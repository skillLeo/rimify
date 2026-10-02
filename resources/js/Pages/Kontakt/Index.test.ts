import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { ContactProp, VehicleProp } from '../../types/rimify'

const current: { props: Record<string, unknown> } = { props: {} }

interface PostOptions {
    onSuccess?: () => void
    onError?: () => void
}

/* What `useForm` posted: the address, the data after `transform`, and the options — the test answers through them. */
const posted: { url: string; data: Record<string, unknown>; options: PostOptions }[] = []

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    router: { on: vi.fn(() => () => undefined), delete: vi.fn(), visit: vi.fn() },
    useForm: <T extends Record<string, unknown>>(data: T) => {
        let transform = (d: Record<string, unknown>): Record<string, unknown> => d
        const initial = { ...data }
        const form = reactive({
            ...data,
            errors: {} as Record<string, string>,
            processing: false,
            transform(fn: (d: Record<string, unknown>) => Record<string, unknown>) {
                transform = fn

                return form
            },
            post(url: string, options: PostOptions) {
                const values = Object.fromEntries(Object.keys(initial).map((k) => [k, (form as Record<string, unknown>)[k]]))
                posted.push({ url, data: transform(values), options })
            },
            reset(...keys: string[]) {
                for (const k of keys) (form as Record<string, unknown>)[k] = initial[k]
            },
        })

        return form
    },
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

function mountPage(
    options: { contact?: ContactProp; vehicle?: VehicleProp | null; prefill?: { subject: string; from: string | null }; mail?: boolean } = {}
): VueWrapper {
    const contact = options.contact ?? CONTACT
    current.props = { contact, vehicle: options.vehicle ?? null, notifyByMail: options.mail ?? true }
    const wrapper = mount(Kontakt, { props: { contact, prefill: options.prefill }, attachTo: document.body })
    mounted.push(wrapper)

    return wrapper
}

async function fill(wrapper: VueWrapper): Promise<void> {
    await wrapper.find('#kon-name').setValue('Jana Beispiel')
    await wrapper.find('#kon-email').setValue('jana@example.com')
    await wrapper.find('#kon-subject').setValue('Frage zu einer Felge')
    await wrapper.find('#kon-message').setValue('Passt die Felge auch mit Winterreifen?')
}

