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

/** A new, empty block of a type, including an empty list where the type has one. */
export function emptyBlock(block: SchemaBlock): ContentBlock {
    const data: BlockData = { ...emptyItem(block.fields) }

    if (block.list) {
        data[block.list.key] = [emptyItem(block.list.fields)]
    }

    return { type: block.type, data }
}

/** The one repeatable block type of a page, if it has one (guide and legal sections). */
export function repeatable(schema: PageSchema): SchemaBlock | null {
    return schema.blocks.find((block) => block.repeat) ?? null
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

/* Equal as the server will store them: a trailing space typed into a field is no change. */
function same(a: unknown, b: unknown): boolean {
    const x = typeof a === 'string' ? normalised(a) : (a ?? null)
    const y = typeof b === 'string' ? normalised(b) : (b ?? null)

    return x === y
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

/** A block's or an item's words in reading order, for a place that is new or gone as a whole. */
function allWords(data: Record<string, unknown> | undefined, fields: SchemaField[]): string {
    return fields
        .filter((field) => field.kind !== 'icon')
        .map((field) => words(data?.[field.key]))
        .filter((text) => text !== '')
        .join('\n\n')
}

/** The labels of every changed place — what the Protokoll's sentence names. */
export function changes(schema: PageSchema, before: PageContent, after: PageContent): string[] {
    return diff(schema, before, after).map((change) => change.label)
}

/**
 * Every place where `after` differs from `before`, in reading order, with its words: „Titel",
 * „Einstieg · Überschrift", „Abschnitt 3 · Text", „Abschnitt 7 (neu)", „Versprechen 2 (entfernt)".
 * Positional, like the server: a section moved up reads as the two places it changed.
 */
export function diff(schema: PageSchema, before: PageContent, after: PageContent): Change[] {
    const out: Change[] = []

    for (const field of schema.page) {
        const key = field.key as 'title' | 'metaDescription'

        if (!same(before[key] ?? '', after[key] ?? '')) {
            out.push({ label: field.label, before: words(before[key]), after: words(after[key]) })
        }
    }

    const seen: Record<string, number> = {}
    const total = Math.max(before.blocks.length, after.blocks.length)

    for (let i = 0; i < total; i++) {
        const old = before.blocks[i]
        const now = after.blocks[i]
        const type = (now ?? old)?.type ?? ''
        const definition = schema.blocks.find((b) => b.type === type)

        if (!definition) {
            continue
        }

        seen[type] = (seen[type] ?? 0) + 1
        const where = definition.repeat ? `${definition.label} ${seen[type]}` : definition.label

        if (!old || old.type !== type) {
            out.push({ label: `${where} (neu)`, before: '', after: allWords(now?.data, definition.fields) })
            continue
        }

        if (!now) {
            out.push({ label: `${where} (entfernt)`, before: allWords(old.data, definition.fields), after: '' })
            continue
        }

        for (const field of definition.fields) {
            if (!same(old.data[field.key], now.data[field.key])) {
                out.push({ label: `${where} · ${field.label}`, before: shown(field, old.data[field.key]), after: shown(field, now.data[field.key]) })
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

    return out
}

/** A value as a person reads it: a glyph by its name („Werkzeug"), anything else as written. */
function shown(field: SchemaField, value: unknown): string {
    if (field.kind === 'icon') {
        return field.options?.find((option) => option.value === value)?.label ?? words(value)
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

    const field = definition.fields.find((f) => f.key === match[2])

    return field ? `${where} · ${field.label}` : where
}

/** The id a field's input carries, stable per position, so a server error can find its field. */
export function fieldId(path: string): string {
    return `pg-${path.replace(/[^a-zA-Z0-9]+/g, '-')}`
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
