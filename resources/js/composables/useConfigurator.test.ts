import { describe, expect, it } from 'vitest'
import { useConfigurator } from './useConfigurator'
import type { ConfigVerdict, ProduktConfig } from '../types/pages'

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

function config(overrides: Partial<ProduktConfig>): ProduktConfig {
    return {
        id: 1,
        finishId: 10,
        sku: 'SKU',
        diameterIn: 18,
        widthIn: 8,
        etMm: 35,
        sizeLabel: '8J × 18 · ET 35',
        versionLabel: 'Breite 8J · ET 35 · Lochkreis 5 × 112',
        fullLabel: '8J × 18 · ET 35 · 5×112 · 66,6 mm',
        boltPattern: '5×112',
        centreBore: '66,6 mm',
        priceCents: 100000,
        price: '1.000,00 €',
        inStock: true,
        kbaNumber: null,
        weightG: null,
        verdict: null,
        ...overrides,
    }
}

describe('useConfigurator', () => {
    it('lists one size per diameter, in ascending order, with German decimals', () => {
        const configs = [
            config({ id: 1, diameterIn: 19 }),
            config({ id: 2, diameterIn: 17 }),
            config({ id: 3, diameterIn: 18.5 }),
            config({ id: 4, diameterIn: 17, priceCents: 90000 }),
        ]

        const c = useConfigurator(() => configs, 10)

        expect(c.sizes.value.map((s) => s.label)).toEqual(['17', '18,5', '19'])
    })

    it('defaults to the cheapest size that is permitted, never simply the first', () => {
        const configs = [
            config({ id: 1, diameterIn: 17, priceCents: 80000, verdict: verdict({ status: 'NOT_PERMITTED', sellable: false }) }),
            config({ id: 2, diameterIn: 18, priceCents: 95000 }),
            config({ id: 3, diameterIn: 19, priceCents: 90000 }),
        ]

        const c = useConfigurator(() => configs, 10)

        expect(c.selected.value?.id).toBe(3)
    })

    // M-6: the page opens on the size the server picked for this finish — the size its card speaks for and links to — and
    // never on one the browser picked by a rule of its own; a size named in the link still comes first.
    it('opens on the size the server names for the finish, before its own pick, and after a size in the link', () => {
        const configs = [
            config({ id: 1, diameterIn: 18, priceCents: 90000 }),
            config({ id: 2, diameterIn: 19, priceCents: 95000 }),
        ]

        expect(useConfigurator(() => configs, 10).selected.value?.id).toBe(1)
        expect(useConfigurator(() => configs, 10, null, () => ({ '10': 2 })).selected.value?.id).toBe(2)
        expect(useConfigurator(() => configs, 10, 1, () => ({ '10': 2 })).selected.value?.id).toBe(1)
        // A size of another finish is no answer here.
        expect(useConfigurator(() => configs, 10, null, () => ({ '10': 77 })).selected.value?.id).toBe(1)
    })

    // Finding 103: struck through reads as forbidden. A wheel its Gutachten approves, with a tyre size nobody could
    // confirm, is unverified — a third state, and one that can be chosen so its answer can be read.
    it('tells an unconfirmed size from a refused one: the wheel approved and the tyre without an answer is not blocked', () => {
        const tyre = { status: 'UNKNOWN' as const, label: 'Noch nicht bestätigt', lines: [], thresholds: [], fromVehicleData: true }
        const configs = [
            config({ id: 1, diameterIn: 17, verdict: verdict({ status: 'NOT_PERMITTED', sellable: false, reason: 'Für dein Fahrzeug nicht freigegeben.' }) }),
            config({ id: 2, diameterIn: 18, verdict: verdict({ status: 'UNKNOWN', sellable: false, wheelStatus: 'CONDITIONAL', tyre, reason: 'Für 250 km/h können wir die Reifen nicht bestätigen.' }) }),
            // Nothing on record for the car at all: that is still „keine Freigabe hinterlegt“, struck through.
            config({ id: 3, diameterIn: 19, verdict: verdict({ status: 'UNKNOWN', sellable: false }) }),
            // Waiting for a fact of the car is asked for in place: choosable as before, and not this state either.
            config({ id: 4, diameterIn: 20, verdict: verdict({ status: 'UNKNOWN', sellable: false, wheelStatus: 'CONDITIONAL', tyre, missing: ['bodyForm'] }) }),
        ]

        const sizes = useConfigurator(() => configs, 10).sizes.value

        expect(sizes.map((s) => [s.label, s.blocked, s.unconfirmed])).toEqual([
            ['17', true, false],
            ['18', false, true],
            ['19', true, false],
            ['20', false, false],
        ])
        expect(sizes[1]?.reason).toBe('Für 250 km/h können wir die Reifen nicht bestätigen.')
    })

    it('shows a blocked size with its reason instead of hiding it', () => {
        const configs = [
            config({ id: 1, diameterIn: 20, verdict: verdict({ status: 'NOT_PERMITTED', sellable: false, reason: 'Nicht freigegeben.' }) }),
            config({ id: 2, diameterIn: 18 }),
        ]

        const c = useConfigurator(() => configs, 10)
        const blocked = c.sizes.value.find((s) => s.diameter === 20)

        expect(blocked?.blocked).toBe(true)
        expect(blocked?.reason).toBe('Nicht freigegeben.')

        c.selectSize(blocked!)
        expect(c.selected.value?.id).toBe(2)
    })

    // MINI Paceman *00 on the 19″: the answer waits only for the body style. Struck through, the question could never
    // be asked; choosable, the panel asks it — and the purchase stays off until it is answered (sellable is false).
    it('keeps a size choosable whose answer waits only for a fact the customer can give', () => {
        const configs = [
            config({ id: 1, diameterIn: 19, verdict: verdict({ status: 'UNKNOWN', sellable: false, reason: 'Für dieses Fahrzeug fehlt die Karosserieform.', missing: ['bodyForm'] }) }),
            config({ id: 2, diameterIn: 18, verdict: verdict({ status: 'UNKNOWN', sellable: false, reason: 'Für dieses Fahrzeug liegt uns die entsprechende Anlage des Gutachtens noch nicht vor.' }) }),
        ]

        const c = useConfigurator(() => configs, 10)
        const nineteen = c.sizes.value.find((s) => s.diameter === 19)!
        const eighteen = c.sizes.value.find((s) => s.diameter === 18)!

        expect(nineteen.blocked).toBe(false)
        expect(eighteen.blocked).toBe(true)

        c.selectSize(nineteen)
        expect(c.selected.value?.id).toBe(1)
        expect(c.selected.value?.verdict?.sellable).toBe(false)
    })

    it('forgets the chosen size when the finish changes', () => {
        const configs = [
            config({ id: 1, finishId: 10, diameterIn: 18 }),
            config({ id: 2, finishId: 10, diameterIn: 19 }),
            config({ id: 3, finishId: 20, diameterIn: 18 }),
        ]

        const c = useConfigurator(() => configs, 10)
        c.selectSize(c.sizes.value[1]!)
        expect(c.selected.value?.id).toBe(2)

        c.selectFinish(20)
        expect(c.configId.value).toBeNull()
        expect(c.selected.value?.id).toBe(3)
    })

    it('strikes a diameter through only when none of its configurations is permitted', () => {
        // Demo Zehnspeiche Z-08 "Volcano Grau" on the BMW: two 18" rows, one refused, one permitted.
        const configs = [
            config({ id: 44, widthIn: 8.5, etMm: 40, priceCents: 94900, verdict: verdict({ status: 'NOT_PERMITTED', sellable: false }) }),
            config({ id: 43, widthIn: 8, etMm: 45, priceCents: 89900 }),
        ]

        const c = useConfigurator(() => configs, 10)
        const eighteen = c.sizes.value.find((s) => s.diameter === 18)!

        expect(eighteen.blocked).toBe(false)
        expect(eighteen.config.id).toBe(43)
        expect(c.selected.value?.id).toBe(43)
    })

    it('marks the chip of the selected diameter with the selected configuration', () => {
        const configs = [
            config({ id: 1, widthIn: 8, priceCents: 80000 }),
            config({ id: 2, widthIn: 8.5, priceCents: 90000 }),
        ]

        const c = useConfigurator(() => configs, 10)
        c.selectVariant(c.variants.value.find((v) => v.id === 2)!)

        expect(c.selected.value?.id).toBe(2)
        expect(c.sizes.value[0]?.config.id).toBe(2)
    })

    it('offers every width and ET inside the chosen diameter, refused ones disabled', () => {
        // Demo Zehnspeiche Z-08 "Himalaya Grau": 8J ET45 carries an Auflage, 8,5J ET40 is permitted outright.
        const configs = [
            config({ id: 41, widthIn: 8, etMm: 45, versionLabel: 'Breite 8J · ET 45 · Lochkreis 5 × 112', priceCents: 89900, verdict: verdict({ status: 'CONDITIONAL' }) }),
            config({ id: 42, widthIn: 8.5, etMm: 40, versionLabel: 'Breite 8,5J · ET 40 · Lochkreis 5 × 112', priceCents: 94900 }),
            config({ id: 45, widthIn: 9, etMm: 35, versionLabel: 'Breite 9J · ET 35 · Lochkreis 5 × 112', priceCents: 99900, verdict: verdict({ status: 'NOT_PERMITTED', sellable: false, reason: 'ET außerhalb des Gutachtens.' }) }),
            config({ id: 46, diameterIn: 19, widthIn: 8.5, etMm: 40, priceCents: 109900 }),
        ]

        const c = useConfigurator(() => configs, 10)

        expect(c.variants.value.map((v) => v.label)).toEqual(['Breite 8J · ET 45 · Lochkreis 5 × 112', 'Breite 8,5J · ET 40 · Lochkreis 5 × 112', 'Breite 9J · ET 35 · Lochkreis 5 × 112'])
        expect(c.variants.value[2]).toMatchObject({ blocked: true, reason: 'ET außerhalb des Gutachtens.' })

        c.selectVariant(c.variants.value[1]!)
        expect(c.selected.value?.id).toBe(42)

        c.selectVariant(c.variants.value[2]!)
        expect(c.selected.value?.id).toBe(42)
    })

    // Finding 138: the width beside the diameter follows the diameter's chip — an approved wheel whose tyre size waits is
    // grey and choosable there (finding 103), so it is here too, never struck as refused.
    it('keeps a width whose tyres are unconfirmed choosable, grey, with its reason', () => {
        const waiting = verdict({
            status: 'UNKNOWN', sellable: false, reason: 'Die Reifengröße ist noch nicht bestätigt.', wheelStatus: 'PERMITTED',
            tyre: { status: 'UNKNOWN', label: 'Noch nicht bestätigt', lines: [], thresholds: [], fromVehicleData: false },
        })
        const configs = [
            config({ id: 51, widthIn: 8, etMm: 45, sizeLabel: '8J × 18 · ET 45' }),
            config({ id: 52, widthIn: 9, etMm: 40, sizeLabel: '9J × 18 · ET 40', verdict: waiting }),
        ]

        const c = useConfigurator(() => configs, 10)

        expect(c.variants.value[1]).toMatchObject({ blocked: false, unconfirmed: true, reason: 'Die Reifengröße ist noch nicht bestätigt.' })
        c.selectVariant(c.variants.value[1]!)
        expect(c.selected.value?.id).toBe(52)
    })

    it('opens on a permitted size that is in stock before a cheaper one that is sold out', () => {
        const configs = [
            config({ id: 1, priceCents: 80000, inStock: false }),
            config({ id: 2, diameterIn: 19, priceCents: 90000 }),
        ]

        expect(useConfigurator(() => configs, 10).selected.value?.id).toBe(2)
    })

    it('keeps the chosen size when the colour changes and the new finish offers it', () => {
        const configs = [
            config({ id: 1, finishId: 10, diameterIn: 18, priceCents: 80000 }),
            config({ id: 2, finishId: 10, diameterIn: 19, priceCents: 90000 }),
            config({ id: 3, finishId: 20, diameterIn: 18, priceCents: 80000 }),
            config({ id: 4, finishId: 20, diameterIn: 19, priceCents: 90000 }),
        ]

        const c = useConfigurator(() => configs, 10)
        c.selectSize(c.sizes.value.find((s) => s.diameter === 19)!)
        c.selectFinish(20)

        expect(c.selected.value?.id).toBe(4)
    })

    // D-286: until the car's papers are in, no size sells — the colour must not move the customer off the size chosen.
    it('keeps the chosen size when the colour changes where the wheel is approved and only the tyres wait for the papers', () => {
        const open = verdict({
            status: 'UNKNOWN', label: 'Noch nicht bestätigt', sellable: false, wheelStatus: 'CONDITIONAL',
            tyre: { status: 'UNKNOWN', label: 'Noch nicht bestätigt', lines: [], thresholds: [], fromVehicleData: false, owed: ['8.1', '8.2', 'T'] },
        })
        const configs = [
            config({ id: 1, finishId: 10, diameterIn: 18, priceCents: 80000, verdict: open }),
            config({ id: 2, finishId: 10, diameterIn: 19, priceCents: 90000, verdict: open }),
            config({ id: 3, finishId: 20, diameterIn: 18, priceCents: 80000, verdict: open }),
            config({ id: 4, finishId: 20, diameterIn: 19, priceCents: 90000, verdict: open }),
        ]

        const c = useConfigurator(() => configs, 10)
        c.selectSize(c.sizes.value.find((s) => s.diameter === 19)!)
        c.selectFinish(20)

        expect(c.selected.value?.id).toBe(4)
    })

    it('speaks to the customer informally when a refused size carries no reason of its own', () => {
        const configs = [
            config({ id: 1, verdict: verdict({ status: 'NOT_PERMITTED', sellable: false, reason: null }) }),
        ]

        expect(useConfigurator(() => configs, 10).sizes.value[0]?.reason).toBe(
            'Für dein Fahrzeug nicht freigegeben.'
        )
    })

    it('reports the cheapest price of the finish as the from-price', () => {
        const configs = [
            config({ id: 1, priceCents: 120000, price: '1.200,00 €' }),
            config({ id: 2, diameterIn: 19, priceCents: 99900, price: '999,00 €' }),
        ]

        expect(useConfigurator(() => configs, 10).fromPrice.value).toBe('999,00 €')
    })
})

