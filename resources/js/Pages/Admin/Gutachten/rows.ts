/**
 * The Verwendungsbereich row form: typed the way a Gutachten prints it — a tyre size is `225/40 R18`,
 * optionally with its minimum `92Y` — and sent the way the server reads it (FitmentRowsRequest).
 * Kept apart from the pages so its reading is tested.
 */

import type { AxleValue, FitmentRowView, RowForm, TyreSizeForm } from '../../../types/admin/gutachten'

export interface ParsedTyre {
    width_mm: number
    aspect: number
    diameter: number
    min_load_index: number | null
    min_speed_symbol: string
}

/**
 * `225/40 R18`, `225/40R18`, `225/40 ZR18 92Y`, `225/40-18` → its parts; null when it is not a tyre
 * size. A load index and speed symbol after it are the document's own minimum.
 */
export function parseTyre(text: string): ParsedTyre | null {
    const m = text
        .trim()
        .toUpperCase()
        .match(/^(\d{3})\s*\/\s*(\d{2})\s*(?:Z?R|-)\s*(\d{2})(?:\s+(\d{2,3})\s*([A-Z]{1,2}))?$/)

    if (!m) {
        return null
    }

    return {
        width_mm: Number(m[1]),
        aspect: Number(m[2]),
        diameter: Number(m[3]),
        min_load_index: m[4] ? Number(m[4]) : null,
        min_speed_symbol: m[5] ?? '',
    }
}

export function emptySize(axle: AxleValue = 'ALL'): TyreSizeForm {
    return { text: '', axle, min_load_index: null, min_speed_symbol: '' }
}

export function emptyRow(): RowForm {
    return {
        axle: 'ALL',
        requires_entry: false,
        entry_note: '',
        source_page: null,
        build_from: '',
        build_to: '',
        width_min: '',
        width_max: '',
        et_min: '',
        et_max: '',
        centre_bore: '',
        tyre_sizes: [emptySize()],
        conditions: [],
    }
}

/** A saved row, back in the form it was typed in. */
export function formFromRow(row: FitmentRowView): RowForm {
    return {
        axle: row.axle,
        requires_entry: row.requiresEntry,
        entry_note: row.entryNote,
        source_page: row.sourcePage,
        build_from: row.buildFrom,
        build_to: row.buildTo,
        width_min: row.widthMin,
        width_max: row.widthMax,
        et_min: row.etMin,
        et_max: row.etMax,
        centre_bore: row.centreBore,
        tyre_sizes: row.tyreSizes.map((s) => ({
            text: `${s.width_mm}/${s.aspect} R${s.diameter}${s.min_load_index !== null && s.min_speed_symbol ? ` ${s.min_load_index}${s.min_speed_symbol}` : ''}`,
            axle: s.axle,
            min_load_index: s.min_load_index,
            min_speed_symbol: s.min_speed_symbol,
        })),
        conditions: row.conditions.map((c) => ({ id: c.id, note: c.note })),
    }
}

/** The sizes that do not read as a tyre size, by their place in the list. */
export function unreadable(form: RowForm): number[] {
    return form.tyre_sizes.flatMap((size, index) => (size.text.trim() !== '' && parseTyre(size.text) === null ? [index] : []))
}

/** What the server reads: empty size lines left out, each size in its parts. */
export function payload(form: RowForm): Record<string, unknown> {
    const sizes = form.tyre_sizes
        .map((size) => ({ size, parsed: parseTyre(size.text) }))
        .filter((entry): entry is { size: TyreSizeForm; parsed: ParsedTyre } => entry.parsed !== null)
        .map(({ size, parsed }) => ({
            width_mm: parsed.width_mm,
            aspect: parsed.aspect,
            diameter: parsed.diameter,
            min_load_index: parsed.min_load_index,
            min_speed_symbol: parsed.min_speed_symbol,
            axle: size.axle,
        }))

    return {
        axle: form.axle,
        requires_entry: form.requires_entry,
        entry_note: form.entry_note,
        source_page: form.source_page === null || String(form.source_page) === '' ? null : Number(form.source_page),
        build_from: form.build_from || null,
        build_to: form.build_to || null,
        width_min: form.width_min,
        width_max: form.width_max,
        et_min: form.et_min,
        et_max: form.et_max,
        centre_bore: form.centre_bore,
        tyre_sizes: sizes,
        conditions: form.conditions.map((c) => ({ id: c.id, note: c.note })),
    }
}
