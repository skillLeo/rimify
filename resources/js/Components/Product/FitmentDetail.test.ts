import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ABNAHME, borbetDetail } from './borbetDetail.fixture'
import FitmentDetail from './FitmentDetail.vue'

/*
 * Block D, item 15: the Auflagen in full, in the order they are done — with the millimetres for the car's
 * Fahrzeugtyp, the bolt sets and their torque, each size's axle, band and printed minimum, and the notes.
 */
describe('FitmentDetail', () => {
    const wrapper = mount(FitmentDetail, { props: { detail: borbetDetail, vehicleLabel: 'BMW 1er-Reihe 1K4' } })

    it('names the car and keeps the order the work is done in', () => {
        expect(wrapper.find('#auflagen h2').text()).toBe('Was das Gutachten für deinen BMW 1er-Reihe 1K4 verlangt')
        expect(wrapper.findAll('.fdt__sec-h').map((h) => h.text())).toEqual(['Abnahme', 'Arbeiten am Fahrzeug', 'Befestigung', 'Reifen', 'Hinweise', 'Hinweise des Gutachtens'])
        expect(wrapper.text()).toContain(ABNAHME)
    })

    it('gives the millimetres under their sentence, and every bolt set with what the page prints beside it', () => {
        expect(wrapper.findAll('.fdt__measures li').map((li) => li.text())).toEqual(['Vorderachse: von 190 bis 220 mm', 'Hinterachse: von 220 bis 270 mm · aufgeweitet um 30 mm'])
        expect(wrapper.findAll('.fdt__bolts li').map((li) => li.text().replace(/\s+/g, ' '))).toEqual([
            'Kegelbundschraube M12x1,5, Kegel 60°, Schaftlänge 30 mm · Anzugsmoment 120 Nm · Set Nr. 5248 · nur bis Nachtrag 03',
            'Kegelbundschraube M14x1,25, Kegel 60°, Schaftlänge 30 mm · Anzugsmoment 140 Nm · Set Nr. 5276 · ab Nachtrag 04',
        ])
    })

    it('says each size with its axle, band and printed minimum, and the 50 km torque check', () => {
        const withSizes = mount(FitmentDetail, { props: { detail: { ...borbetDetail, sections: [] }, vehicleLabel: 'BMW 1er-Reihe 1K4' } })

        expect(withSizes.find('.fdt__sizes').text().replace(/\s+/g, ' ')).toBe('245/35 R18 · nur Hinterachse · 70–250 kW · laut Gutachten mindestens 92')
        expect(wrapper.find('.fdt__list--quiet').text()).toContain('nach einer Wegstrecke von 50km')
    })
})
