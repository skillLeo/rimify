import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { BasketLine, BasketTotals, ContactProp } from '../../types/rimify'

/*
 * The checkout (ACCURACY.md D4, D7; findings #38, #41, #68; Block G): every step can be walked,
 * nothing names a carrier, a delivery time is named only as the operator wrote it, unconfigured
 * shipping is named and kept out of the total, and the final button is disabled with the server's
 * reason while no order can be placed. When one can, the button asks the server, which decides.
 *
 * Block G: §312j Abs. 2 and 3 BGB (the goods, the total, shipping and delivery directly above a
 * button that says „Zahlungspflichtig bestellen“), checks on leaving a field and never while
 * typing, what was typed kept in the tab, the Ort from the PLZ, and paying with Stripe — a decline
 * answered on the page with everything still typed, a second press doing nothing.
 */

type Options = { onError?: (errors: Record<string, string>) => void; onFinish?: () => void }

const post = vi.fn<(url: string, data: Record<string, unknown>, options: Options) => void>()
const reload = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    usePage: () => ({ props: { vehicle: null } }),
    router: {
        post: (...args: [string, Record<string, unknown>, Options]) => post(...args),
        reload: (...args: unknown[]) => reload(...args),
    },
}))

/* Stripe.js, as the page sees it: Elements that mount and say they are ready, a submit, a confirmation. */
type Handler = (event: Record<string, unknown>) => void

const stripe = {
    handlers: {} as Record<string, Handler>,
    submit: vi.fn(async () => ({})),
    confirmPayment: vi.fn(async (_options: Record<string, unknown>) => ({ error: { message: 'Deine Karte wurde abgelehnt.' } })),
}

vi.mock('../../composables/useStripe', () => ({
    loadStripe: async () => () => ({
        elements: () => ({
            create: (type: string) => ({
                mount: () => undefined,
                destroy: () => undefined,
                on: (event: string, handler: Handler) => {
                    stripe.handlers[`${type}:${event}`] = handler
                },
            }),
            submit: stripe.submit,
            update: () => undefined,
        }),
        confirmPayment: stripe.confirmPayment,
    }),
    stripeAppearance: () => ({}),
    xsrfToken: () => 'token',
}))

const { default: Kasse } = await import('./Index.vue')

type Line = BasketLine & { demo?: boolean }
type Totals = BasketTotals & { shippingConfigured?: boolean }

const REFUSAL = 'In deinem Warenkorb liegen Felgen aus unserem Beispielsortiment.'

function line(overrides: Partial<Line> = {}): Line {
    return {
        key: 'wheel:11',
        kind: 'WHEEL',
        title: 'MCR4 Ultimate',
        subtitle: 'Light Grey D5',
        brandName: 'MOTEC',
        sizeLabel: '8,5J × 19 · ET 45',
        art: { kind: 'wheel', finish: 'silver', spokes: 5 },
        quantity: 4,
        unitPrice: '199,00 €',
        lineTotal: '796,00 €',
        lineTotalCents: 79_600,
        inStock: true,
        slug: 'motec-mcr4-ultimate',
        demo: true,
        verdict: { status: 'CONDITIONAL', label: 'Freigegeben mit Auflagen', sellable: true, requiresEntry: true, conditions: [] },
        ...overrides,
    }
}

function totals(overrides: Partial<Totals> = {}): Totals {
    return {
        subtotal: '796,00 €',
        shipping: 'wird noch festgelegt',
        shippingCents: 0,
        freeShipping: false,
        tax: '127,09 €',
        total: '796,00 €',
        totalCents: 79_600,
        count: 4,
        shippingConfigured: false,
        ...overrides,
    }
}

const contact: ContactProp = { email: 'info@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' }

let wrappers: VueWrapper[] = []

type MountProps = {
    lines?: Line[]
    totals?: Totals
    orderRefusal?: string | null
    deliveryTime?: string | null
    payment?: { publishableKey: string; testMode: boolean } | null
}

function mountKasse(props: MountProps = {}): VueWrapper {
    const wrapper = mount(Kasse, {
        props: {
            lines: props.lines ?? [line()],
            totals: props.totals ?? totals(),
            contact,
            orderRefusal: props.orderRefusal === undefined ? REFUSAL : props.orderRefusal,
            deliveryTime: props.deliveryTime ?? null,
            payment: props.payment ?? null,
            shown: 'aaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbb',
        },
        attachTo: document.body,
    })
    wrappers.push(wrapper)

    return wrapper
}

