import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { ListViewItem, ListViewsProps } from '../../../types/admin/lists'

/*
 * The views above a list: the whole list, the person's own views, those shared with their role —
 * links that say where one is; „Als Ansicht speichern“ for filters no view keeps; „Änderungen
 * speichern“ and „Verwerfen“ only for one's own view, changed; a deleted view back with „Rückgängig“.
 */

const router = { patch: vi.fn(), delete: vi.fn(), post: vi.fn() }
const shown = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    router: {
        patch: (...a: unknown[]) => router.patch(...a),
        delete: (...a: unknown[]) => router.delete(...a),
        post: (...a: unknown[]) => router.post(...a),
    },
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

vi.mock('reka-ui', () => {
    const pass = defineComponent({ setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()) })

    return {
        DropdownMenuRoot: pass,
        DropdownMenuTrigger: defineComponent({ setup: (_, { slots, attrs }) => () => h('button', { type: 'button', ...attrs }, slots.default?.()) }),
        DropdownMenuPortal: pass,
        DropdownMenuContent: pass,
        DropdownMenuSeparator: defineComponent({ setup: () => () => h('hr') }),
        DropdownMenuItem: defineComponent({
            emits: ['select'],
            setup: (_, { slots, attrs, emit }) => () => h('button', { type: 'button', ...attrs, onClick: (e: Event) => emit('select', e) }, slots.default?.()),
        }),
    }
})

vi.mock('./SaveViewDialog.vue', () => ({
    default: defineComponent({
        props: { open: Boolean, view: { type: Object, default: null } },
        setup: (props) => () => h('div', { class: 'dialog-stub', 'data-open': String(props.open), 'data-view': props.view ? String((props.view as ListViewItem).id) : '' }),
    }),
}))

vi.mock('../../Chrome/toast', () => ({ toast: { show: (...a: unknown[]) => shown(...a) } }))

const { default: ListViews } = await import('./ListViews.vue')

function item(overrides: Partial<ListViewItem> = {}): ListViewItem {
    return { id: 1, name: 'Bezahlt', href: '/admin/bestellungen?status=bezahlt&ansicht=1', mine: true, sharedWith: null, roleId: null, owner: null, ...overrides }
}

function views(overrides: Partial<ListViewsProps> = {}): ListViewsProps {
    return { items: [item()], active: null, missing: false, modified: false, shareOptions: [], canSave: true, limit: 30, ...overrides }
}

function mountBar(v: ListViewsProps, query: Record<string, string> = {}) {
    return mount(ListViews, { props: { list: 'bestellungen', base: '/admin/bestellungen', allLabel: 'Alle Bestellungen', views: v, query } })
}

const labels = (wrapper: ReturnType<typeof mountBar>): string[] => wrapper.findAll('.lv__actions button, .lv__actions a').map((b) => b.text())

beforeEach(() => {
    router.patch.mockReset()
    router.delete.mockReset()
    router.post.mockReset()
    shown.mockReset()
})

