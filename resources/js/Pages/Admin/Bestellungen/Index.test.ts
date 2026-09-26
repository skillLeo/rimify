import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { AdminBestellungenProps, OrderRow } from '../../../types/admin/bestellungen'

/*
 * Bestellungen: the rows say in words how an order stands and tag only the exception; a seeded order
 * says it is Demodaten; a heading re-sorts the list as it stands; the export is a pair of plain
 * download links, offered only to a role that may take the data away.
 */

const get = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: {}, url: '/admin/bestellungen' }),
    router: { get: (...a: unknown[]) => get(...a) },
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => slots.default?.() }) }))

vi.mock('reka-ui', () => {
    const pass = defineComponent({ setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()) })

    return {
        DropdownMenuRoot: pass,
        DropdownMenuTrigger: defineComponent({ setup: (_, { slots, attrs }) => () => h('button', attrs, slots.default?.()) }),
        DropdownMenuPortal: pass,
        DropdownMenuContent: pass,
        DropdownMenuItem: defineComponent({ props: { asChild: Boolean }, setup: (_, { slots }) => () => slots.default?.() }),
        DropdownMenuSeparator: defineComponent({ setup: () => () => h('hr') }),
    }
})

const { default: Page } = await import('./Index.vue')

function row(overrides: Partial<OrderRow> = {}): OrderRow {
    return {
        id: 1,
        number: 'RMF-2026-1001',
        placed: true,
        date: '26.09.2026',
        at: '26.09.2026, 14:22 Uhr',
        iso: null,
        customer: 'Jonas Weber',
        email: 'jonas@example.de',
        vehicle: 'BMW 3er',
        total: '1.425,00 €',
        status: 'PAID',
        statusLabel: 'Bezahlt',
        payment: { label: 'Bezahlt', tone: 'plain' },
        fulfilment: { label: 'Zu versenden', tone: 'warn' },
        paymentMethod: 'Kreditkarte',
        shippingMethod: null,
        conditions: false,
        demo: false,
        ...overrides,
    }
}

function props(overrides: Partial<AdminBestellungenProps> = {}): AdminBestellungenProps {
    return {
        orders: [row()],
        filters: { q: '', status: '', von: '', bis: '', zahlart: '', versandart: '', min: '', max: '', auflagen: false, sort: 'datum', richtung: 'ab' },
        options: { statuses: [{ value: 'offen', label: 'Zu versenden (bezahlt)', count: 1 }], payment: [], shipping: [] },
        filtered: false,
        totalAll: 1,
        pagination: { current: 1, last: 1, total: 1, prev: null, next: null },
        query: {},
        exportUrls: null,
        can: { export: false },
        ...overrides,
    }
}

beforeEach(() => get.mockReset())

describe('Bestellungen', () => {
    it('writes a normal state as text and tags only the exception', () => {
        const cells = mount(Page, { props: props() }).findAll('tbody td')

        expect(cells[4]?.find('.adm-tag').exists()).toBe(false)
        expect(cells[4]?.text()).toContain('Bezahlt')
        expect(cells[5]?.find('.adm-tag--warn').text()).toBe('Zu versenden')
    })

    it('says a seeded order is Demodaten, and an order sold under Auflagen says so', () => {
        const wrapper = mount(Page, { props: props({ orders: [row({ demo: true, conditions: true })] }) })

        expect(wrapper.find('.ob-demo').text()).toBe('Demodaten')
        expect(wrapper.text()).toContain('mit Auflagen')
    })

    it('re-sorts the list as it stands when a heading is pressed, keeping the filters', async () => {
        const wrapper = mount(Page, { props: props({ query: { status: 'offen' } }) })

        await wrapper.findAll('.ob-sort').find((b) => b.text().includes('Summe'))?.trigger('click')

        expect(get).toHaveBeenCalledWith('/admin/bestellungen', { status: 'offen', sort: 'summe', richtung: 'ab' }, expect.anything())
    })

    it('marks the sorted column for a screen reader', () => {
        const headers = mount(Page, { props: props() }).findAll('thead th')

        expect(headers[1]?.attributes('aria-sort')).toBe('descending')
        expect(headers[3]?.attributes('aria-sort')).toBeUndefined()
    })

    it('offers the export as plain download links, only with the right to export', () => {
        expect(mount(Page, { props: props() }).find('a[download]').exists()).toBe(false)

        const links = mount(Page, { props: props({ exportUrls: { csv: '/x.csv', xlsx: '/x.xlsx' }, can: { export: true } }) }).findAll('a[download]')
        expect(links.map((a) => a.attributes('href'))).toEqual(['/x.xlsx', '/x.csv'])
    })

    it('tells an empty shop from a filter that excludes everything', () => {
        expect(mount(Page, { props: props({ orders: [], totalAll: 0 }) }).text()).toContain('Hier erscheint jede Bestellung')
        expect(mount(Page, { props: props({ orders: [], filtered: true, totalAll: 12 }) }).text()).toContain('Kein Treffer für diese Filter.')
    })

    it('hides Zahlart and Versandart while no order carries one', () => {
        const wrapper = mount(Page, { props: props() })

        expect(wrapper.find('#ob-zahlart').exists()).toBe(false)
        expect(mount(Page, { props: props({ options: { statuses: [], payment: [{ value: 'card', label: 'Kreditkarte' }], shipping: [] } }) }).find('#ob-zahlart').exists()).toBe(true)
    })
})
