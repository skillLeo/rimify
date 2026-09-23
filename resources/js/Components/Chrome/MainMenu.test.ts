import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { NavItem } from '../../types/rimify'

/*
 * The phone's navigation lives in the header's corner (it replaced the bottom bar). What matters
 * here: every destination the admin maintains is in it, the basket carries its count, and the page
 * you are on is marked rather than dropped.
 */

const current: { props: Record<string, unknown> } = { props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    router: { on: vi.fn(() => () => undefined) },
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

// The dropdown's own behaviour belongs to reka-ui; here the content renders open so the items can
// be read. The trigger keeps its real markup, because the badge on it is ours.
vi.mock('reka-ui', () => ({
    DropdownMenuRoot: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }),
    DropdownMenuTrigger: defineComponent({
        setup: (_, { slots, attrs }) => () => h('button', { type: 'button', ...attrs }, slots.default?.()),
    }),
    DropdownMenuPortal: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }),
    DropdownMenuContent: defineComponent({
        setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()),
    }),
    DropdownMenuItem: defineComponent({ setup: (_, { slots }) => () => slots.default?.() }),
}))

const { default: MainMenu } = await import('./MainMenu.vue')

function item(label: string, href: string, routeName: string | null, icon: string | null): NavItem {
    return { label, href, routeName, behaviour: null, icon }
}

const PHONE: NavItem[] = [
    item('Start', '/', 'startseite', 'home'),
    item('Felgen', '/felgen', 'felgen.index', 'wheel'),
    item('Check', '/rimify-check', 'check.index', 'check-circle'),
    item('Kontakt', '/kontakt', 'kontakt', 'mail'),
    item('Warenkorb', '/warenkorb', 'warenkorb.index', 'cart'),
]

const HEADER: NavItem[] = [
    item('Felgen', '/felgen', 'felgen.index', 'wheel'),
    item('FAQ', '/faq', 'faq', 'info'),
]

function mountMenu(options: { cartCount?: number; routeName?: string; phone?: NavItem[]; header?: NavItem[] } = {}): VueWrapper {
    current.props = {
        cartCount: options.cartCount ?? 0,
        routeName: options.routeName ?? 'startseite',
        menus: {
            header: options.header ?? HEADER,
            footer_pages: [],
            footer_legal: [],
            mobile_bottom: options.phone ?? PHONE,
        },
    }
    const wrapper = mount(MainMenu)
    mounted.push(wrapper)

    return wrapper
}

let mounted: VueWrapper[] = []

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('MainMenu', () => {
    it('lists the phone destinations in the admin’s order, then what only the header menu has', () => {
        const wrapper = mountMenu()

        expect(wrapper.findAll('a').map((a) => a.text().replace(/\s+/g, ' ').trim())).toEqual([
            'Start',
            'Felgen',
            'Check',
            'Kontakt',
            'Warenkorb',
            'FAQ',
        ])
        expect(wrapper.findAll('a').map((a) => a.attributes('href'))).toEqual([
            '/',
            '/felgen',
            '/rimify-check',
            '/kontakt',
            '/warenkorb',
            '/faq',
        ])
    })

    it('marks the page you are on instead of hiding it', () => {
        const wrapper = mountMenu({ routeName: 'felgen.index' })
        const marked = wrapper.findAll('a').filter((a) => a.attributes('aria-current') === 'page')

        expect(marked).toHaveLength(1)
        expect(marked[0]?.attributes('href')).toBe('/felgen')
    })

    it('carries the basket count on its row and on the button, and neither when the basket is empty', () => {
        const empty = mountMenu({ cartCount: 0 })
        expect(empty.find('.mainmenu__count').exists()).toBe(false)
        expect(empty.find('.mainmenu__badge').exists()).toBe(false)
        expect(empty.find('button').attributes('aria-label')).toBe('Menü')

        const full = mountMenu({ cartCount: 3 })
        expect(full.find('.mainmenu__count').text()).toBe('3')
        // The badge is decoration; the button's name is what a screen reader hears.
        expect(full.find('.mainmenu__badge').attributes('aria-hidden')).toBe('true')
        expect(full.find('button').attributes('aria-label')).toBe('Menü, 3 Artikel im Warenkorb')
    })

    it('gives every row an icon', () => {
        expect(mountMenu().findAll('a svg')).toHaveLength(6)
    })

    it('falls back to a neutral icon for an item the admin gave none', () => {
        const wrapper = mountMenu({ phone: [item('Ratgeber', '/ratgeber', 'ratgeber.index', null)], header: [] })

        expect(wrapper.findAll('a')).toHaveLength(1)
        expect(wrapper.find('a svg').exists()).toBe(true)
    })
})
