import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { BestellungProps } from '../../types/pages'

/*
 * The order page (findings #3, #38, #42, #43; ACCURACY.md §3.1 F3): a seeded order says it is
 * demonstration data and that its verdicts say nothing about the car; a confirmation mail is named
 * only when it went out; no carrier is named; and questions go to the contact form with the order
 * number in its subject (#26).
 *
 * Block G: arriving here from Stripe pays nothing. While the payment is being confirmed the page says
 * so and asks the server; a new answer reloads the page's order, and a declined payment leads back
 * to the Kasse.
 */

const reload = vi.fn()
const routerPost = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    router: { reload: (...args: unknown[]) => reload(...args), post: (...args: unknown[]) => routerPost(...args) },
    usePage: () => ({ props: {}, url: '/bestellung/42' }),
}))

const { default: Bestellung } = await import('./Index.vue')

type Props = BestellungProps & { demo: boolean }

function props(overrides: Partial<Props> = {}, order: Partial<BestellungProps['order']> = {}): Props {
    return {
        order: {
            number: 'RMF-2026-1003',
            status: 'SHIPPED',
            statusLabel: 'Versendet',
            placedAt: '01.07.2026, 10:00 Uhr',
            vehicleLabel: 'BMW 3er',
            keyNumbers: 'HSN 0005 · TSN CKT',
            subtotal: '796,00 €',
            shipping: '0,00 €',
            tax: '127,09 €',
            total: '796,00 €',
            trackingCode: null,
            ...order,
        },
        lines: [
            {
                id: 1,
                kind: 'WHEEL',
                kindLabel: 'Felge',
                label: 'Demo Fünfspeiche F-01 · Silber · 8J × 18',
                quantity: 4,
                unitPrice: '199,00 €',
                lineTotal: '796,00 €',
                verdict: { status: 'PERMITTED', requiresEntry: false, documentRevision: 1, detail: {} },
            },
        ],
        contact: { email: 'info@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' },
        demo: false,
        ...overrides,
    }
}

let wrappers: VueWrapper[] = []

function mountOrder(p: Props): VueWrapper {
    const wrapper = mount(Bestellung, { props: p })
    wrappers.push(wrapper)

    return wrapper
}

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
})

describe('Bestellung', () => {
    it('says a seeded order is demonstration data and its verdicts say nothing about the car', () => {
        const wrapper = mountOrder(props({ demo: true }))

        expect(wrapper.find('h1').text()).toBe('Beispielbestellung')
        expect(wrapper.text()).toContain('Demodaten')
        expect(wrapper.text()).toContain('niemand hat sie aufgegeben')
        expect(wrapper.text()).toContain('Sie sagen nichts darüber aus, ob eine Felge an das genannte Fahrzeug darf.')
        expect(wrapper.text()).not.toContain('Vielen Dank für deine Bestellung.')
    })

    it('says the payment is being confirmed and asks the server — the page itself never marks it paid', async () => {
        vi.useFakeTimers()
        const answers = [{ state: 'confirming' }, { state: 'paid' }]
        const fetchMock = vi.fn(async () => new Response(JSON.stringify(answers.shift() ?? { state: 'paid' }), { status: 200 }))
        vi.stubGlobal('fetch', fetchMock)

        try {
            const wrapper = mountOrder(props({ payment: { state: 'confirming', poll: true, email: 'kunde@beispiel.de', mailed: false } }, { status: 'PENDING_PAYMENT', statusLabel: 'Wartet auf Zahlung' }))

            expect(wrapper.find('h1').text()).toBe('Deine Zahlung wird bestätigt.')
            expect(wrapper.text()).not.toContain('Vielen Dank')

            await vi.advanceTimersByTimeAsync(2000)
            expect(fetchMock).toHaveBeenCalledWith('/bestellung/RMF-2026-1003/status', expect.anything())
            expect(reload).not.toHaveBeenCalled()

            await vi.advanceTimersByTimeAsync(2000)
            expect(reload).toHaveBeenCalledWith({ only: ['order', 'payment'] })
        } finally {
            vi.useRealTimers()
            vi.unstubAllGlobals()
        }
    })

    it('leads a declined payment back to the Kasse, where everything typed is still there', () => {
        const wrapper = mountOrder(props({ payment: { state: 'failed', poll: false, email: 'kunde@beispiel.de', mailed: false } }, { status: 'FAILED', statusLabel: 'Fehlgeschlagen' }))

        expect(wrapper.find('h1').text()).toBe('Die Zahlung hat nicht geklappt.')
        expect(wrapper.text()).toContain('Es wurde nichts abgebucht.')
        expect(wrapper.find('a.ord__retry').attributes('href')).toBe('/kasse')
    })

    it('offers the account in one click where the server says so, and says the link is on its way', async () => {
        const post = vi.fn((_url: string, _data: unknown, options: { onSuccess?: () => void; onFinish?: () => void }) => {
            options.onSuccess?.()
            options.onFinish?.()
        })
        routerPost.mockImplementation(post)

        const wrapper = mountOrder(props({ accountOffer: true, payment: { state: 'paid', poll: false, email: 'kunde@beispiel.de', mailed: true } }))
        const card = wrapper.find('.ord__account')

        expect(card.find('h2').text()).toBe('Konto anlegen?')
        expect(card.text()).toContain('kunde@beispiel.de')

        await card.find('button').trigger('click')

        expect(post).toHaveBeenCalledWith('/bestellung/RMF-2026-1003/konto', {}, expect.anything())
        expect(wrapper.find('.ord__account [role="status"]').text()).toBe('Der Link ist unterwegs. Mit ihm legst du dein Passwort fest.')

        expect(mountOrder(props()).find('.ord__account').exists()).toBe(false)
    })

    it('names the confirmation mail only when it went out', () => {
        const sent = mountOrder(props({ payment: { state: 'paid', poll: false, email: 'kunde@beispiel.de', mailed: true } }))
        expect(sent.text()).toContain('Die Bestätigung mit Rechnung, AGB und Widerrufsbelehrung haben wir an kunde@beispiel.de geschickt.')

        const notSent = mountOrder(props({ payment: { state: 'paid', poll: false, email: 'kunde@beispiel.de', mailed: false } }))
        expect(notSent.text()).not.toContain('Die Bestätigung')
    })

    it('promises no confirmation mail it did not send, and names no carrier', () => {
        const wrapper = mountOrder(props({}, { trackingCode: '003404340001000002' }))

        expect(wrapper.find('h1').text()).toBe('Vielen Dank für deine Bestellung.')
        expect(wrapper.text()).toContain('Heb dir die Bestellnummer auf – mit ihr beantworten wir deine Fragen.')
        expect(wrapper.text()).not.toContain('Bestätigung ist unterwegs')
        expect(wrapper.text()).not.toContain('DHL')
        expect(wrapper.text()).toContain('Sendungsnummer 003404340001000002')

        const pending = mountOrder(props())
        expect(pending.text()).toContain('Die Sendungsnummer steht hier, sobald dein Paket unterwegs ist.')
        expect(pending.text()).not.toContain('DHL')
    })

    it('sends questions to the contact form with the order number in the subject (#26)', () => {
        const wrapper = mountOrder(props())
        const question = wrapper.find('.ord__next-link')

        expect(question.attributes('href')).toBe('/kontakt?betreff=Bestellung+RMF-2026-1003&von=%2Fbestellung%2F42')
        expect(question.text()).toContain('Schreib uns')
        expect(wrapper.html()).not.toContain('mailto:')
    })
})
