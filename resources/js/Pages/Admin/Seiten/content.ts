/**
 * The editor's arithmetic, kept out of the components so it can be tested on its own: how long a
 * text is (as the server counts it), what a new section starts as, and where two versions differ —
 * named exactly as PageSchema::changes() names it on the server, so the dialog before publishing
 * and the Protokoll afterwards say the same thing.
 */

import type { BlockData, ContentBlock, PageContent, PageSchema, SchemaBlock, SchemaField } from '../../../types/admin/seiten'

/** A text as the server keeps it (PageSchema::string): line endings as `\n`, trimmed. */
export function normalised(value: string): string {
    return value.replace(/\r\n?/g, '\n').trim()
}

/** Characters as the server's mb_strlen counts them, after it trims: an emoji is one, not two. */
export function length(value: unknown): number {
    return typeof value === 'string' ? Array.from(normalised(value)).length : 0
}

/** Over its limit, the way the publish check will say it is. */
export function overLimit(field: SchemaField, value: unknown): boolean {
    return field.max !== null && field.kind !== 'number' && length(value) > field.max
}

function emptyValue(field: SchemaField): string | number | null {
    if (field.kind === 'number') {
        return field.min ?? 1
    }

    if (field.kind === 'icon') {
        return field.options?.[0]?.value ?? ''
    }

    if (field.kind === 'choice') {
        return field.default ?? field.options?.[0]?.value ?? ''
    }

    return ''
}

/** A new, empty item of a block's list — every field present, so the form's shape never shifts. */
export function emptyItem(fields: SchemaField[]): Record<string, string | number | null> {
    const item: Record<string, string | number | null> = {}

    for (const field of fields) {
        item[field.key] = emptyValue(field)
    }

    return item
}

/** A table's bounds, PageSchema's COLUMNS_MIN, COLUMNS_MAX and ROWS_MAX: the buttons stop where the check would refuse. */
export const COLUMNS_MIN = 2
export const COLUMNS_MAX = 6
export const ROWS_MAX = 30

/** A table starts with two columns and one row, as the server's skeleton does (PageSchema::emptyValues). */
const NEW_TABLE_COLUMNS = COLUMNS_MIN

/** A new, empty block of a type, including an empty list where the type has one. */
export function emptyBlock(block: SchemaBlock): ContentBlock {
    const data: BlockData = {}

    for (const field of block.fields) {
        if (field.kind === 'grid') {
            // A table: its headings under the field's key, its rows beside them.
            data[field.key] = Array.from({ length: NEW_TABLE_COLUMNS }, () => '')
            data.rows = [Array.from({ length: NEW_TABLE_COLUMNS }, () => '')]
        } else if (field.kind === 'image') {
            // A picture: its address, and its size as the upload measures it.
            data[field.key] = ''
            data.width = null
            data.height = null
        } else {
            data[field.key] = emptyValue(field)
        }
    }

    if (block.list) {
        data[block.list.key] = [emptyItem(block.list.fields)]
    }

    return { type: block.type, data }
}

/** The repeatable block types of a page, in the schema's order: a legal page's sections, an article's building blocks. */
export function repeatables(schema: PageSchema): SchemaBlock[] {
    return schema.blocks.filter((block) => block.repeat)
}

/** „Abschnitt 3" for a repeatable block, the plain label for a fixed one. */
export function blockLabel(schema: PageSchema, blocks: ContentBlock[], index: number): string {
    const block = blocks[index]
    const definition = schema.blocks.find((b) => b.type === block?.type)

    if (!block || !definition) {
        return ''
    }

    if (!definition.repeat) {
        return definition.label
    }

    const nth = blocks.slice(0, index + 1).filter((b) => b.type === block.type).length

    return `${definition.label} ${nth}`
}

/* Equal as the server will store them: a trailing space typed into a field is no change — in a table's cells too. */
function same(a: unknown, b: unknown): boolean {
    const stored = (value: unknown): unknown => (typeof value === 'string' ? normalised(value) : (value ?? null))

    if ((a !== null && typeof a === 'object') || (b !== null && typeof b === 'object')) {
        return JSON.stringify(a, (_key, value: unknown) => stored(value)) === JSON.stringify(b, (_key, value: unknown) => stored(value))
    }

    return stored(a) === stored(b)
}

/** One changed place, with its words before and after — empty where the place is new or gone. */
export interface Change {
    label: string
    before: string
    after: string
}

