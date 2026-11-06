import { describe, expect, it } from 'vitest'
import { blankLine, carLine, carSummary, createEntryStore, duplicateKeys, isPair, ownSizes, pairWarnings, refusedOf, toEditLine, typedFront, typedRear, type CarView, type EntryView } from './entryStore'

const car = (over: Partial<CarView>): CarView => ({
    id: 1,
    sizeId: 1,
    vehicleId: 1,
    label: 'BMW 3er',
    hsnTsn: null,
    kw: null,
    k: null,
    gone: false,
    lines: 0,
    pairs: 0,
    unread: 0,
    codes: 0,
    done: false,
    page: null,
    copiedFrom: null,
    unsourced: false,
    sourceLabel: null,
    axle: 'ALL',
    finish: null,
    conflict: false,
    ...over,
})

const entry = (cars: CarView[], wheelSizes: EntryView['wheelSizes'] = []): EntryView => ({ wheelSizes, cars, conflicts: [], unreachable: [], hasList: false, keptCombinations: 0, unread: [], undescribed: [], suggestion: null })

describe('a line of vorne + hinten (the client’s change of 05.11.2026)', () => {
    it('fills the rear with what is typed in front, until someone changes the rear', () => {
        const line = blankLine()

        typedFront(line, '225/40 R18')
        expect(line.rear).toBe('225/40 R18')

        typedRear(line, '255/35 R18')
        typedFront(line, '235/40 R18')
        expect(line.rear).toBe('255/35 R18')
        expect(line.follows).toBe(false)
    })

    it('follows again once the rear is emptied, or set to the front', () => {
        const line = blankLine('225/40 R18', '255/35 R18')

        typedRear(line, '')
        expect(line.follows).toBe(true)

        typedFront(line, '235/40 R18')
        expect(line.rear).toBe('235/40 R18')

        typedRear(line, '235/40 R18')
        expect(line.follows).toBe(true)
    })

    it('never fills the other side of a line that came with one side', () => {
        const line = toEditLine({ id: 5, front: '225/40 R18', rear: '', oneSided: true, kw: '', codes: [], frontOnRim: false, rearOnRim: false, outsideList: false, frontWhy: null, rearWhy: null })

        typedFront(line, '235/40 R18')

        expect(line.rear).toBe('')
    })

    it('takes a correction of a saved line of one size to both sides, and leaves a saved pair alone', () => {
        const server = { id: 5, oneSided: false, kw: '85-142', codes: ['K1'], frontOnRim: false, rearOnRim: false, outsideList: false, frontWhy: null, rearWhy: null }
        const same = toEditLine({ ...server, front: '225/40 R18', rear: '225/40 R18' })
        const pair = toEditLine({ ...server, front: '225/40 R18', rear: '255/35 R18' })

        typedFront(same, '225/45 R18')
        typedFront(pair, '235/40 R18')

        expect(same.rear).toBe('225/45 R18')
        expect(same.kw).toBe('85-142')
        expect(same.codes).toEqual(['K1'])
        expect(pair.rear).toBe('255/35 R18')
    })

    it('tells a pair from one size, whatever the figures say', () => {
        expect(isPair({ front: '225/40 R18 88W', rear: '225/40 R18 92Y' })).toBe(false)
        expect(isPair({ front: '225/40 R18', rear: '255/35 R18' })).toBe(true)
        expect(isPair({ front: '225/40 R18', rear: 'unleserlich' })).toBe(false)
    })
})

describe('what it warns of, never blocks', () => {
    it('names a side of a pair with no line of its own, and goes quiet once it has one or staff say it stands only here', () => {
        const pair = blankLine('225/40 R18', '255/35 R18')
        const own = blankLine('225/40 R18')

        expect(pairWarnings(pair, [pair, own])).toHaveLength(1)
        expect(pairWarnings(pair, [pair, own])[0]).toContain('Die hintere Größe')

        expect(pairWarnings(pair, [pair, own, blankLine('255/35 R18')])).toEqual([])

        pair.rearOnRim = true
        expect(pairWarnings(pair, [pair, own])).toEqual([])
    })

    it('says nothing of a line of one size', () => {
        const line = blankLine('225/40 R18')

        expect(pairWarnings(line, [line])).toEqual([])
    })

    it('knows which sizes stand on a line of their own', () => {
        expect([...ownSizes([blankLine('225/40 R18'), blankLine('235/40 R18', '255/35 R18')])]).toHaveLength(1)
    })

    it('finds a line typed twice, and does not take another band or other figures for it', () => {
        const first = blankLine('225/40 R18 88')
        const twice = blankLine('225/40R18 88')
        const figures = blankLine('225/40 R18 92')
        const banded = blankLine('225/40 R18 88')

        banded.kw = '85-142'

        expect(duplicateKeys([first, twice, figures, banded])).toEqual([twice.key])
    })
})

describe('what the server says of a side', () => {
    it('keeps its word for the text it was said of', () => {
        expect(refusedOf({ front: '225/40 R18 999', rear: '225/40 R18', frontWhy: 'Diesen Index kennt der Shop nicht.', rearWhy: null })).toEqual({
            front: { text: '225/40 R18 999', why: 'Diesen Index kennt der Shop nicht.' },
            rear: null,
        })
    })
})

describe('the to-do list', () => {
    it('keeps a car\'s key numbers and power whole in a narrow column, and its separators at the end of a line', () => {
        expect(carLine('BMW 1er 118i · 103 kW · HSN 0005 · TSN CLA')).toBe('BMW 1er 118i\u00A0· 103\u00A0kW\u00A0· HSN\u00A00005\u00A0· TSN\u00A0CLA')
    })

    it('says what a car holds, or that it is empty', () => {
        expect(carSummary({ lines: 0, pairs: 0, unread: 0 })).toBe('noch leer')
        expect(carSummary({ lines: 0, pairs: 0, unread: 1 })).toBe('nicht lesbar')
        expect(carSummary({ lines: 3, pairs: 1, unread: 0 })).toBe('2 Reifengrößen · 1 Kombination')
        expect(carSummary({ lines: 1, pairs: 0, unread: 0 })).toBe('1 Reifengröße')
    })

    it('goes on to the next car with nothing entered, round the end of the list, and stops when none is left', () => {
        const store = createEntryStore({ documentId: 1, entry: entry([car({ id: 1, done: true }), car({ id: 2, done: false }), car({ id: 3, done: true }), car({ id: 4, done: false })]), step: 3, car: 2, editable: true })

        expect(store.nextOpen(2)?.id).toBe(4)
        expect(store.nextOpen(4)?.id).toBe(2)

        store.state.entry = entry([car({ id: 1, done: true })])
        expect(store.nextOpen(1)).toBeUndefined()
    })

    it('opens a step once everything before it has been seen', () => {
        const store = createEntryStore({ documentId: 1, entry: entry([]), step: 0, car: null, editable: true })

        expect(store.furthest()).toBe(1)

        store.state.entry = entry([], [{ id: 1, wheelModelId: 1, configId: 1, wheel: 'x', wheelType: null, label: 'x', colours: [], printed: { type: null, width: null, diameter: null, et: null, holes: null, circle: null }, mismatch: [] }])
        expect(store.furthest()).toBe(2)

        store.state.entry = entry([car({ id: 1 })], store.state.entry.wheelSizes)
        expect(store.furthest()).toBe(4)
    })
})
