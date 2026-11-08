import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkPaste, parseKwBand, pasteToSides, readPaste, readTyre, sizeKey, tyreLabel, whyUnread } from './tyreInput'

interface Notation { text: string; label: string; width: number; aspect: number; diameter: number; li: number | null; li2: number | null; si: string | null; marker: string | null }

/* One list, read by this test and by the server's (tests/Unit/Support/TyreTextTest.php): the two readings cannot drift apart. */
const notations = JSON.parse(readFileSync(resolve(process.cwd(), 'tests/Fixtures/tyre-notations.json'), 'utf8')) as { reads: Notation[]; refuses: string[] }

describe('readTyre: the notations a Gutachten prints', () => {
    it('has notations to read', () => {
        expect(notations.reads.length).toBeGreaterThan(5)
        expect(notations.refuses.length).toBeGreaterThan(3)
    })

    it.each(notations.reads)('$text reads as $label, with the load index, the symbol and the marker apart', (notation) => {
        const tyre = readTyre(notation.text)

        expect(tyre).toEqual({ width: notation.width, aspect: notation.aspect, diameter: notation.diameter, li: notation.li, li2: notation.li2, si: notation.si, marker: notation.marker })
        expect(tyreLabel(tyre!)).toBe(notation.label)
    })

    it.each(notations.refuses)('refuses %j rather than guess', (input) => {
        expect(readTyre(input)).toBeNull()
    })

    it('gives one key per size, whatever the minimum or the marker, for duplicates and pairs', () => {
        expect(sizeKey(readTyre('225/40R18 88W')!)).toBe(sizeKey(readTyre('XL 225/40 R18')!))
        expect(sizeKey(readTyre('225/40R18')!)).not.toBe(sizeKey(readTyre('225/45R18')!))
    })
})

describe('checkPaste: the paste against the wheels of this combination', () => {
    const on = (text: string, front: number, rear: number) => checkPaste(readPaste(text), { front, rear })

    it('takes a size alone for both axles where both wheels share its diameter', () => {
        expect(on('225/40R18 92Y', 18, 18)[0]?.status).toBe('single')
    })

    it('makes a size alone an error line where the wheels differ, or its rim is not theirs', () => {
        const [different] = on('225/40R18 92Y', 18, 19)
        const [wrong] = on('225/40R19 92Y', 18, 18)

        expect(different?.status).toBe('unread')
        expect(different?.reason).toBe('Eine Größe allein geht hier nicht: Die Felgen haben vorne 18 und hinten 19 Zoll. Schreib vorne + hinten.')
        expect(wrong?.status).toBe('unread')
        expect(wrong?.reason).toBe('Passt nicht: Die Felge vorne und hinten hat 18 Zoll, der Reifen R19.')
    })

    it('keeps a pair whose sides fit their wheels, and says which side does not', () => {
        expect(on('225/40R18 + 255/35R19', 18, 19)[0]?.status).toBe('pair')

        const [wrong] = on('225/40R18 + 255/35R18', 18, 19)

        expect(wrong?.status).toBe('unread')
        expect(wrong?.reason).toBe('Passt nicht: Die Felge hinten hat 19 Zoll, der Reifen R18.')
    })

    it('takes nothing over from an error line', () => {
        expect(pasteToSides(on('225/40R18 + 255/35R18\n225/40R18 + 255/35R19', 18, 19).filter((line) => line.status !== 'unread'))).toEqual([{ front: '225/40 R18', rear: '255/35 R19' }])
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

    it('reads the second paper\'s HL before either side of a pair', () => {
        const [line] = readPaste('HL 255/35R20 100 - HL 265/35R20 102')

        expect(line?.pairs?.map((pair) => `${tyreLabel(pair.front)} | ${tyreLabel(pair.rear)}`)).toEqual(['HL 255/35 R20 100 | HL 265/35 R20 102'])
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

describe('what „Mehrere einfügen" adds (the client\'s change of 05.11.2026)', () => {
    it('turns a size alone into vorne = hinten, and a pair into a pair', () => {
        const read = readPaste('235/50R18 96W\n225/40R18 – 255/35R18\nDas liest niemand')

        expect(pasteToSides(read)).toEqual([
            { front: '235/50 R18 96W', rear: '235/50 R18 96W' },
            { front: '225/40 R18', rear: '255/35 R18' },
        ])
    })
})

describe('why a line does not read', () => {
    it('names a speed symbol the table does not know, instead of „no size found"', () => {
        expect(whyUnread('255/35R18 90X')).toBe('Das Geschwindigkeitssymbol „X“ gibt es nicht.')
        expect(readPaste('255/35R18 90X')[0]?.reason).toBe('Das Geschwindigkeitssymbol „X“ gibt es nicht.')
        expect(whyUnread('Cabrio')).toBeNull()
    })
})

describe('the kW band a paper prints beside a size', () => {
    it('reads a band, and one figure as a band of one power', () => {
        expect(parseKwBand('85-195')).toEqual({ kw_min: 85, kw_max: 195 })
        expect(parseKwBand(' 85 – 195 kW ')).toEqual({ kw_min: 85, kw_max: 195 })
        expect(parseKwBand('170 kW')).toEqual({ kw_min: 170, kw_max: 170 })
        expect(parseKwBand('')).toBeUndefined()
    })

    it('refuses what it cannot read, or a band typed the wrong way round', () => {
        expect(parseKwBand('195-85')).toBeNull()
        expect(parseKwBand('85-1195')).toBeNull()
        expect(parseKwBand('viel')).toBeNull()
    })
})
