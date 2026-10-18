import { mount, type VueWrapper } from '@vue/test-utils'
import { renderToString } from '@vue/server-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import type { AdminNavGroup } from '../../types/admin'

/*
 * The rail's items get their tooltips from hydration on (D-272): the server renders the items alone — a tooltip there
 * could not open, and reka's ten components per item were most of an admin page's render — and the browser draws each
 * item inside its tooltip once mounted. The toggle keeps its tooltip throughout.
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

// A tooltip root leaves a mark, so the test can count them; the rest passes its content through.
const passthrough = defineComponent({ setup: (_, { slots }) => () => slots.default?.() })

vi.mock('reka-ui', () => ({
    TooltipProvider: passthrough,
    TooltipRoot: defineComponent({ setup: (_, { slots }) => () => h('span', { 'data-tooltip': '' }, slots.default?.()) }),
    TooltipTrigger: passthrough,
    TooltipPortal: defineComponent({ setup: () => () => null }),
    TooltipContent: passthrough,
}))

const { default: AdminRail } = await import('./AdminRail.vue')
const { provideAdminShell } = await import('../../composables/admin/useAdmin')

const NAV: AdminNavGroup[] = [
    { key: 'uebersicht', label: 'Übersicht', short: 'Übersicht', icon: 'overview', pages: [{ label: 'Übersicht', href: '/admin', icon: 'overview', count: null, countTone: 'neutral' }] },
    {
        key: 'gutachten',
        label: 'Gutachten',
        short: 'Gutachten',
        icon: 'documents',
        pages: [
            { label: 'Dokumente', href: '/admin/gutachten', icon: 'documents', count: null, countTone: 'neutral' },
            { label: 'Benachrichtigungswünsche', href: '/admin/benachrichtigungen', icon: 'inquiries', count: 140, countTone: 'neutral' },
        ],
    },
]

const Shell = defineComponent({
    setup() {
        provideAdminShell({ paletteOpen: ref(false), shortcutsOpen: ref(false), railCollapsed: ref(true), toggleRail: () => undefined })

        return () => h(AdminRail)
    },
})

let mounted: VueWrapper[] = []

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('AdminRail tooltips', () => {
    current.props = { admin: { nav: NAV, environment: null, preferences: { railCollapsed: true } } }

    it('renders the items on the server without their tooltips — the toggle keeps its own', async () => {
        const html = await renderToString(createSSRApp(Shell))

        expect(html.match(/class="adm-rail__item"/g)).toHaveLength(3)
        // The server writes an empty attribute as its bare name.
        expect(html.match(/<span data-tooltip>/g)).toHaveLength(1)
        expect(html).toContain('adm-rail__toggle')
    })

    it('draws the items without their tooltips through hydration, and inside them once the browser is idle', async () => {
        const wrapper = mount(Shell)
        mounted.push(wrapper)
        await nextTick()

        // Mounted, not yet idle: the toggle's tooltip only (D-276).
        expect(wrapper.findAll('[data-tooltip]')).toHaveLength(1)

        // jsdom has no requestIdleCallback: the composable falls back to the next timer turn.
        await new Promise((resolve) => setTimeout(resolve, 5))
        await nextTick()

        expect(wrapper.findAll('[data-tooltip]')).toHaveLength(4)
        expect(wrapper.findAll('[data-tooltip] > .adm-rail__item').map((a) => a.attributes('href'))).toEqual(['/admin', '/admin/gutachten', '/admin/benachrichtigungen'])
        expect(wrapper.find('[data-tooltip] > .adm-rail__item[href="/admin/benachrichtigungen"]').attributes('aria-label')).toBe('Benachrichtigungswünsche, 140 offen')
    })
})
