import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ABNAHME, borbetDetail } from './borbetDetail.fixture'
import FitmentPanel from './FitmentPanel.vue'
import { ABNAHME_REQUIRED, PAPERS_EXEMPT } from '../../fitment/papers'
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

    it('calls an answer that waits for the body style or drive open, not absent, and asks for it right below', () => {
        const waiting = mount(FitmentPanel, {
            props: { vehicle, verdict: verdict({ status: 'UNKNOWN', label: 'Unbekannt', sellable: false, reason: 'Das Gutachten unterscheidet nach Karosserieform.', missing: ['bodyForm'] }) },
        })

        expect(waiting.find('.rcheck-panel__vehicle').text()).toBe('Noch offen für BMW 3er Coupe')
        expect(waiting.find('.bf__lead').text()).toBe('Für dieses Fahrzeug fehlt die Karosserieform. Trag sie ein und wir prüfen sofort.')
        // The vaguer reason gives way to the question.
        expect(waiting.find('.fit__reason').exists()).toBe(false)

        const unknown = mount(FitmentPanel, { props: { vehicle, verdict: verdict({ status: 'UNKNOWN', label: 'Unbekannt', sellable: false }) } })

        expect(unknown.find('.rcheck-panel__vehicle').text()).toBe('Keine Freigabe hinterlegt für BMW 3er Coupe')
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

    /*
     * ABE 53841, points 10 and 11: the document frees the papers (§ 15 FZV), the Auflagen still send the car to a
     * Prüfer. Two questions, two lines — and never „Eintragung … erforderlich“ beside „keine Berichtigung“.
     */
    it('says the Abnahme and the papers on two lines where the document frees the papers (§ 15 FZV)', () => {
        const wrapper = mount(FitmentPanel, {
            props: { vehicle, verdict: verdict({ status: 'CONDITIONAL', requiresEntry: true, papersExempt: true }) },
        })

        expect(wrapper.findAll('.fit__entry').map((p) => p.text())).toEqual([ABNAHME_REQUIRED, PAPERS_EXEMPT])
        expect(wrapper.text()).not.toContain('Eintragung')

        const noAbnahme = mount(FitmentPanel, { props: { vehicle, verdict: verdict({ papersExempt: true }) } })

        expect(noAbnahme.findAll('.fit__entry').map((p) => p.text())).toEqual(['Keine Abnahme durch einen Prüfer erforderlich.', PAPERS_EXEMPT])
    })

    it('says nothing about the papers for a wheel that may not go on the car, even where the document frees them', () => {
        const wrapper = mount(FitmentPanel, {
            props: { vehicle, verdict: verdict({ status: 'UNKNOWN', sellable: false, papersExempt: true }) },
        })

        expect(wrapper.find('.fit__papers').exists()).toBe(false)
        expect(wrapper.text()).not.toContain('§')
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

    it('gives the overview of what the Gutachten asks and links to it in full, keeping the purchase close', () => {
        const wrapper = mount(FitmentPanel, {
            props: {
                vehicle,
                verdict: verdict({ status: 'CONDITIONAL', requiresEntry: true, conditions: [ABNAHME], tyreSizes: ['245/35 R18'], detail: borbetDetail }),
            },
        })

        // One line: what there is to do, then the way to the full wording. The notes are not a task.
        expect(wrapper.find('.fit__overview-line').text()).toBe(
            'Abnahme beim Prüfer · bis zu 2 Arbeiten am Fahrzeug, je nach Reifengröße · Kegelbundschraube M12x1,5 (120 Nm) oder ein anderer Schraubensatz – welcher, hängt von deinem Fahrzeug ab · alle Auflagen im Wortlaut'
        )
        expect(wrapper.find('.fit__overview a').attributes('href')).toBe('#auflagen')
        // The sentences stand below the purchase, not in the panel; the sizes keep their own line.
        expect(wrapper.find('.fit__conditions').exists()).toBe(false)
        expect(wrapper.text()).not.toContain(ABNAHME)
        expect(wrapper.find('.fit__tyres').text()).toContain('245/35 R18')
        expect(wrapper.text().split('Eintragung in die Fahrzeugpapiere erforderlich.')).toHaveLength(2)
    })

    /*
     * D-01: the link scrolls without a history entry — Back from a fragment re-mounts the Inertia page and throws
     * away the chosen size — and hands the focus to the section's heading (D-12).
     */
    it('scrolls to the Auflagen without a history entry, and hands the focus to their heading', async () => {
        const target = document.createElement('section')
        target.id = 'auflagen'
        target.innerHTML = '<h2 id="fdt-h" tabindex="-1">Was das Gutachten verlangt</h2>'
        target.scrollIntoView = vi.fn()
        document.body.append(target)

        const wrapper = mount(FitmentPanel, {
            props: { vehicle, verdict: verdict({ status: 'CONDITIONAL', requiresEntry: true, conditions: [ABNAHME], detail: borbetDetail }) },
            attachTo: document.body,
        })
        const before = window.history.length
        const click = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })

        wrapper.find('.fit__to-detail').element.dispatchEvent(click)

        expect(click.defaultPrevented).toBe(true)
        expect(target.scrollIntoView).toHaveBeenCalledOnce()
        expect(document.activeElement?.id).toBe('fdt-h')
        expect(window.location.hash).toBe('')
        expect(window.history.length).toBe(before)

        wrapper.unmount()
        target.remove()
    })

    // D-09: 255/30 R19 is printed for the rear axle only — still one of the car's sizes.
    it('lists the sizes of both axles, each once', () => {
        const wrapper = mount(FitmentPanel, {
            props: { vehicle, verdict: verdict({ tyreSizes: ['235/35 R19'], tyreSizesFront: ['235/35 R19'], tyreSizesRear: ['235/35 R19', '255/30 R19'] }) },
        })

        expect(wrapper.find('.fit__tyres .data').text()).toBe('235/35 R19 · 255/30 R19')
    })
})
