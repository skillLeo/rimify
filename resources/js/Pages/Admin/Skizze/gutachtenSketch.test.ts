import { describe, expect, it } from 'vitest'
import { CODES, initialCells, type Cell } from './gutachtenDemo'
import { applyPaste, cellDone, cellSummary, copyCell, copyPreview, duplicateLines, lineId, pairWarnings, paperSizes, reserveLineIds, undescribedCodes, unreadableLines } from './gutachtenSketch'
import { readPaste } from './tyreInput'

function cell(id: string): Cell {
    const found = initialCells().find((c) => c.groupId === id)

    if (found === undefined) {
        throw new Error(id)
    }

    return found
}

describe('a cell, as the to-do list and step 5 name it', () => {
    it('counts tyres and pairs, or says it is empty', () => {
        expect(cellSummary(cell('m3'))).toBe('2 Reifen · 1 Kombination')
        expect(cellSummary(cell('x3'))).toBe('noch leer')
        expect(cellSummary({ ...cell('x3'), tyres: [{ id: 9, text: '235/50 R18', codes: [], kw: '', axle: 'ALL' }] })).toBe('1 Reifen')
    })
})

describe('„Kopieren nach …"', () => {
    it('replaces the target with the source and marks it as copied', () => {
        const copied = copyCell(cell('m3'), { ...cell('x3'), tyres: [{ id: 9, text: '235/50 R18', codes: [], kw: '', axle: 'ALL' }] }, 'ersetzen', 'BMW M3')

        expect(copied.tyres.map((line) => line.text)).toEqual(['225/40 R18 88W', '255/35 R18 90W'])
        expect(copied.pairs.map((pair) => `${pair.front} | ${pair.rear}`)).toEqual(['225/40 R18 | 255/35 R18'])
        expect(copied.general).toEqual(cell('m3').general)
        expect(copied.copiedFrom).toBe('BMW M3')
        expect(copied.groupId).toBe('x3')
    })

    it('adds only what the target does not hold yet', () => {
        const target = { ...cell('x3'), tyres: [{ id: 9, text: '225/40 R18 88W', codes: ['11A'], kw: '', axle: 'ALL' as const }], general: ['10B'] }
        const copied = copyCell(cell('m3'), target, 'hinzufuegen', 'BMW M3')

        expect(copied.tyres.map((line) => line.text)).toEqual(['225/40 R18 88W', '255/35 R18 90W'])
        expect(copied.tyres[0]?.codes).toEqual(['11A'])
        expect(copied.general[0]).toBe('10B')
        expect(new Set(copied.general).size).toBe(copied.general.length)
    })

    it('gives every copied line an id of its own, so editing one never edits the other', () => {
        const source = cell('m3')
        const copied = copyCell(source, cell('x3'), 'ersetzen', 'BMW M3')

        expect(copied.tyres.map((line) => line.id)).not.toEqual(source.tyres.map((line) => line.id))
        copied.tyres[0]!.codes.push('99Z')
        expect(source.tyres[0]!.codes).not.toContain('99Z')
    })
})

describe('the soft warnings, never a block', () => {
    it('lists the codes used but not described yet, once each, in the paper order', () => {
        expect(undescribedCodes(initialCells(), CODES)).toEqual(['721', '725', '74A'])
    })

    it('names a pair size the paper does not list for this wheel size', () => {
        const m3 = cell('m3')
        const sizes = paperSizes(initialCells())

        expect(pairWarnings(m3, sizes)).toEqual([])
        expect(pairWarnings({ ...m3, pairs: [{ id: 5, front: '225/40 R18', rear: '265/35 R18', codes: ['68L'] }] }, sizes)).toEqual([
            { id: 5, text: 'Die hintere Reifengröße ist zu diesem Gutachten noch nicht als Reifen erfasst. Steht sie dort nicht, braucht sie eine andere Felgengröße.' },
        ])
    })

    it('finds a size typed twice on one row, whatever its minimum', () => {
        const m3 = cell('m3')
        const twice = { ...m3, tyres: [...m3.tyres, { id: 7, text: '225/40R18', codes: [], kw: '', axle: 'ALL' as const }] }

        expect(duplicateLines(twice)).toEqual([7])
        expect(duplicateLines(m3)).toEqual([])
    })

    it('does not count a size twice when the paper splits it by power', () => {
        const z3 = {
            ...cell('z3'),
            tyres: [
                { id: 1, text: '225/40 R18 88', codes: [], kw: '85-142', axle: 'ALL' as const },
                { id: 2, text: '225/40 R18 88', codes: [], kw: '170-170', axle: 'ALL' as const },
            ],
        }

        expect(duplicateLines(z3)).toEqual([])
    })
})

