import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { COMPARE_STORAGE_KEY, compareKey, parseStored, useCompare, type CompareEntry } from './compare'

function entry(n: number, finish = 1): CompareEntry {
    return {
        modelId: n,
        finishId: finish,
        slug: `modell-${n}`,
        brandName: 'Demo',
        modelName: `Modell ${n}`,
        finishName: 'Silber',
        image: null,
        fromPriceCents: 68900 + n,
    }
}

describe('useCompare', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        window.localStorage.clear()
    })

    it('adds up to four wheels, in order, and says when one is already there', () => {
        const store = useCompare()

        expect(store.add(entry(1))).toBe('added')
        expect(store.add(entry(2))).toBe('added')
        expect(store.add(entry(1))).toBe('present')
        expect(store.keys).toEqual(['1:1', '2:1'])
        expect(store.canCompare).toBe(true)
        expect(store.query).toBe('1:1,2:1')
    })

    it('refuses a fifth wheel', () => {
        const store = useCompare()

        for (let n = 1; n <= 4; n++) {
            expect(store.add(entry(n))).toBe('added')
        }

        expect(store.isFull).toBe(true)
        expect(store.add(entry(5))).toBe('full')
        expect(store.count).toBe(4)
    })

    it('removes, toggles and clears', () => {
        const store = useCompare()

        store.add(entry(1))
        store.add(entry(2))
        store.remove('1:1')
        expect(store.keys).toEqual(['2:1'])

        expect(store.toggle(entry(2))).toBe('removed')
        expect(store.toggle(entry(2))).toBe('added')
        expect(store.has('2:1')).toBe(true)

        store.clear()
        expect(store.items).toEqual([])
        expect(store.canCompare).toBe(false)
    })

    it('tells two finishes of one model apart', () => {
        const store = useCompare()

        store.add(entry(1, 1))
        store.add(entry(1, 2))

        expect(store.keys).toEqual(['1:1', '1:2'])
        expect(compareKey(entry(7, 3))).toBe('7:3')
    })

    it('persists to one versioned key once hydrated, and never before', () => {
        const store = useCompare()

        store.add(entry(1))
        expect(window.localStorage.getItem(COMPARE_STORAGE_KEY)).toBeNull()

        store.hydrate()
        store.add(entry(2))

        const stored = JSON.parse(window.localStorage.getItem(COMPARE_STORAGE_KEY) ?? '{}') as { v: number; items: CompareEntry[] }
        expect(stored.v).toBe(1)
        expect(stored.items.map(compareKey)).toEqual(['2:1'])
    })

    it('hydrates from storage on the client only', () => {
        window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify({ v: 1, items: [entry(3), entry(4)] }))
        const store = useCompare()

        // Before mount the tray is empty — the server rendered it that way.
        expect(store.items).toEqual([])

        store.hydrate()
        expect(store.keys).toEqual(['3:1', '4:1'])
        expect(store.hydrated).toBe(true)
    })

    it('hydrates once: a second call keeps what was added since', () => {
        window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify({ v: 1, items: [entry(3)] }))
        const store = useCompare()

        store.hydrate()
        store.add(entry(4))
        store.hydrate()

        expect(store.keys).toEqual(['3:1', '4:1'])
    })

    it('follows the other tab through the storage event', () => {
        const store = useCompare()
        store.hydrate()

        window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify({ v: 1, items: [entry(9)] }))
        window.dispatchEvent(new StorageEvent('storage', { key: COMPARE_STORAGE_KEY }))

        expect(store.keys).toEqual(['9:1'])
    })

    it('replaces the list with the page\'s own', () => {
        const store = useCompare()
        store.hydrate()
        store.add(entry(1))

        store.replace([entry(5), entry(6), entry(6)])

        expect(store.keys).toEqual(['5:1', '6:1'])
        expect(JSON.parse(window.localStorage.getItem(COMPARE_STORAGE_KEY) ?? '{}').items).toHaveLength(2)
    })

    it('drops anything stored that is not the current shape', () => {
        expect(parseStored(null)).toEqual([])
        expect(parseStored('not json')).toEqual([])
        expect(parseStored(JSON.stringify({ v: 0, items: [entry(1)] }))).toEqual([])
        expect(parseStored(JSON.stringify({ v: 1, items: [{ modelId: 'x' }] }))).toEqual([])
        expect(parseStored(JSON.stringify({ v: 1, items: [entry(1), entry(1), entry(2)] })).map(compareKey)).toEqual(['1:1', '2:1'])
        expect(parseStored(JSON.stringify({ v: 1, items: [1, 2, 3, 4, 5].map((n) => entry(n)) }))).toHaveLength(4)
    })
})
