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
})
