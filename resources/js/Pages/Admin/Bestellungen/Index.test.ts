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
const current: { props: Record<string, unknown>; url: string } = { props: {}, url: '/admin/bestellungen' }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    router: { get: (...a: unknown[]) => get(...a) },
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => slots.default?.() }) }))

// The views bar and the column chooser have tests of their own (Components/Admin/Lists).
vi.mock('../../../Components/Admin/Lists/ListViews.vue', () => ({
    default: defineComponent({
        emits: ['ownColumns'],
        setup: (_, { emit }) => () => h('button', { class: 'lv-stub', type: 'button', onClick: () => emit('ownColumns') }),
    }),
}))
vi.mock('../../../Components/Admin/Lists/ColumnChooser.vue', () => ({ default: defineComponent({ setup: () => () => h('div', { class: 'lc-stub' }) }) }))

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
        total: 142_500,
        currency: 'EUR',
        status: 'PAID',
        statusLabel: 'Bezahlt',
        payment: { label: 'Bezahlt', tone: 'plain' },
        fulfilment: { label: 'Zu versenden', tone: 'warn' },
        paymentMethod: 'Kreditkarte',
        shippingMethod: null,
        conditions: false,
        demo: false,
        test: false,
        href: '/admin/bestellungen/1',
        ...overrides,
    }
}

function props(overrides: Partial<AdminBestellungenProps> = {}): AdminBestellungenProps {
    return {
        orders: [row()],
        filters: { q: '', status: '', zeitraum: '', von: '', bis: '', zahlart: '', versandart: '', min: '', max: '', auflagen: false, sort: 'datum', richtung: 'ab' },
        options: { statuses: [{ value: 'offen', label: 'Zu versenden (bezahlt)', count: 1 }], payment: [], shipping: [] },
        filtered: false,
        totalAll: 1,
        pagination: { current: 1, last: 1, total: 1, prev: null, next: null },
        query: {},
        exportUrls: null,
        can: { export: false },
        views: { items: [], active: null, missing: false, shareOptions: [], canSave: true, limit: 30 },
        columns: {
            all: [
                { key: 'nummer', label: 'Nummer', required: true },
                { key: 'datum', label: 'Datum', required: false },
                { key: 'kunde', label: 'Kundin oder Kunde', required: false },
                { key: 'fahrzeug', label: 'Fahrzeug', required: false },
                { key: 'summe', label: 'Summe', required: false },
                { key: 'zahlung', label: 'Zahlung', required: false },
                { key: 'versand', label: 'Versand', required: false },
            ],
            shown: ['nummer', 'datum', 'kunde', 'summe', 'zahlung', 'versand'],
            defaults: ['nummer', 'datum', 'kunde', 'summe', 'zahlung', 'versand'],
        },
        ...overrides,
    }
}

beforeEach(() => {
    get.mockReset()
    current.props = {}
})

describe('Bestellungen', () => {
    it('writes a normal state as text and tags only the exception', () => {
        const cells = mount(Page, { props: props() }).findAll('tbody td')

        expect(cells[4]?.find('.adm-tag').exists()).toBe(false)
        expect(cells[4]?.text()).toContain('Bezahlt')
        expect(cells[5]?.find('.adm-tag--warn').text()).toBe('Zu versenden')
    })

    it('draws only the columns the person chose — the number always, the car when asked for', () => {
        const base = props()
        const wrapper = mount(Page, { props: { ...base, columns: { ...base.columns, shown: ['nummer', 'fahrzeug', 'summe'] } } })

        expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual(['Nummer', 'Fahrzeug', 'Summe'])
        expect(wrapper.findAll('tbody td').map((td) => td.attributes('data-label'))).toEqual(['Nummer', 'Fahrzeug', 'Summe'])
        expect(wrapper.find('.ob-vehicle').text()).toBe('BMW 3er')
    })

    it('keeps the column the list is sorted by, even where the person hid it', () => {
        const base = props()
        const wrapper = mount(Page, {
            props: { ...base, filters: { ...base.filters, sort: 'summe', richtung: 'ab' }, columns: { ...base.columns, shown: ['nummer', 'datum'] } },
        })

        expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual(['Nummer', 'Datum', 'Summe'])
    })

    it('shows an open view\'s own columns from the first frame, and the person\'s own once asked for', async () => {
        const view = {
            id: 7,
            name: 'Mit Fahrzeug',
            href: '/admin/bestellungen?ansicht=7',
            query: {},
            storesColumns: true,
            columns: ['nummer', 'fahrzeug'],
            mine: true,
            sharedWith: null,
            roleId: null,
            owner: null,
        }
        const wrapper = mount(Page, { props: props({ views: { items: [view], active: 7, missing: false, shareOptions: [], canSave: true, limit: 30 } }) })

        expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual(['Nummer', 'Fahrzeug'])

        // „Meine Spalten wiederherstellen“: the view stays open, the person's columns come back.
        await wrapper.find('.lv-stub').trigger('click')
        expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual(['Nummer', 'Datum', 'Kundin oder Kunde', 'Summe', 'Zahlung', 'Versand'])
    })

    it('says a refused filter above the list — and leaves a refused view name to its dialog', () => {
        current.props = { errors: { status: 'Diesen Status gibt es nicht. Wähl bitte einen aus der Liste.', name: 'Eine Ansicht mit diesem Namen hast du schon.' } }

        const alert = mount(Page, { props: props() }).find('.adm-alert')

        expect(alert.findAll('.ob-refusal').map((p) => p.text())).toEqual(['Diesen Status gibt es nicht. Wähl bitte einen aus der Liste.'])
    })

    it('keeps an open view open when a heading re-sorts the list', async () => {
        const wrapper = mount(Page, { props: props({ query: { status: 'offen' }, views: { items: [], active: 7, missing: false, shareOptions: [], canSave: true, limit: 30 } }) })

        await wrapper.findAll('.ob-sort')[1]?.trigger('click')

        expect(get).toHaveBeenCalledWith('/admin/bestellungen', { status: 'offen', sort: 'summe', richtung: 'ab', ansicht: '7' }, expect.anything())
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
