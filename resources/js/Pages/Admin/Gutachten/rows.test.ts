import { describe, expect, it } from 'vitest'
import type { FitmentRowView } from '../../../types/admin/gutachten'
import { emptyRow, formFromRow, parseTyre, payload, sentIndex, unreadable } from './rows'

describe('reading a tyre size as a Gutachten prints it', () => {
    it('reads the usual spellings', () => {
        expect(parseTyre('225/40 R18')).toEqual({ width_mm: 225, aspect: 40, diameter: 18, min_load_index: null, min_speed_symbol: '' })
        expect(parseTyre('225/40R18')?.diameter).toBe(18)
        expect(parseTyre('255/35 zr19')?.width_mm).toBe(255)
        expect(parseTyre('225/40-18')?.aspect).toBe(40)
    })

    it('keeps the document’s own minimum after the size', () => {
        expect(parseTyre('245/35 ZR19 93Y')).toMatchObject({ min_load_index: 93, min_speed_symbol: 'Y' })
    })

    it('reads a minimum as the PDF prints it: a load index alone, a symbol alone, spaced, bracketed, with XL', () => {
        expect(parseTyre('245/35 R19 93')).toMatchObject({ min_load_index: 93, min_speed_symbol: '' })
        expect(parseTyre('245/35 R19 Y')).toMatchObject({ min_load_index: null, min_speed_symbol: 'Y' })
        expect(parseTyre('245/35 R19 93 Y')).toMatchObject({ min_load_index: 93, min_speed_symbol: 'Y' })
        expect(parseTyre('245/35 R19 (93Y)')).toMatchObject({ min_load_index: 93, min_speed_symbol: 'Y' })
        expect(parseTyre('245/35 R19 93Y XL')).toMatchObject({ min_load_index: 93, min_speed_symbol: 'Y' })
        expect(parseTyre('245/35 R19 XL')).toMatchObject({ min_load_index: null, min_speed_symbol: '' })
        expect(parseTyre('245/35 R19 93Y')).toMatchObject({ width_mm: 245, min_load_index: 93 })
    })

    it('refuses what is not a tyre size', () => {
        expect(parseTyre('225/40')).toBeNull()
        expect(parseTyre('8,5J x 18')).toBeNull()
    })
})

describe('the row as the server reads it', () => {
    it('leaves empty size lines out and sends each size in its parts', () => {
        const form = emptyRow()
        form.tyre_sizes = [
            { text: '225/40 R18', axle: 'FRONT', min_load_index: null, min_speed_symbol: '' },
            { text: '', axle: 'ALL', min_load_index: null, min_speed_symbol: '' },
        ]
        form.source_page = 7

        expect(payload(form)).toMatchObject({
            source_page: 7,
            tyre_sizes: [{ width_mm: 225, aspect: 40, diameter: 18, axle: 'FRONT', min_load_index: null, min_speed_symbol: '' }],
            build_from: null,
        })
    })

    it('names the size lines that do not read', () => {
        const form = emptyRow()
        form.tyre_sizes = [
            { text: '225/40 R18', axle: 'ALL', min_load_index: null, min_speed_symbol: '' },
            { text: '225-40', axle: 'ALL', min_load_index: null, min_speed_symbol: '' },
        ]

        expect(unreadable(form)).toEqual([1])
    })

    it('brings a saved row back as it was typed', () => {
        const row = {
            axle: 'ALL',
            requiresEntry: true,
            entryNote: 'Eintragung nötig.',
            sourcePage: 3,
            buildFrom: '',
            buildTo: '',
            widthMin: '',
            widthMax: '',
            etMin: '',
            etMax: '',
            centreBore: '',
            tyreSizes: [{ width_mm: 245, aspect: 35, diameter: 19, min_load_index: 93, min_speed_symbol: 'Y', axle: 'REAR', label: '' }],
            conditions: [{ id: 4, text: 'Bördeln der Radläufe erforderlich.', note: '' }],
        } as unknown as FitmentRowView

        expect(formFromRow(row)).toMatchObject({ requires_entry: true, source_page: 3, tyre_sizes: [{ text: '245/35 R19 93Y', axle: 'REAR' }], conditions: [{ id: 4, note: '' }] })
    })

    it('keeps a minimum load index without a symbol when a row is changed', () => {
        const row = { tyreSizes: [{ width_mm: 245, aspect: 35, diameter: 19, min_load_index: 93, min_speed_symbol: '', axle: 'ALL', label: '' }], conditions: [] } as unknown as FitmentRowView

        expect(formFromRow(row).tyre_sizes[0]?.text).toBe('245/35 R19 93')
        expect(payload(formFromRow(row)).tyre_sizes).toEqual([{ width_mm: 245, aspect: 35, diameter: 19, min_load_index: 93, min_speed_symbol: '', axle: 'ALL' }])
    })

    it('finds the line the server means, past the lines that are not sent', () => {
        const form = emptyRow()
        form.tyre_sizes = [
            { text: '', axle: 'ALL', min_load_index: null, min_speed_symbol: '' },
            { text: '225/40 R18', axle: 'ALL', min_load_index: null, min_speed_symbol: '' },
            { text: '225/40 ZR18', axle: 'ALL', min_load_index: null, min_speed_symbol: '' },
        ]

        expect([0, 1, 2].map((i) => sentIndex(form, i))).toEqual([null, 0, 1])
    })
})
