import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FitmentPanel from './FitmentPanel.vue'
import type { ConfigVerdict } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'

const vehicle: VehicleProp = {
    id: 3,
    make: 'BMW',
    model: '3er',
    variant: 'Coupe',
    label: 'BMW 3er Coupe',
    short: 'BMW 3er',
    hsn: '0005',
    tsn: '582',
    keyNumbers: 'HSN 0005 · TSN 582',
    buildWindow: '01/1995–12/1999',
}

function verdict(overrides: Partial<ConfigVerdict>): ConfigVerdict {
    return {
        status: 'PERMITTED',
        label: 'Freigegeben',
        sellable: true,
        requiresEntry: false,
        entryNoteDe: null,
        conditions: [],
        reason: null,
        reasonCode: null,
        document: null,
        tyreSizes: [],
        ...overrides,
    }
}

describe('FitmentPanel', () => {
    it('reads the answer in two lines — the wheel from the Gutachten, the tyres from the papers — with the tyre sentences', () => {
        const line = 'Reifen mit Tragfähigkeitsindex 88 sind nur bis zu einer zulässigen Achslast von 1.120 kg zulässig. Vergleiche die 1.120 kg mit den Feldern 8.1 (vorn) und 8.2 (hinten) deiner Zulassungsbescheinigung Teil I – im alten Fahrzeugschein Ziffer 16.'
        const wrapper = mount(FitmentPanel, {
            props: {
                vehicle,
                verdict: verdict({
                    status: 'CONDITIONAL',
                    wheelStatus: 'PERMITTED',
                    wheelLabel: 'Freigegeben',
                    tyre: {
                        status: 'CONDITIONAL',
                        label: 'Mit deinen Fahrzeugpapieren prüfen',
                        lines: [line],
                        thresholds: [{ text: 'Reifen mit Tragfähigkeitsindex 88 …', maxAxleLoad: '1.120 kg' }],
                        fromVehicleData: false,
                    },
                }),
            },
        })

        const halves = wrapper.findAll('.fit__half').map((half) => [half.find('dt').text(), half.find('dd').text()])

        expect(halves).toEqual([
            ['Felge', 'Freigegeben'],
            ['Reifen', 'Mit deinen Fahrzeugpapieren prüfen'],
        ])
        expect(wrapper.find('.fit__tyre-lines').text()).toBe(line)
    })

    it('offers the fields 8.1, 8.2 and T under the tyre lines, and the typed figures once they are kept', () => {
        const tyre = { status: 'CONDITIONAL' as const, label: 'Mit deinen Fahrzeugpapieren prüfen', lines: ['…'], thresholds: [], fromVehicleData: false }
        const empty = mount(FitmentPanel, { props: { vehicle, verdict: verdict({ status: 'CONDITIONAL', wheelStatus: 'PERMITTED', wheelLabel: 'Freigegeben', tyre }) } })

        expect(empty.find('#pp-axle_front_kg').exists()).toBe(true)
        expect(empty.find('#pp-axle_rear_kg').exists()).toBe(true)
        expect(empty.find('#pp-top_speed_kmh').exists()).toBe(true)

        const note = 'Für die Vorderachse rechnen wir mit 1.100 kg aus unseren Fahrzeugdaten – mehr als deine 1.050 kg aus Feld 8.1. So bist du auf der sicheren Seite.'
        const kept = mount(FitmentPanel, {
            props: {
                vehicle: { ...vehicle, papers: { axleFrontKg: 1050, axleRearKg: 1100, topSpeedKmh: 250, notes: [note] } },
                verdict: verdict({ wheelStatus: 'PERMITTED', wheelLabel: 'Freigegeben', tyre: { ...tyre, status: 'PERMITTED', label: 'Freigegeben', fromVehicleData: true } }),
            },
        })

        expect(kept.find('.pp__summary').text()).toContain('8.1 1.050 kg · 8.2 1.100 kg · T 250 km/h')
        expect(kept.text()).toContain(note)
        expect(kept.find('#pp-axle_front_kg').exists()).toBe(false)
    })

    it('offers no papers form without a tyre half', () => {
        const wrapper = mount(FitmentPanel, { props: { vehicle, verdict: verdict({ status: 'UNKNOWN', sellable: false }) } })

        expect(wrapper.find('.pp').exists()).toBe(false)
    })

    it('shows no halves on a verdict that has none', () => {
        const wrapper = mount(FitmentPanel, { props: { vehicle, verdict: verdict({ status: 'UNKNOWN', sellable: false }) } })

        expect(wrapper.find('.fit__halves').exists()).toBe(false)
        expect(wrapper.find('.fit__tyre-lines').exists()).toBe(false)
    })

    it('never tells the customer "no entry needed" about a wheel that is not permitted', () => {
        const wrapper = mount(FitmentPanel, {
            props: {
                vehicle,
                verdict: verdict({
                    status: 'NOT_PERMITTED',
                    sellable: false,
                    reason: 'Das Gutachten führt dieses Fahrzeug nicht auf.',
                }),
            },
        })

        expect(wrapper.text()).toContain('Nicht freigegeben für BMW 3er Coupe')
        expect(wrapper.text()).not.toContain('Eintragung')
        expect(wrapper.text()).toContain('Das Gutachten führt dieses Fahrzeug nicht auf.')
    })

    it('says nothing about entry for UNKNOWN, and does not dress it as a refusal', () => {
        const wrapper = mount(FitmentPanel, {
            props: { vehicle, verdict: verdict({ status: 'UNKNOWN', sellable: false }) },
        })

        expect(wrapper.text()).not.toContain('Eintragung')
        expect(wrapper.classes()).toContain('rcheck-panel--unknown')
        expect(wrapper.classes()).not.toContain('rcheck-panel--danger')
    })

    it('shows every Auflage of a CONDITIONAL verdict as a full sentence', () => {
        const wrapper = mount(FitmentPanel, {
            props: {
                vehicle,
                verdict: verdict({
                    status: 'CONDITIONAL',
                    requiresEntry: true,
                    conditions: ['Nur mit den angegebenen Radschrauben zulässig.'],
                }),
            },
        })

        expect(wrapper.text()).toContain('Mit Auflagen freigegeben für BMW 3er Coupe')
        expect(wrapper.text()).toContain('Eintragung in die Fahrzeugpapiere erforderlich.')
        expect(wrapper.find('.fit__conditions li').text()).toBe(
            'Nur mit den angegebenen Radschrauben zulässig.'
        )
    })

    it('names the document without a stray separator when the issuer is missing', () => {
        const wrapper = mount(FitmentPanel, {
            props: {
                vehicle,
                verdict: verdict({ document: { number: 'TG-123', issuer: null, kind: 'TEILEGUTACHTEN' } }),
            },
        })

        expect(wrapper.find('.fit__doc').text()).toBe('TG-123')
    })

    it('opens the Gutachten at the page the answer stands on, and says the entry once', () => {
        const wrapper = mount(FitmentPanel, {
            props: {
                vehicle,
                verdict: verdict({
                    status: 'CONDITIONAL',
                    requiresEntry: true,
                    conditions: ['Eintragung in die Fahrzeugpapiere erforderlich.', 'Bördeln der Radläufe erforderlich.'],
                    document: { number: '53810', issuer: 'KBA', kind: 'ABE', pdf: { url: '/storage/ABEs/gutachten/a.pdf#page=2', page: 2 } },
                }),
            },
        })

        const link = wrapper.find('.fit__pdf a')
        expect(link.attributes('href')).toBe('/storage/ABEs/gutachten/a.pdf#page=2')
        expect(link.attributes('target')).toBe('_blank')
        expect(link.text()).toBe('Gutachten öffnen (PDF, Seite 2)')
        expect(wrapper.text().split('Eintragung in die Fahrzeugpapiere erforderlich.')).toHaveLength(2)
        expect(wrapper.findAll('.fit__conditions li').map((li) => li.text())).toEqual(['Bördeln der Radläufe erforderlich.'])
    })

    it('offers no link where no file is stored', () => {
        const wrapper = mount(FitmentPanel, {
            props: { vehicle, verdict: verdict({ document: { number: '53810', issuer: 'KBA', kind: 'ABE', pdf: null } }) },
        })

        expect(wrapper.find('.fit__pdf').exists()).toBe(false)
    })
})