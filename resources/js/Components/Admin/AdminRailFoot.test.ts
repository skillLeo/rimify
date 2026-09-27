import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'

/*
 * The rail's foot: the shop's health only when something is wrong, as one quiet line — dot, short
 * label, count — (a link only for a role that may open System), polled every minute; „Neu“ with exactly the server's quick actions; the account as a monogram with
 * its menu — Profil, Benachrichtigungen, Tastenkürzel, and Abmelden last, sent once.
 */

const current: { props: Record<string, unknown>; url: string } = { props: {}, url: '/admin' }
const post = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    router: { post: (...a: unknown[]) => post(...a), on: vi.fn(() => () => undefined) },
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

vi.mock('reka-ui', () => {
    const pass = defineComponent({ setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()) })
    const child = defineComponent({ props: { asChild: Boolean }, setup: (_, { slots }) => () => slots.default?.() })

    return {
        DropdownMenuRoot: pass,
        DropdownMenuTrigger: defineComponent({ setup: (_, { slots, attrs }) => () => h('button', { type: 'button', ...attrs }, slots.default?.()) }),
        DropdownMenuPortal: pass,
        DropdownMenuContent: pass,
        DropdownMenuLabel: pass,
        DropdownMenuSeparator: defineComponent({ setup: () => () => h('hr') }),
        DropdownMenuItem: defineComponent({
            props: { asChild: Boolean, disabled: Boolean },
            emits: ['select'],
            setup: (props, { slots, attrs, emit }) => () =>
                props.asChild ? slots.default?.() : h('button', { type: 'button', ...attrs, onClick: (e: Event) => emit('select', e) }, slots.default?.()),
        }),
        TooltipRoot: pass,
        TooltipTrigger: child,
        TooltipPortal: defineComponent({ setup: () => () => null }),
        TooltipContent: pass,
    }
})

const { default: AdminRailFoot } = await import('./AdminRailFoot.vue')
const { provideAdminShell } = await import('../../composables/admin/useAdmin')
const { resetHealth, snoozeBanner } = await import('../../composables/admin/useHealth')

let mounted: VueWrapper[] = []
const shortcuts = ref(false)
const palette = ref(false)

function mountFoot(admin: Record<string, unknown> = {}): VueWrapper {
    current.props = {
        admin: {
            account: { name: 'Sabine Roth', email: 'sabine@example.test', role: 'Super-Admin' },
            health: { state: 'ok', sentence: 'Alles in Ordnung', label: '', count: null, href: '/admin/system', banner: null },
            quickActions: [{ key: 'ratgeber', label: 'Ratgeber-Artikel anlegen', href: '/admin/seiten?neu=1', icon: 'text' }],
            ...admin,
        },
    }

    const wrapper = mount(
        defineComponent({
            setup() {
                provideAdminShell({ paletteOpen: palette, shortcutsOpen: shortcuts, railCollapsed: ref(false), toggleRail: () => undefined })

                return () => h(AdminRailFoot, { collapsed: false })
            },
        })
    )
    mounted.push(wrapper)

    return wrapper
}

