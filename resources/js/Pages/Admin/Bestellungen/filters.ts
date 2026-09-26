/**
 * The Bestellungen filter form, kept apart from the page so its rules are tested.
 *
 * The days are the admin's shared rules (composables/admin/days.ts). Amounts travel as they were
 * typed — `1.425,50` — and the server reads them with the same parser that reads every price in the
 * admin, so the page never turns a German number into a float of its own.
 */

import { rangeForm, rangeQuery, type Zeitraum } from '../../../composables/admin/days'
import type { OrderFilters, OrderSort } from '../../../types/admin/bestellungen'

export interface FilterForm {
    status: string
    zeitraum: Zeitraum
    von: string
    bis: string
    zahlart: string
    versandart: string
    min: string
    max: string
    auflagen: boolean
}

export function formFromFilters(filters: OrderFilters, today: string): FilterForm {
    return {
        status: filters.status,
        ...rangeForm(filters.von || null, filters.bis || null, today),
        zahlart: filters.zahlart,
        versandart: filters.versandart,
        min: filters.min,
        max: filters.max,
        auflagen: filters.auflagen,
    }
}

/**
 * The query for the form, the search and the sort in force — or the German sentence that says what
 * is wrong with an own date range. Defaults are left out, so the plain list is the bare URL.
 */
export function queryFromForm(
    form: FilterForm,
    search: string,
    sort: { sort: OrderSort; richtung: 'auf' | 'ab' },
    today: string
): { query: Record<string, string> } | { error: string } {
    const range = rangeQuery(form, today)

    if ('error' in range) {
        return range
    }

    const query: Record<string, string> = {}
    const q = search.trim()

    if (q) {
        query.q = q
    }

    if (form.status) {
        query.status = form.status
    }

    Object.assign(query, range.query)

    for (const key of ['zahlart', 'versandart', 'min', 'max'] as const) {
        const value = form[key].trim()

        if (value) {
            query[key] = value
        }
    }

    if (form.auflagen) {
        query.auflagen = '1'
    }

    return { query: { ...query, ...sortQuery(sort) } }
}

/** The sort as query parameters; the default — newest first — is the bare URL. */
export function sortQuery(sort: { sort: OrderSort; richtung: 'auf' | 'ab' }): Record<string, string> {
    return sort.sort === 'datum' && sort.richtung === 'ab' ? {} : { sort: sort.sort, richtung: sort.richtung }
}

/**
 * Clicking a column heading: the same column turns its direction around; another column starts
 * with what a person looks for first there — the newest, the largest, the earliest step.
 */
export function nextSort(current: { sort: OrderSort; richtung: 'auf' | 'ab' }, column: OrderSort): { sort: OrderSort; richtung: 'auf' | 'ab' } {
    if (current.sort === column) {
        return { sort: column, richtung: current.richtung === 'ab' ? 'auf' : 'ab' }
    }

    return { sort: column, richtung: column === 'status' ? 'auf' : 'ab' }
}

/** How many filters are on — for the phone's "Filter · 2". The search is its own field. */
export function activeCount(filters: OrderFilters): number {
    return [
        filters.status,
        filters.von || filters.bis,
        filters.zahlart,
        filters.versandart,
        filters.min || filters.max,
        filters.auflagen,
    ].filter(Boolean).length
}
