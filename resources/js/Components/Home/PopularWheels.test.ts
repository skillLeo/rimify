import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { NNBSP } from '../../format'
import { formatMoney } from '../../lib/num'
import type { StartseiteProps } from '../../types/pages'
import type { ProductCardProp, VehicleProp } from '../../types/rimify'

vi.mock('@inertiajs/vue3', () => ({
    router: { get: vi.fn() },
    usePage: () => ({ props: {} }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
}))

const { default: PopularWheels } = await import('./PopularWheels.vue')

function card(n: number, overrides: Partial<ProductCardProp> = {}): ProductCardProp {
    return {
        modelId: n,
        modelName: `Modell ${n}`,
        slug: `modell-${n}`,
        brandName: 'Demo',
        finishId: 1,
        finishName: 'Silber',
        art: { finish: 'silver', spokes: 5 },
        image: null,
        rating: 4.5,
        ratingCount: 12,
        ratingLabel: 'Sehr gut',
        fromPriceCents: 18900 + n * 100,
        fromPrice: '',
        inStock: true,
        stockQty: 8,
        diameters: ['17', '18'],
        fitment: null,
        ...overrides,
    }
}

const cards = Array.from({ length: 8 }, (_, i) => card(i + 1))

type Shelf = NonNullable<StartseiteProps['popular']>

function popular(overrides: Partial<Shelf> = {}): Shelf {
    return { title: 'Neu im Shop', ranking: 'neu', cards, total: null, ...overrides }
}

const vehicle: VehicleProp = {
    id: 3,
    make: 'BMW',
    model: '3er',
    variant: '3er Coupé (E46) 320Ci',
    label: 'BMW 3er Coupé (E46) 320Ci',
    short: 'BMW 3er',
    hsn: '0005',
    tsn: '582',
    keyNumbers: 'HSN 0005 · TSN 582',
    buildWindow: '1999–2006',
}

let wrappers: VueWrapper[] = []

function mountPopular(props: { popular?: StartseiteProps['popular']; recentlyViewed?: ProductCardProp[]; vehicle?: VehicleProp | null } = {}): VueWrapper {
    const wrapper = mount(PopularWheels, {
        props: {
            popular: props.popular === undefined ? popular() : props.popular,
            recentlyViewed: props.recentlyViewed ?? [],
            vehicle: props.vehicle ?? null,
        },
        attachTo: document.body,
    })
    wrappers.push(wrapper)

    return wrapper
}

beforeEach(() => {
    // The tiles read the compare store.
    setActivePinia(createPinia())
})

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
})

