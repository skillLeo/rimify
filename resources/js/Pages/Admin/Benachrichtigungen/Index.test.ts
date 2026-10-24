import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import type { AdminAlertItem, AdminAlertKind } from '../../../types/admin'
import type { AdminBenachrichtigungenProps } from '../../../types/admin/benachrichtigungen'

/*
 * Benachrichtigungen: the reader's alerts by day, the filter as two links, an empty page that says
 * what will arrive, and „Was du bekommst“ — switches that save as they are flipped.
 */

const post = vi.fn()
const put = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: {}, url: '/admin/benachrichtigungen' }),
    router: { post: (...a: unknown[]) => post(...a), put: (...a: unknown[]) => put(...a) },
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => slots.default?.() }) }))

vi.mock('reka-ui', () => ({
    DropdownMenuRoot: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }),
    DropdownMenuTrigger: defineComponent({ setup: (_, { slots }) => () => h('button', slots.default?.()) }),
    DropdownMenuPortal: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }),
    DropdownMenuContent: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }),
    DropdownMenuItem: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }),
    DropdownMenuSeparator: defineComponent({ setup: () => () => h('hr') }),
}))

const { default: Page } = await import('./Index.vue')

function item(overrides: Partial<AdminAlertItem> = {}): AdminAlertItem {
    return {
        id: 'a1',
        kind: 'order_paid',
        kindLabel: 'Bestellung bezahlt',
        title: 'Bestellung RMF-000042 ist bezahlt.',
        detail: '1.425,00 €',
        href: null,
        read: false,
        day: '26.09.2026',
        dayLabel: 'Heute',
        time: '14:22 Uhr',
        at: '26.09.2026, 14:22 Uhr',
        iso: null,
        ...overrides,
    }
}

const KINDS: AdminAlertKind[] = [
    { kind: 'order_paid', label: 'Bestellung bezahlt', description: 'Eine Bestellung ist bezahlt.', inApp: true, email: false },
    { kind: 'conflict_opened', label: 'Neuer Konflikt', description: 'Zwei Gutachten widersprechen sich.', inApp: true, email: false },
]

function props(overrides: Partial<AdminBenachrichtigungenProps> = {}): AdminBenachrichtigungenProps {
    return {
        filter: 'alle',
        items: [],
        counts: { unread: 0, all: 0 },
        pagination: { current: 1, last: 1, prev: null, next: null },
        kinds: KINDS,
        ...overrides,
    }
}

beforeEach(() => {
    post.mockReset()
    put.mockReset()
})

