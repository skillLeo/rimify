import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import type { AdminNavGroup } from '../../types/admin'

/*
 * The rail draws the server's tree and nothing else. What matters here: a group of one page is
 * that page, the page you are on is marked, a count says itself only when it is not zero, and a
 * broken thing is the only thing in the failure colour.
 */

const current: { props: Record<string, unknown>; url: string } = { props: {}, url: '/admin' }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    router: { on: vi.fn(() => () => undefined) },
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

// Tooltips are reka-ui's behaviour; the trigger renders its child, the content is left out.
const passthrough = defineComponent({ setup: (_, { slots }) => () => slots.default?.() })

vi.mock('reka-ui', () => ({
    TooltipProvider: passthrough,
    TooltipRoot: passthrough,
    TooltipTrigger: passthrough,
    TooltipPortal: defineComponent({ setup: () => () => null }),
    TooltipContent: passthrough,
}))

const { default: AdminRail } = await import('./AdminRail.vue')
const { provideAdminShell } = await import('../../composables/admin/useAdmin')

const NAV: AdminNavGroup[] = [
    { key: 'uebersicht', label: 'Übersicht', icon: 'overview', pages: [{ label: 'Übersicht', href: '/admin', icon: 'overview', count: null, countTone: 'neutral' }] },
    {
        key: 'gutachten',
        label: 'Gutachten',
        icon: 'documents',
        pages: [
            { label: 'Dokumente', href: '/admin/gutachten', icon: 'documents', count: null, countTone: 'neutral' },
            { label: 'Benachrichtigungswünsche', href: '/admin/benachrichtigungen', icon: 'inquiries', count: 140, countTone: 'neutral' },
        ],
    },
    { key: 'system', label: 'System', icon: 'prices', pages: [{ label: 'Warteschlange', href: '/admin/warteschlange', icon: 'sort', count: 3, countTone: 'bad' }] },
]

let mounted: VueWrapper[] = []

function mountRail(url = '/admin', collapsed = false): { wrapper: VueWrapper; toggle: ReturnType<typeof vi.fn> } {
    current.url = url
    current.props = { admin: { nav: NAV, environment: null, preferences: { railCollapsed: collapsed } } }
    const toggle = vi.fn()

    const wrapper = mount(
        defineComponent({
            setup() {
                provideAdminShell({ paletteOpen: ref(false), shortcutsOpen: ref(false), railCollapsed: ref(collapsed), toggleRail: toggle })

                return () => h(AdminRail)
            },
        })
    )
    mounted.push(wrapper)

    return { wrapper, toggle }
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('AdminRail', () => {
    it('labels groups, but not a group whose only page has the same name', () => {
        const { wrapper } = mountRail()

        expect(wrapper.findAll('.adm-rail__label').map((l) => l.text())).toEqual(['Gutachten', 'System'])
    })

    it('marks the page you are on, and ignores the query string doing it', () => {
        const { wrapper } = mountRail('/admin/gutachten?status=offen')
        const marked = wrapper.findAll('.adm-rail__item').filter((a) => a.attributes('aria-current') === 'page')

        expect(marked).toHaveLength(1)
        expect(marked[0]?.attributes('href')).toBe('/admin/gutachten')
    })

    it('shows a count only where there is one, caps it, and names it for a screen reader', () => {
        const { wrapper } = mountRail()
        const items = wrapper.findAll('.adm-rail__item')

        expect(items[0]?.find('.adm-rail__count').exists()).toBe(false)
        expect(items[2]?.find('.adm-rail__count').text()).toBe('99+')
        expect(items[2]?.attributes('aria-label')).toBe('Benachrichtigungswünsche, 140 offen')
    })

    it('uses the failure colour for failures only', () => {
        const { wrapper } = mountRail()

        expect(wrapper.findAll('.adm-rail__count--bad').map((c) => c.text())).toEqual(['3'])
        expect(wrapper.findAll('.adm-rail__item').at(-1)?.attributes('aria-label')).toBe('Warteschlange, 3 fehlgeschlagen')
    })

    it('says which way the toggle goes, and hands the choice to the shell', async () => {
        const open = mountRail()
        const button = open.wrapper.find('.adm-rail__toggle')

        expect(button.attributes('aria-expanded')).toBe('true')
        expect(button.attributes('aria-label')).toBe('Navigation einklappen')

        await button.trigger('click')
        expect(open.toggle).toHaveBeenCalledOnce()

        const closed = mountRail('/admin', true)
        expect(closed.wrapper.find('.adm-rail__toggle').attributes('aria-label')).toBe('Navigation ausklappen')
    })
})