/** Fills the address step and walks to the payment step. */
async function toPayment(wrapper: VueWrapper): Promise<void> {
    await wrapper.find('#ko-mail').setValue('kunde@beispiel.de')
    await wrapper.find('#ko-name').setValue('Erika Mustermann')
    await wrapper.find('#ko-street').setValue('Hauptstraße')
    await wrapper.find('#ko-nr').setValue('12')
    await wrapper.find('#ko-zip').setValue('50667')
    await wrapper.find('#ko-city').setValue('Köln')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    await wrapper.find('form').trigger('submit')
    await flushPromises()
}

/** The server's answers: the PLZ lookup, and the payment endpoint as a test sets it. */
let payAnswer: { status: number; body: Record<string, unknown> } = { status: 200, body: {} }
const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
    if (url.startsWith('/api/v1/plz/')) {
        const places: Record<string, string[]> = { '50667': ['Köln'], '59969': ['Bromskirchen', 'Hallenberg'] }

        return new Response(JSON.stringify({ places: places[url.slice(-5)] ?? [] }), { status: 200 })
    }

    return new Response(JSON.stringify(payAnswer.body), { status: payAnswer.status })
})

beforeEach(() => {
    post.mockReset()
    reload.mockReset()
    fetchMock.mockClear()
    stripe.submit.mockClear()
    stripe.confirmPayment.mockClear()
    stripe.handlers = {}
    vi.stubGlobal('fetch', fetchMock)
    window.sessionStorage.clear()
})

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
})