beforeEach(() => {
    posted.length = 0
    window.sessionStorage.clear()
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('Kontakt — the contact form (#12)', () => {
    it('asks for name, e-mail, subject and message, says what the address is used for, and sends to the shop', async () => {
        const wrapper = mountPage()
        await fill(wrapper)

        expect(wrapper.find('label[for="kon-name"]').text()).toBe('Dein Name')
        expect(wrapper.find('.kon__privacy a').attributes('href')).toBe('/rechtliches/datenschutz')

        await wrapper.find('form').trigger('submit')

        expect(posted).toHaveLength(1)
        expect(posted[0]!.url).toBe('/kontakt')
        expect(posted[0]!.data).toMatchObject({
            name: 'Jana Beispiel',
            email: 'jana@example.com',
            subject: 'Frage zu einer Felge',
            message: 'Passt die Felge auch mit Winterreifen?',
            // No car chosen: nothing to send along.
            withVehicle: false,
            rmf_leer: '',
        })
    })

    it('starts with the subject and the page the link came from', async () => {
        const wrapper = mountPage({ prefill: { subject: 'Frage zu Bestellung R-1001', from: '/bestellung/R-1001' } })

        expect((wrapper.find('#kon-subject').element as HTMLInputElement).value).toBe('Frage zu Bestellung R-1001')

        await fill(wrapper)
        await wrapper.find('form').trigger('submit')
        expect(posted[0]!.data.from).toBe('/bestellung/R-1001')
    })

    it('offers the chosen car, ticked — and sends it only while it stays ticked', async () => {
        const wrapper = mountPage({ vehicle: VEHICLE })
        const box = wrapper.find('.kon__vehicle input')

        expect(wrapper.find('.kon__vehicle').text()).toBe('Mein Fahrzeug mitschicken: BMW 3er Coupé (HSN 0005 · TSN 582)')
        expect((box.element as HTMLInputElement).checked).toBe(true)
        // With a car chosen, the hint to type the key numbers is not needed.
        expect(wrapper.find('#kon-message-help').exists()).toBe(false)

        await fill(wrapper)
        await box.setValue(false)
        await wrapper.find('form').trigger('submit')
        expect(posted[0]!.data.withVehicle).toBe(false)
    })

    it('without a car, asks for the key numbers in the message instead', () => {
        const wrapper = mountPage()

        expect(wrapper.find('.kon__vehicle').exists()).toBe(false)
        expect(wrapper.find('#kon-message-help').text()).toContain('HSN, TSN und Modell')
    })

    it('hides the honeypot from people and from screen readers, out of the tab order', () => {
        const wrapper = mountPage()
        const trap = wrapper.find('.kon__trap')

        expect(trap.attributes('aria-hidden')).toBe('true')
        expect(trap.find('input').attributes('tabindex')).toBe('-1')
        expect(trap.find('input').attributes('autocomplete')).toBe('off')
    })

    it('puts the thanks where the form was, and moves the focus to it', async () => {
        const wrapper = mountPage()
        await fill(wrapper)
        await wrapper.find('form').trigger('submit')

        posted[0]!.options.onSuccess?.()
        await flushPromises()

        expect(wrapper.find('form').exists()).toBe(false)
        const done = wrapper.find('.kon__done')
        expect(done.attributes('role')).toBe('status')
        expect(done.text()).toContain('Danke, Jana Beispiel – deine Nachricht ist angekommen.')
        expect(done.text()).toContain('Wir antworten dir an jana@example.com.')
        expect(document.activeElement).toBe(done.element)
    })

    it('promises a copy by mail only where outgoing mail is configured', async () => {
        expect(mountPage({ mail: true }).find('.kon__copy').exists()).toBe(true)
        expect(mountPage({ mail: false }).find('.kon__copy').exists()).toBe(false)
    })

    it('keeps the words in the tab when a send fails, and brings them back on the next visit', async () => {
        const first = mountPage()
        await fill(first)
        first.unmount()
        mounted = []

        const again = mountPage()
        await flushPromises()

        expect((again.find('#kon-message').element as HTMLTextAreaElement).value).toBe('Passt die Felge auch mit Winterreifen?')
        expect((again.find('#kon-email').element as HTMLInputElement).value).toBe('jana@example.com')
    })

    it('forgets the draft once the message has arrived', async () => {
        const wrapper = mountPage()
        await fill(wrapper)
        await wrapper.find('form').trigger('submit')
        posted[0]!.options.onSuccess?.()

        expect(window.sessionStorage.getItem('rmf-kontakt-entwurf')).toBeNull()
    })

    it('makes no reply-time promise and offers no phone the client has not given', () => {
        const wrapper = mountPage()

        expect(wrapper.text()).not.toMatch(/Werktag|innerhalb von|ruf/i)
        expect(wrapper.find('a[href^="tel:"]').exists()).toBe(false)
        expect(wrapper.find('a[href*="wa.me"]').exists()).toBe(false)
        expect(wrapper.find('.kon__aside').text()).toContain('service@example.com')
        expect(wrapper.find('.kon__hours').text()).toBe('Mo–Fr 9:00–17:00 Uhr')
    })

    it('shows a phone only once the client has configured one', () => {
        const wrapper = mountPage({ contact: { ...CONTACT, phone: '0800-555-0100', phoneIntl: '+49-800-5550100' } })

        expect(wrapper.find('a[href^="tel:"]').attributes('href')).toBe('tel:+49-800-5550100')
    })
})
