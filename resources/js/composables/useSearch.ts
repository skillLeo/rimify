/**
 * The instant search, as the header field and the command palette use it.
 *
 * Typing is debounced by 120 ms, a request still in flight is aborted when the next one starts,
 * and a response that arrives out of order is dropped — the list on screen is always the answer
 * to what is in the field now.
 */

import { onBeforeUnmount, ref, type Ref } from 'vue'

export interface SearchItem {
    label: string
    sub: string | null
    href: string
}

export interface SearchGroup {
    key: string
    label: string
    items: SearchItem[]
}

export interface SearchResult {
    query: string
    total: number
    suggestion: string | null
    groups: SearchGroup[]
}

export interface Search {
    readonly result: Ref<SearchResult | null>
    readonly loading: Ref<boolean>
    readonly failed: Ref<boolean>
    run(query: string): void
    clear(): void
}

export const SEARCH_DEBOUNCE_MS = 120

export function useSearch(): Search {
    const result = ref<SearchResult | null>(null)
    const loading = ref(false)
    const failed = ref(false)

    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined
    let sequence = 0

    function clear(): void {
        if (timer !== undefined) {
            clearTimeout(timer)
            timer = undefined
        }

        controller?.abort()
        controller = undefined
        result.value = null
        loading.value = false
        failed.value = false
    }

    async function fetchNow(query: string): Promise<void> {
        controller?.abort()
        controller = new AbortController()
        const mine = ++sequence
        loading.value = true
        failed.value = false

        try {
            const response = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
                signal: controller.signal,
            })

            if (mine !== sequence) {
                return
            }

            if (!response.ok) {
                failed.value = true
                result.value = null

                return
            }

            result.value = (await response.json()) as SearchResult
        } catch (error) {
            if ((error as { name?: string }).name === 'AbortError' || mine !== sequence) {
                return
            }

            failed.value = true
            result.value = null
        } finally {
            if (mine === sequence) {
                loading.value = false
            }
        }
    }

    function run(query: string): void {
        const trimmed = query.trim()

        if (timer !== undefined) {
            clearTimeout(timer)
        }

        if (trimmed === '') {
            clear()

            return
        }

        timer = setTimeout(() => {
            void fetchNow(trimmed)
        }, SEARCH_DEBOUNCE_MS)
    }

    onBeforeUnmount(clear)

    return { result, loading, failed, run, clear }
}

/** The recent searches a visitor made, kept in their own browser only. */
const RECENT_KEY = 'rmf.recent-searches'

export function readRecent(): string[] {
    try {
        const raw = localStorage.getItem(RECENT_KEY)
        const parsed: unknown = raw ? JSON.parse(raw) : []

        return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string').slice(0, 5) : []
    } catch {
        return []
    }
}

export function remember(query: string): void {
    try {
        const next = [query, ...readRecent().filter((q) => q !== query)].slice(0, 5)
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {
        // A private window or blocked storage: the search still works, it is just not remembered.
    }
}
