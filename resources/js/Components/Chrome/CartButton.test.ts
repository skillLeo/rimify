import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { provideShell } from '../../composables/useShell'

/*
 * The client's #13 (D-122): the basket in the phone header, left of the menu, with its count. Since his #35 (29.10.2026,
 * D-349) the phone has one header on every page — the shop's own — and the basket stands on the basket and the checkout
 * too, so no icon moves from one page to the next.
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

function header(): VueWrapper {
    const wrapper = mount(defineComponent({ setup: () => { provideShell(); return () => h(SiteHeader) } }), { global: { stubs: { ...MENU, MegaMenu: true, SearchBox: true, VehicleBar: true } } })
    mounted.push(wrapper)

    return wrapper
}

describe('the basket in the phone header', () => {
    it('stands left of the menu, its count in its name', () => {
        current.url = '/'
        current.props = props(3)
        const cart = header().find('a.cart-btn')

        expect(cart.attributes('aria-label')).toBe('Warenkorb, 3 Artikel')
        expect(cart.find('.cart-btn__n').text()).toBe('3')
        expect(cart.element.nextElementSibling?.classList.contains('menu-stub')).toBe(true)
    })

    it('shows no count while the basket is empty', () => {
        current.url = '/felgen'
        current.props = props(0)
        const cart = header().find('a.cart-btn')

        expect(cart.attributes('aria-label')).toBe('Warenkorb')
        expect(cart.find('.cart-btn__n').exists()).toBe(false)
    })

    it('stands on the basket and the checkout too, so no icon moves between pages (#35)', () => {
        current.props = props(2)

        for (const url of ['/warenkorb', '/kasse', '/kasse?schritt=2']) {
            current.url = url
            const cart = header().find('a.cart-btn')
            expect(cart.exists(), url).toBe(true)
            expect(cart.element.nextElementSibling?.classList.contains('menu-stub')).toBe(true)
        }
    })
})
