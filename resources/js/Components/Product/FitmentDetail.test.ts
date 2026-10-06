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
        expect(wrapper.find('#auflagen h2').text()).toBe('Was das Gutachten für BMW 1er-Reihe 1K4 verlangt')
        expect(wrapper.findAll('.fdt__main .fdt__sec-h').map((h) => h.text())).toEqual(['Abnahme', 'Arbeiten am Fahrzeug', 'Befestigung', 'Reifen'])
        expect(wrapper.findAll('.fdt__side .fdt__sec-h').map((h) => h.text())).toEqual(['Hinweise', 'Hinweise des Gutachtens'])
        expect(wrapper.text()).toContain(ABNAHME)
    })

    it('leaves out a sentence the verdict above already says, and keeps the document\'s own wording @kunde-21', () => {
        const ENTRY = 'Eintragung in die Fahrzeugpapiere erforderlich.'
        const detail = {
            ...borbetDetail,
            sections: borbetDetail.sections.map((s) => (s.title === 'Abnahme' ? { ...s, items: [...s.items, { text: ENTRY, measures: [] }] } : s)),
        }
        const omitted = mount(FitmentDetail, { props: { detail, vehicleLabel: 'BMW 1er-Reihe 1K4', omit: [ENTRY] } })

        expect(omitted.find('.fdt__cols').text()).not.toContain(ENTRY)
        expect(omitted.text()).toContain(ABNAHME)
    })

    it('keeps the wording as printed one click away, under „Originaltext anzeigen“ — nothing left out, each with its page @kunde-21', () => {
        const ENTRY = 'Eintragung in die Fahrzeugpapiere erforderlich.'
        const detail = { ...borbetDetail, original: [{ text: ABNAHME, page: 4 }, { text: ENTRY, page: null }] }
        const printed = mount(FitmentDetail, { props: { detail, vehicleLabel: 'BMW 1er-Reihe 1K4', omit: [ENTRY] } })
        const disclosure = printed.find('details[data-original]')

        // Closed until asked for: the arranged lists above are what the customer reads first.
        expect(disclosure.exists()).toBe(true)
        expect(disclosure.attributes('open')).toBeUndefined()
        expect(disclosure.find('summary').text()).toBe('Originaltext anzeigen')
        // The sentence the verdict line says is still there, word for word; the page where the document gives one.
        expect(disclosure.findAll('li').map((li) => li.text())).toEqual([`${ABNAHME} (Seite 4)`, ENTRY])

        // No wording to show, no toggle.
        expect(wrapper.find('details[data-original]').exists()).toBe(false)
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
        expect(wrapper.findAll('.fdt__for').map((s) => s.text()).filter((t) => t.startsWith('Nur bei'))).toEqual(['Nur bei 245/35 R18', 'Nur bei 245/35 R18 und 255/35 R18'])
        // What holds for every size comes first in its section, labelled once as such where size-limited sentences follow.
        expect(wrapper.findAll('.fdt__for').map((s) => s.text())).toContain('Für jede zulässige Reifengröße')
        expect(wrapper.findAll('.fdt__main li').find((li) => li.text().includes('vorderen Radhausausschnittkanten'))?.findAll('.fdt__for').some((s) => s.text().startsWith('Nur bei'))).toBe(false)
    })

    // D-10: the lede's „Wörtlich“ stays true — RIMIFY's own sentence is marked, and the lede says how.
    // ABE 55255, BMW X3 X83: fine-link chains with 235/45 and 245/40, no chains with 255/40 — never in one list.
    it('gives every set of sizes its own list, under its label — never two sizes’ Auflagen side by side', () => {
        const chains = 'Es dürfen nur feingliedrige bzw. die lt. Betriebsanleitung/Handbuch vorgeschriebenen Schneeketten an der Hinterachse verwendet werden.'
        const none = 'Die Verwendung von Schneeketten ist nicht zulässig.'
        const valves = 'Es sind nur schlauchlose Reifen zulässig.'
        const x3 = mount(FitmentDetail, {
            props: {
                detail: {
                    sections: [{ title: 'Hinweise', items: [
                        { text: chains, measures: [], sizes: ['235/45 R19', '245/40 R19'], own: false },
                        { text: none, measures: [], sizes: ['255/40 R19'], own: false },
                        { text: valves, measures: [], sizes: [], own: false },
                    ] }],
                    fasteners: [],
                    tyres: [],
                    notices: [],
                },
                vehicleLabel: 'BMW X3 X83',
            },
        })

        expect(x3.findAll('.fdt__for').map((s) => s.text())).toEqual(['Für jede zulässige Reifengröße', 'Nur bei 235/45 R19 und 245/40 R19', 'Nur bei 255/40 R19'])

        for (const list of x3.findAll('ul')) {
            expect(list.text().includes(chains) && list.text().includes(none)).toBe(false)
        }
    })

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
