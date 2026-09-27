import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import type { ListColumn } from '../../../types/admin/lists'

/*
 * „Spalten“: a tick per column, the column that names the row fixed, the list's order kept whatever
 * order they are ticked in, the choice kept on the account at once — and „Standard“ puts back the
 * list's own set.
 */

vi.mock('reka-ui', () => {
    const pass = defineComponent({ setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()) })

    return {
        DropdownMenuRoot: pass,
        DropdownMenuTrigger: defineComponent({ setup: (_, { slots, attrs }) => () => h('button', { type: 'button', ...attrs }, slots.default?.()) }),
        DropdownMenuPortal: pass,
        DropdownMenuContent: pass,
        DropdownMenuLabel: pass,
        DropdownMenuSeparator: defineComponent({ setup: () => () => h('hr') }),
        DropdownMenuItemIndicator: pass,
        DropdownMenuCheckboxItem: defineComponent({
            props: { modelValue: Boolean, disabled: Boolean },
            emits: ['update:modelValue', 'select'],
            setup: (props, { slots, emit, attrs }) => () =>
                h('button', { type: 'button', role: 'menuitemcheckbox', 'aria-checked': String(props.modelValue), disabled: props.disabled, ...attrs, onClick: () => emit('update:modelValue', !props.modelValue) }, slots.default?.()),
        }),
        DropdownMenuItem: defineComponent({
            props: { disabled: Boolean },
            emits: ['select'],
            setup: (props, { slots, attrs, emit }) => () => h('button', { type: 'button', disabled: props.disabled, ...attrs, onClick: (e: Event) => emit('select', e) }, slots.default?.()),
        }),
    }
})

const { default: ColumnChooser } = await import('./ColumnChooser.vue')

const COLUMNS: ListColumn[] = [
    { key: 'nummer', label: 'Nummer', required: true },
    { key: 'datum', label: 'Datum', required: false },
    { key: 'fahrzeug', label: 'Fahrzeug', required: false },
    { key: 'summe', label: 'Summe', required: false },
]
const DEFAULTS = ['nummer', 'datum', 'summe']

function mountChooser(start: string[] = DEFAULTS, sorted: string | null = null, owner: 'person' | 'view' = 'person') {
    const shown = ref([...start])
    const fetch = vi.fn(async (_url: string, _init: { body: string }) => ({ ok: true }))
    vi.stubGlobal('fetch', fetch)

    const wrapper = mount(
        defineComponent({
            setup: () => () =>
                h(ColumnChooser, { list: 'bestellungen', columns: COLUMNS, defaults: DEFAULTS, sorted, owner, shown: shown.value, 'onUpdate:shown': (v: string[]) => (shown.value = v) }),
        })
    )

    return { wrapper, shown, fetch }
}

const sent = (fetch: ReturnType<typeof mountChooser>['fetch'], n = 0): { list: string; columns: string[]; rev: number } =>
    JSON.parse(fetch.mock.calls[n]?.[1].body ?? '{}') as { list: string; columns: string[]; rev: number }

const boxes = (wrapper: ReturnType<typeof mountChooser>['wrapper']) => wrapper.findAll('[role="menuitemcheckbox"]')

afterEach(() => vi.unstubAllGlobals())

describe('ColumnChooser', () => {
    it('ticks the columns shown and fixes the one that names the row', () => {
        const { wrapper } = mountChooser()

        expect(boxes(wrapper).map((b) => b.attributes('aria-checked'))).toEqual(['true', 'true', 'false', 'true'])
        expect(boxes(wrapper)[0]?.attributes('disabled')).toBeDefined()
        expect(boxes(wrapper)[0]?.text()).toContain('immer sichtbar')
    })

    it('adds a column in the list\'s order and keeps the choice on the account', async () => {
        const { wrapper, shown, fetch } = mountChooser()

        await boxes(wrapper)[2]?.trigger('click')

        expect(shown.value).toEqual(['nummer', 'datum', 'fahrzeug', 'summe'])
        expect(fetch).toHaveBeenCalledWith('/admin/ansicht', expect.objectContaining({ method: 'PATCH' }))
        expect(sent(fetch)).toMatchObject({ list: 'bestellungen', columns: ['nummer', 'datum', 'fahrzeug', 'summe'] })
    })

    it('numbers every save higher than the last, so a late answer cannot put an older choice back', async () => {
        const { wrapper, fetch } = mountChooser()

        await boxes(wrapper)[2]?.trigger('click')
        await boxes(wrapper)[1]?.trigger('click')

        expect(sent(fetch, 1).rev).toBeGreaterThan(sent(fetch, 0).rev)
    })

    it('changes an open view\'s own columns on screen, and never the account\'s', async () => {
        const { wrapper, shown, fetch } = mountChooser(DEFAULTS, null, 'view')

        expect(wrapper.text()).toContain('Spalten dieser Ansicht')
        await boxes(wrapper)[2]?.trigger('click')

        expect(shown.value).toEqual(['nummer', 'datum', 'fahrzeug', 'summe'])
        expect(fetch).not.toHaveBeenCalled()
    })

    it('takes a column away, and puts back the list\'s own set with „Standard“', async () => {
        const { wrapper, shown } = mountChooser()

        await boxes(wrapper)[1]?.trigger('click')
        expect(shown.value).toEqual(['nummer', 'summe'])

        const standard = wrapper.findAll('button').find((b) => b.text() === 'Standard wiederherstellen')
        await standard?.trigger('click')
        expect(shown.value).toEqual(DEFAULTS)
    })

    it('keeps the column the list is sorted by, and says why', async () => {
        const { wrapper, shown } = mountChooser(['nummer', 'datum'], 'summe')
        const summe = boxes(wrapper)[3]

        expect(summe?.attributes('aria-checked')).toBe('true')
        expect(summe?.attributes('disabled')).toBeDefined()
        expect(summe?.text()).toContain('danach sortiert')

        await summe?.trigger('click')
        expect(shown.value).toEqual(['nummer', 'datum'])
    })

    it('offers „Standard“ only where the choice differs from it', () => {
        const standard = mountChooser().wrapper.findAll('button').find((b) => b.text() === 'Standard wiederherstellen')

        expect(standard?.attributes('disabled')).toBeDefined()
    })
})
