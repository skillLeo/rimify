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

type Check = {
    key: string
    label: string
    expected: string
    count: number | null
    checked: number
    examples: string[]
    unmapped: string | null
    unchecked: string | null
}

function page(gaps: Gap[], implausible: Check[] = []) {
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
            fields: [
                { key: 'hsn', label: 'HSN (2.1)', required: true, hint: null },
                { key: 'gesamtmasse_kg', label: 'Zulässige Gesamtmasse in kg (F.2)', required: false, hint: 'Wird nur zum Abgleich mit 8.1 und 8.2 gelesen und nicht gespeichert.' },
            ],
            headers: ['HSN'],
            examples: {},
            mapping: { hsn: 'HSN' },
            missing: [],
            gaps,
            implausible,
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

    it('shows what reads but cannot be: each check with what was read and what was expected, or why it did not run (D-318) @admin-202', () => {
        const wrapper = page(
            [],
            [
                {
                    key: 'axle_range',
                    label: 'Achslast vorn oder hinten (8.1 oder 8.2)',
                    expected: `Erwartet für eine Achslast: 400 bis 2.500${NBSP}kg.`,
                    count: 2,
                    checked: 3,
                    examples: [`Zeile 3: Gelesen: 2.600${NBSP}kg (8.1)`, `Zeile 4: Gelesen: 350${NBSP}kg (8.1)`],
                    unmapped: null,
                    unchecked: null,
                },
                { key: 'axle_same', label: 'Achslast vorn gleich hinten (8.1 = 8.2) in jeder geprüften Zeile', expected: 'Erwartet: …', count: 0, checked: 3, examples: [], unmapped: null, unchecked: null },
                { key: 'axle_sum', label: 'Summe', expected: 'Erwartet: …', count: null, checked: 0, examples: [], unmapped: 'Keine Spalte für Feld F.2 zugeordnet', unchecked: null },
                { key: 'speed_range', label: 'Höchstgeschwindigkeit (T)', expected: 'Erwartet: …', count: null, checked: 0, examples: [], unmapped: null, unchecked: 'Nicht geprüft: …' },
            ]
        )
        const checks = wrapper.findAll('.fr-odd__check')

        // Four checks, each read on its own line — never a list that could be empty and pass.
        expect(checks).toHaveLength(4)
        expect(checks.map((c) => c.find('.fr-odd__result').text())).toEqual([
            'In 2 Zeilen · geprüft: 3 von 3 Zeilen',
            'In keiner Zeile · geprüft: 3 von 3 Zeilen',
            'Keine Spalte für Feld F.2 zugeordnet',
            'Nicht geprüft: …',
        ])
        expect(checks[0]!.findAll('.fr-odd__examples li').map((li) => li.text())).toEqual([`Zeile 3: Gelesen: 2.600${NBSP}kg (8.1)`, `Zeile 4: Gelesen: 350${NBSP}kg (8.1)`])
        expect(checks.map((c) => c.classes('fr-odd__check--hit'))).toEqual([true, false, false, false])
        // A warning, never a stop: the confirmation says so, and the button stays.
        expect(wrapper.find('admin-confirm-stub').attributes('body')).toContain('Der Probelauf hat unplausible Werte gelesen')
        expect(wrapper.find('button.btn--primary').exists()).toBe(true)
        // The total mass is read for the check alone, and the mapping says so.
        expect(wrapper.text()).toContain('Wird nur zum Abgleich mit 8.1 und 8.2 gelesen und nicht gespeichert.')
    })

    it('says nothing of implausible values in the confirmation when no check found any', () => {
        const wrapper = page([], [{ key: 'axle_range', label: 'Achslast', expected: 'Erwartet: …', count: 0, checked: 3, examples: [], unmapped: null, unchecked: null }])

        expect(wrapper.find('admin-confirm-stub').attributes('body')).not.toContain('unplausible')
    })

    it('shows no gaps for a run checked before they were counted', () => {
        expect(page([]).find('.fr-gaps').exists()).toBe(false)
    })
})
