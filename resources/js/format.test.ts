import { describe, expect, it } from 'vitest'
import { decimal, felgen, NNBSP, paragraphs, passendeAnzeigen, withUnit, zoll } from './format'

describe('format', () => {
    it('reads a typed text as its paragraphs: a blank line starts a new one', () => {
        expect(paragraphs('Erster Absatz.\n\nZweiter Absatz,\nmit Umbruch.')).toEqual(['Erster Absatz.', 'Zweiter Absatz,\nmit Umbruch.'])
        expect(paragraphs('Windows\r\n\r\nZeilen')).toEqual(['Windows', 'Zeilen'])
        expect(paragraphs('Leerzeile mit Leerzeichen\n   \nweiter')).toEqual(['Leerzeile mit Leerzeichen', 'weiter'])
        expect(paragraphs('')).toEqual([])
        expect(paragraphs(null)).toEqual([])
    })

    it('counts wheels in one spelling', () => {
        expect(felgen(1)).toBe(`1${NNBSP}Felge`)
        expect(felgen(12)).toBe(`12${NNBSP}Felgen`)
        expect(felgen(0)).toBe(`0${NNBSP}Felgen`)
        expect(felgen(1234)).toBe(`1.234${NNBSP}Felgen`)
    })

    it('joins a measure and its unit with a narrow no-break space', () => {
        expect(withUnit('72,6', 'mm')).toBe(`72,6${NNBSP}mm`)
        expect(withUnit(71, 'dB')).toBe(`71${NNBSP}dB`)
    })

    it('writes sizes with a decimal comma and no trailing zero', () => {
        expect(zoll(18)).toBe(`18${NNBSP}Zoll`)
        expect(zoll(18.5)).toBe(`18,5${NNBSP}Zoll`)
        expect(zoll(['17', '18', '19'])).toBe(`17 · 18 · 19${NNBSP}Zoll`)
    })

    it('formats plain decimals with a fixed number of places', () => {
        expect(decimal(1234.5, 1)).toBe('1.234,5')
        expect(decimal(8.5, 1)).toBe('8,5')
        expect(decimal(100.9, 1)).toBe('100,9')
    })
})

describe('passendeAnzeigen', () => {
    it('says one wheel in the singular, and groups thousands', () => {
        expect(passendeAnzeigen(1)).toBe('1 passende Felge anzeigen')
        expect(passendeAnzeigen(2)).toBe('2 passende Felgen anzeigen')
        expect(passendeAnzeigen(1234)).toBe('1.234 passende Felgen anzeigen')
    })
})
