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

    it('offers the fields 8.1, 8.2 and T under the tyre lines, and the typed figures once they are kept', async () => {
        const tyre = { status: 'CONDITIONAL' as const, label: 'Mit deinen Fahrzeugpapieren prüfen', lines: ['…'], thresholds: [], fromVehicleData: false }
        const empty = mount(FitmentPanel, { props: { vehicle, verdict: verdict({ status: 'CONDITIONAL', wheelStatus: 'PERMITTED', wheelLabel: 'Freigegeben', tyre }) } })

        // Closed until asked for, so the price and „In den Warenkorb“ stay on the first screen.
        expect(empty.find('#pp-axle_front_kg').exists()).toBe(false)
        await empty.find('#pp-open').trigger('click')

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

    it('shows the answer and its document always, and the sum behind „So haben wir gerechnet“, closed', () => {
        const summary = 'Hinterachse mit 1.235 kg: mindestens Tragfähigkeitsindex 93, Geschwindigkeitsindex Y.'
        const lines = ['Vorderachse: 1.210 kg ÷ 2 = 605 kg je Rad.', 'Hinterachse: 1.235 kg ÷ 2 = 617,5 kg je Rad.']
        const wrapper = mount(FitmentPanel, {
            props: {
                vehicle,
                verdict: verdict({
                    wheelStatus: 'PERMITTED',
                    wheelLabel: 'Freigegeben',
                    tyre: { status: 'PERMITTED', label: 'Freigegeben', lines, thresholds: [], fromVehicleData: true, summary, basis: 'Grundlage: Tabelle auf Seite 6 im Gutachten 55255.', open: false },
                }),
            },
        })

        expect(wrapper.find('.fit__tyre-summary').text()).toBe(summary)
        expect(wrapper.find('.fit__tyre-basis').text()).toBe('Grundlage: Tabelle auf Seite 6 im Gutachten 55255.')
        expect(wrapper.find('details.fit__sum summary').text()).toBe('So haben wir gerechnet')
        expect(wrapper.find('details.fit__sum').attributes('open')).toBeUndefined()
        // Folded, never dropped: the whole sum is in the page.
        expect(wrapper.findAll('details.fit__sum li').map((li) => li.text())).toEqual(lines)
    })

    it('opens the sum at once where we say no, or where the customer’s figures made it stricter', () => {
        const tyre = { status: 'NOT_PERMITTED' as const, label: 'Nicht freigegeben', lines: ['…', '…?'], thresholds: [], fromVehicleData: true, summary: 'Bei 280 km/h …', basis: 'Grundlage: Gutachten 55255.', open: true }
        const wrapper = mount(FitmentPanel, { props: { vehicle, verdict: verdict({ status: 'NOT_PERMITTED', wheelStatus: 'PERMITTED', wheelLabel: 'Freigegeben', tyre }) } })

        expect(wrapper.find('details.fit__sum').attributes('open')).toBeDefined()
    })

    it('shows the document’s thresholds in full, unfolded, while the car’s figures are missing (R-03)', () => {
        const line = 'Vergleiche die 1.120 kg mit den Feldern 8.1 (vorn) und 8.2 (hinten) deiner Zulassungsbescheinigung Teil I.'
        const wrapper = mount(FitmentPanel, {
            props: { vehicle, verdict: verdict({ status: 'CONDITIONAL', wheelStatus: 'PERMITTED', wheelLabel: 'Freigegeben', tyre: { status: 'CONDITIONAL', label: 'Mit deinen Fahrzeugpapieren prüfen', lines: [line], thresholds: [], fromVehicleData: false } }) },
        })

        expect(wrapper.find('details.fit__sum').exists()).toBe(false)
        expect(wrapper.find('.fit__tyre-lines').text()).toBe(line)
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

    it('lays the Auflagen out in the order they are done, with the millimetres, the bolts, the sizes and the notes', () => {
        // The 18″ Nachtrag on a BMW 1K4 (pages 3, 2 and 22): what the product page receives.
        const abnahme = 'Der vorschriftsmäßige Zustand des Fahrzeuges ist … bescheinigen zu lassen.'
        const wrapper = mount(FitmentPanel, {
            props: {
                vehicle,
                verdict: verdict({
                    status: 'CONDITIONAL',
                    requiresEntry: true,
                    conditions: [abnahme],
                    tyreSizes: ['225/40 R18'],
                    detail: {
                        sections: [
                            { title: 'Hinweise', items: [{ text: 'Zum Auswuchten der Sonderräder dürfen an der Felgeninnenseite nur Klebegewichte angebracht werden.', measures: [] }] },
                            { title: 'Abnahme', items: [{ text: abnahme, measures: [] }] },
                            { title: 'Arbeiten am Fahrzeug', items: [{ text: 'Durch Anlegen der vorderen Radhausausschnittkanten … zu entnehmen.', measures: ['Vorderachse: von 190 bis 220 mm'] }] },
                        ],
                        fasteners: [
                            { label: 'Kegelbundschraube M12x1,5, Kegel 60°, Schaftlänge 30 mm', torque: '120 Nm', article: 'Set Nr. 5248', limit: 'nur bis Nachtrag 03' },
                            { label: 'Kegelbundschraube M14x1,25, Kegel 60°, Schaftlänge 30 mm', torque: '140 Nm', article: 'Set Nr. 5276', limit: 'ab Nachtrag 04' },
                        ],
                        tyres: [{ label: '245/35 R18', axle: 'nur Hinterachse', minimum: 'laut Gutachten mindestens 92', band: '70–250 kW' }],
                        notices: ['Der Fahrzeughalter muss auf die Kontrolle des Anzugsmoments der Befestigungsmittel nach einer Wegstrecke von 50km hingewiesen werden.'],
                    },
                }),
            },
        })

        expect(wrapper.findAll('.fit__sec-h').map((h) => h.text())).toEqual(['Abnahme', 'Arbeiten am Fahrzeug', 'Befestigung', 'Reifen', 'Hinweise', 'Hinweise des Gutachtens'])
        expect(wrapper.find('.fit__measures').text()).toBe('Vorderachse: von 190 bis 220 mm')
        expect(wrapper.findAll('.fit__bolts li').map((li) => li.text().replace(/\s+/g, ' '))).toEqual([
            'Kegelbundschraube M12x1,5, Kegel 60°, Schaftlänge 30 mm · Anzugsmoment 120 Nm · Set Nr. 5248 · nur bis Nachtrag 03',
            'Kegelbundschraube M14x1,25, Kegel 60°, Schaftlänge 30 mm · Anzugsmoment 140 Nm · Set Nr. 5276 · ab Nachtrag 04',
        ])
        expect(wrapper.find('.fit__sizes').text().replace(/\s+/g, ' ')).toBe('245/35 R18 · nur Hinterachse · 70–250 kW · laut Gutachten mindestens 92')
        expect(wrapper.find('.fit__notices').text()).toContain('nach einer Wegstrecke von 50km')
        // The flat list and the bare size line give way to the sections; the entry line is said once.
        expect(wrapper.find('.fit__tyres').exists()).toBe(false)
        expect(wrapper.text().split('Eintragung in die Fahrzeugpapiere erforderlich.')).toHaveLength(2)
    })
})