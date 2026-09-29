import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, ref } from 'vue'
import type { DirtyFormState } from '../../composables/admin/useDirtyForm'

/*
 * The page pattern: the header, the save bar, the confirmation, the states and the loading rows.
 * Each test pins a rule from admin-shell.md §8–9 that a page would otherwise get wrong on its own.
 */

const current: { props: Record<string, unknown>; url: string } = { props: {}, url: '/admin' }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

vi.mock('reka-ui', () => ({
    DropdownMenuRoot: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }),
    DropdownMenuTrigger: defineComponent({ setup: (_, { slots, attrs }) => () => h('button', { type: 'button', ...attrs }, slots.default?.()) }),
    DropdownMenuPortal: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }),
    DropdownMenuContent: defineComponent({ setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()) }),
    DropdownMenuSeparator: defineComponent({ setup: () => () => h('hr') }),
    DropdownMenuItem: defineComponent({
        props: { asChild: Boolean },
        emits: ['select'],
        setup: (props, { slots, attrs, emit }) => () =>
            props.asChild ? slots.default?.() : h('button', { type: 'button', ...attrs, onClick: () => emit('select') }, slots.default?.()),
    }),
    DialogRoot: defineComponent({ props: { open: Boolean }, setup: (props, { slots }) => () => (props.open ? h('div', { class: 'dialog-root' }, slots.default?.()) : null) }),
    DialogPortal: defineComponent({ setup: (_, { slots }) => () => slots.default?.() }),
    DialogOverlay: defineComponent({ setup: () => () => null }),
    DialogContent: defineComponent({ setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()) }),
    DialogTitle: defineComponent({ setup: (_, { slots }) => () => h('h2', slots.default?.()) }),
    DialogDescription: defineComponent({ setup: (_, { slots }) => () => h('p', slots.default?.()) }),
    DialogClose: defineComponent({ setup: (_, { slots }) => () => h('button', { type: 'button' }, slots.default?.()) }),
}))

const { default: AdminPage } = await import('./AdminPage.vue')
const { default: AdminSaveBar } = await import('./AdminSaveBar.vue')
const { default: AdminConfirm } = await import('./AdminConfirm.vue')
const { default: AdminState } = await import('./AdminState.vue')
const { default: AdminSkeletonRows } = await import('./AdminSkeletonRows.vue')

let mounted: VueWrapper[] = []