describe('ListViews', () => {
    it('marks where one is: the whole list with nothing filtered, else the open view', () => {
        const plain = mountBar(views())
        expect(plain.findAll('[aria-current="page"]').map((a) => a.text())).toEqual(['Alle Bestellungen'])

        const open = mountBar(views({ active: 1 }), { status: 'bezahlt' })
        expect(open.findAll('[aria-current="page"]').map((a) => a.attributes('href'))).toEqual(['/admin/bestellungen?status=bezahlt&ansicht=1'])
    })

    it('counts the whole list as where one is in any order — sorting is not filtering', () => {
        const sorted = mountBar(views(), { sort: 'summe', richtung: 'ab' })

        expect(sorted.findAll('[aria-current="page"]').map((a) => a.text())).toEqual(['Alle Bestellungen'])
    })

    it('says so when the link names a view that is gone, and when the limit of views is reached', () => {
        expect(mountBar(views({ missing: true })).find('.lv__missing').text()).toContain('Die verlinkte Ansicht gibt es nicht mehr')

        const full = mountBar(views({ canSave: false }), { status: 'offen' })
        expect(full.find('.lv__limit').text()).toBe('30 von 30 Ansichten gespeichert. Lösch eine, um diese Filter zu speichern.')
    })

    it('says who shared a view, and with whom one shared one\'s own', () => {
        const wrapper = mountBar(views({ items: [item({ sharedWith: 'Support' }), item({ id: 2, name: 'Große', mine: false, owner: 'Sabine Roth' })] }))
        const links = wrapper.findAll('.lv__view')

        expect(links[0]?.text()).toContain(', geteilt mit der Rolle „Support“')
        expect(links[1]?.text()).toContain(', geteilt von Sabine Roth')
        // The people icon marks both shared views.
        expect(wrapper.findAll('.lv__view svg')).toHaveLength(2)
    })

    it('offers to keep filters no view keeps — and nothing for a view unchanged or with no filters on', () => {
        expect(labels(mountBar(views(), { status: 'offen' }))).toEqual(['Als Ansicht speichern'])
        expect(labels(mountBar(views({ active: 1 }), { status: 'bezahlt' }))).toEqual([])
        expect(labels(mountBar(views()))).toEqual([])
        // At the limit of views: no button — a sentence instead (above).
        expect(labels(mountBar(views({ canSave: false }), { status: 'offen' }))).toEqual([])
    })

    it('lets the owner save over a changed view or set it back — never a view shared by somebody else', () => {
        const own = mountBar(views({ active: 1, modified: true }), { status: 'offen' })
        expect(labels(own)).toEqual(['Änderungen speichern', 'Verwerfen', 'Als Ansicht speichern'])
        expect(own.find('.lv__actions a').attributes('href')).toBe('/admin/bestellungen?status=bezahlt&ansicht=1')
        expect(own.find('.lv__changed').text()).toBe('geändert')

        const shared = mountBar(views({ items: [item({ mine: false, owner: 'Sabine Roth' })], active: 1, modified: true }), { status: 'offen' })
        expect(labels(shared)).toEqual(['Als Ansicht speichern'])
        expect(shared.find('.lv__more').exists()).toBe(false)
    })

    it('saves the filters on screen into the open view', async () => {
        const wrapper = mountBar(views({ active: 1, modified: true }), { status: 'offen' })

        await wrapper.find('.lv__actions button').trigger('click')

        expect(router.patch).toHaveBeenCalledWith('/admin/ansichten/1', { query: { status: 'offen' } }, expect.anything())
    })

    it('deletes the open view and brings it back from the toast', async () => {
        const wrapper = mountBar(views({ active: 1 }), { status: 'bezahlt' })

        await wrapper.findAll('.adm-menu__item').find((b) => b.text().includes('Löschen'))?.trigger('click')
        expect(router.delete).toHaveBeenCalledWith('/admin/ansichten/1', expect.anything())

        // The deletion went through: the toast offers the way back.
        ;(router.delete.mock.calls[0]?.[1] as { onSuccess: () => void }).onSuccess()
        const message = shown.mock.calls[0]?.[0] as { text: string; action: { label: string; run: () => void } }
        expect(message.text).toBe('Ansicht „Bezahlt“ gelöscht.')
        expect(message.action.label).toBe('Rückgängig')

        message.action.run()
        expect(router.post).toHaveBeenCalledWith('/admin/ansichten/1/wiederherstellen', {}, expect.anything())
    })

    it('opens the dialog to rename and share the open view, and to save a new one', async () => {
        const wrapper = mountBar(views({ active: 1, modified: true }), { status: 'offen' })

        await wrapper.findAll('.adm-menu__item').find((b) => b.text().includes('Umbenennen'))?.trigger('click')
        expect(wrapper.find('.dialog-stub').attributes()).toMatchObject({ 'data-open': 'true', 'data-view': '1' })

        await wrapper.findAll('.lv__actions button').find((b) => b.text() === 'Als Ansicht speichern')?.trigger('click')
        expect(wrapper.find('.dialog-stub').attributes('data-view')).toBe('')
    })
})
