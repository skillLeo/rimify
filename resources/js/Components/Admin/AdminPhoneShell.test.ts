import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref, type Ref } from 'vue'
import type { AdminNavGroup } from '../../types/admin'

/*
 * The phone shell: always five tabs, the groups in the rail's order, counts that add up, and
 * everything else — with the account — one tap away in Mehr.
 */

const current: { props: Record<string, unknown>; url: string } = { props: {}, url: '/admin' }
const post = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    router: { post: (...a: unknown[]) => post(...a), visit: vi.fn(), prefetch: vi.fn(), on: vi.fn(() => () => undefined) },
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

// The sheet's mechanics (history, drag, focus) are BottomSheet's own; here it shows its content while open.
vi.mock('../Mobile/BottomSheet.vue', () => ({
    default: defineComponent({
        props: { open: Boolean, title: { type: String, default: '' }, id: { type: String, default: '' } },
        setup: (props, { slots }) => () => (props.open ? h('section', { 'data-sheet': props.id, 'aria-label': props.title }, slots.default?.()) : null),
    }),
}))

const { default: AdminBottomBar } = await import('./AdminBottomBar.vue')
const { default: AdminAppBar } = await import('./AdminAppBar.vue')
const { provideAdminShell } = await import('../../composables/admin/useAdmin')

const page = (label: string, href: string, count: number | null = null, countTone: 'neutral' | 'bad' = 'neutral') =>
    ({ label, href, icon: 'overview', count, countTone }) as const

const NAV: AdminNavGroup[] = [
    { key: 'uebersicht', label: 'Übersicht', short: 'Übersicht', icon: 'overview', pages: [page('Übersicht', '/admin')] },
    { key: 'katalog', label: 'Katalog', short: 'Katalog', icon: 'wheels', pages: [page('Wuchtgewichte-Farben', '/admin/wuchtgewichte'), page('RDKS-Sensorpreise', '/admin/rdks-preise')] },
    { key: 'gutachten', label: 'Gutachten', short: 'Gutachten', icon: 'documents', pages: [page('Dokumente', '/admin/gutachten', 60), page('Benachrichtigungswünsche', '/admin/benachrichtigungen', 45)] },
    { key: 'team', label: 'Team', short: 'Team', icon: 'users', pages: [page('Rollen & Rechte', '/admin/rollen')] },
    { key: 'system', label: 'System', short: 'System', icon: 'prices', pages: [page('Warteschlange', '/admin/warteschlange', 2, 'bad'), page('Protokoll', '/admin/protokoll')] },
]

let mounted: VueWrapper[] = []

function mountBar(url = '/admin'): { wrapper: VueWrapper; palette: Ref<boolean> } {
    current.url = url
    current.props = { admin: { nav: NAV, account: { name: 'Mara Keller', email: 'mara@example.test', role: 'Katalog' }, breadcrumbs: [] } }
    const palette = ref(false)

    const wrapper = mount(
        defineComponent({
            setup() {
                provideAdminShell({ paletteOpen: palette, shortcutsOpen: ref(false), railCollapsed: ref(false), toggleRail: () => undefined })

                return () => h(AdminBottomBar)
            },
        })
    )
    mounted.push(wrapper)

    return { wrapper, palette }
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    post.mockReset()
})