function keep(wrapper: VueWrapper): VueWrapper {
    mounted.push(wrapper)

    return wrapper
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('AdminPage', () => {
    it('renders one h1 and one context line, and the primary action last', () => {
        const wrapper = keep(
            mount(AdminPage, {
                props: { title: 'Rollen & Rechte', context: '7 Rollen · 12 Konten', more: [{ label: 'Exportieren', href: '/x' }] },
                slots: { primary: '<button class="btn btn--primary">Rolle anlegen</button>', default: '<p>Körper</p>' },
            })
        )

        expect(wrapper.findAll('h1').map((t) => t.text())).toEqual(['Rollen & Rechte'])
        expect(wrapper.find('.adm-page__context').text()).toBe('7 Rollen · 12 Konten')
        expect(wrapper.findAll('.adm-page__actions > *').at(-1)?.text()).toBe('Rolle anlegen')
        expect(wrapper.find('.adm-page__body').text()).toBe('Körper')
    })

    it('puts destructive actions last, behind a hairline, whatever order they came in', () => {
        const run = vi.fn()
        const wrapper = keep(
            mount(AdminPage, {
                props: {
                    title: 'Gutachten',
                    context: '9 Dokumente',
                    more: [
                        { label: 'Löschen', run, danger: true },
                        { label: 'Duplizieren', run },
                    ],
                },
            })
        )
        const items = wrapper.findAll('.adm-menu__item')

        expect(items.map((i) => i.text())).toEqual(['Duplizieren', 'Löschen'])
        expect(items[1]?.classes()).toContain('adm-menu__item--danger')
        expect(wrapper.find('hr').exists()).toBe(true)
    })

    it('has no action area when there is nothing to do, and says so once when read-only', () => {
        const wrapper = keep(mount(AdminPage, { props: { title: 'Profil', context: 'Seit 2026', readOnly: true } }))

        expect(wrapper.find('.adm-page__actions').exists()).toBe(false)
        expect(wrapper.find('.adm-page__readonly').text()).toBe('Du kannst diese Seite ansehen, aber nicht ändern.')
    })
})

interface Calls {
    save: number
    discard: number
    stay: number
    leave: number
}

function editorState(state: { dirty?: boolean; saving?: boolean; failed?: boolean } = {}): DirtyFormState & { calls: Calls } {
    const calls: Calls = { save: 0, discard: 0, stay: 0, leave: 0 }

    return {
        dirty: computed(() => state.dirty ?? false),
        saving: computed(() => state.saving ?? false),
        failed: ref(state.failed ?? false),
        leaving: ref(false),
        save: () => calls.save++,
        discard: () => calls.discard++,
        stay: () => calls.stay++,
        leave: () => calls.leave++,
        calls,
    }
}

describe('AdminSaveBar', () => {
    it('is there while clean, says so, and saves nothing', async () => {
        const editor = editorState()
        const wrapper = keep(mount(AdminSaveBar, { props: { editor } }))
        const [discard, save] = wrapper.findAll('.adm-savebar button')

        expect(wrapper.find('.adm-savebar__status').text()).toBe('Keine Änderungen')
        expect(discard?.attributes('disabled')).toBeDefined()
        expect(save?.attributes('aria-disabled')).toBe('true')

        await save?.trigger('click')
        expect(editor.calls.save).toBe(0)
    })

    it('saves and discards once there are changes', async () => {
        const editor = editorState({ dirty: true })
        const wrapper = keep(mount(AdminSaveBar, { props: { editor } }))
        const [discard, save] = wrapper.findAll('.adm-savebar button')

        expect(wrapper.find('.adm-savebar__status').text()).toBe('Nicht gespeicherte Änderungen')
        await save?.trigger('click')
        await discard?.trigger('click')
        expect(editor.calls).toMatchObject({ save: 1, discard: 1 })
    })

    it('shows the save in flight on the button, and a refused save in words', () => {
        const saving = keep(mount(AdminSaveBar, { props: { editor: editorState({ dirty: true, saving: true }) } }))
        expect(saving.find('.adm-savebar__status').text()).toBe('Wird gespeichert …')
        expect(saving.find('.adm-savebar__save').attributes('aria-busy')).toBe('true')

        const failed = keep(mount(AdminSaveBar, { props: { editor: editorState({ dirty: true, failed: true }) } }))
        expect(failed.find('.adm-savebar__status').text()).toBe('Die Änderungen konnten nicht gespeichert werden.')
        expect(failed.find('.adm-savebar').attributes('data-state')).toBe('failed')
    })

    it('asks before a change is lost, with keeping it as the safe answer', async () => {
        const editor = editorState({ dirty: true })
        editor.leaving.value = true
        const wrapper = keep(mount(AdminSaveBar, { props: { editor } }))
        const buttons = wrapper.findAll('.dialog-root button').filter((b) => b.text() !== '')

        expect(wrapper.find('.dialog-root h2').text()).toBe('Änderungen nicht gespeichert')
        expect(buttons.map((b) => b.text())).toEqual(['Änderungen verwerfen', 'Weiter bearbeiten'])
        expect(buttons[1]?.classes()).toContain('btn--primary')

        await buttons[1]?.trigger('click')
        expect(editor.calls.stay).toBe(1)
    })
})

describe('AdminConfirm', () => {
    function confirmIn(environment: string | null, props: Record<string, unknown> = {}): VueWrapper {
        current.props = { admin: { environment } }

        return keep(mount(AdminConfirm, { props: { open: true, title: 'Gutachten ABE 12345 löschen?', body: '42 Freigaben verlieren damit ihren Nachweis.', ...props } }))
    }

    it('says it is the live shop on the live shop, and only there', () => {
        expect(confirmIn(null).find('.adm-confirm__body').text()).toBe('Das wirkt sofort im Live-Shop. 42 Freigaben verlieren damit ihren Nachweis.')
        expect(confirmIn('local').find('.adm-confirm__body').text()).toBe('42 Freigaben verlieren damit ihren Nachweis.')
    })

    it('waits for the exact word before it acts', async () => {
        const wrapper = confirmIn('local', { confirmWord: 'LÖSCHEN' })
        const act = wrapper.findAll('button').find((b) => b.text() === 'Löschen')

        await act?.trigger('click')
        expect(wrapper.emitted('confirm')).toBeUndefined()
        expect(act?.attributes('aria-disabled')).toBe('true')

        await wrapper.find('input').setValue('LÖSCHEN')
        await act?.trigger('click')
        expect(wrapper.emitted('confirm')).toHaveLength(1)
    })
})

describe('AdminState', () => {
    it('never says "nothing here" when the filters are what hide everything', async () => {
        const filtered = keep(mount(AdminState, { props: { kind: 'filtered', total: 12000 } }))

        expect(filtered.find('.adm-state__heading').text()).toBe('Kein Treffer für diese Filter.')
        expect(filtered.find('.adm-state__text').text()).toBe('12.000 Einträge insgesamt — die Filter schließen sie alle aus.')

        await filtered.find('button').trigger('click')
        expect(filtered.emitted('reset')).toHaveLength(1)

        const empty = keep(mount(AdminState, { props: { kind: 'empty', text: 'Farben legt das Katalog-Team an.' }, slots: { default: '<button>Farbe anlegen</button>' } }))
        expect(empty.find('.adm-state__heading').text()).toBe('Hier ist noch nichts.')
        expect(empty.find('button').text()).toBe('Farbe anlegen')
    })

    it('keeps a load failure on the page with a way to try again', async () => {
        const wrapper = keep(mount(AdminState, { props: { kind: 'error' } }))

        expect(wrapper.find('section').attributes('role')).toBe('alert')
        await wrapper.find('button').trigger('click')
        expect(wrapper.emitted('retry')).toHaveLength(1)
    })

    it('names the area a refused page belongs to, and leads back to the overview', () => {
        const wrapper = keep(mount(AdminState, { props: { kind: 'forbidden', module: 'Bestellungen' } }))

        expect(wrapper.find('.adm-state__text').text()).toContain('„Bestellungen“')
        expect(wrapper.find('a').attributes('href')).toBe('/admin')
    })
})

describe('AdminSkeletonRows', () => {
    it('draws a screen of rows in the table’s own tracks, busy for assistive technology', () => {
        const wrapper = keep(mount(AdminSkeletonRows, { props: { columns: ['minmax(0, 2fr)', '1fr', '120px'] } }))
        const rows = wrapper.findAll('.adm-skel__row')

        expect(wrapper.attributes('aria-busy')).toBe('true')
        expect(wrapper.text()).toBe('Wird geladen …')
        expect(rows).toHaveLength(8)
        expect(rows[0]?.findAll('.adm-skel__cell')).toHaveLength(3)
        expect(rows[0]?.attributes('style')).toContain('grid-template-columns: minmax(0, 2fr) 1fr 120px')
    })
})
