/**
 * The Felgen list's filter form and sort, kept apart from the page so their rules are tested. Defaults
 * are left out of every query, so the plain list is the bare URL.
 */

import { decimal } from '../../../format'
import type { WheelFilters, WheelSort } from '../../../types/admin/felgen'

export interface WheelFilterForm {
    status: string
    marke: string
    freigaben: string
    demo: string
    /** `fehlt`: the Felgen still without their Radtypenbezeichnung (D-298). */
    radtyp?: string
}

type Sort = { sort: WheelSort; richtung: 'auf' | 'ab' }

export function formFromFilters(filters: WheelFilters): WheelFilterForm {
    return { status: filters.status, marke: filters.marke, freigaben: filters.freigaben, demo: filters.demo, radtyp: filters.radtyp ?? '' }
}

export function queryFromForm(form: WheelFilterForm, search: string, sort: Sort): Record<string, string> {
    const query: Record<string, string> = {}
    const q = search.trim()

    if (q) {
        query.q = q
    }

    for (const key of ['status', 'marke', 'freigaben', 'demo', 'radtyp'] as const) {
        const value = form[key]

        if (value) {
            query[key] = value
        }
    }

    return { ...query, ...sortQuery(sort) }
}

/** The sort as query parameters; the default — by brand and name, A to Z — is the bare URL. */
export function sortQuery(sort: Sort): Record<string, string> {
    return sort.sort === 'name' && sort.richtung === 'auf' ? {} : { sort: sort.sort, richtung: sort.richtung }
}

/**
 * A column heading: the same column turns around; another starts with what a person looks for first —
 * names A to Z, the newest change, the lowest price, the most sizes.
 */
export function nextSort(current: Sort, column: WheelSort): Sort {
    if (current.sort === column) {
        return { sort: column, richtung: current.richtung === 'ab' ? 'auf' : 'ab' }
    }

    return { sort: column, richtung: column === 'name' || column === 'preis' ? 'auf' : 'ab' }
}

/** How many filters are on — for the phone's „Filter · 2“. The search is its own field. */
export function activeCount(filters: WheelFilters): number {
    return [filters.status, filters.marke, filters.freigaben, filters.demo, filters.radtyp].filter(Boolean).length
}

/** `3 Felgen`, `1 Felge` — German grouping through the one formatter (R-10). */
export function felgen(n: number): string {
    return `${decimal(n, 0)} ${n === 1 ? 'Felge' : 'Felgen'}`
}
