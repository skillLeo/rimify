import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const visits: { path: string; data: Record<string, unknown> }[] = []

vi.mock('@inertiajs/vue3', () => ({
    router: {
        get: (path: string, data: Record<string, unknown>) => {
            visits.push({ path, data })
        },
    },
}))

const { useListingFilters } = await import('./useListingFilters')

describe('useListingFilters', () => {
    beforeEach(() => {
        visits.length = 0
    })

    it('adds and removes a facet value, and drops the page number on every change', () => {
        // A ref, because the real source is the page props: reactive, and re-read after each visit.
        const state = ref<Record<string, unknown>>({ zoll: ['18'], seite: 3 })
        const filters = useListingFilters(() => state.value)

        filters.toggle('zoll', '19')
        expect(visits[0]?.data).toEqual({ zoll: ['18', '19'] })

        state.value = visits[0]!.data
        filters.toggle('zoll', '18')
        expect(visits[1]?.data).toEqual({ zoll: ['19'] })
    })

    it('removes the facet key entirely when its last value is deselected', () => {
        const filters = useListingFilters(() => ({ marke: ['BBS'] }))

        filters.toggle('marke', 'BBS')
        expect(visits[0]?.data).toEqual({})
    })

    it('toggles the entry-free flag as a bare 1 and removes it again', () => {
        const filters = useListingFilters(() => ({}))
        filters.toggleEntry()
        expect(visits[0]?.data).toEqual({ ohne_eintragung: 1 })

        const on = useListingFilters(() => ({ ohne_eintragung: true }))
        on.toggleEntry()
        expect(visits[1]?.data).toEqual({})
    })

    it('writes the page into the query and omits it for page one', () => {
        const filters = useListingFilters(() => ({ zoll: ['18'] }))

        filters.goToPage(2)
        expect(visits[0]?.data).toEqual({ zoll: ['18'], seite: 2 })

        filters.goToPage(1)
        expect(visits[1]?.data).toEqual({ zoll: ['18'] })
    })

    it('resets to an empty query on the listing path', () => {
        const filters = useListingFilters(() => ({ zoll: ['18'], marke: ['BBS'] }), '/felgen')

        filters.reset()
        expect(visits[0]).toEqual({ path: '/felgen', data: {} })
    })
})
