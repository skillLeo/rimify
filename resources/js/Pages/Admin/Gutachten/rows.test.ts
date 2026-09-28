import { describe, expect, it } from 'vitest'
import type { DocumentConditionView, FitmentRowView, TyreSizeForm } from '../../../types/admin/gutachten'
import { badCodes, derivedEntry, emptyRow, formFromRow, kwText, parseCodes, parseKwBand, parseTyre, payload, sentIndex, unreadable } from './rows'

const size = (text: string, axle: TyreSizeForm['axle'] = 'ALL', codes = ''): TyreSizeForm => ({ text, axle, min_load_index: null, min_speed_symbol: '', kw: '', codes })

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
        expect(parseTyre('245/35 R19 93Y')).toMatchObject({ width_mm: 245, min_load_index: 93 })
    })

    it('refuses what is not a tyre size', () => {
        expect(parseTyre('225/40')).toBeNull()
        expect(parseTyre('8,5J x 18')).toBeNull()
    })
})

describe('reading codes as the document prints them', () => {
    it('splits at spaces, commas and semicolons, keeps each as typed and once', () => {
        expect(parseCodes('A01 A12, K1c;T88  A01')).toEqual(['A01', 'A12', 'K1c', 'T88'])
        expect(parseCodes('K1c K1C')).toEqual(['K1c', 'K1C'])
        expect(parseCodes('  ')).toEqual([])
    })

    it('names a typed code the server will not take', () => {
        expect(badCodes('A01 Bördeln A-12 987654321')).toEqual(['Bördeln', 'A-12', '987654321'])
    })
})

describe('the Eintragung the codes derive', () => {
    const list = [
        { code: 'A01', kind: 'abnahme', page: 6 },
        { code: 'A12', kind: 'verbot', page: 7 },
    ] as unknown as DocumentConditionView[]

    it('follows an Abnahme on the row or on a size, with its page', () => {
        const form = emptyRow()
        form.tyre_sizes = [size('225/40 R18'), size('235/40 R18', 'ALL', 'A01')]

        expect(derivedEntry(form, list)).toEqual({ required: true, derived: true, sources: ['A01, Seite 6'], sizes: [1] })

        form.tyre_sizes = [size('225/40 R18', 'ALL', 'A12')]
        expect(derivedEntry(form, list)).toMatchObject({ required: false, derived: true, sources: [] })

        form.codes = 'A12 A01'
        expect(derivedEntry(form, list)).toMatchObject({ required: true, sizes: [0] })
    })

    it('gives way to a person’s override, and says it is not derived', () => {
        const form = emptyRow()
        form.codes = 'A01'
        form.entry_override = 'not_required'

        expect(derivedEntry(form, list)).toMatchObject({ required: false, derived: false, sources: ['A01, Seite 6'] })
    })
})

