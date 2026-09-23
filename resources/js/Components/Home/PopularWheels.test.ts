import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { euro, NNBSP } from '../../format'
import type { StartseiteProps } from '../../types/pages'
import type { ProductCardProp, VehicleProp } from '../../types/rimify'

type VisitOptions = {
    only?: string[]
    preserveScroll?: boolean
    preserveState?: boolean
    onStart?: () => void
    onSuccess?: () => void
    onCancel?: () => void
    onFinish?: () => void
}

const get = vi.fn<(url: string, data: Record<string, string>, options: VisitOptions) => void>()

vi.mock('@inertiajs/vue3', () => ({
    router: { get: (...args: [string, Record<string, string>, VisitOptions]) => get(...args) },
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
        fromPriceCents: 75600 + n * 400,
        fromPrice: '',
        inStock: true,
        stockQty: 8,
        diameters: ['17', '18'],
        fitment: null,
        ...overrides,
    }
}

const cards = Array.from({ length: 8 }, (_, i) => card(i + 1))

function popular(overrides: Partial<StartseiteProps['popular']> = {}): StartseiteProps['popular'] {
    return {
        title: 'Felgen mit den meisten Freigaben',
        tabs: [
            { key: 'beliebt', label: 'Meiste Freigaben' },
            { key: 'neu', label: 'Neu' },
            { key: 'bis200', label: 'Bis 200 €' },
        ],
        active: 'beliebt',
        cards,
        total: null,
        ...overrides,
    }
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

function mountPopular(props: Partial<{ popular: StartseiteProps['popular']; recentlyViewed: ProductCardProp[]; vehicle: VehicleProp | null }> = {}): VueWrapper {
    const wrapper = mount(PopularWheels, {
        props: {
            popular: props.popular ?? popular(),
            recentlyViewed: props.recentlyViewed ?? [],
            vehicle: props.vehicle ?? null,
        },
        attachTo: document.body,
    })
    wrappers.push(wrapper)

    return wrapper
}

beforeEach(() => {
    get.mockReset()
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
            expect(tile.find('.tile__legal').text()).toBe('inkl. MwSt., zzgl. Versand')
            expect(tile.find('.star, [class*="rating"]').exists()).toBe(false)
            expect(tile.find('.verdict').exists()).toBe(false)
            // One link per card, and it says what happens.
            expect(tile.findAll('a')).toHaveLength(1)
            expect(tile.find('a.tile__cta').text()).toBe('Details ansehen')
            expect(tile.find('input.tile__compare-input').exists()).toBe(true)
        }

        expect(wrapper.find('#h5 .tile__price').text()).toBe(`ab ${euro(19000)} pro Felge`)
        expect(wrapper.text()).not.toMatch(/Details(?! ansehen)/)
        expect(wrapper.text()).not.toContain('Sehr gut')
        expect(wrapper.find('h2').text()).toBe('Felgen mit den meisten Freigaben')
        expect(wrapper.find('.popular__more a').text()).toBe('Alle Felgen ansehen')
        // No popularity claim without sales or view data behind it (ACCURACY.md D7, #51).
        expect(wrapper.text()).not.toMatch(/beliebt/i)
    })

    it('reloads only the popular row when a tab changes, keeping scroll and state', async () => {
        const wrapper = mountPopular()

        const neu = wrapper.findAll('[role="tab"]').find((t) => t.text() === 'Neu')
        expect(neu).toBeDefined()
        await neu?.trigger('mousedown', { button: 0 })
        await neu?.trigger('click')
        await nextTick()

        expect(get).toHaveBeenCalledTimes(1)
        const [url, data, options] = get.mock.calls[0] as [string, Record<string, string>, VisitOptions]
        expect(url).toBe('/')
        expect(data).toEqual({ beliebt: 'neu' })
        expect(options.only).toEqual(['popular'])
        expect(options.preserveScroll).toBe(true)
        expect(options.preserveState).toBe(true)
    })

    it('shows eight skeletons while a tab loads and says so when the request fails', async () => {
        const wrapper = mountPopular()

        const neu = wrapper.findAll('[role="tab"]').find((t) => t.text() === 'Neu')
        await neu?.trigger('mousedown', { button: 0 })
        await neu?.trigger('click')
        await nextTick()

        const options = (get.mock.calls[0] as [string, Record<string, string>, VisitOptions])[2]
        options.onStart?.()
        await nextTick()

        expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
        expect(wrapper.findAll('#h5 .skeleton--tile')).toHaveLength(8)

        options.onFinish?.()
        await nextTick()

        expect(wrapper.find('.notice--bad').text()).toContain('Die Felgen lassen sich gerade nicht laden.')
        expect(wrapper.find('.notice--bad button').text()).toBe('Erneut versuchen')
        // The last good tiles stay under the notice.
        expect(wrapper.findAll('#h5 .tile')).toHaveLength(8)
    })

    it('names the vehicle, keeps the tabs the server sends, carries the count on the button and a verdict on every tile', () => {
        const wrapper = mountPopular({
            vehicle,
            popular: popular({
                title: null,
                total: 1247,
                cards: cards.map((c, i) => card(i + 1, { fitment: { status: i % 2 ? 'CONDITIONAL' : 'PERMITTED', requiresEntry: false, conditions: i % 2 ? ['Die Änderung ist in die Fahrzeugpapiere einzutragen.'] : [] } })),
            }),
        })

        expect(wrapper.find('h2').text()).toBe('Passend für deinen BMW 3er')
        expect(wrapper.findAll('[role="tab"]').map((t) => t.text())).toEqual(['Meiste Freigaben', 'Neu', 'Bis 200 €'])
        expect(wrapper.find('.popular__more a').text()).toBe('1.247 passende Felgen anzeigen')
        expect(wrapper.find('.popular__more a').attributes('href')).toBe('/felgen')

        const tiles = wrapper.findAll('#h5 .tile')
        expect(tiles).toHaveLength(8)
        for (const tile of tiles) {
            expect(tile.find('.verdict').exists()).toBe(true)
        }
        expect(wrapper.text()).toContain('Die Änderung ist in die Fahrzeugpapiere einzutragen.')
    })

    it('renders the row alone when the server sends no tabs', () => {
        const wrapper = mountPopular({ vehicle, popular: popular({ title: null, tabs: [], active: 'beliebt', total: 3 }) })

        expect(wrapper.findAll('[role="tab"]')).toHaveLength(0)
        expect(wrapper.findAll('#h5 .tile')).toHaveLength(8)
        expect(wrapper.find('.popular__more a').text()).toBe('3 passende Felgen anzeigen')
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

    it('shows the designed empty state when a tab has nothing', () => {
        const wrapper = mountPopular({ popular: popular({ active: 'bis200', cards: [] }) })

        expect(wrapper.find('.empty__title').text()).toBe('In dieser Auswahl ist gerade nichts.')
        expect(wrapper.find('.empty__text').text()).toBe('Schau unter „Meiste Freigaben“ oder „Neu“ – oder sieh dir alle Felgen an.')
        expect(wrapper.find('.popular__more a').exists()).toBe(true)
    })
})
