import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { DashboardOrderRow, TodoItem } from '../../../types/admin/uebersicht'

/*
 * The Übersicht's widgets and lists: every widget has the same four states; a state is a word with
 * a dot, never a dot alone; each table row is one link; the to-do list names each row's kind.
 */

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

const { default: DashWidget } = await import('./DashWidget.vue')
const { default: StateChip } = await import('./StateChip.vue')
const { default: RecentOrders } = await import('./RecentOrders.vue')
const { default: TodoList } = await import('./TodoList.vue')

describe('DashWidget', () => {
    it('titles its section and links to the full list behind it', () => {
        const wrapper = mount(DashWidget, { props: { title: 'Neueste Bestellungen', href: '/admin/bestellungen' }, slots: { default: '<p class="x">Inhalt</p>' } })
        const section = wrapper.find('section')

        expect(wrapper.find(`#${section.attributes('aria-labelledby')}`).text()).toBe('Neueste Bestellungen')
        expect(wrapper.find('a').attributes('href')).toBe('/admin/bestellungen')
        expect(wrapper.find('a').text()).toContain('Alle ansehen')
        expect(wrapper.find('.x').exists()).toBe(true)
    })

    it('shows its sentence instead of empty content, a skeleton while loading, and a retry on failure', async () => {
        expect(mount(DashWidget, { props: { title: 'T', empty: 'Noch nichts.' }, slots: { default: '<p class="x" />' } }).find('.x').exists()).toBe(false)
        expect(mount(DashWidget, { props: { title: 'T', loading: true } }).find('section').attributes('aria-busy')).toBe('true')

        const failed = mount(DashWidget, { props: { title: 'T', error: 'Konnte nicht geladen werden.' } })
        expect(failed.find('[role="alert"]').text()).toContain('Konnte nicht geladen werden.')
        await failed.find('button').trigger('click')
        expect(failed.emitted('retry')).toHaveLength(1)
    })
})

describe('StateChip', () => {
    it('writes the state as a word with a dot, and nothing as a dash', () => {
        const chip = mount(StateChip, { props: { label: 'Zu versenden', tone: 'warn' } })

        expect(chip.text()).toBe('Zu versenden')
        expect(chip.find('.chip--warn .chip__dot').attributes('aria-hidden')).toBe('true')
        expect(mount(StateChip, { props: { label: '–', tone: 'plain' } }).find('.chip').exists()).toBe(false)
    })
})

describe('RecentOrders', () => {
    const row: DashboardOrderRow = {
        id: 1,
        number: 'RMF-2026-1004',
        customer: 'Petra Bauer',
        total: '1.425,00 €',
        payment: { label: 'Bezahlt', tone: 'plain' },
        fulfilment: { label: 'Zu versenden', tone: 'warn' },
        ago: 'vor 2 Std.',
        iso: null,
        demo: true,
        href: '/admin/bestellungen?q=RMF-2026-1004',
    }

    it('makes each row one link, the amount right-aligned, and the age in words', () => {
        const wrapper = mount(RecentOrders, { props: { orders: [row] } })
        const cells = wrapper.findAll('tbody td')

        expect(wrapper.findAll('tbody a')).toHaveLength(1)
        expect(wrapper.find('tbody a').attributes('href')).toBe('/admin/bestellungen?q=RMF-2026-1004')
        expect(cells[2]?.classes()).toContain('dt__num')
        expect(cells[5]?.text()).toBe('vor 2 Std.')
    })
})

describe('TodoList', () => {
    it('names each row’s kind, and each row leads to where it is done', () => {
        const items: TodoItem[] = [
            { key: 'a', type: 'Versand', title: 'Bestellung RMF-1 versenden', detail: '1.425,00 €', ago: 'vor 3 Tagen', iso: null, href: '/admin/bestellungen?q=RMF-1' },
            { key: 'b', type: 'Anfrage', title: 'BMW 3er 320d', detail: '2 Personen warten auf ein Gutachten', ago: 'gestern', iso: null, href: '/admin/anfragen' },
        ]
        const wrapper = mount(TodoList, { props: { items } })

        expect(wrapper.findAll('.todo__type').map((t) => t.text())).toEqual(['Versand', 'Anfrage'])
        expect(wrapper.findAll('a').map((a) => a.attributes('href'))).toEqual(['/admin/bestellungen?q=RMF-1', '/admin/anfragen'])
    })
})
