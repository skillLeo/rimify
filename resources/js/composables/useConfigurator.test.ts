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

    it('reports the cheapest price of the finish as the from-price', () => {
        const configs = [
            config({ id: 1, priceCents: 120000, price: '1.200,00 €' }),
            config({ id: 2, diameterIn: 19, priceCents: 99900, price: '999,00 €' }),
        ]

        expect(useConfigurator(() => configs, 10).fromPrice.value).toBe('999,00 €')
    })
})
