import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ABNAHME, borbetDetail } from './borbetDetail.fixture'
import FitmentDetail from './FitmentDetail.vue'

/*
 * Block D, item 15: the Auflagen in full — what there is to do on the left, in the order the Borbet brief §5
 * sets, with the millimetres, the bolt sets and each size as aligned rows; the notes on the right.
 */
describe('FitmentDetail', () => {
    const wrapper = mount(FitmentDetail, { props: { detail: borbetDetail, vehicleLabel: 'BMW 1er-Reihe 1K4' } })
    const rows = (table: number): string[][] =>
        wrapper.findAll('.fdt__table')[table]?.findAll('tbody tr').map((tr) => tr.findAll('td').map((td) => td.text())) ?? []

    it('names the car, and keeps what there is to do apart from what there is to know', () => {
        expect(wrapper.find('#auflagen h2').text()).toBe('Was das Gutachten für deinen BMW 1er-Reihe 1K4 verlangt')
        expect(wrapper.findAll('.fdt__main .fdt__sec-h').map((h) => h.text())).toEqual(['Abnahme', 'Arbeiten am Fahrzeug', 'Befestigung', 'Reifen'])
        expect(wrapper.findAll('.fdt__side .fdt__sec-h').map((h) => h.text())).toEqual(['Hinweise', 'Hinweise des Gutachtens'])
        expect(wrapper.text()).toContain(ABNAHME)
    })

    it('gives the millimetres under their sentence, and every bolt set as a row with what the page prints beside it', () => {
        expect(wrapper.findAll('.fdt__measures li').map((li) => li.text())).toEqual(['Vorderachse: von 190 bis 220 mm', 'Hinterachse: von 220 bis 270 mm · aufgeweitet um 30 mm'])
        expect(rows(0)).toEqual([
            ['Kegelbundschraube M12x1,5, Kegel 60°, Schaftlänge 30 mm', '120 Nm', 'Set Nr. 5248', 'nur bis Nachtrag 03'],
            ['Kegelbundschraube M14x1,25, Kegel 60°, Schaftlänge 30 mm', '140 Nm', 'Set Nr. 5276', 'ab Nachtrag 04'],
        ])
    })

    it('says each size with its axle, band and printed minimum, and the 50 km torque check', () => {
        expect(rows(1)).toEqual([['245/35 R18', 'nur Hinterachse', '70–250 kW', 'Lastindex 92']])
        expect(wrapper.find('.fdt__side').text()).toContain('nach einer Wegstrecke von 50km')
    })

    // D-04: a sentence the document hangs off some sizes says which, above it; one for every size says none.
    it('names the sizes a sentence belongs to', () => {
        expect(wrapper.findAll('.fdt__for').map((s) => s.text())).toEqual(['Gilt für 245/35 R18', 'Gilt für 245/35 R18 und 255/35 R18'])
        expect(wrapper.findAll('.fdt__main li').find((li) => li.text().includes('vorderen Radhausausschnittkanten'))?.find('.fdt__for').exists()).toBe(false)
    })

    // D-10: the lede's „Wörtlich“ stays true — RIMIFY's own sentence is marked, and the lede says how.
    it('marks our own sentences apart from the document’s wording', () => {
        expect(wrapper.find('.fdt__lede').text()).toBe('Wörtlich aus dem Gutachten. Was mit „Unser Hinweis“ beginnt, kommt von uns.')
        expect(wrapper.findAll('.fdt__own').map((s) => s.element.parentElement?.textContent?.trim())).toEqual([
            'Unser Hinweis: Die Reifengröße 245/35 R18 gibt das Gutachten nur für 70–250 kW an. Vergleiche das mit Feld P.2.',
        ])
    })

    // D-07 and D-08: the set a sentence names by number carries it; „Nachtrag“ is said once, under the sets.
    it('puts the number on the set its sentence names, and says what „Nachtrag“ means here', () => {
        const named = mount(FitmentDetail, {
            props: {
                detail: { ...borbetDetail, fasteners: [{ number: 'S01', thread: 'Schraube M12x1,5', label: 'Schraube M12x1,5, Kegel 60°, Schaftlänge 30 mm', torque: '110 Nm', article: '5248', limit: null }] },
                vehicleLabel: 'BMW 1er-Reihe 187',
            },
        })

        expect(named.find('.fdt__table tbody td').text()).toBe('Nr. S01 · Schraube M12x1,5, Kegel 60°, Schaftlänge 30 mm')
        expect(named.find('.fdt__aside').exists()).toBe(false)
        expect(wrapper.find('.fdt__aside').text()).toContain('Feld K der Zulassungsbescheinigung Teil I')
    })

    // D-12: one region for the whole, a heading the panel's link can hand the focus to.
    it('is one landmark whose heading takes the focus', () => {
        expect(wrapper.findAll('section')).toHaveLength(1)
        expect(wrapper.find('#fdt-h').attributes('tabindex')).toBe('-1')
    })
})
