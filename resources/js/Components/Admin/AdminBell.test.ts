import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, inject, provide } from 'vue'
import type { AdminAlertItem } from '../../types/admin'

/*
 * The bell: the number is the server's, shown from the first frame and capped at 99+, and a fresher
 * one wins once the bell has read it or Back restored an old page; the list is fetched when the bell
 * opens, the keyboard lands on the newest alert, and „Alle als gelesen markieren“ is never offered
 * before the list it would clear is on screen.
 */

const current: { props: Record<string, unknown>; url: string } = { props: {}, url: '/admin' }
const post = vi.fn()
const visit = vi.fn()
const handlers: Record<string, Array<() => void>> = {}

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    router: {
        post: (...args: unknown[]) => post(...args),
        visit: (...args: unknown[]) => visit(...args),
        on: (event: string, callback: () => void) => {
            ;(handlers[event] ??= []).push(callback)

            return () => undefined
        },
    },
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

const OPEN = Symbol('open')

vi.mock('reka-ui', () => ({
    DropdownMenuRoot: defineComponent({
        emits: ['update:open'],
        setup: (_, { slots, emit }) => {
            provide(OPEN, () => emit('update:open', true))

            return () => h('div', slots.default?.())
        },
    }),
    DropdownMenuTrigger: defineComponent({
        setup: (_, { slots, attrs }) => {
            const open = inject<() => void>(OPEN)

            return () => h('button', { type: 'button', ...attrs, onClick: () => open?.() }, slots.default?.())
        },
    }),
    DropdownMenuPortal: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }),
    DropdownMenuContent: defineComponent({ setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()) }),
    DropdownMenuLabel: defineComponent({ setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()) }),
    DropdownMenuSeparator: defineComponent({ setup: () => () => h('hr') }),
    DropdownMenuItem: defineComponent({
        props: { asChild: Boolean },
        emits: ['select'],
        setup: (props, { slots, attrs, emit }) => () =>
            props.asChild
                ? slots.default?.()
                : h('button', { type: 'button', ...attrs, onClick: (e: Event) => emit('select', e) }, slots.default?.()),
    }),
}))

const { default: AdminBell } = await import('./AdminBell.vue')

function alert(overrides: Partial<AdminAlertItem> = {}): AdminAlertItem {
    return {
        id: '9b1f0c2e-0000-4000-8000-000000000001',
        kind: 'order_paid',
        kindLabel: 'Bestellung bezahlt',
        title: 'Bestellung RMF-000042 ist bezahlt.',
        detail: '1.425,00 € · Audi RS 4',
        href: null,
        read: false,
        day: '26.09.2026',
        dayLabel: 'Heute',
        time: '14:22 Uhr',
        at: '26.09.2026, 14:22 Uhr',
        iso: '2026-09-26T12:22:00+00:00',
        ...overrides,
    }
}

let mounted: VueWrapper[] = []

function mountBell(unread: number | null, offered = true): VueWrapper {
    current.props = { admin: { notifications: { unread, offered } } }
    const wrapper = mount(AdminBell, { attachTo: document.body })
    mounted.push(wrapper)

    return wrapper
}

function answer(body: unknown, status = 200): void {
    vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({ ok: status >= 200 && status < 300, status, redirected: false, url: '', json: async () => body }))
    )
}

async function openBell(wrapper: VueWrapper): Promise<void> {
    await wrapper.find('.adm-bell').trigger('click')
    await flushPromises()
}

/** The options object a router call was given, so its callbacks can be run as Inertia would. */
function optionsOf(call: unknown[] | undefined): { onSuccess?: () => void } {
    return (call?.[2] ?? {}) as { onSuccess?: () => void }
}

beforeEach(() => {
    post.mockReset()
    visit.mockReset()
    // A page from the server: whatever count the bell read last is dropped.
    handlers.success?.forEach((callback) => callback())
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    vi.unstubAllGlobals()
})

