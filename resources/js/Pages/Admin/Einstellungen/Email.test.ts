import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { AdminEmailProps } from '../../../types/admin/email'

const router = vi.hoisted(() => ({ post: vi.fn(), delete: vi.fn(), get: vi.fn() }))

vi.mock('@inertiajs/vue3', () => ({ router }))

vi.mock('../../../Components/Admin/AdminPage.vue', () => ({
    default: defineComponent({ props: { title: String, context: String }, setup: (props, { slots }) => () => h('main', [h('h1', props.title), h('p', { class: 'ctx' }, props.context), slots.default?.()]) }),
}))
vi.mock('../../../Components/Admin/AdminSaveBar.vue', () => ({ default: defineComponent({ setup: () => () => null }) }))
/* The confirmation, drawn inline: its title, body and button are what the test reads. */
vi.mock('../../../Components/Admin/AdminConfirm.vue', () => ({
    default: {
        props: ['open', 'title', 'body', 'confirmLabel', 'busy'],
        emits: ['confirm', 'update:open'],
        setup: (props: Record<string, string | boolean | undefined>, { emit }: { emit: (event: 'confirm') => void }) => () =>
            props.open
                ? h('div', { class: 'confirm-stub' }, [h('p', { class: 'confirm-title' }, String(props.title ?? '')), h('p', { class: 'confirm-body' }, String(props.body ?? '')), h('button', { class: 'confirm-go', onClick: () => emit('confirm') }, String(props.confirmLabel ?? ''))])
                : null,
    },
}))
vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => slots.default?.() }) }))
vi.mock('../../../composables/admin/useDirtyForm', () => ({
    useDirtyForm: (initial: object) => {
        const form = reactive({ ...structuredClone(initial), errors: {} as Record<string, string> })

        return { form: Object.assign(form, { data: () => ({ ...form }) }), save: vi.fn() }
    },
}))

const { default: Page } = await import('./Email.vue')

function props(over: Partial<AdminEmailProps> = {}): AdminEmailProps {
    return {
        stamp: 'stand-1',
        form: { from_address: 'bestellung@rimify.de', from_name: 'RIMIFY', topic_arn: '' },
        region: 'eu-north-1',
        keyMasked: '••••••••••••TS12',
        secretMasked: '••••••••••••X9Y8',
        pending: false,
        verifiedAt: null,
        sending: false,
        mailer: 'log',
        test: null,
        dns: [],
        domain: 'rimify.de',
        webhookUrl: 'https://rimify.de/webhooks/ses',
        suppressions: [],
        ...over,
    }
}