describe('the row as the server reads it', () => {
    it('leaves empty size lines out and sends each size in its parts, with its codes', () => {
        const form = emptyRow()
        form.tyre_sizes = [size('225/40 R18', 'FRONT', 'A01 T88'), size('')]
        form.source_page = 7
        form.codes = 'A12 K1c'
        form.notes = { K1c: 'Nur an der Hinterachse.', GONE: 'nicht mehr getippt' }

        expect(payload(form)).toMatchObject({
            source_page: 7,
            tyre_sizes: [{ width_mm: 225, aspect: 40, diameter: 18, axle: 'FRONT', min_load_index: null, min_speed_symbol: '', codes: ['A01', 'T88'] }],
            conditions: [
                { code: 'A12', note: '' },
                { code: 'K1c', note: 'Nur an der Hinterachse.' },
            ],
            entry_override: null,
            entry_override_reason: null,
            build_from: null,
        })
    })

    it('sends an override with its reason, and no reason without one', () => {
        const form = emptyRow()
        form.entry_override_reason = 'Liegen gelassen.'

        expect(payload(form)).toMatchObject({ entry_override: null, entry_override_reason: null })

        form.entry_override = 'required'
        expect(payload(form)).toMatchObject({ entry_override: 'required', entry_override_reason: 'Liegen gelassen.' })
    })

    it('names the size lines that do not read', () => {
        const form = emptyRow()
        form.tyre_sizes = [size('225/40 R18'), size('225-40')]

        expect(unreadable(form)).toEqual([1])
    })

    it('brings a saved row back as it was typed', () => {
        const row = {
            axle: 'ALL',
            entryOverride: 'required',
            entryOverrideReason: 'Der Prüfer verlangt die Eintragung.',
            entryNote: 'Eintragung nötig.',
            sourcePage: 3,
            buildFrom: '',
            buildTo: '',
            widthMin: '',
            widthMax: '',
            etMin: '',
            etMax: '',
            centreBore: '',
            tyreSizes: [{ width_mm: 245, aspect: 35, diameter: 19, min_load_index: 93, min_speed_symbol: 'Y', axle: 'REAR', label: '', codes: [{ code: 'T88' }], requiresEntry: true }],
            conditions: [{ code: 'K1c', text: 'Bördeln der Radläufe erforderlich.', note: '', kind: 'karosseriearbeit', page: 7, defined: true }],
        } as unknown as FitmentRowView

        expect(formFromRow(row)).toMatchObject({
            codes: 'K1c',
            entry_override: 'required',
            entry_override_reason: 'Der Prüfer verlangt die Eintragung.',
            source_page: 3,
            tyre_sizes: [{ text: '245/35 R19 93Y', axle: 'REAR', codes: 'T88' }],
            notes: {},
        })
    })

    it('keeps a minimum load index without a symbol when a row is changed', () => {
        const row = { tyreSizes: [{ width_mm: 245, aspect: 35, diameter: 19, min_load_index: 93, min_speed_symbol: '', axle: 'ALL', label: '', codes: [] }], conditions: [], entryOverride: null, entryOverrideReason: '' } as unknown as FitmentRowView

        expect(formFromRow(row).tyre_sizes[0]?.text).toBe('245/35 R19 93')
        expect(payload(formFromRow(row)).tyre_sizes).toEqual([{ width_mm: 245, aspect: 35, diameter: 19, min_load_index: 93, min_speed_symbol: '', axle: 'ALL', kw_min: null, kw_max: null, codes: [] }])
    })

    it('finds the line the server means, past the lines that are not sent', () => {
        const form = emptyRow()
        form.tyre_sizes = [size(''), size('225/40 R18'), size('225/40 ZR18')]

        expect([0, 1, 2].map((i) => sentIndex(form, i))).toEqual([null, 0, 1])
    })
})

describe('the kW band a Gutachten prints beside a size (Block D)', () => {
    it('reads the band as printed, and nothing for an empty field', () => {
        expect(parseKwBand('85-195')).toEqual({ kw_min: 85, kw_max: 195 })
        expect(parseKwBand(' 85 – 195 kW ')).toEqual({ kw_min: 85, kw_max: 195 })
        expect(parseKwBand('')).toBeUndefined()
    })

    it('refuses a band it cannot read, or one typed the wrong way round', () => {
        expect(parseKwBand('85')).toBeNull()
        expect(parseKwBand('195-85')).toBeNull()
        expect(parseKwBand('85-1195')).toBeNull()
    })

    it('sends the band with its size, marks an unreadable one, and reads a saved one back', () => {
        const form = emptyRow()
        form.tyre_sizes = [{ ...size('215/35 R19'), kw: '85-125' }, { ...size('225/35 R19'), kw: 'viel' }]

        expect(unreadable(form)).toEqual([1])

        form.tyre_sizes[1]!.kw = ''
        const sent = payload(form).tyre_sizes as { kw_min: number | null; kw_max: number | null }[]

        expect(sent[0]).toMatchObject({ kw_min: 85, kw_max: 125 })
        expect(sent[1]).toMatchObject({ kw_min: null, kw_max: null })
        expect(kwText({ kw_min: 85, kw_max: 195 })).toBe('85-195')
    })
})