function words(value: unknown): string {
    return value === null || value === undefined ? '' : String(value)
}

/** A field's value as two versions are compared: a table's headings and rows together, anything else as stored. */
function comparable(field: SchemaField, data: Record<string, unknown> | undefined): unknown {
    return field.kind === 'grid' ? { head: data?.head ?? [], rows: data?.rows ?? [] } : data?.[field.key]
}

/** A block's or an item's words in reading order, for a place that is new or gone as a whole. */
function allWords(data: Record<string, unknown> | undefined, fields: SchemaField[]): string {
    return fields
        .filter((field) => field.kind !== 'icon')
        .map((field) => shown(field, comparable(field, data)))
        .filter((text) => text !== '')
        .join('\n\n')
}

/** The labels of every changed place — what the Protokoll's sentence names. */
export function changes(schema: PageSchema, before: PageContent, after: PageContent): string[] {
    return diff(schema, before, after).map((change) => change.label)
}

/** A place among its own kind (`prose#3`), its label („Abschnitt 3") and its block. */
interface Place {
    definition: SchemaBlock
    label: string
    data: Record<string, unknown>
}

/** A version's blocks by their place among their own kind, in reading order — PageSchema::placed on the server. */
function placed(schema: PageSchema, blocks: ContentBlock[]): Map<string, Place> {
    const out = new Map<string, Place>()
    const seen: Record<string, number> = {}

    for (const block of blocks) {
        const definition = schema.blocks.find((b) => b.type === block.type)

        if (!definition) {
            continue
        }

        seen[block.type] = (seen[block.type] ?? 0) + 1
        const nth = seen[block.type] ?? 1
        out.set(`${block.type}#${nth}`, { definition, label: definition.repeat ? `${definition.label} ${nth}` : definition.label, data: block.data })
    }

    return out
}

/**
 * Every place where `after` differs from `before`, with its words: „Titel", „Einstieg · Überschrift",
 * „Abschnitt 3 · Text", „Abschnitt 7 (neu)", „Zitat 1 (entfernt)". Each kind of block is compared among
 * its own, by its place, like the server: a section moved up reads as the two places it changed, a quote
 * removed between two sections as the quote's removal (SEI-25), and another order of the kinds as
 * „Reihenfolge der Bausteine".
 */
export function diff(schema: PageSchema, before: PageContent, after: PageContent): Change[] {
    const out: Change[] = []

    for (const field of schema.page) {
        const key = field.key as 'title' | 'metaDescription'

        if (!same(before[key] ?? '', after[key] ?? '')) {
            out.push({ label: field.label, before: words(before[key]), after: words(after[key]) })
        }
    }

    const was = placed(schema, before.blocks)
    const is = placed(schema, after.blocks)

    for (const [key, place] of is) {
        const { definition, label: where } = place
        const now = { data: place.data }
        const kept = was.get(key)

        if (!kept) {
            out.push({ label: `${where} (neu)`, before: '', after: allWords(now.data, definition.fields) })
            continue
        }

        const old = { data: kept.data }

        for (const field of definition.fields) {
            const a = comparable(field, old.data)
            const b = comparable(field, now.data)

            if (!same(a, b)) {
                out.push({ label: `${where} · ${field.label}`, before: shown(field, a), after: shown(field, b) })
            }
        }

        const list = definition.list

        if (list) {
            const oldItems = Array.isArray(old.data[list.key]) ? (old.data[list.key] as Record<string, unknown>[]) : []
            const newItems = Array.isArray(now.data[list.key]) ? (now.data[list.key] as Record<string, unknown>[]) : []
            const items = Math.max(oldItems.length, newItems.length)

            for (let j = 0; j < items; j++) {
                const itemWhere = `${list.itemLabel} ${j + 1}`
                const a = oldItems[j]
                const b = newItems[j]

                if (!a) {
                    out.push({ label: `${itemWhere} (neu)`, before: '', after: allWords(b, list.fields) })
                } else if (!b) {
                    out.push({ label: `${itemWhere} (entfernt)`, before: allWords(a, list.fields), after: '' })
                } else {
                    for (const field of list.fields) {
                        if (!same(a[field.key], b[field.key])) {
                            out.push({ label: `${itemWhere} · ${field.label}`, before: shown(field, a[field.key]), after: shown(field, b[field.key]) })
                        }
                    }
                }
            }
        }
    }

    for (const [key, place] of was) {
        if (!is.has(key)) {
            out.push({ label: `${place.label} (entfernt)`, before: allWords(place.data, place.definition.fields), after: '' })
        }
    }

    // The blocks both versions have, in each version's order: a quote moved above a section changes no words.
    const kept = [...was.keys()].filter((key) => is.has(key))
    const now = [...is.keys()].filter((key) => was.has(key))

    if (kept.join('|') !== now.join('|')) {
        out.push({
            label: 'Reihenfolge der Bausteine',
            before: kept.map((key) => was.get(key)?.label ?? '').join(', '),
            after: now.map((key) => is.get(key)?.label ?? '').join(', '),
        })
    }

    return out
}

