import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { LookupResult } from '../../types/pages'
import type { ContactProp } from '../../types/rimify'

const current: { props: Record<string, unknown> } = { props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    useForm: (data: Record<string, unknown>) => reactive({ ...data, processing: false, errors: {}, post: vi.fn() }),
    router: { get: vi.fn() },
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
}))

const { default: VehicleSelector } = await import('./VehicleSelector.vue')

// Fixtures only — the shop's address lives in config/rimify.php; this is a reserved example domain.
const CONTACT: ContactProp = { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' }
const MISS: LookupResult = { status: 'not_found', hsn: '9999', tsn: 'ZZZ' }

let mounted: VueWrapper[] = []

function mountSelector(props: Record<string, unknown>): VueWrapper {
    current.props = props
    const wrapper = mount(VehicleSelector, {
        props: { makes: [{ make: 'BMW', models: 3 }], models: [], variants: [], selectedMake: null, selectedModel: null },
        global: { stubs: { DocFacsimile: true } },
    })
    mounted.push(wrapper)

    return wrapper
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('VehicleSelector — a key-number miss (R-09)', () => {
    it('offers three ways forward, the third an e-mail with the key numbers already written in', () => {
        const wrapper = mountSelector({ lookup: MISS, contact: CONTACT })
        const routes = wrapper.find('.vsel__miss-actions').findAll('a, button')

        expect(routes.map((r) => r.text())).toEqual(['Schlüsselnummern prüfen', 'Stattdessen Marke wählen', 'Per E-Mail nachfragen'])

        const href = routes[2]!.attributes('href') ?? ''
        const query = new URLSearchParams(href.split('?')[1] ?? '')

        expect(href.startsWith('mailto:service@example.com?')).toBe(true)
        expect(query.get('subject')).toBe('Fahrzeug nicht gefunden')
        expect(query.get('body')).toContain('HSN: 9999\r\nTSN: ZZZ')
        expect(wrapper.find('.vsel__miss-note').text()).toContain('service@example.com')
    })

    it('never sends the customer to the old contact form', () => {
        const wrapper = mountSelector({ lookup: MISS, contact: CONTACT })

        expect(wrapper.find('a[href="/kontakt"]').exists()).toBe(false)
        expect(wrapper.text()).not.toContain('Daten an RIMIFY senden')
    })

    it('still offers three ways forward if the contact details were ever missing', () => {
        const wrapper = mountSelector({ lookup: MISS })
        const routes = wrapper.find('.vsel__miss-actions').findAll('a, button')

        expect(routes).toHaveLength(3)
        expect(routes[2]!.attributes('href')).toBe('/kontakt')
    })

    it('shows no miss panel without a miss', () => {
        const wrapper = mountSelector({ contact: CONTACT })

        expect(wrapper.find('.vsel__miss').exists()).toBe(false)
    })
})
