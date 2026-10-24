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
            props: { vehicle, verdict: verdict({ status: 'UNKNOWN', label: 'Noch nicht bestätigt', sellable: false, reason: 'Das Gutachten unterscheidet nach Karosserieform.', missing: ['bodyForm'] }) },
        })

        expect(waiting.find('.rcheck-panel__vehicle').text()).toBe('Noch offen für BMW 3er Coupe')
        expect(waiting.find('.bf__lead').text()).toBe('Für dieses Fahrzeug fehlt die Karosserieform. Trag sie ein und wir prüfen sofort.')
        // The vaguer reason gives way to the question.
        expect(waiting.find('.fit__reason').exists()).toBe(false)

        const unknown = mount(FitmentPanel, { props: { vehicle, verdict: verdict({ status: 'UNKNOWN', label: 'Noch nicht bestätigt', sellable: false }) } })

        expect(unknown.find('.rcheck-panel__vehicle').text()).toBe('Noch nicht bestätigt für BMW 3er Coupe')
    })

    // Finding 103 (the operator's decision of 14.10.2026): the client's own wheel on his own car read „Keine Freigabe
    // hinterlegt“ over a row saying „Freigegeben mit Auflagen“. Unverified is neither forbidden nor unavailable.
    it('leads with the half that is true where the wheel is approved and only the tyre size is unconfirmed — and shows a way on', () => {
        const summary = 'Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt. Für 250 km/h können wir die Reifen deshalb nicht bestätigen.'
        const open = mount(FitmentPanel, {
            props: {
                vehicle,
                askHref: '/kontakt?betreff=Wunschreifen',
                verdict: verdict({
                    status: 'UNKNOWN', label: 'Noch nicht bestätigt', sellable: false, reason: summary, reasonCode: 'TYRE_UNKNOWN',
                    wheelStatus: 'CONDITIONAL', wheelLabel: 'Freigegeben mit Auflagen',
                    tyre: { status: 'UNKNOWN', label: 'Noch nicht bestätigt', summary, lines: [], thresholds: [], fromVehicleData: true },
                }),
            },
            global: { stubs: { Link: { props: ['href'], template: '<a :href="href"><slot /></a>' } } },
        })

        expect(open.find('.rcheck-panel__vehicle').text()).toBe('Felge freigegeben mit Auflagen · Reifengröße noch nicht bestätigt')
        expect(open.text()).not.toContain('Keine Freigabe hinterlegt')
        expect(open.find('[data-open="tyre"]').text()).toBe('Die Felge selbst ist für BMW 3er Coupe mit Auflagen freigegeben. Die Reifengröße dazu können wir noch nicht bestätigen.')
        // What is on record, said as that — and never what the document does or does not print (R-17).
        expect(open.find('.fit__tyre-summary').text()).toBe(summary)
        expect(open.text()).not.toMatch(/Gutachten (druckt|enthält|nennt) kein/)
        expect(open.find('[data-open="next"]').text()).toContain('Wenn du deine Wunschreifen nennst, prüfen wir sie vorab von Hand.')
        expect(open.find('[data-open="next"] a').attributes('href')).toBe('/kontakt?betreff=Wunschreifen')

        // A wheel approved outright reads without „mit Auflagen“; a plain „we hold nothing“ stays what it was.
        const plain = mount(FitmentPanel, {
            props: { vehicle, verdict: verdict({ status: 'UNKNOWN', label: 'Noch nicht bestätigt', sellable: false, wheelStatus: 'PERMITTED', wheelLabel: 'Freigegeben', tyre: { status: 'UNKNOWN', label: 'Noch nicht bestätigt', summary, lines: [], thresholds: [], fromVehicleData: true } }) },
        })

        expect(plain.find('.rcheck-panel__vehicle').text()).toBe('Felge freigegeben · Reifengröße noch nicht bestätigt')
        expect(plain.find('[data-open="next"] a').exists()).toBe(false)
    })

    // D-286, the operator's answer of 18.10.2026: a missing input is the absence of a grant, in finding 103's shape — the
    // wheel's own verdict first, in full; the tyre unconfirmed, the reason ours; then the way on, which is the form.
    it('points an answer that waits for the car’s papers at the form, open, asking for exactly what is missing', () => {
        const lines = [
            'Für die Reifen fehlen uns die zulässigen Achslasten (Felder 8.1 und 8.2) und die Höchstgeschwindigkeit (Feld T) deines Fahrzeugs.',
            'Trag die Werte aus deiner Zulassungsbescheinigung Teil I ein, dann zeigen wir dir, welche Reifen du fahren darfst.',
        ]
        const waiting = (owed: string[]) =>
            mount(FitmentPanel, {
                props: {
                    vehicle,
                    askHref: '/kontakt?betreff=Wunschreifen',
                    verdict: verdict({
                        status: 'UNKNOWN', label: 'Noch nicht bestätigt', sellable: false, requiresEntry: true,
                        wheelStatus: 'CONDITIONAL', wheelLabel: 'Freigegeben mit Auflagen',
                        conditions: ['Nur mit den angegebenen Radschrauben zulässig.'],
                        tyre: { status: 'UNKNOWN', label: 'Noch nicht bestätigt', lines, thresholds: [], fromVehicleData: false, owed },
                    }),
                },
                global: { stubs: { Link: { props: ['href'], template: '<a :href="href"><slot /></a>' } } },
            })
        const all = waiting(['8.1', '8.2', 'T'])

        // The wheel's own verdict first, in full: its Eintragung and its Auflagen. No size is the open part here — the
        // tyres are, whichever size: „Reifen“, not „Reifengröße“.
        expect(all.find('.rcheck-panel__vehicle').text()).toBe('Felge freigegeben mit Auflagen · Reifen noch nicht bestätigt')
        expect(all.find('[data-open="tyre"]').text()).toBe('Die Felge selbst ist für BMW 3er Coupe mit Auflagen freigegeben. Die Reifen dazu können wir noch nicht bestätigen.')
        expect(all.find('.fit__entry--verdict').text()).toBe('Eintragung in die Fahrzeugpapiere erforderlich.')
        expect(all.find('.fit__conditions li').text()).toBe('Nur mit den angegebenen Radschrauben zulässig.')
        // Then the tyre, the reason ours; the way on is the form — not a table we may hold one day, not a message to us.
        expect(all.findAll('.fit__tyre-lines li').map((li) => li.text())).toEqual(lines)
        expect(all.find('[data-open="next"]').exists()).toBe(false)
        expect(all.find('#pp-axle_front_kg').exists()).toBe(true)
        // Which fields, the tyre lines just said: the form says only where they are kept.
        expect(all.find('[data-asked]').text()).toBe('Wir speichern die Werte zu diesem Fahrzeug als Cookie in deinem Browser.')
        expect(all.find('.fit__elsewhere').exists()).toBe(false)
    })

    // The interaction review of D-291: a figure the customer typed that makes the answer negative stays theirs to change.
    it('keeps the papers form where the customer\'s own figures made the answer negative', () => {
        const wrapper = mount(FitmentPanel, {
            props: {
                vehicle: { ...vehicle, papers: { axleFrontKg: 1610, axleRearKg: 1200, topSpeedKmh: 250, notes: [] } },
                verdict: verdict({ status: 'NOT_PERMITTED', label: 'Nicht freigegeben', sellable: false, reason: 'Die Felge ist für 690 kg je Rad geprüft. Maßgeblich ist die zulässige Achslast der Vorderachse: 1.610 kg nach deiner Angabe aus Feld 8.1, also 805 kg je Rad – mehr, als die Felge tragen darf.' }),
            },
            global: { stubs: { Link: { props: ['href'], template: '<a :href="href"><slot /></a>' } } },
        })

        expect(wrapper.find('.pp__summary').text()).toContain('Nach deinen Angaben: 8.1 1.610 kg')
        expect(wrapper.find('#pp-change').exists()).toBe(true)
    })

    // D-289: where the rim sells alone, the panel says so, and the form waits behind its button — open, it pushed the price
    // and „In den Warenkorb“ off the first screen.
    it('says the rim alone can be ordered where it sells while the tyres wait, the form closed behind its button', () => {
        const wrapper = mount(FitmentPanel, {
            props: {
                vehicle,
                verdict: verdict({
                    status: 'UNKNOWN', label: 'Noch nicht bestätigt', sellable: false, rimSellable: true,
                    wheelStatus: 'PERMITTED', wheelLabel: 'Freigegeben',
                    tyre: { status: 'UNKNOWN', label: 'Noch nicht bestätigt', lines: [], thresholds: [], fromVehicleData: false, owed: ['8.1', '8.2', 'T'] },
                }),
            },
            global: { stubs: { Link: { props: ['href'], template: '<a :href="href"><slot /></a>' } } },
        })

        expect(wrapper.find('[data-open="tyre"]').text()).toBe(
            'Die Felge selbst ist für BMW 3er Coupe freigegeben – nur mit einer der zulässigen Reifengrößen. Die Reifen dazu können wir noch nicht bestätigen. Die Felge allein kannst du schon bestellen.'
        )
        expect(wrapper.find('.pp__form').exists()).toBe(false)
        expect(wrapper.find('#pp-open').exists()).toBe(true)
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

        expect(kept.find('.pp__summary').text()).toContain('8.1 1.050 kg · 8.2 1.100 kg · T 250 km/h')
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
                    reason: 'Für dieses Fahrzeug ist zu diesem Gutachten bei uns keine Freigabe hinterlegt.',
                }),
            },
        })

        expect(wrapper.text()).toContain('Nicht freigegeben für BMW 3er Coupe')
        expect(wrapper.text()).not.toContain('Eintragung')
        expect(wrapper.text()).toContain('Für dieses Fahrzeug ist zu diesem Gutachten bei uns keine Freigabe hinterlegt.')
    })

    it('is no dead end where this wheel is no answer for the car: the wheels that are, one link away (finding 117)', () => {
        const link = (v: ConfigVerdict) => mount(FitmentPanel, { props: { vehicle, verdict: v }, global: { stubs: { Link: { props: ['href'], template: '<a :href="href"><slot /></a>' } } } }).find('.fit__elsewhere a')

        for (const v of [
            verdict({ status: 'NOT_PERMITTED', sellable: false, reason: 'Für dieses Fahrzeug ist zu diesem Gutachten bei uns keine Freigabe hinterlegt.' }),
            verdict({ status: 'UNKNOWN', sellable: false, reasonCode: 'NO_DOCUMENT', reason: 'Für diese Kombination liegt uns kein Gutachten vor.' }),
            verdict({ status: 'UNKNOWN', sellable: false, reasonCode: 'ANNEX_MISSING', reason: 'Für dieses Fahrzeug liegt uns die entsprechende Anlage des Gutachtens noch nicht vor.' }),
        ]) {
            // Without an article: „deinen“ broke on a feminine model name („deinen … C-Klasse“).
            expect(link(v).text()).toBe('Felgen für BMW 3er anzeigen')
            expect(link(v).attributes('href')).toBe('/felgen?fahrzeug=3')
        }

        // Not where the wheel may go on, nor where the way on is already in the panel: a fact to give, a tyre size open.
        expect(link(verdict({ status: 'CONDITIONAL', sellable: true })).exists()).toBe(false)
        expect(link(verdict({ status: 'UNKNOWN', sellable: false, missing: ['bodyForm'] })).exists()).toBe(false)
        expect(link(verdict({ status: 'UNKNOWN', sellable: false, wheelStatus: 'PERMITTED', tyre: { status: 'UNKNOWN', label: 'Noch nicht bestätigt', summary: null, basis: null, lines: [], thresholds: [], fromVehicleData: true, open: false } })).exists()).toBe(false)
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

    /* The client's #21: „Eintragung“ stood three times on a wheel with Auflagen — the line, the admin's note, the list. */
    it('says the Eintragung once, in the verdict under its headline, the more exact note in its place @kunde-21', () => {
        const wrapper = mount(FitmentPanel, {
            props: {
                vehicle,
                verdict: verdict({
                    status: 'CONDITIONAL',
                    requiresEntry: true,
                    entryNoteDe: 'Eintragung durch eine amtlich anerkannte Prüfstelle erforderlich.',
                    conditions: ['Eintragung in die Fahrzeugpapiere erforderlich.', 'Nur mit den angegebenen Radschrauben zulässig.'],
                }),
            },
        })

        expect(wrapper.text().match(/Eintragung/g)).toHaveLength(1)
        expect(wrapper.find('.fit__entry--verdict').text()).toBe('Eintragung durch eine amtlich anerkannte Prüfstelle erforderlich.')
        // Right under the verdict's headline: the papers belong to the answer.
        expect(wrapper.find('.rcheck-panel__vehicle + .fit__entry--verdict').exists()).toBe(true)
        // The Auflagen explain themselves; none repeats the line.
        expect(wrapper.findAll('.fit__conditions li').map((li) => li.text())).toEqual(['Nur mit den angegebenen Radschrauben zulässig.'])
    })

    it('keeps a note about something else beneath the line', () => {
        const wrapper = mount(FitmentPanel, {
            props: { vehicle, verdict: verdict({ status: 'CONDITIONAL', requiresEntry: true, entryNoteDe: 'Gilt nur zusammen mit den Distanzscheiben aus Punkt 3.' }) },
        })

        expect(wrapper.find('.fit__entry--verdict').text()).toBe('Eintragung in die Fahrzeugpapiere erforderlich.')
        expect(wrapper.find('.fit__note').text()).toBe('Gilt nur zusammen mit den Distanzscheiben aus Punkt 3.')
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

    it('opens the Gutachten at the page the answer stands on, and says the entry once @kunde-21 @kunde-28', () => {
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

    /*
     * The client's #18: a Komplettrad's tyre chosen, the answer is the one for that combination — ABE 55255 asks the X3
     * for an Abnahme with 255/40 R19 alone. The server sends each tyre's size answer (ConditionGroups); the panel says it.
     */
    it('answers for the tyre chosen: that size\'s Eintragung and that size\'s work, nothing another size alone needs @kunde-18', () => {
        const detail = {
            ...borbetDetail,
            sections: borbetDetail.sections.map((s) => (s.title === 'Abnahme' ? { ...s, items: [{ text: ABNAHME, measures: [], sizes: ['245/35 R18'] }] } : s)),
        }
        const base = verdict({
            status: 'CONDITIONAL',
            requiresEntry: true,
            conditions: [ABNAHME],
            tyreSizes: ['245/35 R18', '255/35 R18'],
            detail,
            conditionGroups: {
                combination: [],
                sizes: [
                    { size: '245/35 R18', axle: 'nur Hinterachse', conditions: [ABNAHME], entry: true },
                    { size: '255/35 R18', axle: 'nur Hinterachse', conditions: [], entry: false },
                ],
                chosen: null,
                entry: null,
            },
        })
        const panel = (chosen: string | null, entry: boolean | null) =>
            mount(FitmentPanel, { props: { vehicle, verdict: base, chosen: chosen === null ? null : { combination: [], sizes: [], chosen, entry } } })
        const KEGEL = 'Kegelbundschraube M12x1,5 (120 Nm) oder ein anderer Schraubensatz – welcher, hängt von deinem Fahrzeug ab'

        // Before a tyre is chosen: what any size may need, said as depending on the size.
        expect(panel(null, null).find('.fit__overview-line').text()).toBe(
            `Abnahme beim Prüfer, je nach Reifengröße · bis zu 2 Arbeiten am Fahrzeug, je nach Reifengröße · ${KEGEL} · alle Auflagen im Wortlaut`
        )

        // The tyre whose size carries the Abnahme: the Eintragung, and both pieces of work.
        const wide = panel('245/35 R18', true)
        expect(wide.find('.fit__entry--verdict').text()).toBe('Eintragung in die Fahrzeugpapiere erforderlich.')
        expect(wide.find('.fit__overview-h').text()).toBe('Das verlangt das Gutachten mit 245/35 R18')
        expect(wide.find('.fit__overview-line').text()).toBe(`Abnahme beim Prüfer · 2 Arbeiten am Fahrzeug · ${KEGEL} · alle Auflagen im Wortlaut`)

        // The other: no Eintragung, and only the work every size needs.
        const narrow = panel('255/35 R18', false)
        expect(narrow.find('.fit__entry--verdict').text()).toBe('Keine Eintragung erforderlich.')
        expect(narrow.find('.fit__overview-line').text()).toBe(`1 Arbeit am Fahrzeug · ${KEGEL} · alle Auflagen im Wortlaut`)
        // The verdict itself stays the combination's: „Mit Auflagen“, never upgraded by the choice of a tyre.
        expect(narrow.find('.rcheck-panel__vehicle').text()).toBe('Mit Auflagen freigegeben für BMW 3er Coupe')
    })

    /*
     * D-335: a set chosen as one of the Gutachten's combinations — both sizes fitted. The panel says each axle's Auflagen
     * under its name in full, whatever the detail folds away, the Eintragung the set needs (either axle's), and the work
     * of either size.
     */
    it('answers for a set per axle: each axle\'s Auflagen under its name, the set\'s Eintragung, either size\'s work @admin-208', () => {
        const detail = {
            ...borbetDetail,
            sections: borbetDetail.sections.map((s) => (s.title === 'Abnahme' ? { ...s, items: [{ text: ABNAHME, measures: [], sizes: ['245/35 R18'] }] } : s)),
        }
        const wrapper = mount(FitmentPanel, {
            props: {
                vehicle,
                verdict: verdict({ status: 'CONDITIONAL', requiresEntry: true, conditions: [ABNAHME], tyreSizes: ['225/40 R18', '245/35 R18'], detail }),
                chosen: {
                    combination: [],
                    sizes: [
                        { size: '225/40 R18', axle: 'Vorderachse', conditions: [], entry: false },
                        { size: '245/35 R18', axle: 'Hinterachse', conditions: [ABNAHME], entry: true },
                    ],
                    chosen: null,
                    entry: true,
                    perAxle: true,
                },
            },
        })
        const set = wrapper.find('[data-set-answer]')

        // Shown in full beside the detail's overview, under one heading — the groups' own heads name the axles.
        expect(set.findAll('.cgroups__size .cgroups__head').map((h) => h.text())).toEqual(['Vorderachse · 225/40 R18', 'Hinterachse · 245/35 R18'])
        expect(set.text()).toContain(ABNAHME)
        // Both are fitted: the Eintragung the rear's size needs is the set's — never „erforderlich mit … nicht mit …“.
        expect(wrapper.find('.fit__entry--verdict').text()).toBe('Eintragung in die Fahrzeugpapiere erforderlich.')
        expect(wrapper.findAll('.fit__overview-h').map((h) => h.text())).toEqual(['Das verlangt das Gutachten für diese Kombination'])
        expect(wrapper.text()).not.toContain('je nach Reifengröße')
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
