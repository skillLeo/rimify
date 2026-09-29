/**
 * The Protokoll's filter form, kept apart from the page so the arithmetic is tested.
 *
 * The days themselves — Berlin days, German input, the presets — are the admin's shared rules
 * (composables/admin/days.ts); this adds the Protokoll's own two filters, person and area.
 */

import type { ProtokollFilters } from '../../../types/admin/protokoll'
import { rangeForm, rangeQuery, type Zeitraum } from '../../../composables/admin/days'

export { berlinToday, formatGermanDay, parseGermanDay, presetRange, shiftDay, type Zeitraum } from '../../../composables/admin/days'

export interface FilterForm {
    person: string
    bereich: string
    zeitraum: Zeitraum
    /** Only for `eigen`: what the person typed, TT.MM.JJJJ. */
    von: string
    bis: string
}

/** The form that shows the filters the server applied: a preset where they match one, else an own range. */
export function formFromFilters(filters: ProtokollFilters, today: string): FilterForm {
    return { person: filters.person ?? '', bereich: filters.bereich ?? '', ...rangeForm(filters.von, filters.bis, today) }
}

/**
 * The query the form asks for, or the German sentence that says what is wrong with an own range.
 * Empty values are left out, so an unfiltered log is the bare URL.
 */
export function queryFromForm(form: FilterForm, today: string): { query: Record<string, string> } | { error: string } {
    const range = rangeQuery(form, today)

    if ('error' in range) {
        return range
    }

    const query: Record<string, string> = { ...range.query }

    if (form.person) {
        query.person = form.person
    }

    if (form.bereich) {
        query.bereich = form.bereich
    }

    return { query }
}

/** How many filters are on — for the phone's "Filter · 2". */
export function activeCount(filters: ProtokollFilters): number {
    return [filters.person, filters.bereich, filters.von || filters.bis].filter(Boolean).length
}
