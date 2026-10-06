import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { AdminEmailProps } from '../../../types/admin/email'

const router = vi.hoisted(() => ({ post: vi.fn(), delete: vi.fn() }))

vi.mock('@inertiajs/vue3', () => ({ router }))

vi.mock('../../../Components/Admin/AdminPage.vue', () => ({
    default: defineComponent({ props: { title: String, context: String }, setup: (props, { slots }) => () => h('main', [h('h1', props.title), h('p', { class: 'ctx' }, props.context), slots.default?.()]) }),
}))
vi.mock('../../../Components/Admin/AdminSaveBar.vue', () => ({ default: defineComponent({ setup: () => () => null }) }))
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

    it('releases a blocked address through its own route, and a double press sends it once', async () => {
        const wrapper = mount(Page, { props: props({ suppressions: [{ id: 7, email: 'weg@example.org', reason: 'Unzustellbar', detail: 'Permanent/General', at: '06.10.2026, 21:00 Uhr' }] }) })

        const release = wrapper.findAll('button').find((b) => b.text() === 'Sperre aufheben')!
        await release.trigger('click')
        await release.trigger('click')

        expect(router.delete).toHaveBeenCalledTimes(1)
        expect(router.delete.mock.calls[0]![0]).toBe('/admin/einstellungen/e-mail/sperren/7')
    })
})
