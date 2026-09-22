import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { BasketLine, BasketTotals, ContactProp } from '../../types/rimify'

/*
 * The checkout (ACCURACY.md D4, D7; findings #38, #41, #68): every step can be walked, nothing
 * names a carrier, a delivery time or a payment provider, unconfigured shipping is named and kept
 * out of the total, and the final button is disabled with the server's reason while no order can
 * be placed. When one can, the button asks the server, which decides.
 */

type Options = { onError?: (errors: Record<string, string>) => void }

const post = vi.fn<(url: string, data: Record<string, unknown>, options: Options) => void>()

vi.mock('@inertiajs/vue3', () => ({
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    usePage: () => ({ props: { vehicle: null } }),
    router: { post: (...args: [string, Record<string, unknown>, Options]) => post(...args) },
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

function mountKasse(props: { lines?: Line[]; totals?: Totals; orderRefusal?: string | null } = {}): VueWrapper {
    const wrapper = mount(Kasse, {
        props: {
            lines: props.lines ?? [line()],
            totals: props.totals ?? totals(),
            contact,
            orderRefusal: props.orderRefusal === undefined ? REFUSAL : props.orderRefusal,
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

beforeEach(() => {
    post.mockReset()
})

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
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
})