describe('„Mehrere einfügen" into a cell', () => {
    it('adds sizes as tyre lines and pairs as pair lines, normalised, and leaves out what did not read', () => {
        const filled = applyPaste(cell('z3'), readPaste('225/40R18-88\nNr. 1: 225/40R18 – 255/35R18\nunlesbar'))

        expect(filled.tyres.map((line) => line.text)).toEqual(['225/40 R18 88'])
        expect(filled.pairs.map((pair) => `${pair.front} | ${pair.rear}`)).toEqual(['225/40 R18 | 255/35 R18'])
        expect(filled.copiedFrom).toBeNull()
    })
})

describe('what the interaction review found (D-386)', () => {
    it('never hands out a line id a restored session already holds', () => {
        const restored = { ...cell('x3'), tyres: [{ id: 999_999, text: '235/50 R18', codes: [], kw: '', axle: 'ALL' as const }] }

        reserveLineIds([restored])

        expect(lineId()).toBeGreaterThan(999_999)
    })

    it('counts a row as done only for a line it can read', () => {
        expect(cellDone({ ...cell('x3'), tyres: [{ id: 1, text: 'abc', codes: [], kw: '', axle: 'ALL' }] })).toBe(false)
        expect(cellDone({ ...cell('x3'), tyres: [{ id: 1, text: '', codes: [], kw: '', axle: 'ALL' }] })).toBe(false)
        expect(cellDone({ ...cell('x3'), tyres: [{ id: 1, text: '235/50R18', codes: [], kw: '', axle: 'ALL' }] })).toBe(true)
        expect(unreadableLines({ ...cell('x3'), tyres: [{ id: 4, text: 'abc', codes: [], kw: '', axle: 'ALL' }], pairs: [{ id: 5, front: '225/40 R18', rear: 'Quatsch', codes: [] }] })).toEqual([4, 5])
    })

    it('keeps the target its own page: each row of a paper stands on its own page', () => {
        const z3 = { ...cell('z3'), page: '' }

        expect(copyCell(cell('m3'), z3, 'ersetzen', 'BMW M3').page).toBe('')
    })

    it('says what an added copy really adds — and when it adds nothing', () => {
        const same = copyCell(cell('m3'), cell('x3'), 'ersetzen', 'BMW M3')

        expect(copyPreview(cell('m3'), [same], 'hinzufuegen')).toBe('Nichts kommt hinzu: Alles steht dort schon.')
        expect(copyPreview(cell('m3'), [cell('x3'), cell('z3')], 'hinzufuegen')).toBe('Hinzu kommen insgesamt 4 Reifen und 2 Kombinationen, für 2 Fahrzeuggruppen.')
        expect(copyPreview(cell('m3'), [cell('x3')], 'ersetzen')).toBe('Ersetzt durch 2 Reifen und 1 Kombination für 1 Fahrzeuggruppe.')
    })

    it('warns of both sizes of a pair when neither stands among the tyre lines', () => {
        const pair = { ...cell('m3'), pairs: [{ id: 6, front: '215/35 R18', rear: '265/35 R18', codes: [] }] }

        expect(pairWarnings(pair, paperSizes(initialCells())).map((warning) => warning.text.split('.')[0])).toEqual([
            'Die vordere Reifengröße ist zu diesem Gutachten noch nicht als Reifen erfasst',
            'Die hintere Reifengröße ist zu diesem Gutachten noch nicht als Reifen erfasst',
        ])
    })
})
