import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { BestellungProps } from '../../types/pages'

/*
 * The order page (findings #3, #38, #42, #43; ACCURACY.md §3.1 F3): a seeded order says it is
 * demonstration data and that its verdicts say nothing about the car; no confirmation mail is
 * promised; no carrier is named; and questions go to the e-mail with the order number, never to
 * the Kontakt form.
 */

vi.mock('@inertiajs/vue3', () => ({
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
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

    it('promises no confirmation mail and names no carrier', () => {
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

    it('sends questions to the e-mail with the order number, never to the Kontakt form', () => {
        const wrapper = mountOrder(props())
        const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))

        expect(hrefs).not.toContain('/kontakt')
        expect(hrefs).toContain(`mailto:info@example.com?subject=${encodeURIComponent('Bestellung RMF-2026-1003')}`)
    })
})
