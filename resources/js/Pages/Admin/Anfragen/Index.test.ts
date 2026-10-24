import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { AdminBenachrichtigungenProps } from '../../../types/pages'

/*
 * Anfragen: the empty state says how people get onto the list, waiting counts are
 * German, and only an unconfirmed or unsubscribed address is tagged.
 */

const current = reactive<{ props: Record<string, unknown> }>({ props: {} })

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    router: { post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn(), on: vi.fn(() => () => undefined) },
}))

const { default: Page } = await import('./Index.vue')

type Subscription = AdminBenachrichtigungenProps['subscriptions'][number]

function subscription(id: number, status: string): Subscription {
    return {
        id,
        email: `kunde${id}@example.com`,
        vehicle: 'VW Golf VIII',
        keyNumbers: 'HSN 0603 · TSN BJK',
        status,
        requestedAt: '20.09.2026',
        notifiedAt: null,
    }
}

let mounted: VueWrapper[] = []

function mountPage(props: Partial<AdminBenachrichtigungenProps> = {}): VueWrapper {
    const wrapper = mount(Page, {
        props: {
            summary: { waiting: 1234, total: 1300, found: 1300 },
            search: '',
            pagination: { current: 1, last: 26, total: 1300, prev: null, next: '/admin/anfragen?seite=2' },
            subscriptions: [subscription(1, 'Wartet'), subscription(2, 'Benachrichtigt'), subscription(3, 'Unbestätigt'), subscription(4, 'Abgemeldet')],
            demand: [{ vehicle: 'VW Golf VIII', keyNumbers: 'HSN 0603 · TSN BJK', waiting: 1234 }],
            ...props,
        },
        attachTo: document.body,
    })
    mounted.push(wrapper)

    return wrapper
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('Anfragen', () => {
    it('says how people get onto the list when nobody has yet', () => {
        const wrapper = mountPage({ summary: { waiting: 0, total: 0, found: 0 }, subscriptions: [], demand: [] })

        expect(wrapper.text()).toContain(
            'Kundinnen und Kunden tragen sich im Shop ein, wenn für ihr Fahrzeug noch keine Felge freigegeben ist.'
        )
        expect(wrapper.find('table').exists()).toBe(false)
    })

    it('prints the waiting count in German', () => {
        const wrapper = mountPage()

        expect(wrapper.find('td[data-label="Wartende"]').text()).toBe('1.234')
    })

    it('reaches every request page by page, and says when a search finds none (the admin audit’s F-26)', () => {
        const paged = mountPage()
        expect(paged.find('nav[aria-label="Seiten der Anfragen"]').text()).toContain('Seite 1 von 26')
        expect(paged.text()).not.toContain('Die neuesten')
        // No search, no „gefunden“: the page once compared the search function with '' and always said it.
        expect(paged.text()).not.toContain('Anfragen gefunden')

        const none = mountPage({ search: 'niemand@example.com', summary: { waiting: 1234, total: 1300, found: 0 }, subscriptions: [], pagination: { current: 1, last: 1, total: 0, prev: null, next: null } })
        expect(none.text()).toContain('Kein Treffer für diese Filter.')
        expect(none.find('section[aria-labelledby="ben-all"] table').exists()).toBe(false)
    })

    it('says a search that finds nothing once, as every other list does — never also „0 Anfragen gefunden“ (the admin audit’s F-39)', () => {
        const none = mountPage({ search: 'Golf', summary: { waiting: 1234, total: 1300, found: 0 }, subscriptions: [], pagination: { current: 1, last: 1, total: 0, prev: null, next: null } })
        expect(none.text()).not.toContain('gefunden')
        expect(none.findAll('.adm-state__heading').map((h) => h.text())).toEqual(['Kein Treffer für diese Filter.'])

        const some = mountPage({ search: 'Golf', summary: { waiting: 1234, total: 1300, found: 12 } })
        expect(some.find('section[aria-labelledby="ben-all"] .ben__note').text()).toBe('12 Anfragen gefunden.')
    })

    it('says of how many vehicles the ranking shows the most asked-for (the admin audit’s sweep after F-26)', () => {
        const demand = Array.from({ length: 20 }, (_, i) => ({ vehicle: `Fahrzeug ${i + 1}`, keyNumbers: `HSN 0603 · TSN B${String(i).padStart(2, '0')}`, waiting: 30 - i }))

        expect(mountPage({ demand, summary: { waiting: 1234, total: 1300, found: 1300, vehicles: 34 } }).find('.ben__more').text()).toBe(
            'Hier stehen die 20 von 34 Fahrzeugen mit den meisten Wartenden. Jede Anfrage steht unter „Alle Anfragen“.'
        )
        expect(mountPage({ demand: demand.slice(0, 3), summary: { waiting: 12, total: 20, found: 20, vehicles: 3 } }).find('.ben__more').exists()).toBe(false)
    })

    it('tags only an unconfirmed or unsubscribed address, neutral', () => {
        const status = mountPage().findAll('td[data-label="Status"]')

        expect(status.map((td) => td.find('.adm-tag').exists())).toEqual([false, false, true, true])
        expect(status[0]!.text()).toBe('Wartet')
        expect(status[1]!.text()).toBe('Benachrichtigt')
        expect(status[2]!.find('.adm-tag--neutral').text()).toBe('Unbestätigt')
        expect(status[3]!.find('.adm-tag--neutral').text()).toBe('Abgemeldet')
    })
})
