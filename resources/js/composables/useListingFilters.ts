/**
 * Filter state lives in the query string, never in a store.
 *
 * 726 results behind client-side state is unindexable, unshareable and impossible to get back to.
 * Writing every change to the URL means the back button works, a filtered listing can be sent to a
 * friend, and the server renders exactly what the link describes.
 */

import { router } from '@inertiajs/vue3'
import { computed, type ComputedRef } from 'vue'

/** What a facet can carry in the query string: a list of values, a flag, or a page number. */
export type FilterValue = string | number | boolean | string[]

export type FilterState = Record<string, FilterValue>

export interface ListingFilters {
    readonly current: ComputedRef<FilterState>
    toggle(facet: string, value: string): void
    toggleEntry(): void
    reset(): void
    goToPage(page: number): void
}

export function useListingFilters(
    filters: () => Record<string, unknown>,
    path = '/felgen'
): ListingFilters {
    const current = computed(() => filters() as FilterState)

    function visit(next: FilterState): void {
        // `preserveScroll` because the customer is looking at the filter they just changed, and
        // `replace` so a run of filter taps does not fill the history with near-identical entries.
        router.get(path, next, { preserveScroll: true, preserveState: true, replace: true })
    }

    function toggle(facet: string, value: string): void {
        const next = { ...current.value }
        const raw = next[facet]
        const values = Array.isArray(raw) ? raw.map(String) : []

        const updated = values.includes(value)
            ? values.filter((v) => v !== value)
            : [...values, value]

        if (updated.length === 0) {
            delete next[facet]
        } else {
            next[facet] = updated
        }

        // Any change to the filter set invalidates the page number: page 7 of a narrower result
        // set is usually empty, and an empty page reads as a broken filter.
        delete next.seite

        visit(next)
    }

    function toggleEntry(): void {
        const next = { ...current.value }

        if (next.ohne_eintragung === true) {
            delete next.ohne_eintragung
        } else {
            next.ohne_eintragung = 1
        }

        delete next.seite

        visit(next)
    }

    function reset(): void {
        visit({})
    }

    function goToPage(page: number): void {
        const next = { ...current.value }

        if (page <= 1) {
            delete next.seite
        } else {
            next.seite = page
        }

        router.get(path, next, { preserveState: true })
    }

    return { current, toggle, toggleEntry, reset, goToPage }
}
