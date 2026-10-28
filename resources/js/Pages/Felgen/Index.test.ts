import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { VehicleProp } from '../../types/rimify'

const current: { props: Record<string, unknown> } = { props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    router: { get: vi.fn(), on: vi.fn(() => () => undefined), delete: vi.fn(), post: vi.fn(), flushAll: vi.fn() },
}))

const { default: Felgen } = await import('./Index.vue')

const VEHICLE: VehicleProp = {
    id: 7,
    make: 'BMW',
    model: '3er',
    variant: 'Coupé',
    typeDesignation: null,
    label: 'BMW 3er Coupé',
    short: 'BMW 3er',
    hsn: '0005',
    tsn: '582',
    keyNumbers: 'HSN 0005 · TSN 582',
    buildWindow: '01/1995–12/1999',
}

let mounted: VueWrapper[] = []

function mountEmpty(filters: Record<string, unknown> = {}): VueWrapper {
    current.props = { vehicle: VEHICLE, notifyByMail: true, contact: { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' } }
    const wrapper = mount(Felgen, {
        props: { hasVehicle: true, cards: [], total: 0, facets: {}, filters, page: 1, demo: false },
        global: { stubs: { FilterBar: true, ProductTile: true } },
    })
    mounted.push(wrapper)

    return wrapper
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('Felgen — the count with a filter set (EIGENE-FUNDE 128)', () => {
    it('says what the filters left of what they narrowed: „0 von 44 Felgen“, and the plain count without a filter', () => {
        current.props = { vehicle: null, contact: { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: '' } }
        const filtered = mount(Felgen, {
            props: { hasVehicle: false, cards: [], total: null, unfiltered: 44, facets: {}, filters: { zoll: ['22.0'] }, page: 1, demo: false },
            global: { stubs: { FilterBar: true, ProductTile: true } },
        })
        const plain = mount(Felgen, {
            props: { hasVehicle: false, cards: [], total: null, unfiltered: null, facets: {}, filters: {}, page: 1, demo: false },
            global: { stubs: { FilterBar: true, ProductTile: true } },
        })
        mounted.push(filtered, plain)

        expect(filtered.find('.plp__count').text().replace(/\s+/g, ' ')).toBe('0 von 44 Felgen')
        expect(plain.find('.plp__count').text().replace(/\s+/g, ' ')).toBe('0 Felgen im Sortiment')
    })

    // Human QA 28.10.2026: „2Felgen mit gültigem Gutachten“ — the space after the number was lost, at both widths. Read as
    // the page gives it, never with the whitespace evened out first.
    it('keeps the space between the number and the word, with and without a filter', async () => {
        const wrapper = mountEmpty()
        await wrapper.setProps({ total: 2 })
        expect(wrapper.find('.plp__count').text()).toBe('2 Felgen mit gültigem Gutachten für dieses Fahrzeug')

        await wrapper.setProps({ total: 1, unfiltered: 12 })
        expect(wrapper.find('.plp__count').text()).toBe('1 von 12 Felgen mit gültigem Gutachten für dieses Fahrzeug')

        await wrapper.setProps({ total: 1, unfiltered: null })
        expect(wrapper.find('.plp__count').text()).toBe('1 Felge mit gültigem Gutachten für dieses Fahrzeug')
    })

    it('says it for a car too, with what the Gutachten cover', () => {
        const wrapper = mountEmpty({ zoll: ['22.0'] })
        wrapper.setProps({ unfiltered: 12 })

        return wrapper.vm.$nextTick().then(() => {
            expect(wrapper.find('.plp__count').text().replace(/\s+/g, ' ')).toBe('0 von 12 Felgen mit gültigem Gutachten für dieses Fahrzeug')
        })
    })
})

describe('Felgen — the choices in the list on a phone (the client\'s #31)', () => {
    const FACETS = {
        zoll: [{ value: '18.0', count: 3 }, { value: '19.0', count: 0 }],
        marke: [{ value: 'BORBET', count: 2 }],
    }

    it('sets the sizes and brands out as chips under the Filter button, the chosen one pressed, an empty one disabled', async () => {
        const { router } = await import('@inertiajs/vue3')
        current.props = { vehicle: null, contact: { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: '' } }
        const wrapper = mount(Felgen, {
            props: { hasVehicle: false, cards: [], total: null, facets: FACETS, filters: { zoll: ['18.0'] }, page: 1, demo: false },
            global: { stubs: { FilterBar: true, ProductTile: true } },
        })
        mounted.push(wrapper)
        const chips = wrapper.findAll('.plp__quick .chip')

        expect(chips.map((c) => c.text())).toEqual(['18\u202fZoll 3', '19\u202fZoll 0', 'BORBET 2'])
        expect(chips[0]?.attributes('aria-pressed')).toBe('true')
        expect(chips[1]?.attributes('disabled')).toBeDefined()

        await chips[2]?.trigger('click')

        expect(router.get).toHaveBeenCalledWith('/felgen', { zoll: ['18.0'], marke: ['BORBET'] }, expect.objectContaining({ replace: true }))
    })
})

describe('Felgen — the empty listing for a vehicle', () => {
    it('offers the real notify flow instead of the contact form that sent nothing', () => {
        const wrapper = mountEmpty()
        const state = wrapper.find('.state')

        expect(state.find('a[href="/kontakt"]').exists()).toBe(false)
        expect(state.find('form.vnotify__form').exists()).toBe(true)
        expect(state.find('button[type="submit"]').text()).toBe('Benachrichtigen, sobald verfügbar')
        expect(state.find('a[href="/felgen-suchen"]').exists()).toBe(true)
    })

    it('offers the filter reset, not the notify flow, when filters emptied the list', () => {
        const wrapper = mountEmpty({ zoll: ['19'] })
        const state = wrapper.find('.state')

        expect(state.find('form').exists()).toBe(false)
        expect(state.text()).toContain('Filter zurücksetzen')
    })
})

describe('Felgen — no wheel in the shop at all', () => {
    it('says so once, without sending anyone to choose a car first, and offers to write', () => {
        current.props = { vehicle: null, contact: { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: '' } }
        const wrapper = mount(Felgen, {
            props: { hasVehicle: false, cards: [], total: null, facets: {}, filters: {}, page: 1, demo: false },
            global: { stubs: { FilterBar: true, ProductTile: true } },
        })
        mounted.push(wrapper)
        const state = wrapper.get('.state')

        expect(wrapper.find('.plp__notice').exists()).toBe(false)
        expect(state.get('.state__title').text()).toBe('Im Sortiment ist gerade keine Felge.')
        expect(state.text()).toContain('Sobald die ersten freigegeben sind, stehen sie hier.')
        expect(state.findAll('a').map((a) => [a.text(), a.attributes('href')])).toEqual([['Schreib uns', '/kontakt?betreff=Ich+suche+eine+Felge&von=%2Ffelgen']])
    })
})
