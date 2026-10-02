import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { provideMobileShell } from '../../composables/mobile/useMobileShell'
import { provideShell } from '../../composables/useShell'

/*
 * The client's #13 (D-122): the basket in the phone header, left of the menu, with its count — in the phone layout's
 * app bar and in the site header's phone row alike; not on the basket and the checkout themselves.
 */

const current: { url: string; props: Record<string, unknown> } = { url: '/', props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    router: { delete: vi.fn(), on: vi.fn(() => () => undefined) },
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

const { default: SiteHeader } = await import('./SiteHeader.vue')
const { default: AppBar } = await import('../Mobile/AppBar.vue')

const MENU = { MainMenu: defineComponent({ setup: () => () => h('button', { class: 'menu-stub', type: 'button' }, 'Menü') }) }

function props(cartCount: number): Record<string, unknown> {
    return {
        contact: { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: '' },
        vehicle: null,
        cartCount,
        menus: {},
        mega: { brands: [], sizes: [], makes: [], popular: [] },
    }
}

let mounted: VueWrapper[] = []

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

function appBar(): VueWrapper {
    const wrapper = mount(defineComponent({ setup: () => { provideMobileShell(); return () => h(AppBar, { top: true }) } }), { global: { stubs: MENU } })
    mounted.push(wrapper)

    return wrapper
}

describe('the basket in the phone header', () => {
    it('stands left of the menu in the app bar, its count in its name', () => {
        current.url = '/'
        current.props = props(3)
        const tools = appBar().find('.mbar__tools')
        const children = [...tools.element.children]
        const cart = tools.find('a[href="/warenkorb"]')

        expect(cart.attributes('aria-label')).toBe('Warenkorb, 3 Artikel')
        expect(cart.find('.cart-btn__n').text()).toBe('3')
        expect(children.indexOf(cart.element)).toBe(children.length - 2)
        expect(children.at(-1)?.classList.contains('menu-stub')).toBe(true)
    })

    it('stands left of the menu in the site header’s phone row too, and shows no count while the basket is empty', () => {
        current.url = '/felgen'
        current.props = props(0)
        const wrapper = mount(defineComponent({ setup: () => { provideShell(); return () => h(SiteHeader) } }), { global: { stubs: { ...MENU, MegaMenu: true, SearchBox: true, VehicleBar: true } } })
        mounted.push(wrapper)
        const cart = wrapper.find('a.cart-btn')

        expect(cart.attributes('aria-label')).toBe('Warenkorb')
        expect(cart.find('.cart-btn__n').exists()).toBe(false)
        expect(cart.element.nextElementSibling?.classList.contains('menu-stub')).toBe(true)
    })

    it('is not shown on the basket and the checkout themselves', () => {
        current.props = props(2)

        for (const url of ['/warenkorb', '/kasse', '/kasse?schritt=2']) {
            current.url = url
            expect(appBar().find('a[href="/warenkorb"]').exists()).toBe(false)
        }
    })
})
