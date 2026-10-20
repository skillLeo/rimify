import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue')

    return {
        Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
        router: { post: vi.fn() },
        usePage: () => ({ props: { errors: {} } }),
        useForm: (initial: Record<string, unknown>) =>
            reactive({
                ...initial,
                errors: {},
                processing: false,
                isDirty: false,
                defaults: () => undefined,
                reset: () => undefined,
                post: () => undefined,
            }),
    }
})

vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: {} }))

const { default: ImportRun } = await import('./ImportRun.vue')

const NBSP = ' '

type Gap = { key: string; label: string; count: number | null; share: string | null; unmapped: string | null }

function page(gaps: Gap[]) {
    return mount(ImportRun, {
        props: {
            run: {
                id: 7,
                file: 'beispiel.csv',
                source: 'KBA-Typdaten',
                format: 'CSV',
                status: 'previewed',
                statusLabel: 'Probelauf',
                summary: { create: 2, refused: 1, unread: 0 },
                by: 'Testzugang Admin',
                at: '20.10.2026, 09:00 Uhr',
                rowCount: 3,
                appliedAt: null,
            },
            fields: [{ key: 'hsn', label: 'HSN (2.1)', required: true }],
            headers: ['HSN'],
            examples: {},
            mapping: { hsn: 'HSN' },
            missing: [],
            gaps,
            rows: [],
            hiddenRows: 0,
            planHash: 'x',
            can: { remap: true, apply: true },
        },
        global: {
            stubs: {
                AdminPage: { template: '<div><slot /><slot name="primary" /></div>' },
                AdminConfirm: true,
            },
        },
    })
}

/*
 * D-317 (the operator's brief of 20.10.2026): the Probelauf counts what the file lacks over all its rows, each with its
 * share of the file — the figures a purchase of the full dataset is decided on.
 */
describe('Fahrzeuge › Import › Probelauf', () => {
    it('shows what the file lacks over all its rows, each as a count and a share of the file @admin-202', () => {
        const wrapper = page([
            { key: 'without_speed', label: 'Höchstgeschwindigkeit (T)', count: 2, share: `66,7${NBSP}%`, unmapped: null },
            { key: 'without_axle', label: 'Achslast vorn oder hinten (8.1 oder 8.2)', count: 2, share: `66,7${NBSP}%`, unmapped: null },
            { key: 'without_keys', label: 'HSN oder TSN (2.1 oder 2.2)', count: 1, share: `33,3${NBSP}%`, unmapped: null },
            { key: 'without_eg', label: 'EG-Typgenehmigungsnummer (K)', count: 0, share: `0${NBSP}%`, unmapped: null },
        ])
        const rows = wrapper.findAll('.fr-gaps tbody tr').map((tr) => tr.findAll('td').map((td) => td.text()))

        // toEqual on the whole list: four rows, each as shown — never a check over an empty table.
        expect(rows).toEqual([
            ['Höchstgeschwindigkeit (T)', '2 von 3', `66,7${NBSP}%`],
            ['Achslast vorn oder hinten (8.1 oder 8.2)', '2 von 3', `66,7${NBSP}%`],
            ['HSN oder TSN (2.1 oder 2.2)', '1 von 3', `33,3${NBSP}%`],
            ['EG-Typgenehmigungsnummer (K)', '0 von 3', `0${NBSP}%`],
        ])
        // A field every row carries is quiet, as a nought among the counts is.
        expect(wrapper.findAll('.fr-gaps tbody tr').map((tr) => tr.classes('fr-gap--none'))).toEqual([false, false, false, true])
        // The table is named by its heading.
        const heading = wrapper.find('.fr-gaps h3')
        expect(wrapper.find('.fr-gaps table').attributes('aria-labelledby')).toBe(heading.attributes('id'))
    })

    it('shows a field without a column as „Keine Spalte zugeordnet“, never as a count of missing values (R-17) @admin-202', () => {
        const wrapper = page([
            { key: 'without_speed', label: 'Höchstgeschwindigkeit (T)', count: null, share: null, unmapped: 'Keine Spalte zugeordnet' },
            { key: 'without_axle', label: 'Achslast vorn oder hinten (8.1 oder 8.2)', count: null, share: null, unmapped: 'Keine Spalte für Feld 8.2 zugeordnet' },
            { key: 'without_keys', label: 'HSN oder TSN (2.1 oder 2.2)', count: 0, share: `0${NBSP}%`, unmapped: null },
            { key: 'without_eg', label: 'EG-Typgenehmigungsnummer (K)', count: 1, share: `33,3${NBSP}%`, unmapped: null },
        ])
        const rows = wrapper.findAll('.fr-gaps tbody tr').map((tr) => tr.findAll('td').map((td) => td.text()))

        expect(rows).toEqual([
            ['Höchstgeschwindigkeit (T)', 'Keine Spalte zugeordnet', '–'],
            ['Achslast vorn oder hinten (8.1 oder 8.2)', 'Keine Spalte für Feld 8.2 zugeordnet', '–'],
            ['HSN oder TSN (2.1 oder 2.2)', '0 von 3', `0${NBSP}%`],
            ['EG-Typgenehmigungsnummer (K)', '1 von 3', `33,3${NBSP}%`],
        ])
        expect(wrapper.findAll('.fr-gaps tbody tr').map((tr) => tr.classes('fr-gap--unmapped'))).toEqual([true, true, false, false])
    })

    it('shows no gaps for a run checked before they were counted', () => {
        expect(page([]).find('.fr-gaps').exists()).toBe(false)
    })
})
