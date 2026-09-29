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
            summary: { waiting: 1234, total: 1300, limit: 200 },
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
        const wrapper = mountPage({ summary: { waiting: 0, total: 0, limit: 200 }, subscriptions: [], demand: [] })

        expect(wrapper.text()).toContain(
            'Kundinnen und Kunden tragen sich im Shop ein, wenn für ihr Fahrzeug noch keine Felge freigegeben ist.'
        )
        expect(wrapper.find('table').exists()).toBe(false)
    })

    it('prints the waiting count in German', () => {
        const wrapper = mountPage()

        expect(wrapper.find('td[data-label="Wartende"]').text()).toBe('1.234')
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
