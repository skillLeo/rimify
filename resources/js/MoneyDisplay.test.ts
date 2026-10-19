import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { ProductCardProp } from './types/rimify'

/*
 * The money sweep's twin (the launch release §4; tests/Feature/Storefront/MoneyDisplayTest.php): the
 * two surfaces the browser writes from minor units, given exactly the cents the server sends for one
 * rim at 229,00 € and four of them (D-102) — and the text they render, as the customer and the team read it.
 */

vi.mock('@inertiajs/vue3', () => ({
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
    // The order page's „Erstatten“ reads the page's errors and posts through the router (Block G §5).
    usePage: () => ({ props: { errors: {} } }),
    router: { post: vi.fn() },
}))

const { default: ProductTile } = await import('./Components/Ui/ProductTile.vue')
const { default: OrderShow } = await import('./Pages/Admin/Bestellungen/Show.vue')

const RIM = 22_900
const FOUR = 91_600

beforeEach(() => {
    setActivePinia(createPinia())
})

describe('MoneyDisplay', () => {
    it('shows one rim on the tile, never a share of four', () => {
        const card: ProductCardProp = {
            modelId: 1,
            modelName: 'Probelauf',
            slug: 'platzhalter-probelauf',
            brandName: 'Platzhalter',
            finishId: 1,
            finishName: 'Silber',
            art: { finish: 'silver', spokes: 5 },
            image: null,
            rating: null,
            ratingCount: 0,
            ratingLabel: null,
            fromPriceCents: RIM,
            fromPrice: '229,00\u202F€',
            inStock: true,
            diameters: ['18'],
            fitment: null,
        }

        const tile = mount(ProductTile, { props: { card, vehicle: null, compare: false, eager: false } })

        expect(tile.find('.tile__price').text()).toBe('ab 229,00\u202F€ pro Felge')
        tile.unmount()
    })

    it('shows the order line as four × one rim and the total of four in the admin', () => {
        const state = { key: 'paid', label: 'Bezahlt', tone: 'plain' as const }
        const page = mount(OrderShow, {
            props: {
                order: {
                    id: 1, number: 'RMF-2026-0001', statusLabel: 'Bezahlt', payment: state, fulfilment: state,
                    paymentMethod: null, shippingMethod: null, vehicle: null, keys: null, placedAt: null, paidAt: null,
                    shippedAt: null, tracking: null, note: null, subtotal: FOUR, shipping: 0, tax: 14_625, total: FOUR, demo: false, test: false,
                },
                customer: { name: 'Erika Mustermann', email: null, phone: null },
                delivery: null,
                billing: null,
                sameAddress: true,
                lines: [{ id: 1, kind: 'WHEEL', label: 'Platzhalter Probelauf', quantity: 4, unit: RIM, total: FOUR, package: null, snapshot: null }],
            },
            global: { stubs: { AdminPage: { template: '<div><slot /></div>' } } },
        })

        expect(page.find('.bs-line__qty').text()).toBe('4 × 229,00\u202F€')
        expect(page.find('.bs-line__total').text()).toBe('916,00\u202F€')
        expect(page.text()).toContain('146,25\u202F€')
        page.unmount()
    })
})
