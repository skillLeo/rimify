import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { ColumnsInForce, ListViewItem, ListViewsProps } from '../../../types/admin/lists'

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
    return {
        id: 1,
        name: 'Bezahlt',
        href: '/admin/bestellungen?status=bezahlt&ansicht=1',
        query: { status: 'bezahlt' },
        storesColumns: false,
        columns: null,
        mine: true,
        sharedWith: null,
        roleId: null,
        owner: null,
        ...overrides,
    }
}

function views(overrides: Partial<ListViewsProps> = {}): ListViewsProps {
    return { items: [item()], active: null, missing: false, shareOptions: [], canSave: true, limit: 30, ...overrides }
}

const MINE: ColumnsInForce = { keys: ['nummer', 'datum', 'summe'], fromView: false }

function mountBar(v: ListViewsProps, query: Record<string, string> = {}, columns: ColumnsInForce = MINE) {
    return mount(ListViews, { props: { list: 'bestellungen', base: '/admin/bestellungen', allLabel: 'Alle Bestellungen', views: v, query, columns } })
}

const labels = (wrapper: ReturnType<typeof mountBar>): string[] => wrapper.findAll('.lv__actions button, .lv__actions a').map((b) => b.text())

beforeEach(() => {
    router.patch.mockReset()
    router.delete.mockReset()
    router.post.mockReset()
    shown.mockReset()
})

describe('ListViews', () => {
    // SV-02a: revealed once at the mount, a view far along the row lost its menu again when the font came in later.
    it('brings the open view into sight when it mounts, and again once the web font is in and the widths are final', async () => {
        const reveal = vi.fn()
        const before = Element.prototype.scrollIntoView
        let fontsIn: () => void = () => {}

        Element.prototype.scrollIntoView = reveal
        Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: new Promise<void>((resolve) => (fontsIn = resolve)) } })

        try {
            mountBar(views({ active: 1 }), { status: 'bezahlt' })
            expect(reveal).toHaveBeenCalledTimes(1)

            fontsIn()
            await new Promise((resolve) => setTimeout(resolve, 0))
            expect(reveal).toHaveBeenCalledTimes(2)
            // The item with its menu, not the link alone.
            expect((reveal.mock.contexts.at(-1) as HTMLElement).classList.contains('lv__item')).toBe(true)
        } finally {
            Element.prototype.scrollIntoView = before
            Reflect.deleteProperty(document, 'fonts')
        }
    })

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
        const own = mountBar(views({ active: 1 }), { status: 'offen' })
        expect(labels(own)).toEqual(['Änderungen speichern', 'Verwerfen', 'Als Ansicht speichern'])
        expect(own.find('.lv__actions a').attributes('href')).toBe('/admin/bestellungen?status=bezahlt&ansicht=1')
        expect(own.find('.lv__changed').text()).toBe('geändert')

        const shared = mountBar(views({ items: [item({ mine: false, owner: 'Sabine Roth' })], active: 1 }), { status: 'offen' })
        expect(labels(shared)).toEqual(['Als Ansicht speichern'])
        expect(shared.find('.lv__more').exists()).toBe(false)
    })

    it('does not call a view changed for an amount spelled another way (SV-13)', () => {
        const saved = item({ query: { min: '1.000', status: 'bezahlt' } })

        for (const onScreen of ['1000', '1.000', ' 1000 ']) {
            const wrapper = mountBar(views({ items: [saved], active: 1 }), { status: 'bezahlt', min: onScreen })

            expect(wrapper.find('.lv__changed').exists()).toBe(false)
            expect(labels(wrapper)).toEqual([])
        }

        // A different amount is a change.
        expect(mountBar(views({ items: [saved], active: 1 }), { status: 'bezahlt', min: '1001' }).find('.lv__changed').exists()).toBe(true)
    })

    it('saves the filters on screen into the open view — and the person\'s columns never', async () => {
        const wrapper = mountBar(views({ active: 1 }), { status: 'offen' })

        await wrapper.find('.lv__actions button').trigger('click')

        expect(router.patch).toHaveBeenCalledWith('/admin/ansichten/1', { query: { status: 'offen' } }, expect.anything())
    })
})

describe('ListViews with a view that keeps its columns', () => {
    const withColumns = item({ storesColumns: true, columns: ['nummer', 'datum', 'fahrzeug'] })
    const fromView = (keys: string[]): ColumnsInForce => ({ keys, fromView: true })

    it('says whose columns are shown next to the view, and gives the person\'s own back', async () => {
        const wrapper = mountBar(views({ items: [withColumns], active: 1 }), { status: 'bezahlt' }, fromView(['nummer', 'datum', 'fahrzeug']))

        expect(wrapper.find('.lv__cols').text()).toContain('Spalten aus dieser Ansicht')
        // Its own columns as saved: the view is unchanged.
        expect(wrapper.find('.lv__changed').exists()).toBe(false)

        await wrapper.find('.lv__own').trigger('click')
        expect(wrapper.emitted('ownColumns')).toHaveLength(1)
    })

    it('says nothing of columns while the person\'s own are shown', () => {
        const wrapper = mountBar(views({ items: [withColumns], active: 1 }), { status: 'bezahlt' })

        expect(wrapper.find('.lv__cols').exists()).toBe(false)
        // The person's columns differ from the view's — that is no change to the view.
        expect(wrapper.find('.lv__changed').exists()).toBe(false)
    })

    it('reads as changed when its columns change on screen, and saves them over with the filters', async () => {
        const wrapper = mountBar(views({ items: [withColumns], active: 1 }), { status: 'bezahlt' }, fromView(['nummer', 'summe']))

        expect(wrapper.find('.lv__changed').text()).toBe('geändert')
        expect(labels(wrapper)).toEqual(['Änderungen speichern', 'Verwerfen', 'Als Ansicht speichern'])

        await wrapper.find('.lv__actions button').trigger('click')
        expect(router.patch).toHaveBeenCalledWith('/admin/ansichten/1', { query: { status: 'bezahlt' }, columns: ['nummer', 'summe'] }, expect.anything())
    })
})

describe('ListViews, deleting and naming', () => {
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
        const wrapper = mountBar(views({ active: 1 }), { status: 'offen' })

        await wrapper.findAll('.adm-menu__item').find((b) => b.text().includes('Umbenennen'))?.trigger('click')
        expect(wrapper.find('.dialog-stub').attributes()).toMatchObject({ 'data-open': 'true', 'data-view': '1' })

        await wrapper.findAll('.lv__actions button').find((b) => b.text() === 'Als Ansicht speichern')?.trigger('click')
        expect(wrapper.find('.dialog-stub').attributes('data-view')).toBe('')
    })
})
