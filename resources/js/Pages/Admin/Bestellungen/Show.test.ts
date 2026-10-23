import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'

/*
 * One order, Block G §5: „Erstatten“ asks with the exact amount before anything is sent, refuses more than is left
 * on the page already, and posts the German figure the server reads (Money::fromGerman). Only through Stripe: the
 * form is not there where a refund cannot be made.
 */

const post = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    Head: defineComponent({ setup: () => () => null }),
    usePage: () => ({ props: { errors: {} } }),
    router: { post: (...a: unknown[]) => post(...a) },
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
}))

vi.mock('reka-ui', () => {
    const pass = defineComponent({ setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()) })

    return { DropdownMenuRoot: pass, DropdownMenuTrigger: pass, DropdownMenuPortal: pass, DropdownMenuContent: pass, DropdownMenuItem: pass, DropdownMenuSeparator: pass }
})

vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => slots.default?.() }) }))

/* The confirmation, drawn inline: its title and button text are what the test reads. */
vi.mock('../../../Components/Admin/AdminConfirm.vue', () => ({
    default: defineComponent({
        props: { open: Boolean, title: String, body: String, confirmLabel: String, busy: Boolean },
        emits: ['confirm', 'update:open'],
        setup: (props, { emit }) => () =>
            props.open ? h('div', { class: 'confirm-stub' }, [h('p', { class: 'confirm-title' }, props.title), h('p', { class: 'confirm-body' }, props.body), h('button', { class: 'confirm-go', onClick: () => emit('confirm') }, props.confirmLabel)]) : null,
    }),
}))

const { default: Page } = await import('./Show.vue')

const NNBSP = ' '

function props(money: Record<string, unknown> = {}, order: Record<string, unknown> = {}) {
    return {
        order: {
            id: 7, number: 'RMF-2026-0007', statusLabel: 'Bezahlt', payment: { label: 'Bezahlt', tone: 'plain' as const }, fulfilment: { label: 'Offen', tone: 'plain' as const },
            paymentMethod: 'Stripe', shippingMethod: null, vehicle: null, keys: null, placedAt: null, paidAt: null, shippedAt: null, tracking: null,
            note: null, subtotal: 159_600, shipping: 0, tax: 25_482, total: 159_600, demo: false, test: false, ...order,
        },
        customer: { name: 'Erika Mustermann', email: 'kunde@beispiel.de', phone: null },
        delivery: null,
        billing: null,
        sameAddress: true,
        lines: [],
        money: { paid: 159_600, refunded: 0, refundable: 159_600, refundableInput: '1.596,00', canRefund: true, flag: null, error: null, papers: [], refunds: [], ...money },
    }
}

beforeEach(() => {
    post.mockReset()
    window.sessionStorage.clear()
})

describe('Bestellung · Erstatten', () => {
    it('asks with the exact amount, then posts the figure and the reason', async () => {
        const wrapper = mount(Page, { props: props() })

        await wrapper.find('#bs-refund-amount').setValue('399,00')
        await wrapper.find('#bs-refund-reason').setValue('Eine Felge zurückgeschickt')
        await wrapper.find('form.bs-refund').trigger('submit')

        expect(wrapper.find('.confirm-title').text()).toBe(`399,00${NNBSP}€ erstatten?`)
        expect(wrapper.find('.confirm-go').text()).toBe(`399,00${NNBSP}€ erstatten`)
        expect(post).not.toHaveBeenCalled()

        await wrapper.find('.confirm-go').trigger('click')

        expect(post).toHaveBeenCalledWith('/admin/bestellungen/7/erstattung', { amount: '399,00', reason: 'Eine Felge zurückgeschickt' }, expect.anything())
    })

    it('refuses more than is left before it asks', async () => {
        const wrapper = mount(Page, { props: props({ refunded: 159_000, refundable: 600 }) })

        await wrapper.find('#bs-refund-amount').setValue('7,00')
        await wrapper.find('#bs-refund-reason').setValue('Zu viel')
        await wrapper.find('form.bs-refund').trigger('submit')

        expect(wrapper.find('.confirm-title').exists()).toBe(false)
        expect(wrapper.find('#bs-refund-err').text()).toBe(`Höchstens 6,00${NNBSP}€ lassen sich noch erstatten.`)
    })

    it('keeps what was typed when the refund is first sent to „Passwort bestätigen“, and drops it once made (the admin audit’s F-13)', async () => {
        const wrapper = mount(Page, { props: props() })

        await wrapper.find('#bs-refund-amount').setValue('10,00')
        await wrapper.find('#bs-refund-reason').setValue('Kulanz für einen Kratzer')
        await wrapper.find('form.bs-refund').trigger('submit')
        await wrapper.find('.confirm-go').trigger('click')

        // The visit ends on the password page: the refund is not made, the figures stay kept.
        const options = post.mock.calls[0]?.[2] as { onSuccess: (page: { component: string }) => void }
        options.onSuccess({ component: 'Admin/Bestaetigen/Index' })
        wrapper.unmount()

        const back = mount(Page, { props: props() })
        await nextTick()
        expect((back.find('#bs-refund-amount').element as HTMLInputElement).value).toBe('10,00')
        expect((back.find('#bs-refund-reason').element as HTMLInputElement).value).toBe('Kulanz für einen Kratzer')

        // Made on the order's own page: nothing is kept any more.
        await back.find('form.bs-refund').trigger('submit')
        await back.find('.confirm-go').trigger('click')
        ;(post.mock.calls[1]?.[2] as { onSuccess: (page: { component: string }) => void }).onSuccess({ component: 'Admin/Bestellungen/Show' })
        expect(window.sessionStorage.getItem('rmf.refund.7')).toBeNull()
    })

    it('says no money moves when the order was paid with the Testzahlung (the admin audit’s F-11)', async () => {
        const wrapper = mount(Page, { props: props({}, { test: true }) })

        expect(wrapper.find('#bs-refund-help').text()).toContain('Bei der Testzahlung fließt kein Geld')
        expect(wrapper.find('#bs-refund-help').text()).not.toContain('Stripe')

        await wrapper.find('#bs-refund-reason').setValue('Test')
        await wrapper.find('form.bs-refund').trigger('submit')
        expect(wrapper.find('.confirm-body').text()).toContain('Bei der Testzahlung fließt kein Geld zurück')
        expect(wrapper.find('.confirm-body').text()).not.toContain('Stripe')
    })

    it('offers no refund where one cannot be made, and names the flag the webhook raised', () => {
        const wrapper = mount(Page, { props: props({ canRefund: false, flag: 'Betrag stimmt nicht: bezahlt wurden 1,00 €. Erst prüfen, dann versenden.' }) })

        expect(wrapper.find('form.bs-refund').exists()).toBe(false)
        expect(wrapper.find('.bs-money [role="alert"]').text()).toContain('Betrag stimmt nicht')
    })
})
