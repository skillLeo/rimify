import { describe, expect, it } from 'vitest'
import { NNBSP, formatCurrency, formatMoney, formatNumber, formatPercent, parseNumber } from './num'

/* The one place a number becomes text and text a number (R-10). */

describe('formatting', () => {
    it('writes thousands with a point and decimals with a comma', () => {
        expect(formatNumber(1234.5, 1)).toBe('1.234,5')
        expect(formatNumber(1500)).toBe('1.500')
    })

    it('writes money with cents for tables and without for tiles and charts', () => {
        expect(formatMoney(142550)).toBe(`1.425,50${NNBSP}€`)
        expect(formatMoney(5974800)).toBe(`59.748,00${NNBSP}€`)
        expect(formatMoney(142550, true)).toBe(`1.426${NNBSP}€`)
    })

    it('writes a change with its sign, a real minus and a narrow space before the percent', () => {
        expect(formatPercent(12.4)).toBe(`+12,4${NNBSP}%`)
        expect(formatPercent(-3)).toBe(`−3,0${NNBSP}%`)
        expect(formatPercent(0)).toBe(`0,0${NNBSP}%`)
        expect(formatPercent(61.8, 0, false)).toBe(`62${NNBSP}%`)
    })
})

describe('parseNumber', () => {
    it('reads what a German person types', () => {
        expect(parseNumber('1000')).toBe(1000)
        expect(parseNumber('1.000')).toBe(1000)
        expect(parseNumber(' 1000 ')).toBe(1000)
        expect(parseNumber('1.425,50')).toBe(1425.5)
        expect(parseNumber('−12,5')).toBe(-12.5)
        expect(parseNumber(1000)).toBe(1000)
    })

    it('refuses what is not unambiguously a number', () => {
        expect(parseNumber('12.5')).toBeNull()
        expect(parseNumber('1.00')).toBeNull()
        expect(parseNumber('2026-09-01')).toBeNull()
        expect(parseNumber('zwölf')).toBeNull()
        expect(parseNumber('')).toBeNull()
        expect(parseNumber(null)).toBeNull()
    })
})

describe('formatCurrency', () => {
    it('writes an amount with its currency, the shop’s as €', () => {
        expect(formatCurrency(142500)).toBe(`1.425,00${NNBSP}€`)
        expect(formatCurrency(1250, 'CHF')).toBe(`12,50${NNBSP}CHF`)
        // A refund is negative: the typographic minus, as PHP's GermanFormat writes it.
        expect(formatCurrency(-990)).toBe(`−9,90${NNBSP}€`)
    })

    it('writes every cent from integer digits, never through a float', () => {
        expect(formatCurrency(0)).toBe(`0,00${NNBSP}€`)
        expect(formatCurrency(5)).toBe(`0,05${NNBSP}€`)
        expect(formatCurrency(99)).toBe(`0,99${NNBSP}€`)
        expect(formatCurrency(100)).toBe(`1,00${NNBSP}€`)
        // 0.29 × 100 is 28.999… as a float; the digits here never were one.
        expect(formatCurrency(29)).toBe(`0,29${NNBSP}€`)
        expect(formatCurrency(123456789012)).toBe(`1.234.567.890,12${NNBSP}€`)
    })

    it('writes byte for byte what PHP writes (tests/Unit/Support/GermanFormatTest)', () => {
        // The same fixtures on both sides: U+202F before the sign, U+2212 for a minus.
        expect(formatCurrency(142500)).toBe('1.425,00\u202F€')
        expect(formatCurrency(570000)).toBe('5.700,00\u202F€')
        expect(formatCurrency(-4999)).toBe('\u221249,99\u202F€')
    })

    it('is what formatMoney writes for euros, cents included', () => {
        expect(formatMoney(5974800)).toBe(formatCurrency(5974800, 'EUR'))
        expect(formatMoney(5974850, true)).toBe(`59.749${NNBSP}€`)
        expect(formatMoney(5974849, true)).toBe(`59.748${NNBSP}€`)
        expect(formatMoney(-30, true)).toBe(`0${NNBSP}€`)
    })
})
