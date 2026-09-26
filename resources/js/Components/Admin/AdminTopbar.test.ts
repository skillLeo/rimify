import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref, type Ref } from 'vue'

/*
 * The topbar: where you are, the one search, help. Breadcrumbs never link to a page that is not
 * there, both search affordances open the same palette, and the e-mail help row exists only when
 * somebody was asked to read that address.
 */

const current: { props: Record<string, unknown>; url: string } = { props: {}, url: '/admin' }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    router: { on: vi.fn(() => () => undefined), post: vi.fn() },
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

vi.mock('reka-ui', () => ({
    DropdownMenuRoot: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }),
    DropdownMenuTrigger: defineComponent({
        setup: (_, { slots, attrs }) => () => h('button', { type: 'button', ...attrs }, slots.default?.()),
    }),
    DropdownMenuPortal: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }),
    DropdownMenuContent: defineComponent({ setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()) }),
    DropdownMenuSeparator: defineComponent({ setup: () => () => h('hr') }),
    DropdownMenuLabel: defineComponent({ setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()) }),
    DropdownMenuItem: defineComponent({
        props: { asChild: Boolean },
        emits: ['select'],
        setup: (props, { slots, attrs, emit }) => () =>
            props.asChild
                ? slots.default?.()
                : h('button', { type: 'button', ...attrs, onClick: (e: Event) => emit('select', e) }, slots.default?.()),
    }),
}))

const { default: AdminTopbar } = await import('./AdminTopbar.vue')
const { provideAdminShell } = await import('../../composables/admin/useAdmin')

let mounted: VueWrapper[] = []

function mountBar(admin: Record<string, unknown>): { wrapper: VueWrapper; palette: Ref<boolean>; shortcuts: Ref<boolean> } {
    current.props = { admin: { account: { name: 'Mara Keller', email: 'mara@example.test', role: null }, ...admin } }
    const palette = ref(false)
    const shortcuts = ref(false)

    const wrapper = mount(
        defineComponent({
            setup() {
                provideAdminShell({ paletteOpen: palette, shortcutsOpen: shortcuts, railCollapsed: ref(false), toggleRail: () => undefined })

                return () => h(AdminTopbar)
            },
        })
    )
    mounted.push(wrapper)

    return { wrapper, palette, shortcuts }
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('AdminTopbar', () => {
    it('names the group and the page, links neither, and marks the page as current', () => {
        const { wrapper } = mountBar({
            breadcrumbs: [
                { label: 'Gutachten', href: null },
                { label: 'Dokumente', href: null },
            ],
        })
        const crumbs = wrapper.find('.adm-crumbs')

        expect(crumbs.findAll('li').map((li) => li.text())).toEqual(['Gutachten', 'Dokumente'])
        expect(crumbs.findAll('a')).toHaveLength(0)
        expect(crumbs.find('[aria-current="page"]').text()).toBe('Dokumente')
    })

    it('renders no breadcrumb bar at all where there is nothing to say', () => {
        expect(mountBar({ breadcrumbs: [] }).wrapper.find('.adm-crumbs').exists()).toBe(false)
    })

    it('opens the one palette from the field and from the icon', async () => {
        const field = mountBar({})
        await field.wrapper.find('.adm-search--field').trigger('click')
        expect(field.palette.value).toBe(true)

        const icon = mountBar({})
        await icon.wrapper.find('.adm-search--icon').trigger('click')
        expect(icon.palette.value).toBe(true)
    })

    it('opens the shortcuts from the help menu', async () => {
        const { wrapper, shortcuts } = mountBar({})
        const row = wrapper.findAll('button').find((b) => b.text() === 'Tastenkürzel')

        await row?.trigger('click')
        expect(shortcuts.value).toBe(true)
    })

    it('offers e-mail help only when an address is configured', () => {
        expect(mountBar({ supportEmail: null }).wrapper.find('a[href^="mailto:"]').exists()).toBe(false)
        expect(mountBar({ supportEmail: 'hilfe@example.test' }).wrapper.find('a[href="mailto:hilfe@example.test"]').exists()).toBe(true)
    })
})