beforeEach(() => {
    post.mockReset()
    resetHealth()
    shortcuts.value = false
    palette.value = false
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('AdminRailFoot', () => {
    it('shows nothing while all is well: an empty foot is the healthy state', () => {
        const foot = mountFoot()

        expect(foot.find('.adm-foot__health').exists()).toBe(false)
        expect(foot.text()).not.toContain('Alles in Ordnung')
        expect(foot.find('[role="status"]').text()).toBe('')
    })

    it('says a problem in one quiet line — dot, short label, count — and opens System for a role that may', () => {
        const warn = { state: 'warn', sentence: 'Warteschlange steht seit 12 Stunden', label: 'Warteschlange stockt', count: '12 Std', href: '/admin/system', banner: null }
        const row = mountFoot({ health: warn }).find('a.adm-foot__health')

        expect(row.attributes('href')).toBe('/admin/system')
        expect(row.attributes('aria-label')).toBe('Warteschlange steht seit 12 Stunden')
        expect(row.find('.adm-foot__label').text()).toBe('Warteschlange stockt')
        expect(row.find('.adm-foot__count').text()).toBe('· 12 Std')
        // The dot and the count carry the colour; the words stay the rail's grey.
        expect(row.find('.adm-health__dot--warn').exists()).toBe(true)
        expect(row.find('.adm-foot__count--warn').exists()).toBe(true)
        expect(row.classes().some((c) => c.startsWith('adm-foot__health--'))).toBe(false)
        // Not dismissible: a problem hidden is a dead queue nobody noticed.
        expect(row.find('button').exists()).toBe(false)

        const plain = mountFoot({ health: { ...warn, href: null } })
        expect(plain.find('a.adm-foot__health').exists()).toBe(false)
        expect(plain.find('p.adm-foot__health').exists()).toBe(true)
        expect(plain.find('[role="status"]').text()).toBe('Warteschlange steht seit 12 Stunden')
    })

    it('stays away while the banner says the same, and comes back once it is put off', async () => {
        const queue = {
            state: 'warn',
            sentence: 'Warteschlange steht seit 2 Stunden',
            label: 'Warteschlange stockt',
            count: '2 Std',
            href: '/admin/system',
            banner: { key: 'queue', sentence: 'Die Warteschlange steht seit 2 Stunden.' },
        }
        const wrapper = mountFoot({ health: queue })

        // The banner is the interrupt; the rail's line would only say it a second time.
        expect(wrapper.find('.adm-foot__health').exists()).toBe(false)

        // „Später erinnern“ on the banner: the ambient reminder is back.
        snoozeBanner('queue')
        await flushPromises()
        expect(wrapper.find('.adm-foot__label').text()).toBe('Warteschlange stockt')
    })

    it('asks again every minute and shows the new line', async () => {
        vi.useFakeTimers()
        vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ state: 'bad', sentence: 'Shop im Wartungsmodus', label: 'Wartungsmodus', count: null }) })))
        const wrapper = mountFoot()

        await vi.advanceTimersByTimeAsync(60_000)
        await flushPromises()

        expect(fetch).toHaveBeenCalledWith('/admin/system/puls', expect.anything())
        expect(wrapper.find('.adm-foot__label').text()).toBe('Wartungsmodus')
        expect(wrapper.find('.adm-health__dot--bad').exists()).toBe(true)
    })

    it('offers under „Neu“ exactly what the server allows, and no button when it allows nothing', () => {
        const links = mountFoot().findAll('.adm-foot__actions a')
        expect(links.map((a) => a.attributes('href'))).toEqual(['/admin/seiten?neu=1'])

        expect(mountFoot({ quickActions: [] }).find('.adm-foot__new').exists()).toBe(false)
    })

    it('opens the palette from its shortcut hint', async () => {
        await mountFoot().find('.adm-foot__kbd').trigger('click')

        expect(palette.value).toBe(true)
    })

    it('shows the account as a monogram with name and role', () => {
        const profile = mountFoot().find('.adm-foot__profile')

        expect(profile.find('.adm-avatar').text()).toBe('SR')
        expect(profile.text()).toContain('Sabine Roth')
        expect(profile.text()).toContain('Super-Admin')
        expect(profile.attributes('aria-label')).toBe('Konto: Sabine Roth, Super-Admin')
    })

    it('shows the whole name in the rail’s own tooltip only once it is cut — never a native title', async () => {
        const wrapper = mountFoot()
        const profile = wrapper.find('.adm-foot__profile')
        // The tooltip's root around the menu (AdminMenuTip), the one element here that takes `disabled`.
        const tooltip = profile.element.closest('div[disabled]') as HTMLElement

        expect(wrapper.findAll('[title]')).toHaveLength(0)
        expect(tooltip.getAttribute('disabled')).toBe('true')

        // A narrow rail: the name ends in „…“.
        const name = profile.find('.adm-foot__name').element
        Object.defineProperty(name, 'scrollWidth', { value: 180, configurable: true })
        Object.defineProperty(name, 'clientWidth', { value: 120, configurable: true })
        await profile.trigger('pointerenter')

        expect(tooltip.getAttribute('disabled')).toBe('false')
    })

    it('offers the profile, the notifications, the shortcuts and — last, in red — the way out', async () => {
        const wrapper = mountFoot()
        const menu = wrapper.find('.adm-foot__menu')

        expect(menu.findAll('a').map((a) => a.attributes('href'))).toEqual(['/admin/profil', '/admin/benachrichtigungen', '/admin/profil#passwort'])

        await menu.findAll('button').find((b) => b.text() === 'Tastenkürzel')?.trigger('click')
        expect(shortcuts.value).toBe(true)

        const out = menu.find('.adm-menu__item--danger')
        expect(out.text()).toBe('Abmelden')
        await out.trigger('click')
        await out.trigger('click')
        expect(post).toHaveBeenCalledTimes(1)
        expect(post).toHaveBeenCalledWith('/admin/abmelden', {}, expect.anything())
    })

    it('draws no account row without an account', () => {
        expect(mountFoot({ account: null }).find('.adm-foot__profile').exists()).toBe(false)
    })
})