describe('AdminBell', () => {
    it('shows no number at zero, and none when the number could not be read', () => {
        expect(mountBell(0).find('.adm-bell__count').exists()).toBe(false)
        expect(mountBell(null).find('.adm-bell__count').exists()).toBe(false)
        expect(mountBell(0).find('.adm-bell').attributes('aria-label')).toBe('Benachrichtigungen')
    })

    it('shows the unread number, capped at 99+, and says it to a screen reader', () => {
        const three = mountBell(3)
        expect(three.find('.adm-bell__count').text()).toBe('3')
        expect(three.find('.adm-bell').attributes('aria-label')).toBe('Benachrichtigungen, 3 ungelesen')

        const many = mountBell(150)
        expect(many.find('.adm-bell__count').text()).toBe('99+')
        expect(many.find('.adm-bell').attributes('aria-label')).toBe('Benachrichtigungen, über 99 ungelesen')
    })

    it('fetches the newest alerts when it opens and marks the unread ones', async () => {
        answer({ unread: 1, items: [alert(), alert({ id: 'b', read: true, title: 'Älter.', dayLabel: 'Gestern' })] })
        const wrapper = mountBell(1)

        await openBell(wrapper)

        expect(fetch).toHaveBeenCalledWith('/admin/benachrichtigungen/neueste', expect.objectContaining({ credentials: 'same-origin' }))
        const rows = wrapper.findAll('.adm-bellitem')
        expect(rows).toHaveLength(2)
        expect(rows[0]?.classes()).toContain('adm-bellitem--unread')
        expect(rows[0]?.text()).toContain('Ungelesen:')
        expect(rows[0]?.find('time').text()).toBe('14:22 Uhr')
        expect(rows[1]?.find('time').text()).toBe('Gestern, 14:22 Uhr')
    })

    it('believes the fresher count it has just read over the page\'s', async () => {
        answer({ unread: 3, items: [alert()] })
        const wrapper = mountBell(1)

        await openBell(wrapper)

        expect(wrapper.find('.adm-bell__count').text()).toBe('3')
        expect(wrapper.find('.adm-alerts__unread').text()).toBe('3 ungelesen')
    })

    it('asks again after Back, which restores a page with its old count (BELL-02)', async () => {
        const wrapper = mountBell(3)
        answer({ unread: 0, items: [] })

        window.dispatchEvent(new PopStateEvent('popstate'))
        await flushPromises()

        expect(wrapper.find('.adm-bell__count').exists()).toBe(false)
    })

    it('lands the keyboard on the newest alert, and offers "Alle als gelesen markieren" only once the list is there (BELL-01)', async () => {
        answer({ unread: 2, items: [alert(), alert({ id: 'b' })] })
        const wrapper = mountBell(2)

        expect(wrapper.text()).not.toContain('Alle als gelesen markieren')

        await wrapper.find('.adm-bell').trigger('keydown', { key: 'Enter' })
        await openBell(wrapper)

        expect(document.activeElement?.classList.contains('adm-bellitem')).toBe(true)
        expect(document.activeElement?.textContent).toContain('Bestellung RMF-000042 ist bezahlt.')
        expect(wrapper.text()).toContain('Alle als gelesen markieren')
    })

    it('says so when there is nothing yet', async () => {
        answer({ unread: 0, items: [] })
        const wrapper = mountBell(0)

        await openBell(wrapper)

        expect(wrapper.text()).toContain('Noch nichts.')
        expect(wrapper.find('[role="status"]').text()).toBe('Noch keine Benachrichtigungen.')
    })

    it('says so when the list could not be loaded, and tries again', async () => {
        answer({}, 500)
        const wrapper = mountBell(2)

        await openBell(wrapper)

        expect(wrapper.text()).toContain('konnten nicht geladen werden')

        answer({ unread: 2, items: [alert()] })
        await wrapper.findAll('button').find((b) => b.text() === 'Erneut versuchen')?.trigger('click')
        await flushPromises()

        expect(wrapper.findAll('.adm-bellitem')).toHaveLength(1)
    })

    it('says that the session has ended rather than offering to try again forever (BELL-16)', async () => {
        answer({}, 401)
        const wrapper = mountBell(2)

        await openBell(wrapper)

        expect(wrapper.text()).toContain('Deine Anmeldung ist abgelaufen.')
        expect(wrapper.find('a[href="/admin/anmelden"]').text()).toBe('Neu anmelden')
        expect(wrapper.text()).not.toContain('Erneut versuchen')
    })

    it('marks an unread alert read and, where it has a page, then opens it as its own visit', async () => {
        answer({ unread: 2, items: [alert({ href: null }), alert({ id: 'x', href: '/admin/gutachten' })] })
        const wrapper = mountBell(2)

        await openBell(wrapper)
        const rows = wrapper.findAll('.adm-bellitem')

        await rows[0]?.trigger('click')
        expect(post).toHaveBeenLastCalledWith('/admin/benachrichtigungen/9b1f0c2e-0000-4000-8000-000000000001/gelesen', { bleiben: true }, expect.objectContaining({ preserveState: true }))
        optionsOf(post.mock.calls.at(-1)).onSuccess?.()
        expect(visit).not.toHaveBeenCalled()

        await rows[1]?.trigger('click')
        optionsOf(post.mock.calls.at(-1)).onSuccess?.()
        expect(visit).toHaveBeenCalledWith('/admin/gutachten')
    })

    it('leads a read alert to its page, or to the centre — never a request that changes nothing (BELL-07)', async () => {
        answer({ unread: 0, items: [alert({ read: true, href: null }), alert({ id: 'y', read: true, href: '/admin/gutachten' })] })
        const wrapper = mountBell(0)

        await openBell(wrapper)
        const rows = wrapper.findAll('.adm-bellitem')

        await rows[0]?.trigger('click')
        expect(visit).toHaveBeenLastCalledWith('/admin/benachrichtigungen')
        await rows[1]?.trigger('click')
        expect(visit).toHaveBeenLastCalledWith('/admin/gutachten')
        expect(post).not.toHaveBeenCalled()
    })

    it('marks all read from the menu once the list is loaded', async () => {
        answer({ unread: 2, items: [alert()] })
        const wrapper = mountBell(2)

        await openBell(wrapper)
        await wrapper.findAll('button').find((b) => b.text() === 'Alle als gelesen markieren')?.trigger('click')

        expect(post).toHaveBeenCalledWith('/admin/benachrichtigungen/gelesen', {}, expect.objectContaining({ preserveState: true }))
    })

    it('draws no bell for a role that can receive nothing, unless something already sits in it', () => {
        expect(mountBell(0, false).find('.adm-bell').exists()).toBe(false)
        expect(mountBell(2, false).find('.adm-bell').exists()).toBe(true)
    })

    it('always leads to the page with all of them', () => {
        expect(mountBell(0).find('a[href="/admin/benachrichtigungen"]').text()).toBe('Alle Benachrichtigungen')
    })
})