/*
 * The Gutachten rework §8: one version = one size row of the rim, chosen on its own. Without a car every version of the
 * colour and diameter; with one, those a released paper approves, and the others counted apart — refused by a paper, or
 * none on record (D-383, R-17).
 */
describe('the versions of the chosen diameter', () => {
    const refused = verdict({ status: 'NOT_PERMITTED', sellable: false, reason: 'Für dein Fahrzeug nicht freigegeben.' })
    const noPaper = verdict({ status: 'UNKNOWN', sellable: false, reason: 'Für diese Kombination liegt uns kein Gutachten vor.', reasonCode: 'NO_DOCUMENT' })
    const unentered = verdict({ status: 'UNKNOWN', sellable: false, reason: 'Zu diesem Gutachten haben wir die Reifengrößen für dein Fahrzeug noch nicht erfasst.', reasonCode: 'TYRE_SIZES_NOT_RECORDED' })

    it('without a car, shows every version of the colour and the diameter, and no other', () => {
        const configs = [
            config({ id: 1, widthIn: 8.5, etMm: 30, versionLabel: 'Breite 8,5J · ET 30 · Lochkreis 5 × 120' }),
            config({ id: 2, widthIn: 8, etMm: 40, versionLabel: 'Breite 8J · ET 40 · Lochkreis 5 × 112' }),
            config({ id: 3, widthIn: 9, etMm: 40, diameterIn: 19 }),
            config({ id: 4, widthIn: 8, etMm: 35, finishId: 11 }),
        ]
        const c = useConfigurator(() => configs, 10, 1)

        expect(c.versions.value.map((v) => v.id)).toEqual([2, 1])
        expect(c.versions.value.map((v) => v.label)).toEqual(['Breite 8J · ET 40 · Lochkreis 5 × 112', 'Breite 8,5J · ET 30 · Lochkreis 5 × 120'])
        expect(c.others.value).toEqual([])
    })

    it('with a car, keeps those it may have and sets the others apart, by what is on record', () => {
        const configs = [
            config({ id: 1, widthIn: 8, verdict: verdict({}) }),
            config({ id: 2, widthIn: 8.5, verdict: refused }),
            config({ id: 3, widthIn: 9, verdict: noPaper }),
            config({ id: 4, widthIn: 9.5, verdict: unentered }),
        ]
        const c = useConfigurator(() => configs, 10)

        expect(c.versions.value.map((v) => v.id)).toEqual([1])
        expect(c.others.value.map((v) => [v.id, v.standing])).toEqual([[2, 'refused'], [3, 'none'], [4, 'open']])
    })

    it('counts a version that only waits for the tyres or a fact of the car among those shown: a paper approves it', () => {
        const configs = [
            config({ id: 1, widthIn: 8, verdict: verdict({ status: 'UNKNOWN', sellable: false, wheelStatus: 'PERMITTED', tyre: { status: 'UNKNOWN' }, missing: [] } as unknown as Partial<ConfigVerdict>) }),
            config({ id: 2, widthIn: 8.5, verdict: verdict({ status: 'UNKNOWN', sellable: false, missing: ['bodyForm'] } as Partial<ConfigVerdict>) }),
        ]
        const c = useConfigurator(() => configs, 10)

        expect(c.versions.value.map((v) => v.id)).toEqual([1, 2])
        expect(c.others.value).toEqual([])
    })

    it('keeps one order for versions of the same width and ET: the bolt pattern decides, not the database', () => {
        const same = { widthIn: 8, etMm: 45 }
        const configs = [
            config({ id: 1, ...same, versionLabel: 'Breite 8J · ET 45 · Lochkreis 5 × 112' }),
            config({ id: 2, ...same, versionLabel: 'Breite 8J · ET 45 · Lochkreis 5 × 108' }),
        ]

        expect(useConfigurator(() => configs, 10).versions.value.map((v) => v.id)).toEqual([2, 1])
        expect(useConfigurator(() => [...configs].reverse(), 10).versions.value.map((v) => v.id)).toEqual([2, 1])
    })

    it('names the bore only where it alone tells two versions apart', () => {
        const same = { widthIn: 8, etMm: 35, versionLabel: 'Breite 8J · ET 35 · Lochkreis 5 × 112' }
        const configs = [
            config({ id: 1, ...same, centreBore: '66,6 mm' }),
            config({ id: 2, ...same, centreBore: '72,6 mm' }),
            config({ id: 3, widthIn: 9, etMm: 35, versionLabel: 'Breite 9J · ET 35 · Lochkreis 5 × 112', centreBore: '66,6 mm' }),
        ]
        const c = useConfigurator(() => configs, 10)

        expect(c.versions.value.map((v) => v.label)).toEqual([
            'Breite 8J · ET 35 · Lochkreis 5 × 112 · Mittenloch\u00A066,6 mm',
            'Breite 8J · ET 35 · Lochkreis 5 × 112 · Mittenloch\u00A072,6 mm',
            'Breite 9J · ET 35 · Lochkreis 5 × 112',
        ])
    })

    it('never swaps a version named in the link for another in silence: it stays chosen, among the others', () => {
        const configs = [config({ id: 1, widthIn: 8, verdict: verdict({}) }), config({ id: 2, widthIn: 8.5, verdict: refused })]
        const c = useConfigurator(() => configs, 10, 2)

        expect(c.selected.value?.id).toBe(2)
        expect(c.others.value.map((v) => v.id)).toEqual([2])
        expect(c.versions.value.map((v) => v.id)).toEqual([1])
    })

    describe('across colours, one version stays that version (the interaction review of Phase 3)', () => {
        const pattern = (id: number, finishId: number, boltPattern: string, over: Partial<ProduktConfig> = {}): ProduktConfig =>
            config({ id, finishId, boltPattern, versionLabel: `Breite 8J · ET 35 · Lochkreis ${boltPattern}`, fullLabel: `8J × 18 · ET 35 · ${boltPattern} · 66,6 mm`, ...over })

        it('does nothing on a press of the colour already on: the bolt pattern chosen stays', () => {
            const configs = [pattern(1, 10, '5 × 112'), pattern(2, 10, '5 × 108')]
            const c = useConfigurator(() => configs, 10)

            c.selectVariant(c.versions.value.find((v) => v.id === 2)!)
            c.selectFinish(10)

            expect(c.selected.value?.id).toBe(2)
            expect(c.configId.value).toBe(2)
        })

        it('keeps the bolt pattern in another colour: width and ET alone do not make a version', () => {
            const configs = [pattern(1, 10, '5 × 112'), pattern(2, 10, '5 × 120'), pattern(3, 20, '5 × 112'), pattern(4, 20, '5 × 120')]
            const c = useConfigurator(() => configs, 10)

            c.selectVariant(c.versions.value.find((v) => v.id === 2)!)
            c.selectFinish(20)

            expect(c.selected.value?.id).toBe(4)
            expect(c.colourLacks.value).toBeNull()
        })

        it('keeps the bore too: two bores of one size are two versions', () => {
            const configs = [pattern(1, 10, '5 × 112', { centreBore: '66,6 mm' }), pattern(2, 10, '5 × 112', { centreBore: '72,6 mm' }), pattern(3, 20, '5 × 112', { centreBore: '66,6 mm' }), pattern(4, 20, '5 × 112', { centreBore: '72,6 mm' })]
            const c = useConfigurator(() => configs, 10)

            c.selectVariant(c.versions.value.find((v) => v.id === 2)!)
            c.selectFinish(20)

            expect(c.selected.value?.id).toBe(4)
        })

        it('stays on the same version where the car may not have it in this colour: struck, and never swapped in silence', () => {
            const refused = verdict({ status: 'NOT_PERMITTED', sellable: false, reason: 'Nicht freigegeben.' })
            const configs = [
                config({ id: 1, finishId: 10, widthIn: 8, verdict: verdict({}) }),
                config({ id: 2, finishId: 10, widthIn: 8.5, verdict: verdict({}) }),
                config({ id: 3, finishId: 20, widthIn: 8, verdict: verdict({}) }),
                config({ id: 4, finishId: 20, widthIn: 8.5, verdict: refused }),
            ]
            const c = useConfigurator(() => configs, 10)

            c.selectVariant(c.versions.value.find((v) => v.id === 2)!)
            c.selectFinish(20)

            expect(c.selected.value?.id).toBe(4)
            expect(c.others.value.map((v) => v.id)).toEqual([4])
            expect(c.colourLacks.value).toBeNull()
        })

        it('says what a colour lacks, shows the nearest of the same diameter, and finds the person’s version again on the way back', () => {
            const configs = [
                config({ id: 1, finishId: 10, diameterIn: 18, widthIn: 8 }),
                config({ id: 2, finishId: 10, diameterIn: 18, widthIn: 8.5 }),
                config({ id: 3, finishId: 20, diameterIn: 18, widthIn: 8 }),
                config({ id: 4, finishId: 20, diameterIn: 19, widthIn: 8.5 }),
            ]
            const c = useConfigurator(() => configs, 10)

            c.selectVariant(c.versions.value.find((v) => v.id === 2)!)
            c.selectFinish(20)

            expect(c.selected.value?.id).toBe(3)
            expect(c.colourLacks.value?.id).toBe(2)

            c.selectFinish(10)

            expect(c.selected.value?.id).toBe(2)
            expect(c.colourLacks.value).toBeNull()
        })

        it('says it too where the colour lacks the whole diameter, and goes on from what the person then chooses', () => {
            const configs = [
                config({ id: 1, finishId: 10, diameterIn: 18, widthIn: 8 }),
                config({ id: 2, finishId: 10, diameterIn: 19, widthIn: 8.5 }),
                config({ id: 3, finishId: 20, diameterIn: 18, widthIn: 8 }),
            ]
            const c = useConfigurator(() => configs, 10)

            c.selectSize(c.sizes.value.find((s) => s.diameter === 19)!)
            c.selectFinish(20)

            expect(c.selected.value?.id).toBe(3)
            expect(c.colourLacks.value?.id).toBe(2)

            // Chosen now: this is the version from here on, and the note is over.
            c.selectVariant(c.versions.value.find((v) => v.id === 3)!)
            expect(c.colourLacks.value).toBeNull()

            c.selectFinish(10)
            expect(c.selected.value?.id).toBe(1)
        })

        it('takes the version on screen where nobody chose one, and keeps it through two colours', () => {
            const configs = [
                config({ id: 1, finishId: 10, widthIn: 8 }),
                config({ id: 2, finishId: 20, widthIn: 9 }),
                config({ id: 3, finishId: 30, widthIn: 8 }),
            ]
            const c = useConfigurator(() => configs, 10)

            c.selectFinish(20)
            expect(c.colourLacks.value?.id).toBe(1)

            c.selectFinish(30)
            expect(c.selected.value?.id).toBe(3)
            expect(c.colourLacks.value).toBeNull()
        })
    })

    describe('what a diameter leads to, in the order of OpeningSize', () => {
        const refused = verdict({ status: 'NOT_PERMITTED', sellable: false, reason: 'Nicht freigegeben.' })
        const question = verdict({ status: 'UNKNOWN', sellable: false, missing: ['bodyForm'] as never, reasonCode: 'BODY_OR_DRIVE_UNKNOWN' })
        const tyresOpen = verdict({ status: 'UNKNOWN', sellable: false, wheelStatus: 'PERMITTED', tyre: { status: 'UNKNOWN', label: '', lines: [], thresholds: [], fromVehicleData: false } as never })
        const nothing = verdict({ status: 'UNKNOWN', sellable: false, reasonCode: 'NO_DOCUMENT' })
        const led = (rows: Array<[number, ConfigVerdict, number]>): number =>
            useConfigurator(() => [config({ id: 99, diameterIn: 17, verdict: verdict({}) }), ...rows.map(([id, v, price]) => config({ id, diameterIn: 18, widthIn: 8 + id / 10, verdict: v, priceCents: price }))], 10)
                .sizes.value.find((s) => s.diameter === 18)!.config.id

        it('leads to the version that can still be answered, never to a cheaper refused one', () => {
            expect(led([[1, refused, 70400], [2, question, 74400]])).toBe(2)
        })

        it('ranks its tyres open before a question, a question before no paper, and no paper before a refusal', () => {
            expect(led([[1, refused, 100], [2, nothing, 200], [3, question, 300], [4, tyresOpen, 400]])).toBe(4)
            expect(led([[1, refused, 100], [2, nothing, 200], [3, question, 300]])).toBe(3)
            expect(led([[1, refused, 100], [2, nothing, 200]])).toBe(2)
        })

        it('takes the oldest row on a tie, as the server does', () => {
            expect(led([[2, refused, 100], [1, refused, 100]])).toBe(1)
        })
    })

    it('says what the versions of a struck diameter stand on, each kind once', () => {
        const refused = verdict({ status: 'NOT_PERMITTED', sellable: false })
        const open = verdict({ status: 'UNKNOWN', sellable: false, reasonCode: 'TYRE_SIZES_NOT_RECORDED' })
        const configs = [config({ id: 1, diameterIn: 18, verdict: refused }), config({ id: 2, diameterIn: 18, widthIn: 9, verdict: open }), config({ id: 3, diameterIn: 18, widthIn: 10, verdict: refused }), config({ id: 4, diameterIn: 19, verdict: verdict({}) })]
        const sizes = useConfigurator(() => configs, 10).sizes.value

        expect(sizes.find((s) => s.diameter === 18)!.standings).toEqual(['refused', 'open'])
        expect(sizes.find((s) => s.diameter === 19)!.standings).toEqual([])
    })

    it('says which version was picked by a person: nothing until one is, so the address names only a choice', () => {
        const configs = [config({ id: 1, widthIn: 8 }), config({ id: 2, widthIn: 8.5 })]
        const c = useConfigurator(() => configs, 10)

        expect(c.configId.value).toBeNull()

        c.selectVariant(c.versions.value[1]!)

        expect(c.configId.value).toBe(2)
        expect(c.selected.value?.id).toBe(2)
    })
})