describe('Benachrichtigungen', () => {
    it('says what will arrive when nothing has yet, naming the kinds this person gets', () => {
        const wrapper = mount(Page, { props: props() })

        expect(wrapper.find('.adm-page__context').text()).toBe('Noch keine Benachrichtigungen')
        expect(wrapper.text()).toContain('„Bestellung bezahlt“ und „Neuer Konflikt“')
        expect(wrapper.find('nav[aria-label="Anzeigen"]').exists()).toBe(false)
    })

    it('groups the alerts by day and counts what is unread', () => {
        const wrapper = mount(Page, {
            props: props({
                items: [item(), item({ id: 'a2', read: true, day: '25.09.2026', dayLabel: 'Gestern' })],
                counts: { unread: 1, all: 2 },
            }),
        })

        expect(wrapper.find('.adm-page__context').text()).toBe('1 ungelesen · 2 insgesamt')
        expect(wrapper.findAll('.bn-day__title').map((t) => t.text())).toEqual(['Heute', 'Gestern'])
        expect(wrapper.findAll('.bn-item--unread')).toHaveLength(1)
    })

    it('shows the filter as two links and marks the one in force', () => {
        const wrapper = mount(Page, { props: props({ filter: 'ungelesen', items: [item()], counts: { unread: 1, all: 3 } }) })
        const links = wrapper.findAll('nav[aria-label="Anzeigen"] a')

        expect(links.map((a) => a.attributes('href'))).toEqual(['/admin/benachrichtigungen', '/admin/benachrichtigungen?filter=ungelesen'])
        expect(links[1]?.attributes('aria-current')).toBe('page')
    })

    it('says "Alles gelesen." when the unread filter is empty, not that there is nothing', () => {
        const wrapper = mount(Page, { props: props({ filter: 'ungelesen', counts: { unread: 0, all: 4 } }) })

        expect(wrapper.text()).toContain('Alles gelesen.')
        expect(wrapper.text()).not.toContain('Hier ist noch nichts.')
    })

    it('marks one read without leaving, or all of them at once', async () => {
        const wrapper = mount(Page, {
            props: props({ items: [item({ href: '/admin/gutachten' })], counts: { unread: 1, all: 1 } }),
        })

        await wrapper.find('.bn-item__read').trigger('click')
        expect(post).toHaveBeenLastCalledWith('/admin/benachrichtigungen/a1/gelesen', { bleiben: true }, expect.anything())

        await wrapper.findAll('button').find((b) => b.text().includes('Alle als gelesen markieren'))?.trigger('click')
        expect(post).toHaveBeenLastCalledWith('/admin/benachrichtigungen/gelesen', {}, expect.anything())
    })

    it('saves a switch the moment it is flipped, with every kind in the request', async () => {
        const wrapper = mount(Page, { props: props() })
        const email = wrapper.findAll('.bn-prefs__table input[type="checkbox"]')[1]

        await email?.setValue(true)
        await nextTick()

        expect(put).toHaveBeenCalledWith(
            '/admin/benachrichtigungen/einstellungen',
            {
                kinds: [
                    { kind: 'order_paid', inApp: true, email: true },
                    { kind: 'conflict_opened', inApp: true, email: false },
                ],
            },
            expect.objectContaining({ preserveScroll: true })
        )
    })

    it('puts a switch back when its save fails on the server or on the way (BELL-04)', async () => {
        const wrapper = mount(Page, { props: props() })
        const email = wrapper.findAll('.bn-prefs__table input[type="checkbox"]')[1]

        await email?.setValue(true)
        // Inertia calls neither onSuccess nor onError for a 500 or a lost connection — only onFinish.
        const options = put.mock.calls.at(-1)?.[2] as { onFinish: () => void }
        options.onFinish()
        await nextTick()

        expect((email?.element as HTMLInputElement).checked).toBe(false)
    })

    it('sends the switches it was loaded with, and says in its own words when another tab flipped one meanwhile (the admin audit’s F-25)', async () => {
        const wrapper = mount(Page, { props: props({ kindsStamp: 'stand-1' }) })
        const email = wrapper.findAll('.bn-prefs__table input[type="checkbox"]')[1]

        await email?.setValue(true)
        const options = put.mock.calls.at(-1)?.[2] as { headers: Record<string, string>; onError: (bag: Record<string, string>) => void; onFinish: () => void }
        expect(options.headers).toEqual({ 'X-Rimify-Stand': 'stand-1' })

        options.onError({ _stamp: 'Das wurde inzwischen in einem anderen Tab oder von jemand anderem geändert …' })
        options.onFinish()
        await nextTick()

        // Nothing typed stays here: the switch shows what is stored, and the sentence says so.
        expect((email?.element as HTMLInputElement).checked).toBe(false)
        expect(wrapper.find('.bn-prefs [role="alert"]').text()).toBe(
            'In einem anderen Tab oder auf einem anderen Gerät wurde inzwischen etwas umgestellt, deshalb ist deine Änderung hier nicht gespeichert. Die Schalter zeigen jetzt, was gespeichert ist. Steht einer nicht so, wie du willst, stell ihn noch einmal um.'
        )
    })

    it('keeps a second flip made while the first is on its way, and sends it next (BELL-15)', async () => {
        const wrapper = mount(Page, { props: props() })
        const boxes = wrapper.findAll('.bn-prefs__table input[type="checkbox"]')

        await boxes[1]?.setValue(true)
        await boxes[3]?.setValue(true)
        expect(put).toHaveBeenCalledTimes(1)
        expect(boxes[3]?.attributes('disabled')).toBeUndefined()

        const first = put.mock.calls[0]?.[2] as { onSuccess: () => void; onFinish: () => void }
        first.onSuccess()
        first.onFinish()

        expect(put).toHaveBeenCalledTimes(2)
        expect(put.mock.calls[1]?.[1]).toEqual({
            kinds: [
                { kind: 'order_paid', inApp: true, email: true },
                { kind: 'conflict_opened', inApp: true, email: true },
            ],
        })
    })

    it('keeps the focus in the list when the pressed control goes away with the read (BELL-03)', async () => {
        const wrapper = mount(Page, {
            props: props({ items: [item({ href: null }), item({ id: 'a2' })], counts: { unread: 2, all: 2 } }),
            attachTo: document.body,
        })

        await wrapper.find('.bn-item__title--button').trigger('click')
        ;(post.mock.calls.at(-1)?.[2] as { onSuccess: () => void }).onSuccess()
        await flushPromises()

        expect(document.activeElement?.id).toBe('bn-item-a1')
        wrapper.unmount()
    })

    it('shows no settings to a role that may receive nothing', () => {
        expect(mount(Page, { props: props({ kinds: [] }) }).find('.bn-prefs').exists()).toBe(false)
    })
})