/** A value as a person reads it: a glyph or a choice by its name („Werkzeug"), anything else as written. */
function shown(field: SchemaField, value: unknown): string {
    if (field.kind === 'icon' || field.kind === 'choice') {
        return field.options?.find((option) => option.value === value)?.label ?? words(value)
    }

    // A picture by its file's name, as a person would recognise it.
    if (field.kind === 'image') {
        return typeof value === 'string' && value !== '' ? (value.split('?')[0]?.split('/').pop() ?? '') : ''
    }

    // A table as its lines read: the headings, then each row, cells apart.
    if (field.kind === 'grid' && value !== null && typeof value === 'object') {
        const table = value as { head?: unknown; rows?: unknown }
        const rows = Array.isArray(table.rows) ? (table.rows as unknown[]) : []

        return [table.head, ...rows]
            .map((row) => (Array.isArray(row) ? row.filter((cell): cell is string => typeof cell === 'string').join(' | ') : ''))
            .join('\n')
            .trim()
    }

    return words(value)
}

/**
 * Where an error of the publish check sits, named as the diff names places: „Titel", „Einstieg ·
 * Überschrift", „Abschnitt 3 · Text", „Versprechen 2 · Titel". The server's message is said under
 * the field without a place; the summary above the fields puts the two together. Empty for an
 * error about the page as a whole, whose sentence stands on its own.
 */
export function placeOf(schema: PageSchema, blocks: ContentBlock[], path: string): string {
    const pageField = schema.page.find((field) => field.key === path)

    if (pageField) {
        return pageField.label
    }

    const match = /^blocks\.(\d+)\.data\.([^.]+)(?:\.(\d+)\.([^.]+))?$/.exec(path)

    if (!match) {
        return ''
    }

    const index = Number(match[1])
    const definition = schema.blocks.find((b) => b.type === blocks[index]?.type)
    const where = blockLabel(schema, blocks, index)

    if (!definition) {
        return where
    }

    if (match[3] !== undefined && definition.list) {
        const field = definition.list.fields.find((f) => f.key === match[4])

        return `${definition.list.itemLabel} ${Number(match[3]) + 1}${field ? ` · ${field.label}` : ''}`
    }

    // A table's rows are said at the table, under the field that holds its headings.
    const field = definition.fields.find((f) => f.key === match[2] || (match[2] === 'rows' && f.kind === 'grid'))

    return field ? `${where} · ${field.label}` : where
}

/** The id a field's input carries, stable per position, so a server error can find its field. */
export function fieldId(path: string): string {
    return `pg-${path.replace(/[^a-zA-Z0-9]+/g, '-')}`
}

/**
 * A guard for buttons that change a list's structure. The second click of a double-click lands on whatever just moved
 * into the place — it would remove that one too, or move it back (SEI-24, SEI-33). A pointer's click within 400 ms of
 * the last change is taken once; a key press (`detail` 0) always, since focus follows what it moved.
 */
export function clickGuard(): (event?: MouseEvent) => boolean {
    let last = Number.NEGATIVE_INFINITY

    return (event?: MouseEvent): boolean => {
        const now = performance.now()

        if (event !== undefined && event.detail > 0 && (event.detail > 1 || now - last < 400)) {
            return false
        }

        last = now

        return true
    }
}

/** A list with one element put in at a place: `at` past the end appends. */
export function insertAt<T>(list: T[], at: number, item: T): T[] {
    const next = [...list]
    next.splice(Math.min(at, next.length), 0, item)

    return next
}

/** Moves one element of a list by one place; out of bounds leaves the list as it is. */
export function move<T>(list: T[], from: number, to: number): T[] {
    if (to < 0 || to >= list.length || from === to) {
        return list
    }

    const next = [...list]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item as T)

    return next
}
