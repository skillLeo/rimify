/*
 * The phone homepage, H6 only: the brand wall is the same component as on the desktop document
 * (home-brands.md §9.1) — flush under its heading, Demo labelled and last, no empty cell.
 */

import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { StartseiteProps } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'

const current: { props: Record<string, unknown> } = { props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    router: { get: vi.fn() },
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
}))

// The shell is not under test here: the page is mounted on its own.
vi.mock('../../Layouts/MobileLayout.vue', () => ({ default: {} }))

const { default: Mobile } = await import('./Mobile.vue')

type Brand = StartseiteProps['brands'][number]

const SOFT_HYPHEN = '­'

function brand(overrides: Partial<Brand> = {}): Brand {
    return { name: 'MOTEC', slug: 'motec', logo: null, logoAspect: null, count: 18, href: '/felgen?marke=motec', ...overrides }
}

const demo = brand({ name: 'Demo', slug: 'demo', count: 20, href: '/felgen?marke=demo' })

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

function pageProps(overrides: Partial<StartseiteProps> = {}): StartseiteProps {
    return {
        hero: { title: 'Felgen mit Gutachten', subline: 'Ein Satz.', product: null, stats: { gutachten: 1, variants: 1, wheels: 38, brands: 2 } },
        selector: { makes: [] },
        fitmentCount: null,
        promises: [],
        popular: { title: 'Felgen mit den meisten Freigaben', tabs: [], active: 'beliebt', cards: [], total: null },
        recentlyViewed: [],
        sizes: [],
        // Server order: the sample range first; the wall moves it to the end.
        brands: [demo, brand()],
        komplettrad: { tyre: null },
        calculator: { prefill: null },
        partners: { enabled: false, demo: false },
        guides: [],
        faq: [],
        demo: true,
        ...overrides,
    }
}

let wrappers: VueWrapper[] = []

function mountPage(overrides: Partial<StartseiteProps> = {}, shared: { vehicle: VehicleProp | null } = { vehicle: null }): VueWrapper {
    current.props = {
        vehicle: shared.vehicle,
        garage: [],
        serviceStatus: null,
        // Fixture only, on a reserved example domain.
        contact: { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' },
    }
    const wrapper = mount(Mobile, {
        props: pageProps(overrides),
        global: {
            stubs: {
                VehiclePanel: true,
                HeroFrame: true,
                GutachtenStory: true,
                Shelf: true,
                ProductTile: true,
                ProductTileSkeleton: true,
                TyreLabel: true,
                KomplettradWheel: true,
                RimCode: true,
                ListRow: true,
                Accordion: true,
            },
        },
    })
    wrappers.push(wrapper)

    return wrapper
}

beforeEach(() => {
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
    vi.unstubAllGlobals()
})

describe('Startseite (phone) — Nach Marke', () => {
    it('renders the shared wall flush under the heading, Demo labelled and last, closed by its link cell', () => {
        const wrapper = mountPage()
        const wall = wrapper.find('#h6 ul.brand-wall')

        expect(wrapper.find('#h6-title').text()).toBe('Nach Marke')
        expect(wall.exists()).toBe(true)
        expect(wall.classes()).toContain('brand-wall--flush')
        expect(wall.attributes('aria-label')).toBe('Felgen nach Marke')
        expect(wrapper.find('.brand-grid').exists()).toBe(false)

        const items = wall.findAll('li')
        expect(items).toHaveLength(3)
        for (const item of items) {
            expect(item.find('a').exists()).toBe(true)
        }

        const links = wall.findAll('a')
        expect(links.map((l) => l.attributes('data-kind'))).toEqual(['name', 'sample', 'all'])
        expect(links[1]?.text()).toContain(`Beispiel${SOFT_HYPHEN}sortiment`)
        expect(links[1]?.find('.brand-cell__name').exists()).toBe(false)
        expect(links[2]?.text()).toBe('Alle Felgen ansehen')
        for (const link of links) {
            expect(link.attributes('aria-label')).toBeUndefined()
            // A card is never scaled (DIRECTION §6).
            expect(link.classes()).not.toContain('m-press')
        }
        expect(wrapper.find('#h6 .brand-wall__note').text()).toBe('Nur Marken, von denen gerade Felgen auf Lager sind.')
    })

    it('keeps the 40 px gap after the size shelf only when there is one', () => {
        expect(mountPage().find('.home-brands').classes()).not.toContain('home-brands--after-sizes')

        const withSizes = mountPage({ sizes: [{ inch: 18, count: 12, fitting: null, href: '/felgen?zoll=18' }] })
        expect(withSizes.find('.home-brands').classes()).toContain('home-brands--after-sizes')
        expect(withSizes.find('#h6-title').text()).toBe('Nach Zollgröße')
        expect(withSizes.find('.home-brands h2').text()).toBe('Nach Marke')
    })

    it('with a vehicle, closes on the fitting list and names the counts as the whole stock', () => {
        const wrapper = mountPage({}, { vehicle })

        expect(wrapper.find('#h6 a.brand-cell--all').text()).toBe('Passende Felgen anzeigen')
        expect(wrapper.find('#h6 .brand-wall__note').text()).toContain('an deinen Audi RS 4 passen')
    })
})
