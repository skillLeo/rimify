import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { BasketLine, BasketTotals } from '../../types/rimify'

/*
 * The basket (ACCURACY.md D4, D7; findings #38, #39): no carrier, shipping named and left out of
 * the total while no price is configured, a demo line marked, and the way to the Kasse left open
 * so the flow can be reviewed.
 */

vi.mock('@inertiajs/vue3', () => ({
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    usePage: () => ({ props: { vehicle: null } }),
    router: { patch: () => undefined, delete: () => undefined },
}))

const { default: Warenkorb } = await import('./Index.vue')

type Line = BasketLine & { demo?: boolean }
type Totals = BasketTotals & { shippingConfigured?: boolean }

function line(overrides: Partial<Line> = {}): Line {
    return {
        key: 'wheel:11',
        kind: 'WHEEL',
        title: 'MCR4 Ultimate',
        subtitle: 'Light Grey D5',
        brandName: 'MOTEC',
        sizeLabel: '8,5J × 19 · ET 45',
        art: { kind: 'wheel', finish: 'silver', spokes: 5 },
        quantity: 4,
        unitPrice: '199,00 €',
        lineTotal: '796,00 €',
        lineTotalCents: 79_600,
        inStock: true,
        slug: 'motec-mcr4-ultimate',
        demo: true,
        verdict: null,
        ...overrides,
    }
}

function totals(overrides: Partial<Totals> = {}): Totals {
    return {
        subtotal: '796,00 €',
        shipping: 'wird noch festgelegt',
        shippingCents: 0,
        freeShipping: false,
        tax: '127,09 €',
        total: '796,00 €',
        totalCents: 79_600,
        count: 4,
        shippingConfigured: false,
        ...overrides,
    }
}

let wrappers: VueWrapper[] = []

function mountBasket(props: { lines?: Line[]; totals?: Totals } = {}): VueWrapper {
    const wrapper = mount(Warenkorb, { props: { lines: props.lines ?? [line()], totals: props.totals ?? totals() } })
    wrappers.push(wrapper)

    return wrapper
}

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
})

describe('Warenkorb', () => {
    it('names no carrier and leaves unconfigured shipping out of the total', () => {
        const wrapper = mountBasket()

        expect(wrapper.text()).not.toContain('DHL')
        expect(wrapper.find('.sum__open').text()).toBe('wird noch festgelegt')
        expect(wrapper.text()).toContain('Versandkosten werden noch festgelegt')
        expect(wrapper.text()).not.toContain('MwSt. und Versand')
    })

    it('prices shipping once a price is configured', () => {
        const wrapper = mountBasket({
            lines: [line({ demo: false })],
            totals: totals({ shippingConfigured: true, shipping: '9,90 €', shippingCents: 990, total: '805,90 €' }),
        })

        expect(wrapper.find('.sum__open').exists()).toBe(false)
        expect(wrapper.find('.sum').text()).toContain('9,90 €')
        expect(wrapper.text()).toContain('MwSt. und Versand')
        expect(wrapper.find('.cart__demo').exists()).toBe(false)
    })

    it('marks a demo line, says it cannot be ordered yet, and keeps the way to the Kasse open', () => {
        const wrapper = mountBasket()

        expect(wrapper.find('.bl__flags').text()).toContain('Beispielsortiment')
        expect(wrapper.find('.cart__demo').text()).toContain('bestellen kannst du sie noch nicht')

        const go = wrapper.find('a.cart__go')
        expect(go.exists()).toBe(true)
        expect(go.attributes('href')).toBe('/kasse')
    })
})
