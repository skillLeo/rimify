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
    router: { get: vi.fn(), on: vi.fn(() => () => undefined), delete: vi.fn() },
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
