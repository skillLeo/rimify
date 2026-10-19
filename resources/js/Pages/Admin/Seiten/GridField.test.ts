import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const toastShow = vi.fn()

vi.mock('../../../Components/Chrome/toast', () => ({ toast: { show: (...args: unknown[]) => toastShow(...args) } }))

const { default: GridField } = await import('./GridField.vue')

/*
 * An article's table (his admin item 11, D-306): typed cell by cell, columns and rows added and removed with buttons
 * that stop where the publish check would refuse — 2 to 6 columns, up to 30 rows.
 */

type Table = { head: string[]; rows: string[][] }

function mountGrid(head: string[], rows: string[][]) {
    return mount(GridField, {
        props: { id: 'pg-t', rowsId: 'pg-r', label: 'Inhalt', head, rows, max: 200 },
        attachTo: document.body,
    })
}

function last(wrapper: ReturnType<typeof mountGrid>): Table {
    const events = wrapper.emitted('change') as [Table][] | undefined

    return events!.at(-1)![0]
}

describe('GridField', () => {
    it('labels every cell by its row and column, the column heads by their number @admin-211', () => {
        const wrapper = mountGrid(['ET', 'Wirkung'], [['30', 'breit']])

        expect(wrapper.find('#pg-t').attributes('aria-label')).toBe('Spaltenkopf 1')
        expect(wrapper.find('#pg-r').attributes('aria-label')).toBe('Zeile 1, ET')
        expect(wrapper.find('#pg-r-0-1').attributes('aria-label')).toBe('Zeile 1, Wirkung')
        wrapper.unmount()
    })

    it('adds a column to the headings and every row, and a row as wide as the table @admin-211', async () => {
        const wrapper = mountGrid(['ET', 'Wirkung'], [['30', 'breit']])

        await wrapper.find('#pg-t-add-column').trigger('click')
        expect(last(wrapper)).toEqual({ head: ['ET', 'Wirkung', ''], rows: [['30', 'breit', '']] })

        await wrapper.find('#pg-t-add-row').trigger('click')
        expect(last(wrapper)).toEqual({ head: ['ET', 'Wirkung'], rows: [['30', 'breit'], ['', '']] })
        wrapper.unmount()
    })

    it('keeps two columns and one row at least, and six columns at most @admin-211', () => {
        const narrow = mountGrid(['ET', 'Wirkung'], [['30', 'breit']])

        // Two columns are the least: no column offers to go, and the one row cannot either.
        expect(narrow.findAll('button[aria-label^="Spalte"]')).toHaveLength(0)
        expect(narrow.find('button[aria-label="Zeile 1 entfernen"]').attributes('disabled')).toBeDefined()
        narrow.unmount()

        const wide = mountGrid(['1', '2', '3', '4', '5', '6'], [['', '', '', '', '', '']])

        expect(wide.find('#pg-t-add-column').attributes('disabled')).toBeDefined()
        wide.unmount()
    })

    it('removes a column from the headings and every row @admin-211', async () => {
        const wrapper = mountGrid(['ET', 'Wirkung', 'Hinweis'], [['30', 'breit', 'selten']])

        await wrapper.find('button[aria-label="Spalte 2 entfernen"]').trigger('click')
        expect(last(wrapper)).toEqual({ head: ['ET', 'Hinweis'], rows: [['30', 'selten']] })
        wrapper.unmount()
    })

    // SEI-24, SEI-28: the second click of a double-click is not a second removal, and a removal can be taken back.
    it('removes one row per double-click and brings it back with its words @admin-211', async () => {
        toastShow.mockClear()
        const wrapper = mountGrid(['ET', 'Wirkung'], [['30', 'breit'], ['45', 'schmal']])
        const bin = wrapper.find('button[aria-label="Zeile 1 entfernen"]')

        await bin.trigger('click', { detail: 1 })
        await bin.trigger('click', { detail: 2 })

        expect(wrapper.emitted('change')).toHaveLength(1)
        expect(last(wrapper)).toEqual({ head: ['ET', 'Wirkung'], rows: [['45', 'schmal']] })

        // Rückgängig, against the table as it stands now.
        await wrapper.setProps({ rows: [['45', 'schmal']] })
        const undo = (toastShow.mock.calls.at(-1)?.[0] as { action: { run: () => void } }).action
        undo.run()

        expect(last(wrapper)).toEqual({ head: ['ET', 'Wirkung'], rows: [['30', 'breit'], ['45', 'schmal']] })
        wrapper.unmount()
    })

    it('marks a cell over its length, as the publish check will @admin-211', () => {
        const wrapper = mountGrid(['ET', 'Wirkung'], [['x'.repeat(201), 'breit']])

        expect(wrapper.find('#pg-r').attributes('aria-invalid')).toBe('true')
        expect(wrapper.find('#pg-r-0-1').attributes('aria-invalid')).toBeUndefined()
        wrapper.unmount()
    })
})
