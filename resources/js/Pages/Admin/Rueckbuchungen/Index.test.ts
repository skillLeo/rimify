import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

/*
 * Verkauf › Rückbuchungen (Block G §5): each chargeback with its deadline counted down — warned at three days,
 * marked once it has passed — and the answer offered only while one can still be given.
 */

vi.mock('@inertiajs/vue3', () => ({
    Head: defineComponent({ setup: () => () => null }),
    usePage: () => ({ props: { errors: {} } }),
    router: { post: vi.fn() },
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
vi.mock('../../../Components/Admin/AdminConfirm.vue', () => ({ default: defineComponent({ setup: () => () => null }) }))

const { default: Page } = await import('./Index.vue')

function row(over: Record<string, unknown> = {}) {
    return {
        id: 1, reference: 'dp_1', reason: 'Ware nicht erhalten', status: 'Antwort nötig', amount: 159_600,
        order: { id: 7, number: 'RMF-2026-0007' }, dueBy: '06.10.2026, 01:59 Uhr', daysLeft: 5, overdue: false,
        open: true, answered: false, answeredAt: null, outcome: null, ...over,
    }
}

describe('Rückbuchungen', () => {
    it('counts the days down and warns from three', () => {
        const wrapper = mount(Page, { props: { disputes: [row(), row({ id: 2, daysLeft: 2 }), row({ id: 3, daysLeft: -1, overdue: true })], canRespond: true } })
        const tags = wrapper.findAll('.rb__head .adm-tag')

        expect(tags.map((t) => t.text())).toEqual(['noch 5 Tage', 'noch 2 Tage', 'Frist abgelaufen'])
        expect(tags[1]!.classes()).toContain('adm-tag--warn')
        expect(tags[2]!.classes()).toContain('adm-tag--bad')
    })

    it('offers the answer only while one can be given', () => {
        const wrapper = mount(Page, { props: { disputes: [row(), row({ id: 2, answered: true, answeredAt: '02.10.2026' }), row({ id: 3, open: false, outcome: 'Gewonnen – das Geld bleibt beim Shop.' })], canRespond: true } })
        const items = wrapper.findAll('.rb__item')

        expect(items[0]!.find('button').text()).toBe('Antworten')
        expect(items[1]!.find('button').exists()).toBe(false)
        expect(items[1]!.text()).toContain('gesendet am 02.10.2026')
        expect(items[2]!.text()).toContain('Gewonnen')
    })
})
