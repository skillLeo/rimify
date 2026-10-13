import { describe, expect, it } from 'vitest'
import { CARD_ROOM, LINE_ROOM, countedDe, fitsWhole } from './auflagen'

/* D-197: Auflagen in full while they are short, counted where a Gutachten's paragraphs would not fit — never cut. */
describe('auflagen', () => {
    const short = 'Bördeln der Radläufe erforderlich.'
    const paragraph = 'Die Radabdeckung an Achse 1 ist durch Ausstellen der Frontschürze und des Kotflügels herzustellen. '.repeat(3)

    it('lets a card print two short sentences and a basket line three ordinary ones', () => {
        expect(fitsWhole([short, short], CARD_ROOM)).toBe(true)
        expect(fitsWhole([short, short, short], CARD_ROOM)).toBe(false)
        expect(fitsWhole([paragraph], CARD_ROOM)).toBe(false)

        expect(fitsWhole([short, short, short], LINE_ROOM)).toBe(true)
        expect(fitsWhole([short, short, short, short], LINE_ROOM)).toBe(false)
        expect(fitsWhole([paragraph, paragraph], LINE_ROOM)).toBe(false)
        expect(fitsWhole([], CARD_ROOM)).toBe(true)
    })

    it('counts in German: one Auflage, several Auflagen und Hinweise, and Hinweise where the server says all are', () => {
        expect(countedDe(1)).toBe('1 Auflage aus dem Gutachten')
        expect(countedDe(9)).toBe('9 Auflagen und Hinweise aus dem Gutachten')
        expect(countedDe(1, true)).toBe('1 Hinweis aus dem Gutachten')
        expect(countedDe(3, true)).toBe('3 Hinweise aus dem Gutachten')
    })
})
