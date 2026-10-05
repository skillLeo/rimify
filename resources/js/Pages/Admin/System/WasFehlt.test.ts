import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { AdminWasFehltProps, GoLiveCheck } from '../../../types/admin/system'

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

vi.mock('../../../Components/Admin/AdminPage.vue', () => ({
    default: defineComponent({ props: { title: String, context: String }, setup: (props, { slots }) => () => h('main', [h('h1', props.title), h('p', { class: 'ctx' }, props.context), slots.default?.()]) }),
}))
vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => slots.default?.() }) }))

const { default: Page } = await import('./WasFehlt.vue')

/*
 * System › Was fehlt (the operator's brief of 05.10.2026, §7): the client's items by default, what is open first, the
 * state as a word beside its dot, and the admin page where a check is closed as a link — anything else as code.
 */

function check(over: Partial<GoLiveCheck>): GoLiveCheck {
    return { id: 'x', group: 'Recht und Pflichtangaben', title: 'X', owner: 'kunde', state: 'ok', sentence: 'Satz.', place: '/admin/x', ...over }
}

function props(over: Partial<AdminWasFehltProps> = {}): AdminWasFehltProps {
    return {
        summary: '2 von 5 erfüllt · 1 bei uns · 2 beim Kunden · 1 nicht prüfbar',
        groups: ['Recht und Pflichtangaben', 'Recht am Rad', 'Zahlung', 'Betrieb und Sicherheit'],
        owners: { kunde: 'beim Kunden', wir: 'bei uns (RIMIFY)', host: 'beim Host' },
        owner: 'kunde',
        checks: [
            check({ id: 'mwst', title: 'Umsatzsteuer und Bruttopreise', owner: 'wir', place: 'RIMIFY_SELLER_SMALL_BUSINESS' }),
            check({ id: 'agb', title: 'AGB', state: 'ok', place: '/admin/seiten/6' }),
            check({ id: 'impressum', title: 'Impressum (§ 5 DDG)', state: 'fehlt', sentence: 'Im Impressum fehlen: Anschrift.', place: '/admin/einstellungen/verkaeufer-versand' }),
            check({ id: 'apple-pay', group: 'Zahlung', title: 'Domain für Apple Pay', state: 'nicht prüfbar', place: 'Stripe-Dashboard › Zahlungsmethoden-Domains' }),
            check({ id: 'testmatrix', group: 'Zahlung', title: 'Letzte vollständige Testmatrix', owner: 'wir', state: 'fehlt', place: 'docs/dev/STRIPE.md' }),
        ],
        checkedAt: '05.10.2026, 23:40 Uhr',
        ...over,
    }
}

describe('System › Was fehlt', () => {
    it('leads with the count line, and shows the client’s items, what is open first', () => {
        const wrapper = mount(Page, { props: props() })

        expect(wrapper.find('h1').text()).toBe('Was fehlt')
        expect(wrapper.find('.ctx').text()).toBe('Stand: 05.10.2026, 23:40 Uhr')
        expect(wrapper.find('.wf-summary').text()).toBe('2 von 5 erfüllt · 1 bei uns · 2 beim Kunden · 1 nicht prüfbar')

        const titles = wrapper.findAll('.wf-check__title').map((t) => t.text())
        expect(titles).toEqual(['Impressum (§ 5 DDG)', 'AGB', 'Domain für Apple Pay'])
        expect(wrapper.findAll('.wf-group h2').map((t) => t.text())).toEqual(['Recht und Pflichtangaben', 'Zahlung'])
    })

    it('says each state in a word, links an admin page, and names anything else as code', () => {
        const wrapper = mount(Page, { props: props() })
        const rows = wrapper.findAll('.wf-check')

        expect(rows[0]!.find('.wf-check__state').text()).toBe('Fehlt')
        expect(rows[0]!.find('.wf-check__place a').attributes('href')).toBe('/admin/einstellungen/verkaeufer-versand')
        expect(rows[1]!.find('.wf-check__state').text()).toBe('Erledigt')
        expect(rows[2]!.find('.wf-check__state').text()).toBe('Nicht prüfbar')
        expect(rows[2]!.find('.wf-check__place code').text()).toBe('Stripe-Dashboard › Zahlungsmethoden-Domains')
    })

    it('offers each side as a link with its open count, the current one marked', () => {
        const wrapper = mount(Page, { props: props({ owner: 'alle' }) })
        const filters = wrapper.findAll('.wf-filter__item')

        expect(filters.map((f) => f.attributes('href'))).toEqual([
            '/admin/system/was-fehlt?wer=kunde',
            '/admin/system/was-fehlt?wer=wir',
            '/admin/system/was-fehlt?wer=host',
            '/admin/system/was-fehlt?wer=alle',
        ])
        expect(filters.map((f) => f.find('.wf-filter__count').text())).toEqual(['1 offen', '1 offen', '0 offen', '2 offen'])
        expect(filters[3]!.attributes('aria-current')).toBe('page')
        // Every side's items, each saying whose it is.
        expect(wrapper.findAll('.wf-check')).toHaveLength(5)
        expect(wrapper.find('.wf-check__owner').text()).toContain('Kunde')
    })
})
