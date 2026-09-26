import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

/*
 * The account menu: who you are, your profile, your password, the way out — and nothing that leads
 * nowhere. Signing out is a post, and a second click while it is in flight does not send another.
 */

const current: { props: Record<string, unknown>; url: string } = { props: {}, url: '/admin' }
const post = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    router: { on: vi.fn(() => () => undefined), post: (...args: unknown[]) => post(...args) },
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

// The menu renders open so its rows can be read; an item is its child, or a button that selects.
vi.mock('reka-ui', () => ({
    DropdownMenuRoot: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }),
    DropdownMenuTrigger: defineComponent({
        setup: (_, { slots, attrs }) => () => h('button', { type: 'button', ...attrs }, slots.default?.()),
    }),
    DropdownMenuPortal: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }),
    DropdownMenuContent: defineComponent({ setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()) }),
    DropdownMenuSeparator: defineComponent({ setup: () => () => h('hr') }),
    DropdownMenuItem: defineComponent({
        props: { asChild: Boolean, disabled: Boolean },
        emits: ['select'],
        setup: (props, { slots, attrs, emit }) => () =>
            props.asChild
                ? slots.default?.()
                : h('button', { type: 'button', ...attrs, disabled: props.disabled, onClick: (e: Event) => emit('select', e) }, slots.default?.()),
    }),
}))

const { default: AdminUserMenu } = await import('./AdminUserMenu.vue')

let mounted: VueWrapper[] = []

function mountMenu(account: Record<string, unknown> | null): VueWrapper {
    current.props = { admin: { account } }
    const wrapper = mount(AdminUserMenu)
    mounted.push(wrapper)

    return wrapper
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    post.mockReset()
})

describe('AdminUserMenu', () => {
    it('names the account and its role', () => {
        const wrapper = mountMenu({ name: 'Mara Keller', email: 'mara@example.test', role: 'Katalog' })

        expect(wrapper.find('.adm-usermenu').attributes('aria-label')).toBe('Konto: Mara Keller')
        expect(wrapper.find('.adm-menu__meta').text()).toBe('Katalog')
    })

    it('shows the address where there is no role, never an invented one', () => {
        const wrapper = mountMenu({ name: 'Mara Keller', email: 'mara@example.test', role: null })

        expect(wrapper.find('.adm-menu__meta').text()).toBe('mara@example.test')
    })

    it('offers the profile, the password and the way out — and no entry that leads nowhere', () => {
        const wrapper = mountMenu({ name: 'Mara Keller', email: 'mara@example.test', role: null })

        expect(wrapper.findAll('a').map((a) => [a.text(), a.attributes('href')])).toEqual([
            ['Profil', '/admin/profil'],
            ['Passwort ändern', '/admin/profil#passwort'],
        ])
        expect(wrapper.text()).not.toContain('Zwei-Faktor')
    })

    it('signs out with one post, and refuses a second while the first is in flight', async () => {
        const wrapper = mountMenu({ name: 'Mara Keller', email: 'mara@example.test', role: null })
        const out = wrapper.findAll('button').at(-1)

        await out?.trigger('click')
        expect(post).toHaveBeenCalledOnce()
        expect(post.mock.calls[0]?.[0]).toBe('/admin/abmelden')
        expect(wrapper.findAll('button').at(-1)?.text()).toBe('Wird abgemeldet …')

        await wrapper.findAll('button').at(-1)?.trigger('click')
        expect(post).toHaveBeenCalledOnce()
    })

    it('renders nothing without an account', () => {
        expect(mountMenu(null).html()).toBe('<!--v-if-->')
    })
})
