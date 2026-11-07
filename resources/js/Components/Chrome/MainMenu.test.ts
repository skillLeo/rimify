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
    // As-child hands its slot on; otherwise an item of its own, pressed as reka-ui presses it: `select`, with a closing the handler can prevent.
    DropdownMenuItem: defineComponent({
        props: { asChild: Boolean },
        emits: ['select'],
        setup: (props, { slots, attrs, emit }) => () =>
            props.asChild
                ? slots.default?.()
                : h('div', { role: 'menuitem', ...attrs, onClick: () => emit('select', new Event('select', { cancelable: true })) }, slots.default?.()),
    }),
    DropdownMenuGroup: defineComponent({ setup: (_, { slots }) => () => h('div', { role: 'group' }, slots.default?.()) }),
    DropdownMenuLabel: defineComponent({ setup: (_, { slots, attrs }) => () => h('p', attrs, slots.default?.()) }),
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

const MEGA = {
    brands: [{ label: 'Borbet', href: '/felgen?marke=Borbet' }],
    sizes: [{ label: '18 Zoll', href: '/felgen?zoll=18', count: 6 }, { label: '19 Zoll', href: '/felgen?zoll=19', count: 1 }],
    makes: [{ label: 'BMW', href: '/felgen-suchen?marke=BMW' }],
    popular: [{ label: 'DB8GT2', sub: 'Borbet', href: '/felgen/borbet-db8gt2' }],
}

function mountMenu(options: { cartCount?: number; routeName?: string; phone?: NavItem[]; header?: NavItem[]; mega?: unknown } = {}): VueWrapper {
    current.props = {
        mega: options.mega,
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
    it('opens „Felgen“ in place on the desktop\u2019s groups, and leaves the page where it is', async () => {
        const wrapper = mountMenu({ mega: MEGA })
        const felgen = wrapper.get('[role="menuitem"][aria-expanded]')

        expect(felgen.text()).toBe('Felgen')
        expect(felgen.attributes('aria-expanded')).toBe('false')
        // No link any more: a press on it never goes to the listing.
        expect(wrapper.findAll('a').map((a) => a.attributes('href'))).not.toContain('/felgen')
        expect(wrapper.text()).not.toContain('Nach Marke')

        await felgen.trigger('click')

        expect(felgen.attributes('aria-expanded')).toBe('true')
        expect(wrapper.findAll('.mainmenu__group').map((g) => g.text())).toEqual(['Nach Marke', 'Nach Größe', 'Nach Fahrzeug', 'Günstigste Modelle'])
        expect(wrapper.findAll('.mainmenu__row').map((a) => a.attributes('href'))).toEqual([
            '/felgen',
            '/felgen?marke=Borbet',
            '/felgen?zoll=18',
            '/felgen?zoll=19',
            '/felgen-suchen?marke=BMW',
            '/felgen/borbet-db8gt2',
        ])
        // As the desktop writes them: one model, several models, and the maker beside a model.
        expect(wrapper.findAll('.mainmenu__row .small').map((note) => note.text())).toEqual(['6 Modelle', '1 Modell', 'Borbet'])
        expect(wrapper.findAll('.mainmenu__row').at(0)?.text()).toBe('Alle Felgen ansehen')

        await felgen.trigger('click')

        expect(felgen.attributes('aria-expanded')).toBe('false')
        expect(wrapper.text()).not.toContain('Nach Marke')
    })

    it('leaves out a group with nothing in it', async () => {
        const wrapper = mountMenu({ mega: { ...MEGA, makes: [] } })

        await wrapper.get('[role="menuitem"][aria-expanded]').trigger('click')

        expect(wrapper.findAll('.mainmenu__group').map((g) => g.text())).toEqual(['Nach Marke', 'Nach Größe', 'Günstigste Modelle'])
    })

    it('keeps „Felgen“ the plain link where the catalogue has nothing to group', () => {
        const wrapper = mountMenu({ mega: { brands: [], sizes: [], makes: [], popular: [] } })

        expect(wrapper.find('[role="menuitem"][aria-expanded]').exists()).toBe(false)
        expect(wrapper.findAll('a').map((a) => a.attributes('href'))).toContain('/felgen')
    })

    it('marks „Felgen“ as the page you are on, closed or open', () => {
        const wrapper = mountMenu({ mega: MEGA, routeName: 'felgen.index' })

        expect(wrapper.get('[role="menuitem"][aria-expanded]').attributes('aria-current')).toBe('page')
    })

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

    it('leaves the count to the basket button where one stands beside it (#13): the header says it once', () => {
        current.props = { cartCount: 3, routeName: 'startseite', menus: { header: HEADER, footer_pages: [], footer_legal: [], mobile_bottom: PHONE } }
        const wrapper = mount(MainMenu, { props: { countOnButton: false } })
        mounted.push(wrapper)

        expect(wrapper.find('.mainmenu__badge').exists()).toBe(false)
        expect(wrapper.find('button').attributes('aria-label')).toBe('Menü')
        // Inside the menu the basket row still says how many.
        expect(wrapper.find('.mainmenu__count').text()).toBe('3')
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
