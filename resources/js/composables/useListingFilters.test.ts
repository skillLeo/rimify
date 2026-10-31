import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const visits: { path: string; data: Record<string, unknown>; finish?: () => void }[] = []

vi.mock('@inertiajs/vue3', () => ({
    router: {
        get: (path: string, data: Record<string, unknown>, options?: { onFinish?: () => void }) => {
            visits.push({ path, data, finish: options?.onFinish })
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

    it('adds up taps made before the first answer arrives (HQ-26)', () => {
        // The page's filters do not move until an answer is on screen; the second tap cancels the first visit.
        const filters = useListingFilters(() => ({}))

        filters.toggle('zoll', '16')
        filters.toggle('zoll', '17')
        expect(visits[1]?.data).toEqual({ zoll: ['16', '17'] })

        filters.toggleEntry()
        expect(visits[2]?.data).toEqual({ zoll: ['16', '17'], ohne_eintragung: 1 })
    })

    it('reads the page again once its answer is on screen', () => {
        const state = ref<Record<string, unknown>>({})
        const filters = useListingFilters(() => state.value)

        filters.toggle('zoll', '16')
        // A cancelled visit finishing late leaves the newer one in charge.
        filters.toggle('zoll', '17')
        visits[0]!.finish?.()
        filters.toggle('zoll', '18')
        expect(visits[2]?.data).toEqual({ zoll: ['16', '17', '18'] })

        visits[2]!.finish?.()
        state.value = { marke: ['MOTEC'] }
        filters.toggle('zoll', '19')
        expect(visits[3]?.data).toEqual({ marke: ['MOTEC'], zoll: ['19'] })
    })

    it('removes the facet key entirely when its last value is deselected', () => {
        const filters = useListingFilters(() => ({ marke: ['MOTEC'] }))

        filters.toggle('marke', 'MOTEC')
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
        const filters = useListingFilters(() => ({ zoll: ['18'], marke: ['MOTEC'] }), '/felgen')

        filters.reset()
        expect({ path: visits[0]?.path, data: visits[0]?.data }).toEqual({ path: '/felgen', data: {} })
    })
})
