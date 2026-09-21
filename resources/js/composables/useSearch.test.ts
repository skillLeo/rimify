import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { readRecent, remember, SEARCH_DEBOUNCE_MS, useSearch, type SearchResult } from './useSearch'

function result(query: string, total = 1): SearchResult {
    return { query, total, suggestion: null, groups: total ? [{ key: 'felgen', label: 'Felgen', items: [{ label: query, sub: null, href: '/felgen/x' }] }] : [] }
}

describe('useSearch', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
    })

    it('waits for the visitor to stop typing before it asks the server', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify(result('havanna')), { status: 200 }))
        vi.stubGlobal('fetch', fetchMock)

        const search = useSearch()
        search.run('h')
        search.run('ha')
        search.run('havanna')

        vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1)
        expect(fetchMock).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1)
        await vi.runAllTimersAsync()
        await nextTick()

        expect(fetchMock).toHaveBeenCalledTimes(1)
        const [firstCall] = fetchMock.mock.calls as unknown as [unknown[]]
        expect(String(firstCall[0])).toContain('q=havanna')
        expect(search.result.value?.query).toBe('havanna')
    })

    it('keeps the answer to the latest query when an earlier one arrives late', async () => {
        let resolveFirst: ((r: Response) => void) | undefined
        const fetchMock = vi
            .fn()
            .mockImplementationOnce(() => new Promise<Response>((resolve) => (resolveFirst = resolve)))
            .mockImplementationOnce(async () => new Response(JSON.stringify(result('bbs')), { status: 200 }))
        vi.stubGlobal('fetch', fetchMock)

        const search = useSearch()
        search.run('borbet')
        await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
        search.run('bbs')
        await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
        await vi.runAllTimersAsync()

        resolveFirst?.(new Response(JSON.stringify(result('borbet')), { status: 200 }))
        await vi.runAllTimersAsync()
        await nextTick()

        expect(search.result.value?.query).toBe('bbs')
    })

    it('clears everything when the field is emptied', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(result('oz')), { status: 200 })))

        const search = useSearch()
        search.run('oz')
        await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
        await vi.runAllTimersAsync()
        expect(search.result.value).not.toBeNull()

        search.run('   ')
        expect(search.result.value).toBeNull()
        expect(search.loading.value).toBe(false)
    })

    it('reports a server failure instead of showing stale results', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })))

        const search = useSearch()
        search.run('oz')
        await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
        await vi.runAllTimersAsync()

        expect(search.failed.value).toBe(true)
        expect(search.result.value).toBeNull()
    })
})

describe('recent searches', () => {
    beforeEach(() => localStorage.clear())

    it('remembers the last five distinct terms, newest first', () => {
        for (const term of ['a', 'b', 'c', 'd', 'e', 'f', 'b']) {
            remember(term)
        }

        expect(readRecent()).toEqual(['b', 'f', 'e', 'd', 'c'])
    })

    it('survives blocked storage', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('blocked')
        })

        expect(readRecent()).toEqual([])
        vi.restoreAllMocks()
    })
})