describe('AdminBottomBar', () => {
    it('has five tabs: Übersicht, the first two groups in the rail’s order, Suche and Mehr', () => {
        const { wrapper } = mountBar()
        const tabs = wrapper.findAll('.adm-tabbar__item')

        expect(tabs.map((t) => t.find('.adm-tabbar__label').text())).toEqual(['Übersicht', 'Katalog', 'Gutachten', 'Suche', 'Mehr'])
        expect(tabs[1]?.attributes('href')).toBe('/admin/wuchtgewichte')
    })

    it('marks the tab whose group you are in, and Mehr for a page only Mehr holds', () => {
        const katalog = mountBar('/admin/rdks-preise').wrapper
        expect(katalog.findAll('[aria-current="page"]').map((t) => t.text())).toEqual(['Katalog'])

        const team = mountBar('/admin/rollen').wrapper
        expect(team.findAll('[aria-current="page"]').map((t) => t.text())).toEqual(['Mehr'])
    })

    it('adds up a group’s queues on its tab, capped, and names them', () => {
        const tab = mountBar().wrapper.findAll('.adm-tabbar__item')[2]

        expect(tab?.find('.adm-tabbar__badge').text()).toBe('99+')
        expect(tab?.attributes('aria-label')).toBe('Gutachten, 105 offen')
    })

    it('opens the palette from Suche', async () => {
        const { wrapper, palette } = mountBar()

        await wrapper.findAll('.adm-tabbar__item')[3]?.trigger('click')
        expect(palette.value).toBe(true)
    })

    it('holds the other groups and the account in Mehr, a failure in red, a group of several one level down', async () => {
        const { wrapper } = mountBar()

        await wrapper.findAll('.adm-tabbar__item')[4]?.trigger('click')
        const sheet = wrapper.find('[data-sheet="admin-mehr"]')
        const titles = sheet.findAll('.mrow__title').map((t) => t.text())

        // Katalog and Gutachten have slots, but each slot opens only its first page: both stay here (D-365).
        expect(titles).toEqual(['Katalog', 'Gutachten', 'Rollen & Rechte', 'System', 'Profil', 'Benachrichtigungen', 'Passwort ändern', 'Abmelden'])
        expect(sheet.find('.mrow__sub').text()).toBe('Team')
        expect(sheet.find('.adm-more__name').text()).toBe('Mara Keller')
        expect(sheet.find('a[href="/admin/rollen"]').exists()).toBe(true)

        await sheet.findAll('.mrow').find((r) => r.text().includes('System'))?.trigger('click')
        const group = wrapper.find('[data-sheet="admin-mehr-gruppe"]')
        expect(group.findAll('.mrow__title').map((t) => t.text())).toEqual(['Warteschlange', 'Protokoll'])
    })

    // D-365: on the preview Verkauf's slot opened Bestellungen, and Verkauf › Nachrichten was reachable through Suche alone.
    it('reaches every page of a group from the bar or Mehr — a slot opens only the first', async () => {
        const { wrapper } = mountBar()
        const reached = new Set(wrapper.findAll('.adm-tabbar a').map((a) => a.attributes('href')))

        await wrapper.findAll('.adm-tabbar__item')[4]?.trigger('click')
        const sheet = wrapper.find('[data-sheet="admin-mehr"]')
        sheet.findAll('a').forEach((a) => reached.add(a.attributes('href')))

        for (const row of sheet.findAll('.mrow').filter((r) => r.find('a').exists() === false)) {
            await row.trigger('click')
            wrapper.find('[data-sheet="admin-mehr-gruppe"]').findAll('a').forEach((a) => reached.add(a.attributes('href')))
        }

        const missing = NAV.flatMap((g) => g.pages.map((p) => p.href)).filter((href) => !reached.has(href))
        expect(missing).toEqual([])
    })

    it('signs out from Mehr with one post', async () => {
        const { wrapper } = mountBar()

        await wrapper.findAll('.adm-tabbar__item')[4]?.trigger('click')
        const out = wrapper.findAll('.mrow').find((r) => r.text().includes('Abmelden'))
        await out?.trigger('click')
        await out?.trigger('click')

        expect(post).toHaveBeenCalledOnce()
        expect(post.mock.calls[0]?.[0]).toBe('/admin/abmelden')
    })
})

describe('AdminAppBar', () => {
    it('carries the wordmark, the page title for when the heading scrolls away, and the environment', () => {
        current.props = { admin: { environment: 'staging', breadcrumbs: [{ label: 'Gutachten', href: null }, { label: 'Dokumente', href: null }] } }
        const wrapper = mount(AdminAppBar)
        mounted.push(wrapper)

        expect(wrapper.find('.adm-appbar__brand').attributes('href')).toBe('/admin')
        expect(wrapper.find('.adm-appbar__title').text()).toBe('Dokumente')
        expect(wrapper.find('.adm-appbar__title').attributes('aria-hidden')).toBe('true')
        // "Umgebung:" is read out but not shown; a span may not carry an aria-label of its own.
        expect(wrapper.find('.adm-env').text()).toBe('Umgebung: Vorschau')
        expect(wrapper.find('.adm-env .visually-hidden').text()).toBe('Umgebung:')
    })
})
