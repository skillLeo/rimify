import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'

/*
 * Verkauf › Nachrichten (#12, D-123): the contact form's messages, the unread ones first. „Antworten“ is the team's
 * own mail program, addressed to the sender; „Als gelesen markieren“ posts and takes the message out of the queue.
 */

const current = reactive<{ props: Record<string, unknown> }>({ props: {} })

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    router: { get: vi.fn(), post: vi.fn(), on: vi.fn(() => () => undefined) },
}))

const { default: Page } = await import('./Index.vue')
const { router } = await import('@inertiajs/vue3')

const ITEM = {
    id: 4,
    name: 'Jana Beispiel',
    email: 'jana@example.com',
    subject: 'Frage zu einer Felge',
    message: 'Passt die Felge auch mit Winterreifen?\nDanke!',
    vehicle: 'BMW 3er Coupé (HSN 0005 · TSN 582)',
    from: '/felgen/beispiel',
    at: '02.10.2026, 14:05',
    read: false,
    readAt: null,
    replyHref: 'mailto:jana@example.com?subject=Re%3A%20Frage%20zu%20einer%20Felge',
}

const FILTERS = [
    { value: 'ungelesen', label: 'Ungelesen' },
    { value: 'alle', label: 'Alle' },
]

let mounted: VueWrapper[] = []

function mountPage(props: Record<string, unknown> = {}): VueWrapper {
    const wrapper = mount(Page, {
        props: { items: [ITEM], count: 1, total: 1, filter: 'ungelesen', filters: FILTERS, canMarkRead: true, keepMonths: 12, ...props },
        attachTo: document.body,
    })
    mounted.push(wrapper)

    return wrapper
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    vi.mocked(router.post).mockClear()
})

describe('Admin › Nachrichten', () => {
    it('shows who wrote, about what, the car and where — and answers by mail to the sender', () => {
        const wrapper = mountPage()
        const item = wrapper.find('.nfa-item')

        expect(item.find('.nfa-item__subject').text()).toBe('Frage zu einer Felge')
        expect(item.find('.nfa-item__meta').text()).toBe('Jana Beispiel · jana@example.com')
        expect(item.find('time.nfa-item__at').text()).toBe('02.10.2026, 14:05')
        expect(item.find('.nfa-facts').text()).toContain('BMW 3er Coupé (HSN 0005 · TSN 582)')
        expect(item.find('.nfa-facts').text()).toContain('Gesendet von der Seite')
        expect(item.find('a.btn').attributes('href')).toBe(ITEM.replyHref)
    })

    it('counts what the filter finds, not the rows on the page', () => {
        expect(mountPage({ count: 250 }).text()).toContain('250 ungelesene Nachrichten')
    })

    it('marks a message read through its own route', async () => {
        const wrapper = mountPage()

        await wrapper.findAll('button').find((b) => b.text() === 'Als gelesen markieren')!.trigger('click')

        expect(router.post).toHaveBeenCalledWith('/admin/nachrichten/4/gelesen', {}, { preserveScroll: true })
    })

    it('offers no marking to a reader who may not, and says when a message was read', () => {
        expect(mountPage({ canMarkRead: false }).text()).not.toContain('Als gelesen markieren')
        expect(mountPage({ filter: 'alle', items: [{ ...ITEM, read: true, readAt: '02.10.2026' }] }).text()).toContain('Gelesen am 02.10.2026')
    })

    it('says everything is read, and offers the rest, when the queue is empty', () => {
        const wrapper = mountPage({ items: [], count: 0, total: 3 })

        expect(wrapper.text()).toContain('Alles gelesen.')
        expect(wrapper.findAll('button').some((b) => b.text() === 'Alle zeigen')).toBe(true)
    })
})
