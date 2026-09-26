import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import type { AdminNavGroup } from '../../types/admin'

/*
 * The palette as an operator uses it: open, type, arrow, Enter. Focus never leaves the field, the
 * arrows wrap, Enter goes where the active row points, and an action closes the palette first.
 */

const current: { props: Record<string, unknown>; url: string } = { props: {}, url: '/admin' }
const visit = vi.fn()
const post = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    router: { visit: (...a: unknown[]) => visit(...a), post: (...a: unknown[]) => post(...a), on: vi.fn(() => () => undefined) },
}))

// The dialog's own mechanics are reka-ui's; here it renders its content while open.
const passthrough = defineComponent({ setup: (_, { slots }) => () => slots.default?.() })

vi.mock('reka-ui', () => ({
    DialogRoot: defineComponent({
        props: { open: Boolean },
        setup: (props, { slots }) => () => (props.open ? slots.default?.() : null),
    }),
    DialogPortal: passthrough,
    DialogOverlay: defineComponent({ setup: () => () => h('div') }),
    DialogContent: defineComponent({ setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()) }),
    DialogTitle: defineComponent({ setup: (_, { slots }) => () => h('h2', slots.default?.()) }),
    DialogDescription: defineComponent({ setup: (_, { slots }) => () => h('p', slots.default?.()) }),
    DialogClose: defineComponent({ setup: (_, { slots }) => () => h('button', { type: 'button' }, slots.default?.()) }),
}))

const { default: AdminPalette } = await import('./AdminPalette.vue')
const { provideAdminShell } = await import('../../composables/admin/useAdmin')

const NAV: AdminNavGroup[] = [
    { key: 'uebersicht', label: 'Übersicht', icon: 'overview', pages: [{ label: 'Übersicht', href: '/admin', icon: 'overview', count: null, countTone: 'neutral' }] },
    {
        key: 'gutachten',
        label: 'Gutachten',
        icon: 'documents',
        pages: [
            { label: 'Dokumente', href: '/admin/gutachten', icon: 'documents', count: null, countTone: 'neutral' },
            { label: 'Benachrichtigungswünsche', href: '/admin/benachrichtigungen', icon: 'inquiries', count: null, countTone: 'neutral' },
        ],
    },
]

let mounted: VueWrapper[] = []

interface Harness {
    wrapper: VueWrapper
    open: Ref<boolean>
    shortcuts: Ref<boolean>
    toggle: ReturnType<typeof vi.fn>
}

async function openPalette(url = '/admin'): Promise<Harness> {
    current.url = url
    current.props = { admin: { nav: NAV } }
    const open = ref(false)
    const shortcuts = ref(false)
    const toggle = vi.fn()

    const wrapper = mount(
        defineComponent({
            setup() {
                provideAdminShell({ paletteOpen: open, shortcutsOpen: shortcuts, railCollapsed: ref(false), toggleRail: toggle })

                return () => h(AdminPalette)
            },
        }),
        { attachTo: document.body }
    )
    mounted.push(wrapper)

    open.value = true
    await flushPromises()

    return { wrapper, open, shortcuts, toggle }
}

function rows(wrapper: VueWrapper): string[] {
    return wrapper.findAll('[role="option"]').map((o) => o.find('.adm-palette__key').text())
}

function activeRow(wrapper: VueWrapper): string | undefined {
    return wrapper.find('[aria-selected="true"] .adm-palette__key').text()
}

beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: true, media: query }))
    Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    visit.mockReset()
    post.mockReset()
    window.localStorage.clear()
    vi.unstubAllGlobals()
})

describe('AdminPalette', () => {
    it('opens on the actions when nothing is recent, the first row active', async () => {
        const { wrapper } = await openPalette()

        expect(wrapper.findAll('.adm-palette__heading').map((h) => h.text())).toEqual(['Aktionen'])
        expect(rows(wrapper)).toEqual(['Navigation einklappen', 'Tastenkürzel anzeigen', 'Passwort ändern', 'Abmelden'])
        expect(activeRow(wrapper)).toBe('Navigation einklappen')
    })

    it('lists where you were, but not the page you are on', async () => {
        await openPalette('/admin/gutachten').then(({ wrapper }) => wrapper.unmount())
        const { wrapper } = await openPalette('/admin')

        expect(wrapper.findAll('.adm-palette__heading').map((h) => h.text())).toEqual(['Zuletzt geöffnet', 'Aktionen'])
        expect(rows(wrapper)[0]).toBe('Dokumente')
    })

    it('moves with the arrows, wraps at both ends, and points the field at the active row', async () => {
        const { wrapper } = await openPalette()
        const input = wrapper.find('input')

        await input.trigger('keydown', { key: 'ArrowUp' })
        expect(activeRow(wrapper)).toBe('Abmelden')

        await input.trigger('keydown', { key: 'ArrowDown' })
        expect(activeRow(wrapper)).toBe('Navigation einklappen')
        expect(input.attributes('aria-activedescendant')).toBe(wrapper.find('[aria-selected="true"]').attributes('id'))

        await input.trigger('keydown', { key: 'End' })
        expect(activeRow(wrapper)).toBe('Abmelden')
    })

    it('goes to the page Enter points at, and closes', async () => {
        const { wrapper, open } = await openPalette()
        const input = wrapper.find('input')

        await input.setValue('doku')
        expect(rows(wrapper)).toEqual(['Dokumente'])

        await input.trigger('keydown', { key: 'Enter' })
        expect(visit).toHaveBeenCalledWith('/admin/gutachten')
        expect(open.value).toBe(false)
    })

    it('closes before it runs an action', async () => {
        const { wrapper, open, shortcuts } = await openPalette()

        await wrapper.find('input').setValue('tasten')
        await wrapper.find('input').trigger('keydown', { key: 'Enter' })
        expect(open.value).toBe(false)

        await nextTick()
        expect(shortcuts.value).toBe(true)
    })

    it('says plainly when nothing matches', async () => {
        const { wrapper } = await openPalette()

        await wrapper.find('input').setValue('qqq')
        expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
        expect(wrapper.find('[role="status"]').text()).toContain('Keine Treffer für „qqq“.')
        expect(wrapper.find('input').attributes('aria-expanded')).toBe('false')
    })
})
