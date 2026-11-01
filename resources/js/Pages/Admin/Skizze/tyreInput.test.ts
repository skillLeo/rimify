import { describe, expect, it } from 'vitest'
import { readPaste, readTyre, sizeKey, tyreLabel, whyUnread } from './tyreInput'

describe('readTyre: the notations a Gutachten prints (the brief §6)', () => {
    it.each([
        ['225/40R18 88W', '225/40 R18 88W', 88, 'W'],
        ['225/40 R18 88W', '225/40 R18 88W', 88, 'W'],
        ['225/40R18-88', '225/40 R18 88', 88, null],
        ['245/45R18 100', '245/45 R18 100', 100, null],
        ['235/50R18', '235/50 R18', null, null],
        ['255/35 R 18 90 W', '255/35 R18 90W', 90, 'W'],
    ])('%s reads as %s, with the load index and the symbol apart', (input, label, li, si) => {
        const tyre = readTyre(input)

        expect(tyre).not.toBeNull()
        expect(tyreLabel(tyre!)).toBe(label)
        expect(tyre!.li).toBe(li)
        expect(tyre!.si).toBe(si)
    })

    it('keeps a figure the paper does not give as not given, never a guess', () => {
        expect(readTyre('235/50R18')).toEqual({ width: 235, aspect: 50, diameter: 18, li: null, si: null })
    })

    it('reads lower case, no-break spaces and a symbol in brackets', () => {
        expect(tyreLabel(readTyre('225/40\u00a0zr18 (92y)')!)).toBe('225/40 R18 92Y')
    })

    it.each(['', 'Cabrio', '225/40', '225/40R18 88X', '2250/40R18', '225/40R18 88W 91Y'])('refuses %j rather than guess', (input) => {
        expect(readTyre(input)).toBeNull()
    })

    it('gives one key per size, whatever the minimum, for duplicates and pairs', () => {
        expect(sizeKey(readTyre('225/40R18 88W')!)).toBe(sizeKey(readTyre('225/40 R18')!))
        expect(sizeKey(readTyre('225/40R18')!)).not.toBe(sizeKey(readTyre('225/45R18')!))
    })
})

describe('readPaste: „Mehrere einfügen", one size or one pair per line', () => {
    it('reads single sizes, one per line, and skips empty lines', () => {
        const lines = readPaste('235/50R18\n\n245/45R18 100\n245/45 R18 96W\n')

        expect(lines.map((line) => line.status)).toEqual(['single', 'single', 'single'])
        expect(lines.map((line) => line.sizes?.map(tyreLabel))).toEqual([['235/50 R18'], ['245/45 R18 100'], ['245/45 R18 96W']])
    })

    it.each([
        ['225/40R18 – 255/35R18'],
        ['225/40R18 - 255/35R18'],
        ['225/40R18-255/35R18'],
        ['225/40R18 + 255/35R18'],
        ['225/40R18 → 255/35R18'],
        ['Nr. 1: 225/40R18 – 255/35R18'],
    ])('reads %s as front 225/40 R18 with rear 255/35 R18', (input) => {
        const [line] = readPaste(input)

        expect(line?.status).toBe('pair')
        expect(line?.pairs?.map((pair) => `${tyreLabel(pair.front)} | ${tyreLabel(pair.rear)}`)).toEqual(['225/40 R18 | 255/35 R18'])
    })

    it('does not take the load index after a hyphen for a rear size', () => {
        const [line] = readPaste('225/40R18-88')

        expect(line?.status).toBe('single')
        expect(line?.sizes?.map(tyreLabel)).toEqual(['225/40 R18 88'])
    })

    it('keeps the number a paper gives its pairs', () => {
        expect(readPaste('Nr. 7: 225/40R18 – 255/35R18')[0]?.number).toBe('7')
    })

    it('reads one front with several rears as one pair each', () => {
        const [line] = readPaste('Nr. 1: 215/35R19 – 245/30R19, 255/30R19')

        expect(line?.pairs?.map((pair) => `${tyreLabel(pair.front)} | ${tyreLabel(pair.rear)}`)).toEqual(['215/35 R19 | 245/30 R19', '215/35 R19 | 255/30 R19'])
    })

    it('splits a pasted paragraph at each „Nr."', () => {
        const lines = readPaste('Nr. 1: 215/35R19 – 245/30R19; Nr. 2: 225/35R19 – 255/30R19; Nr. 27: 275/30R19 – 315/25R19')

        expect(lines.map((line) => line.number)).toEqual(['1', '2', '27'])
        expect(lines.every((line) => line.status === 'pair')).toBe(true)
    })

    it('marks what it cannot read, with the reason, and reads the rest', () => {
        const lines = readPaste('Folgende Kombinationen sind möglich:\n225/40R18 – 255/35\n225/40R18 – 245/35R18 – 255/35R18\n235/50R18')

        expect(lines.map((line) => line.status)).toEqual(['unread', 'unread', 'unread', 'single'])
        expect(lines[0]?.reason).toBe('Keine Reifengröße erkannt.')
        expect(lines[1]?.reason).toBe('Die hintere Größe ist nicht lesbar.')
        expect(lines[2]?.reason).toBe('Mehr als zwei Größen in einer Zeile.')
    })

    it('counts lines from 1, as staff see them in the box', () => {
        expect(readPaste('\n235/50R18').map((line) => line.line)).toEqual([2])
    })
})

describe('why a line does not read (D-386)', () => {
    it('names a speed symbol the table does not know, instead of „no size found"', () => {
        expect(whyUnread('255/35R18 90X')).toBe('Das Geschwindigkeitssymbol „X“ gibt es nicht.')
        expect(readPaste('255/35R18 90X')[0]?.reason).toBe('Das Geschwindigkeitssymbol „X“ gibt es nicht.')
        expect(whyUnread('Cabrio')).toBeNull()
    })
})
