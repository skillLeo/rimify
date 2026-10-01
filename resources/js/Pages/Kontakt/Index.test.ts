import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { ContactProp, VehicleProp } from '../../types/rimify'

const current: { props: Record<string, unknown> } = { props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    router: { on: vi.fn(() => () => undefined), delete: vi.fn(), visit: vi.fn() },
}))

const { default: Kontakt } = await import('./Index.vue')

/*
 * Fixtures only: the shop's own address lives in config/rimify.php. A reserved example domain, and
 * the phone is hyphenated so the contact-details guard does not read it as a German number.
 */
const CONTACT: ContactProp = { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' }

const VEHICLE: VehicleProp = {
    id: 3,
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

function mountPage(contact: ContactProp = CONTACT, vehicle: VehicleProp | null = null): VueWrapper {
    current.props = { contact, vehicle }
    const wrapper = mount(Kontakt, { props: { contact } })
    mounted.push(wrapper)

    return wrapper
}

function body(href: string): string | null {
    return new URLSearchParams(href.split('?')[1] ?? '').get('body')
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('Kontakt — e-mail only, until a real endpoint exists', () => {
    it('renders no form, because nothing would receive it', () => {
        const wrapper = mountPage()

        expect(wrapper.find('form').exists()).toBe(false)
        expect(wrapper.find('input').exists()).toBe(false)
        expect(wrapper.find('textarea').exists()).toBe(false)
        expect(wrapper.text()).not.toContain('Nachricht senden')
    })

    it('offers a mailto button to the configured address, with the configured hours', () => {
        const wrapper = mountPage()
        const button = wrapper.findAll('a.btn').find((a) => a.text() === 'E-Mail schreiben')

        expect(button).toBeDefined()
        expect(button!.attributes('href')).toBe('mailto:service@example.com?subject=Anfrage')
        expect(wrapper.text()).toContain('service@example.com')
        expect(wrapper.text()).toContain('wir sind Mo–Fr 9:00–17:00 Uhr für dich da')
    })

    it('makes no reply-time promise and offers no phone the client has not given', () => {
        const wrapper = mountPage()

        expect(wrapper.text()).not.toMatch(/Werktag|antworten|ruf/i)
        expect(wrapper.find('a[href^="tel:"]').exists()).toBe(false)
        expect(wrapper.find('a[href*="wa.me"]').exists()).toBe(false)
    })

    it('writes the chosen vehicle into the prepared e-mail', () => {
        const wrapper = mountPage(CONTACT, VEHICLE)
        const href = wrapper.find('a.btn').attributes('href') ?? ''

        expect(body(href)).toBe('Fahrzeug: BMW 3er Coupé (HSN 0005 · TSN 582)\r\n\r\n')
        expect(wrapper.text()).toContain('Dein Fahrzeug steht schon in der E-Mail: BMW 3er Coupé (HSN 0005 · TSN 582).')
    })

    // The live sweep of 01.10.2026: the page promised Feld K, the mail said „HSN/TSN noch nicht hinterlegt“.
    it('writes into the e-mail what the page says it wrote, also for a car known only by its Feld K', () => {
        const nb = String.fromCharCode(160)
        const fromGutachten: VehicleProp = {
            ...VEHICLE,
            label: 'BMW X3 X83',
            hsn: null,
            tsn: null,
            keyNumbers: 'HSN/TSN noch nicht hinterlegt',
            approval: `Feld${nb}K: e1*2001/116*0249`,
        }
        const wrapper = mountPage(CONTACT, fromGutachten)
        const line = `BMW X3 X83 (Feld${nb}K: e1*2001/116*0249)`

        expect(body(wrapper.find('a.btn').attributes('href') ?? '')).toBe(`Fahrzeug: ${line}\r\n\r\n`)
        expect(wrapper.find('.kon__hint').text()).toBe(`Dein Fahrzeug steht schon in der E-Mail: ${line}.`)
    })

    it('shows a phone only once the client has configured one', () => {
        const wrapper = mountPage({ ...CONTACT, phone: '0800-555-0100', phoneIntl: '+49-800-5550100' })

        expect(wrapper.find('a[href^="tel:"]').attributes('href')).toBe('tel:+49-800-5550100')
    })
})