describe('Einstellungen › E-Mail', () => {
    beforeEach(() => {
        router.post.mockClear()
        router.delete.mockClear()
        router.get.mockClear()
    })

    it('says the mail does not go through SES yet, and shows the keys only as their last four characters', () => {
        const wrapper = mount(Page, { props: props() })

        expect(wrapper.find('.ctx').text()).toBe('In Kraft: Versand über „log“ – noch nicht über Amazon SES')
        expect(wrapper.find('#em-key').text()).toBe('••••••••••••TS12')
        expect(wrapper.find('input#em-key').exists()).toBe(false)
        expect(wrapper.text()).toContain('Die Mails des Shops gehen noch nicht über Amazon SES.')
    })

    it('promises to keep the stored secret only where one is stored', async () => {
        const fresh = mount(Page, { props: props({ keyMasked: null, secretMasked: null }) })
        expect(fresh.find('#em-secret-help').exists()).toBe(false)

        const stored = mount(Page, { props: props() })
        await stored.findAll('button').find((b) => b.text() === 'Neuen Schlüssel eintragen' && b.element.closest('.form-field')?.querySelector('#em-secret'))!.trigger('click')
        expect(stored.find('#em-secret-help').text()).toBe('Leer lassen behält den gespeicherten Schlüssel.')
    })

    it('lists each DNS record with its state, and marks what is missing', () => {
        const wrapper = mount(Page, {
            props: props({
                dns: [
                    { kind: 'SPF', type: 'TXT', name: 'bounce.rimify.de', value: 'v=spf1 include:amazonses.com ~all', found: true },
                    { kind: 'DMARC', type: 'TXT', name: '_dmarc.rimify.de', value: 'v=DMARC1; p=none; rua=mailto:dmarc@rimify.de', found: false },
                ],
            }),
        })

        const rows = wrapper.findAll('tbody tr').map((row) => row.findAll('td').map((cell) => cell.text()))

        expect(rows).toEqual([
            ['SPF', 'TXT', 'bounce.rimify.de', 'v=spf1 include:amazonses.com ~all', 'gefunden'],
            ['DMARC', 'TXT', '_dmarc.rimify.de', 'v=DMARC1; p=none; rua=mailto:dmarc@rimify.de', 'fehlt'],
        ])
    })

    it('asks before it lifts a block, then releases the address through its own route, once for a double press (the admin audit’s F-24)', async () => {
        const wrapper = mount(Page, { props: props({ suppressions: [{ id: 7, email: 'weg@example.org', reason: 'Unzustellbar', detail: 'Permanent/General', at: '06.10.2026, 21:00 Uhr' }] }) })

        await wrapper.findAll('button').find((b) => b.text() === 'Sperre aufheben')!.trigger('click')

        // Asked, not done: one click no longer lifts it.
        expect(router.delete).not.toHaveBeenCalled()
        expect(wrapper.find('.confirm-title').text()).toBe('Sperre für weg@example.org aufheben?')
        expect(wrapper.find('.confirm-body').text()).toContain('dauerhaft unzustellbar')
        expect(wrapper.find('.confirm-body').text()).toContain('Von Hand sperren lässt sie sich hier nicht.')

        await wrapper.find('.confirm-go').trigger('click')
        await wrapper.find('.confirm-go').trigger('click')

        expect(router.delete).toHaveBeenCalledTimes(1)
        expect(router.delete.mock.calls[0]![0]).toBe('/admin/einstellungen/e-mail/sperren/7')
    })

    it('says the block list shows the newest of more, and searches the rest on the server without saving the settings (the sweep after F-26)', async () => {
        const rows = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, email: `weg${i}@example.org`, reason: 'Unzustellbar' as const, detail: null, at: '06.10.2026, 21:00 Uhr' }))
        const wrapper = mount(Page, { props: props({ suppressions: rows, suppressionsTotal: 312, suppressionsFound: 312, suppressionSearch: '' }) })

        expect(wrapper.find('.em-blocked-note').text()).toBe('Hier stehen die neuesten 50 von 312 gesperrten Adressen. Eine ältere findest du über die Suche.')

        await wrapper.find('#em-blocked-q').setValue('  müller@ ')
        await wrapper.find('#em-blocked-q').trigger('keydown', { key: 'Enter' })

        expect(router.get).toHaveBeenCalledWith('/admin/einstellungen/e-mail', { sperre: 'müller@' }, expect.objectContaining({ preserveState: true, only: ['suppressions', 'suppressionsFound', 'suppressionsTotal', 'suppressionSearch'] }))
    })

    it('says when a search finds no blocked address, never that none is blocked', () => {
        const wrapper = mount(Page, { props: props({ suppressions: [], suppressionsTotal: 312, suppressionsFound: 0, suppressionSearch: 'niemand' }) })

        expect(wrapper.find('.em-blocked-note').text()).toBe('Keine gesperrte Adresse passt zu „niemand“.')
        expect(wrapper.text()).not.toContain('Keine Adresse gesperrt.')
    })

    it('names a complaint as a complaint before its block is lifted', async () => {
        const wrapper = mount(Page, { props: props({ suppressions: [{ id: 8, email: 'genervt@example.org', reason: 'Beschwerde', detail: 'abuse', at: '06.10.2026, 21:05 Uhr' }] }) })

        await wrapper.findAll('button').find((b) => b.text() === 'Sperre aufheben')!.trigger('click')

        expect(wrapper.find('.confirm-body').text()).toContain('Eine Mail des Shops wurde als Spam gemeldet.')
        expect(router.delete).not.toHaveBeenCalled()
    })
})
