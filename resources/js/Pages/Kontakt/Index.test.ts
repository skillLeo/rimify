import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { ContactProp, VehicleProp } from '../../types/rimify'

const current: { props: Record<string, unknown> } = { props: {} }

interface PostOptions {
    onSuccess?: (page: { component: string }) => void
    onError?: () => void
    onNetworkError?: () => unknown
}

/* What the server answers a message that arrived with: this page again. */
const ARRIVED = { component: 'Kontakt/Index' }

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
            setError(field: string, message: string) {
                form.errors[field] = message
            },
            clearErrors(field: string) {
                delete form.errors[field]
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

    // #26 and the operator's check (D-144): nothing on the contact page opens a mail program; the address stays to copy.
    it('opens no mail program: the address is text to copy, the way to write is the form', () => {
        const wrapper = mountPage()

        expect(wrapper.html()).not.toContain('mailto:')
        expect(wrapper.find('.kon__way-value--copy').text()).toContain('@')
        expect(wrapper.find('.kon__way--text a').exists()).toBe(false)
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

        posted[0]!.options.onSuccess?.(ARRIVED)
        await flushPromises()

        expect(wrapper.find('form').exists()).toBe(false)
        const done = wrapper.find('.kon__done')
        expect(done.attributes('role')).toBe('status')
        expect(done.text()).toContain('Danke, Jana Beispiel – deine Nachricht ist angekommen.')
        expect(done.text()).toContain('Wir antworten dir an jana@example.com.')
        expect(document.activeElement).toBe(done.element)
    })

    it('checks a field when it is left, in the server\'s words, and takes the sentence back once it is right', async () => {
        const wrapper = mountPage()
        const email = wrapper.find('#kon-email')

        await email.setValue('jana@')
        await email.trigger('blur')
        expect(wrapper.find('#kon-email-err').text()).toBe('Diese E-Mail-Adresse sieht nicht vollständig aus. Bitte prüf sie noch einmal.')
        expect(email.attributes('aria-invalid')).toBe('true')

        await email.setValue('jana@example.com')
        expect(wrapper.find('#kon-email-err').text()).toBe('')

        const message = wrapper.find('#kon-message')
        await message.setValue('Hallo')
        await message.trigger('blur')
        expect(wrapper.find('#kon-message-err').text()).toBe('Ein, zwei Sätze mehr, damit wir dir gleich richtig antworten können.')

        // A field never touched carries no sentence.
        expect(wrapper.find('#kon-name-err').text()).toBe('')
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
        posted[0]!.options.onSuccess?.(ARRIVED)

        expect(window.sessionStorage.getItem('rmf-kontakt-entwurf')).toBeNull()
    })

    it('opens an empty form for the next message, never the one just sent (KON-02)', async () => {
        const wrapper = mountPage()
        await fill(wrapper)
        await wrapper.find('form').trigger('submit')
        posted[0]!.options.onSuccess?.(ARRIVED)
        await flushPromises()

        await wrapper.findAll('button').find((b) => b.text() === 'Noch eine Nachricht schreiben')!.trigger('click')
        await flushPromises()

        expect((wrapper.find('#kon-message').element as HTMLTextAreaElement).value).toBe('')
        expect((wrapper.find('#kon-subject').element as HTMLInputElement).value).toBe('')
        // Name and address stay: the same person is writing again.
        expect((wrapper.find('#kon-email').element as HTMLInputElement).value).toBe('jana@example.com')
    })

    it('says so when the message never left, and keeps the words (KON-03)', async () => {
        const wrapper = mountPage()
        await fill(wrapper)
        await wrapper.find('form').trigger('submit')

        expect(posted[0]!.options.onNetworkError?.()).toBe(false)
        await flushPromises()

        expect(wrapper.find('.kon__offline').attributes('role')).toBe('alert')
        expect(wrapper.find('.kon__offline').text()).toContain('nicht bei uns angekommen')
        expect((wrapper.find('#kon-message').element as HTMLTextAreaElement).value).toBe('Passt die Felge auch mit Winterreifen?')
    })

    it('keeps a half-written message\'s own subject over a linking page\'s (KON-04)', async () => {
        const first = mountPage()
        await fill(first)
        first.unmount()
        mounted = []

        const back = mountPage({ prefill: { subject: 'Fehler 429', from: null } })
        await flushPromises()

        expect((back.find('#kon-subject').element as HTMLInputElement).value).toBe('Frage zu einer Felge')
    })

    it('sends the id of the car the box showed', async () => {
        const wrapper = mountPage({ vehicle: VEHICLE })
        await fill(wrapper)
        await wrapper.find('form').trigger('submit')

        expect(posted[0]!.data).toMatchObject({ withVehicle: true, vehicleId: 3 })
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
