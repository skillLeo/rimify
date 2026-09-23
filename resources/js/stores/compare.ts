/**
 * The compare list: up to four wheels, held side by side (docs/design/sections/home-overhaul.md §2.1).
 *
 * Module state survives every Inertia navigation; `localStorage` survives a reload and reaches
 * the other tabs through the `storage` event. The server never sees this list — `/vergleich`
 * takes the keys in its query so a comparison is a link one can send — which is also why nothing
 * here reads the browser during SSR or hydration: the first frame is rendered with an empty
 * tray, and `hydrate()` fills it from storage in the layout's `onMounted`.
 *
 * Every item carries what the tray needs to draw it without a request: names, the cut-out, the
 * price. The key is `modelId:finishId`, the same string the query carries.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ImageManifest } from '../Components/Ui/Picture.vue'

export const COMPARE_CAP = 4

/** The cap sentence, shown when a fifth wheel is asked for (copy-editor-de). */
export const COMPARE_CAP_TEXT = 'Höchstens 4 Felgen im Vergleich – entferne eine, um eine andere hinzuzufügen.'

/** The storage key; the version inside the payload lets a later shape drop an older one. */
export const COMPARE_STORAGE_KEY = 'rmf_compare'

const STORAGE_VERSION = 1

export interface CompareEntry {
    modelId: number
    finishId: number
    slug: string
    brandName: string
    modelName: string
    finishName: string
    image: ImageManifest | null
    fromPriceCents: number
}

export type AddResult = 'added' | 'full' | 'present'

export function compareKey(entry: Pick<CompareEntry, 'modelId' | 'finishId'>): string {
    return `${entry.modelId}:${entry.finishId}`
}

/** What one stored entry must look like to be trusted; a malformed one is dropped, never repaired. */
function isEntry(value: unknown): value is CompareEntry {
    if (value === null || typeof value !== 'object') {
        return false
    }

    const v = value as Record<string, unknown>

    return (
        Number.isInteger(v.modelId) &&
        Number.isInteger(v.finishId) &&
        typeof v.slug === 'string' &&
        typeof v.brandName === 'string' &&
        typeof v.modelName === 'string' &&
        typeof v.finishName === 'string' &&
        typeof v.fromPriceCents === 'number' &&
        (v.image === null || (typeof v.image === 'object' && v.image !== null))
    )
}

/** The stored payload, read defensively: anything unexpected is an empty list. */
export function parseStored(raw: string | null): CompareEntry[] {
    if (raw === null || raw === '') {
        return []
    }

    try {
        const parsed = JSON.parse(raw) as { v?: unknown; items?: unknown }

        if (parsed === null || typeof parsed !== 'object' || parsed.v !== STORAGE_VERSION || !Array.isArray(parsed.items)) {
            return []
        }

        const seen = new Set<string>()
        const out: CompareEntry[] = []

        for (const item of parsed.items) {
            if (!isEntry(item) || seen.has(compareKey(item))) {
                continue
            }

            seen.add(compareKey(item))
            out.push(item)

            if (out.length === COMPARE_CAP) {
                break
            }
        }

        return out
    } catch {
        return []
    }
}

function serialise(items: CompareEntry[]): string {
    return JSON.stringify({ v: STORAGE_VERSION, items })
}

export const useCompare = defineStore('compare', () => {
    const items = ref<CompareEntry[]>([])
    /** True once storage has been read on the client; nothing is written before that. */
    const hydrated = ref(false)

    let listening = false

    const keys = computed(() => items.value.map(compareKey))
    const count = computed(() => items.value.length)
    const isFull = computed(() => items.value.length >= COMPARE_CAP)
    const canCompare = computed(() => items.value.length >= 2)
    /** The query string `/vergleich` takes. */
    const query = computed(() => keys.value.join(','))

    function has(key: string): boolean {
        return keys.value.includes(key)
    }

    function persist(): void {
        if (!hydrated.value || typeof window === 'undefined') {
            return
        }

        try {
            window.localStorage.setItem(COMPARE_STORAGE_KEY, serialise(items.value))
        } catch {
            // Storage refused (private mode, quota): the list still lives for this page.
        }
    }

    function add(entry: CompareEntry): AddResult {
        if (has(compareKey(entry))) {
            return 'present'
        }

        if (isFull.value) {
            return 'full'
        }

        items.value = [...items.value, entry]
        persist()

        return 'added'
    }

    function remove(key: string): void {
        if (!has(key)) {
            return
        }

        items.value = items.value.filter((item) => compareKey(item) !== key)
        persist()
    }

    function clear(): void {
        if (items.value.length === 0) {
            return
        }

        items.value = []
        persist()
    }

    /** Tick or untick: the card's checkbox. Returns what `add` would, or `'removed'`. */
    function toggle(entry: CompareEntry): AddResult | 'removed' {
        if (has(compareKey(entry))) {
            remove(compareKey(entry))

            return 'removed'
        }

        return add(entry)
    }

    /** The page's own list wins: a shared link and the tray must agree. */
    function replace(entries: CompareEntry[]): void {
        const seen = new Set<string>()
        const next: CompareEntry[] = []

        for (const entry of entries) {
            if (!seen.has(compareKey(entry))) {
                seen.add(compareKey(entry))
                next.push(entry)
            }

            if (next.length === COMPARE_CAP) {
                break
            }
        }

        items.value = next
        persist()
    }

    function readStorage(): void {
        try {
            items.value = parseStored(window.localStorage.getItem(COMPARE_STORAGE_KEY))
        } catch {
            items.value = []
        }
    }

    /**
     * Read the list the browser kept, and keep listening for the other tabs. Client only, from
     * `onMounted`: the server renders an empty tray and the client's first frame is the same.
     * Once: a second caller (a page mounting beside the tray) changes nothing.
     */
    function hydrate(): void {
        if (typeof window === 'undefined' || hydrated.value) {
            return
        }

        readStorage()
        hydrated.value = true

        if (!listening) {
            listening = true
            window.addEventListener('storage', (event: StorageEvent) => {
                if (event.key === COMPARE_STORAGE_KEY || event.key === null) {
                    readStorage()
                }
            })
        }
    }

    return { items, keys, count, isFull, canCompare, query, hydrated, has, add, remove, clear, toggle, replace, hydrate }
})