describe('Kasse', () => {
    it('names no carrier, no delivery time and no payment provider on any step', async () => {
        const wrapper = mountKasse()

        await wrapper.find('#ko-mail').setValue('kunde@beispiel.de')
        await wrapper.find('#ko-name').setValue('Erika Mustermann')
        await wrapper.find('#ko-street').setValue('Hauptstraße')
        await wrapper.find('#ko-nr').setValue('12')
        await wrapper.find('#ko-zip').setValue('50667')
        await wrapper.find('#ko-city').setValue('Köln')
        await wrapper.find('form').trigger('submit')
        await flushPromises()

        expect(wrapper.find('.ko__option-name').text()).toBe('Standardversand')

        await wrapper.find('form').trigger('submit')
        await flushPromises()

        for (const banned of ['DHL', 'Werktage', 'Stripe', 'Kartendaten', 'Es entstehen keine weiteren Kosten']) {
            expect(wrapper.text()).not.toContain(banned)
        }
    })

    it('names unconfigured shipping and keeps it out of the total', () => {
        const wrapper = mountKasse()

        expect(wrapper.find('.sum').text()).toContain('wird noch festgelegt')
        expect(wrapper.text()).toContain('Versandkosten werden noch festgelegt')
        expect(wrapper.text()).not.toContain('MwSt. und Versand')
    })

    it('marks a demo line and the Eintragung on the line itself', () => {
        const wrapper = mountKasse()
        const item = wrapper.find('.ko__line')

        expect(item.text()).toContain('Beispielsortiment')
        expect(item.text()).toContain('Eintragung in die Fahrzeugpapiere erforderlich.')
    })

    it('shows the refusal above a disabled final button and posts nothing', async () => {
        const wrapper = mountKasse()
        await toPayment(wrapper)

        expect(wrapper.find('#ko-refusal').text()).toBe(REFUSAL)

        const pay = wrapper.find('button.ko__pay')
        expect(pay.text()).toBe('Zahlungspflichtig bestellen')
        expect(pay.attributes('disabled')).toBeDefined()
        expect(pay.attributes('aria-describedby')).toBe('ko-refusal')
        expect(wrapper.text()).toContain('Für Abnahme und Eintragung berechnet die Prüfstelle eigene Gebühren.')
        // The total is not the whole amount while shipping is open.
        expect(wrapper.text()).not.toContain('Von uns kommen keine weiteren Kosten dazu.')

        await wrapper.find('form').trigger('submit')
        expect(post).not.toHaveBeenCalled()
    })

    it('asks the server when nothing stands in the way, and shows its answer', async () => {
        const wrapper = mountKasse({
            lines: [line({ demo: false, verdict: null })],
            totals: totals({ shippingConfigured: true, shipping: '9,90 €', shippingCents: 990, total: '805,90 €' }),
            orderRefusal: null,
        })
        await toPayment(wrapper)

        expect(wrapper.find('#ko-refusal').exists()).toBe(false)
        expect(wrapper.text()).toContain('Von uns kommen keine weiteren Kosten dazu.')
        expect(wrapper.text()).toContain('MwSt. und Versand')

        const pay = wrapper.find('button.ko__pay')
        expect(pay.attributes('disabled')).toBeUndefined()

        await wrapper.find('form').trigger('submit')

        expect(post).toHaveBeenCalledTimes(1)
        const [url, data, options] = post.mock.calls[0]!
        expect(url).toBe('/kasse')
        expect(data.email).toBe('kunde@beispiel.de')

        options.onError?.({ order: 'Bestellen ist in dieser Vorschau noch nicht möglich.' })
        await flushPromises()

        expect(wrapper.find('[role="alert"]').text()).toBe('Bestellen ist in dieser Vorschau noch nicht möglich.')
    })

    it('§312j Abs. 2 and 3: the goods with their verdicts, shipping, delivery time and total directly above „Zahlungspflichtig bestellen“', async () => {
        const wrapper = mountKasse({
            lines: [line({ demo: false, verdict: { status: 'CONDITIONAL', label: 'Freigegeben mit Auflagen', sellable: true, requiresEntry: false, conditions: ['Nur mit den angegebenen Radschrauben zulässig.'], sentence: 'Für dein Fahrzeug freigegeben, mit 1 Auflage.' } })],
            totals: totals({ shippingConfigured: true, shipping: '9,90 €', shippingCents: 990, total: '805,90 €' }),
            orderRefusal: null,
            deliveryTime: '3–5 Werktage',
        })
        await toPayment(wrapper)

        const block = wrapper.find('section.ko__final')
        const text = block.text()

        expect(text).toContain('4 × Felge MOTEC MCR4 Ultimate')
        expect(text).toContain('8,5J × 19 · ET 45')
        expect(text).toContain('Für dein Fahrzeug freigegeben, mit 1 Auflage.')
        // The Auflagen one tap away, in full.
        expect(block.find('details.ko__auflagen summary').text()).toBe('Auflagen lesen')
        expect(block.find('details.ko__auflagen').text()).toContain('Nur mit den angegebenen Radschrauben zulässig.')
        expect(block.find('.ko__terms').text()).toContain('Versand')
        expect(block.find('.ko__terms').text()).toContain('9,90 €')
        expect(block.find('.ko__terms').text()).toContain('Lieferzeit')
        expect(block.find('.ko__terms').text()).toContain('3–5 Werktage')
        expect(block.find('.ko__terms').text()).toContain('805,90 €')
        expect(text).toContain('inkl. 127,09 € MwSt. und Versand')

        // The button is the block's own, after all of it — and says exactly this.
        const pay = block.find('button.ko__pay')
        expect(pay.text()).toBe('Zahlungspflichtig bestellen')
        const order = [...block.element.querySelectorAll('.ko__essentials, .ko__terms, .price-legal, button.ko__pay')]
        expect(order.map((el) => el.className.split(' ')[0])).toEqual(['ko__essentials', 'ko__terms', 'price-legal', 'btn'])
    })

    it('links the AGB, the Widerrufsbelehrung and the Muster-Widerrufsformular from the payment step', async () => {
        const wrapper = mountKasse({ orderRefusal: null })
        await toPayment(wrapper)

        const hrefs = wrapper.findAll('.ko__legal-links a').map((a) => a.attributes('href'))
        expect(hrefs).toEqual(['/rechtliches/agb', '/rechtliches/widerrufsbelehrung', '/rechtliches/widerrufsformular', '/rechtliches/datenschutz'])
    })

    it('checks a field when it is left, never while typing', async () => {
        const wrapper = mountKasse()
        const mail = wrapper.find('#ko-mail')

        await mail.setValue('kunde-ohne-at')
        expect(wrapper.find('#ko-mail-err').text()).toBe('')

        await mail.trigger('blur')
        expect(wrapper.find('#ko-mail-err').text()).toBe('Diese E-Mail-Adresse ist unvollständig – sie braucht ein @ und eine Domain.')

        await mail.setValue('kunde@beispiel.de')
        await mail.trigger('blur')
        expect(wrapper.find('#ko-mail-err').text()).toBe('')
    })

    it('offers the number pad for PLZ and Hausnummer, and letters for the Hausnummer one tap away', async () => {
        const wrapper = mountKasse()

        expect(wrapper.find('#ko-zip').attributes('inputmode')).toBe('numeric')
        expect(wrapper.find('#ko-nr').attributes('inputmode')).toBe('numeric')

        await wrapper.find('.ko__letters').trigger('click')
        expect(wrapper.find('#ko-nr').attributes('inputmode')).toBe('text')
        expect(document.activeElement?.id).toBe('ko-nr')
    })

    it('moves a house number an autofill wrote into the street into its own field', async () => {
        const wrapper = mountKasse()

        await wrapper.find('#ko-street').setValue('Hauptstraße 12a')
        await wrapper.find('#ko-street').trigger('blur')

        expect((wrapper.find('#ko-street').element as HTMLInputElement).value).toBe('Hauptstraße')
        expect((wrapper.find('#ko-nr').element as HTMLInputElement).value).toBe('12a')
    })

    it('fills Ort from a PLZ with one place, offers the choice for several, and never overwrites what was typed', async () => {
        const wrapper = mountKasse()

        await wrapper.find('#ko-zip').setValue('50667')
        await flushPromises()
        expect((wrapper.find('#ko-city').element as HTMLInputElement).value).toBe('Köln')

        await wrapper.find('#ko-city').setValue('')
        await wrapper.find('#ko-zip').setValue('59969')
        await flushPromises()
        const places = wrapper.findAll('.ko__place').map((b) => b.text())
        expect(places).toEqual(['Bromskirchen', 'Hallenberg'])
        expect(wrapper.find('.ko__source').text()).toContain('GeoNames')

        await wrapper.findAll('.ko__place')[1]!.trigger('click')
        expect((wrapper.find('#ko-city').element as HTMLInputElement).value).toBe('Hallenberg')

        await wrapper.find('#ko-city').setValue('Mein Dorf')
        await wrapper.find('#ko-zip').setValue('50667')
        await flushPromises()
        expect((wrapper.find('#ko-city').element as HTMLInputElement).value).toBe('Mein Dorf')
    })

    it('moves an autofilled street’s number even when the street was never left (PAY-02)', async () => {
        const wrapper = mountKasse()

        // Autofill writes every field without focusing them; the street is never left.
        await wrapper.find('#ko-mail').setValue('kunde@beispiel.de')
        await wrapper.find('#ko-name').setValue('Erika Mustermann')
        await wrapper.find('#ko-street').setValue('Musterstraße 12')
        await wrapper.find('#ko-zip').setValue('50667')
        await wrapper.find('#ko-city').setValue('Köln')
        await wrapper.find('form').trigger('submit')
        await flushPromises()

        expect(wrapper.find('.ko__recap').text()).toContain('Musterstraße 12,')
        expect(wrapper.find('.ko__recap').text()).not.toContain('12 12')
    })

    it('never fills Ort while the customer is typing in it (PAY-05)', async () => {
        const wrapper = mountKasse()

        await wrapper.find('#ko-zip').setValue('50667')
        ;(wrapper.find('#ko-city').element as HTMLInputElement).focus()
        await flushPromises()

        expect((wrapper.find('#ko-city').element as HTMLInputElement).value).toBe('')
    })

    it('shows the billing address in the recap before paying (PAY-06)', async () => {
        const wrapper = mountKasse()

        await wrapper.find('#ko-mail').setValue('kunde@beispiel.de')
        await wrapper.find('#ko-name').setValue('Erika Mustermann')
        await wrapper.find('#ko-street').setValue('Hauptstraße')
        await wrapper.find('#ko-nr').setValue('12')
        await wrapper.find('#ko-zip').setValue('50667')
        await wrapper.find('#ko-city').setValue('Köln')
        await wrapper.find('.ko__check input').setValue(true)
        await wrapper.find('#ko-b-name').setValue('Firma Muster GmbH')
        await wrapper.find('#ko-b-street').setValue('Werkweg')
        await wrapper.find('#ko-b-nr').setValue('3')
        await wrapper.find('#ko-b-zip').setValue('10115')
        await wrapper.find('#ko-b-city').setValue('Berlin')
        // Its errors are announced like the delivery address's.
        expect(wrapper.find('#ko-b-name').attributes('aria-describedby')).toBe('ko-b-name-err')

        await wrapper.find('form').trigger('submit')
        await flushPromises()

        expect(wrapper.find('.ko__recap').text()).toContain('Rechnung: Firma Muster GmbH, Werkweg 3')
    })

    it('keeps what was typed in this tab: a reload finds it again', async () => {
        const first = mountKasse()
        await first.find('#ko-mail').setValue('kunde@beispiel.de')
        await first.find('#ko-street').setValue('Hauptstraße')
        await flushPromises()
        first.unmount()
        wrappers = wrappers.filter((w) => w !== first)

        const again = mountKasse()
        await flushPromises()

        expect((again.find('#ko-mail').element as HTMLInputElement).value).toBe('kunde@beispiel.de')
        expect((again.find('#ko-street').element as HTMLInputElement).value).toBe('Hauptstraße')
    })

    it('puts the billing address behind an unchecked box', async () => {
        const wrapper = mountKasse()
        const box = wrapper.find('.ko__check input')

        expect((box.element as HTMLInputElement).checked).toBe(false)
        expect(wrapper.find('.ko__check').text()).toBe('Andere Rechnungsadresse')
        expect(wrapper.find('#ko-b-name').exists()).toBe(false)

        await box.setValue(true)
        expect(wrapper.find('#ko-b-name').exists()).toBe(true)
    })

    it('says Testmodus while Stripe runs in test mode', () => {
        const wrapper = mountKasse({ payment: { publishableKey: 'pk_test_fakeKey', testMode: true } })

        expect(wrapper.find('.ko__testmode').text()).toBe('Testmodus – es wird kein Geld abgebucht.')
    })

    describe('with Stripe', () => {
        const ready = async (wrapper: VueWrapper): Promise<void> => {
            await toPayment(wrapper)
            await flushPromises()
            stripe.handlers['payment:ready']?.({})
            await flushPromises()
        }

        const stripeKasse = (): VueWrapper =>
            mountKasse({
                lines: [line({ demo: false })],
                totals: totals({ shippingConfigured: true, shipping: '9,90 €', shippingCents: 990, total: '805,90 €' }),
                orderRefusal: null,
                deliveryTime: '3–5 Werktage',
                payment: { publishableKey: 'pk_test_fakeKey', testMode: true },
            })

        it('reserves the Express place above the Payment Element, and waits for Stripe before the button works', async () => {
            const wrapper = stripeKasse()
            await toPayment(wrapper)
            await flushPromises()

            const methods = wrapper.find('.ko__pay-methods')
            expect(methods.element.firstElementChild?.classList.contains('ko__express')).toBe(true)
            expect(wrapper.find('button.ko__pay').attributes('disabled')).toBeDefined()

            stripe.handlers['payment:ready']?.({})
            await flushPromises()
            expect(wrapper.find('button.ko__pay').attributes('disabled')).toBeUndefined()
        })

        it('answers a declined card on the page, keeps everything typed, and never posts the form', async () => {
            payAnswer = { status: 200, body: { order: 'RMF-2026-0001', clientSecret: 'pi_1_secret_x', returnUrl: '/bestellung/RMF-2026-0001' } }
            const wrapper = stripeKasse()
            await ready(wrapper)

            await wrapper.find('form').trigger('submit')
            await flushPromises()

            const calls = fetchMock.mock.calls.filter(([url]) => url === '/kasse/zahlung')
            expect(calls).toHaveLength(1)
            const body = JSON.parse(String(calls[0]![1]?.body)) as Record<string, unknown>
            expect(body.email).toBe('kunde@beispiel.de')
            expect(body.shown).toBe('aaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbb')
            expect(stripe.confirmPayment).toHaveBeenCalledWith(expect.objectContaining({ clientSecret: 'pi_1_secret_x' }))
            expect(wrapper.find('.ko__refusal--bad').text()).toBe('Deine Karte wurde abgelehnt.')
            expect(post).not.toHaveBeenCalled()

            // Back to the address: everything is still there.
            await wrapper.find('.ko__change').trigger('click')
            expect((wrapper.find('#ko-mail').element as HTMLInputElement).value).toBe('kunde@beispiel.de')
        })

        it('does nothing on a second press while the first is on its way', async () => {
            payAnswer = { status: 200, body: { order: 'RMF-2026-0001', clientSecret: 'pi_1_secret_x', returnUrl: '/bestellung/RMF-2026-0001' } }
            let release: () => void = () => undefined
            stripe.submit.mockImplementationOnce(() => new Promise((resolve) => (release = () => resolve({}))))
            const wrapper = stripeKasse()
            await ready(wrapper)

            await wrapper.find('form').trigger('submit')
            await wrapper.find('form').trigger('submit')
            expect(wrapper.find('button.ko__pay').attributes('aria-busy')).toBe('true')
            release()
            await flushPromises()

            expect(stripe.submit).toHaveBeenCalledTimes(1)
            expect(fetchMock.mock.calls.filter(([url]) => url === '/kasse/zahlung')).toHaveLength(1)
        })

        it('shows the server’s sentence and the basket afresh when what was shown changed', async () => {
            payAnswer = { status: 409, body: { refusal: 'Seit du die Kasse geöffnet hast, hat sich ein Preis in deiner Bestellung geändert.', reload: true } }
            const wrapper = stripeKasse()
            await ready(wrapper)

            await wrapper.find('form').trigger('submit')
            await flushPromises()

            expect(wrapper.find('.ko__refusal--after').text()).toContain('hat sich ein Preis in deiner Bestellung geändert')
            expect(reload).toHaveBeenCalledTimes(1)
            expect(stripe.confirmPayment).not.toHaveBeenCalled()
        })
    })
})
