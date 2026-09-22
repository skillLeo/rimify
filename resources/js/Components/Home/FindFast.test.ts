import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { felgen } from '../../format'
import type { StartseiteProps } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
}))

const { default: FindFast } = await import('./FindFast.vue')

type Brand = StartseiteProps['brands'][number]

const SOFT_HYPHEN = '­'

function brand(overrides: Partial<Brand> = {}): Brand {
    return { name: 'MOTEC', slug: 'motec', logo: null, logoAspect: null, count: 18, href: '/felgen?marke=motec', ...overrides }
}

const demo = brand({ name: 'Demo', slug: 'demo', count: 20, href: '/felgen?marke=demo' })

/** The seeded order puts Demo anywhere; the wall puts it last. */
function range(n: number): Brand[] {
    const makers = Array.from({ length: n - 1 }, (_, i) => brand({ name: `Marke ${i + 1}`, slug: `marke-${i + 1}`, count: i + 1, href: `/felgen?marke=marke-${i + 1}` }))

    return [demo, ...makers]
}

const sizes: StartseiteProps['sizes'] = [
    { inch: 18, count: 12, fitting: null, href: '/felgen?zoll=18' },
    { inch: 19, count: 9, fitting: null, href: '/felgen?zoll=19' },
]

const vehicle: VehicleProp = {
    id: 3,
    make: 'Audi',
    model: 'RS 4',
    variant: 'RS 4 Avant (B9)',
    label: 'Audi RS 4 Avant',
    short: 'Audi RS 4',
    hsn: '0588',
    tsn: 'BKH',
    keyNumbers: 'HSN 0588 · TSN BKH',
    buildWindow: '2017–2019',
}

let wrappers: VueWrapper[] = []

function mountFind(props: Partial<{ sizes: StartseiteProps['sizes']; brands: Brand[]; vehicle: VehicleProp | null }> = {}): VueWrapper {
    const wrapper = mount(FindFast, {
        props: { sizes: props.sizes ?? [], brands: props.brands ?? [brand(), demo], vehicle: props.vehicle ?? null },
        attachTo: document.body,
    })
    wrappers.push(wrapper)

    return wrapper
}

beforeEach(() => {
    // No logo in these fixtures is probed, but the page must never reach for the network in a test.
    vi.stubGlobal(
        'Image',
        class {
            onerror: (() => void) | null = null
            src = ''
        }
    )
})

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
})

describe('FindFast — Nach Marke on the desktop document', () => {
    it.each([1, 2, 6, 7, 13])('closes the wall with %i brands on its link cell, never on an empty one', (n) => {
        const wrapper = mountFind({ brands: range(n) })
        const items = wrapper.findAll('#h6 .brand-wall li')

        expect(items).toHaveLength(n + 1)
        for (const item of items) {
            expect(item.find('a').exists()).toBe(true)
            expect(item.attributes('aria-hidden')).toBeUndefined()
        }
        expect(items.at(-1)?.find('a').attributes('data-kind')).toBe('all')
        expect(wrapper.find('.brands__item--empty').exists()).toBe(false)
    })

    it('shows Demo as the sample range, last among the brands, named by content', () => {
        const wrapper = mountFind({ brands: [demo, brand()] })
        const links = wrapper.findAll('#h6 a.brand-cell:not(.brand-cell--all)')

        expect(links.map((l) => l.attributes('data-kind'))).toEqual(['name', 'sample'])
        expect(links[1]?.text()).toContain(`Beispiel${SOFT_HYPHEN}sortiment`)
        expect(links[1]?.find('.brand-cell__name').exists()).toBe(false)
        expect(links[1]?.find('.visually-hidden').text()).toBe('(Demo)')
        for (const link of wrapper.findAll('#h6 .brand-wall a')) {
            expect(link.attributes('aria-label')).toBeUndefined()
        }
        expect(links[0]?.find('.brand-cell__count').text()).toBe(felgen(18))
    })

    it('keeps the heading, its id and the top margin of the wall', () => {
        const alone = mountFind()
        expect(alone.find('#h6-heading').text()).toBe('Nach Marke')
        expect(alone.find('.brand-wall').classes()).not.toContain('brand-wall--flush')
        expect(alone.find('.brand-wall').attributes('aria-label')).toBe('Felgen nach Marke')

        const withSizes = mountFind({ sizes })
        expect(withSizes.find('#h6-heading').text()).toBe('Nach Zollgröße')
        expect(withSizes.find('#h6-brands').text()).toBe('Nach Marke')
    })

    it('with a vehicle, closes on the fitting list and says the counts are the whole stock', () => {
        const wrapper = mountFind({ vehicle })

        expect(wrapper.find('a.brand-cell--all').text()).toBe('Passende Felgen anzeigen')
        expect(wrapper.find('.brand-wall__note').text()).toContain('an deinen Audi RS 4 passen')
    })

    it('greys a brand without stock instead of linking it, and the note says so', () => {
        const wrapper = mountFind({ brands: [brand(), brand({ name: 'BBS', slug: 'bbs', count: 0, href: null }), demo] })
        const cells = wrapper.findAll('#h6 .brand-cell:not(.brand-cell--all)')

        expect(cells.map((cell) => cell.element.tagName.toLowerCase())).toEqual(['a', 'span', 'a'])
        expect(cells[1]?.classes()).toContain('brand-cell--none')
        expect(cells[1]?.attributes('href')).toBeUndefined()
        expect(cells[1]?.find('.brand-cell__count').exists()).toBe(false)
        expect(cells[1]?.text()).toContain('Noch keine Felgen auf Lager')
        expect(wrapper.find('#h6 .brand-wall__note').text()).toBe('Ausgegraute Marken haben gerade keine Felgen auf Lager.')
    })

    it('renders no brand row at all without brands', () => {
        const wrapper = mountFind({ sizes, brands: [] })

        expect(wrapper.find('#h6-brands').exists()).toBe(false)
        expect(wrapper.find('.brand-wall').exists()).toBe(false)
        expect(wrapper.find('.brand-wall__note').exists()).toBe(false)
    })
})
