/**
 * What a saved view's state *means*, so two states that mean the same compare equal (SV-13): `1000`,
 * `1.000`, ` 1000 ` and the number 1000 are one amount; `null`, `''` and a missing key are one
 * absence; the order of keys and of a list's entries means nothing.
 *
 * Used on both sides of the dirty check — the view as saved and the filters on screen — and never on
 * formatted strings: compare meanings, not spellings.
 */

import { parseNumber } from './num'

export type ViewValue = string | number | boolean | ViewValue[] | { [key: string]: ViewValue }

function normalizeValue(value: unknown): ViewValue | undefined {
    if (value === null || value === undefined) {
        return undefined
    }

    if (typeof value === 'boolean' || typeof value === 'number') {
        return typeof value === 'number' && !Number.isFinite(value) ? undefined : value
    }

    if (typeof value === 'string') {
        const text = value.trim()

        if (text === '') {
            return undefined
        }

        if (text === 'true' || text === 'false') {
            return text === 'true'
        }

        return parseNumber(text) ?? text
    }

    if (Array.isArray(value)) {
        const items = value.map(normalizeValue).filter((item): item is ViewValue => item !== undefined)

        // A stable order by the entries' own meaning: a list of columns in another order is the same set.
        return items.sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : JSON.stringify(a) > JSON.stringify(b) ? 1 : 0))
    }

    if (typeof value === 'object') {
        return normalizeViewState(value as Record<string, unknown>)
    }

    return undefined
}

/** The state with its keys sorted, its numbers numbers, its booleans booleans and its blanks gone. */
export function normalizeViewState(state: Record<string, unknown>): { [key: string]: ViewValue } {
    const normalized: { [key: string]: ViewValue } = {}

    for (const key of Object.keys(state).sort()) {
        const value = normalizeValue(state[key])

        if (value !== undefined) {
            normalized[key] = value
        }
    }

    return normalized
}

/** Whether two states mean the same. */
export function sameViewState(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
    return JSON.stringify(normalizeViewState(a)) === JSON.stringify(normalizeViewState(b))
}
