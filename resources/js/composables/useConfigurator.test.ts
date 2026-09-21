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
        fullLabel: '8J × 18 · ET 35 · 5×112 · 66,6 mm',
        boltPattern: '5×112',
        centreBore: '66,6 mm',
        priceCents: 100000,
        price: '1.000,00 €',
        stockQty: 4,
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
        // BBS SR "Volcano Grau" on the BMW: two 18" rows, one refused, one permitted.
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
        // BBS SR "Himalaya Grau": 8J ET45 carries an Auflage, 8,5J ET40 is permitted outright.
        const configs = [
            config({ id: 41, widthIn: 8, etMm: 45, sizeLabel: '8J × 18 · ET 45', priceCents: 89900, verdict: verdict({ status: 'CONDITIONAL' }) }),
            config({ id: 42, widthIn: 8.5, etMm: 40, sizeLabel: '8,5J × 18 · ET 40', priceCents: 94900 }),
            config({ id: 45, widthIn: 9, etMm: 35, sizeLabel: '9J × 18 · ET 35', priceCents: 99900, verdict: verdict({ status: 'NOT_PERMITTED', sellable: false, reason: 'ET außerhalb des Gutachtens.' }) }),
            config({ id: 46, diameterIn: 19, widthIn: 8.5, etMm: 40, priceCents: 109900 }),
        ]

        const c = useConfigurator(() => configs, 10)

        expect(c.variants.value.map((v) => v.label)).toEqual(['8J × 18 · ET 45', '8,5J × 18 · ET 40', '9J × 18 · ET 35'])
        expect(c.variants.value[2]).toMatchObject({ blocked: true, reason: 'ET außerhalb des Gutachtens.' })

        c.selectVariant(c.variants.value[1]!)
        expect(c.selected.value?.id).toBe(42)

        c.selectVariant(c.variants.value[2]!)
        expect(c.selected.value?.id).toBe(42)
    })

    it('opens on a permitted size that is in stock before a cheaper one that is sold out', () => {
        const configs = [
            config({ id: 1, priceCents: 80000, inStock: false, stockQty: 0 }),
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