describe('PopularWheels', () => {
    it('shows eight tiles with a per-wheel price and its legal line, one CTA each, and never a rating or a bare Details button', () => {
        const wrapper = mountPopular()

        const tiles = wrapper.findAll('#h5 .tile')
        expect(tiles).toHaveLength(8)

        for (const tile of tiles) {
            // The narrow no-break space before the € is part of the format (R-10).
            expect(tile.find('.tile__price').text()).toMatch(new RegExp(`^ab \\d{1,3}(\\.\\d{3})*,\\d{2}${NNBSP}€ pro Felge$`))
            expect(tile.find('.tile__legal').text()).toBe('inkl. MwSt., zzgl. Versandkosten')
            expect(tile.find('.star, [class*="rating"]').exists()).toBe(false)
            expect(tile.find('.verdict').exists()).toBe(false)
            // One link per card, and it says what happens.
            expect(tile.findAll('a')).toHaveLength(1)
            expect(tile.find('a.tile__cta').text()).toBe('Details ansehen')
            expect(tile.find('input.tile__compare-input').exists()).toBe(true)
        }

        expect(wrapper.find('#h5 .tile__price').text()).toBe(`ab ${formatMoney(19000)} pro Felge`)
        expect(wrapper.text()).not.toMatch(/Details(?! ansehen)/)
        expect(wrapper.text()).not.toContain('Sehr gut')
        expect(wrapper.find('.popular__more a').text()).toBe('Alle Felgen ansehen')
        // No popularity claim without sales or view data behind it (ACCURACY.md D7, #51).
        expect(wrapper.text()).not.toMatch(/beliebt/i)
    })

    it('@kunde-05 heads the shelf with the server\'s word — „Meistgekaufte Felgen“ after a sale, „Neu im Shop“ before — and no tabs', () => {
        const sold = mountPopular({ popular: popular({ title: 'Meistgekaufte Felgen', ranking: 'meistgekauft' }) })

        expect(sold.find('h2').text()).toBe('Meistgekaufte Felgen')
        expect(sold.find('#h5').attributes('data-ranking')).toBe('meistgekauft')
        expect(sold.findAll('[role="tab"]')).toHaveLength(0)

        const none = mountPopular()

        expect(none.find('h2').text()).toBe('Neu im Shop')
        expect(none.find('#h5').attributes('data-ranking')).toBe('neu')
    })

    it('@kunde-05 shows no shelf at all below four wheels — absent, not empty — and the recently viewed alone if any', () => {
        const absent = mountPopular({ popular: null })

        expect(absent.find('#h5-heading').exists()).toBe(false)
        expect(absent.findAll('.tile')).toHaveLength(0)
        expect(absent.find('.empty').exists()).toBe(false)
        expect(absent.find('.popular__more').exists()).toBe(false)

        const recent = mountPopular({ popular: null, recentlyViewed: [card(21)] })

        expect(recent.find('#h5b h2').text()).toBe('Zuletzt angesehen')
        expect(recent.find('#h5-heading').exists()).toBe(false)
    })

    it('names the vehicle under the heading, carries the count on the button and a verdict on every tile', () => {
        const wrapper = mountPopular({
            vehicle,
            popular: popular({
                title: 'Meistgekaufte Felgen',
                ranking: 'meistgekauft',
                total: 1247,
                cards: cards.map((c, i) => card(i + 1, { fitment: { status: i % 2 ? 'CONDITIONAL' : 'PERMITTED', requiresEntry: false, conditions: i % 2 ? ['Die Änderung ist in die Fahrzeugpapiere einzutragen.'] : [] } })),
            }),
        })

        expect(wrapper.find('h2').text()).toBe('Meistgekaufte Felgen')
        expect(wrapper.find('.popular__for').text()).toBe('Passend für BMW 3er')
        expect(wrapper.find('.popular__more a').text()).toBe('1.247 passende Felgen anzeigen')
        expect(wrapper.find('.popular__more a').attributes('href')).toBe('/felgen')

        const tiles = wrapper.findAll('#h5 .tile')
        expect(tiles).toHaveLength(8)
        for (const tile of tiles) {
            expect(tile.find('.verdict').exists()).toBe(true)
        }
        expect(wrapper.text()).toContain('Die Änderung ist in die Fahrzeugpapiere einzutragen.')
    })

    it('says in one sentence when none of the shelf fits the car, and leads to the listing', () => {
        const wrapper = mountPopular({ vehicle, popular: popular({ cards: [], total: 0 }) })

        expect(wrapper.find('.empty__title').text()).toBe('Für dein Fahrzeug ist hier gerade keine dabei.')
        expect(wrapper.find('.popular__more a').attributes('href')).toBe('/felgen')
    })

    it('renders Zuletzt angesehen only with history', () => {
        const without = mountPopular()
        expect(without.find('#h5b').exists()).toBe(false)
        expect(without.text()).not.toContain('Zuletzt angesehen')

        const withHistory = mountPopular({ recentlyViewed: [card(21), card(22)] })
        const recent = withHistory.find('#h5b')
        expect(recent.exists()).toBe(true)
        expect(recent.find('h2').text()).toBe('Zuletzt angesehen')
        expect(recent.findAll('.tile')).toHaveLength(2)
    })
})
