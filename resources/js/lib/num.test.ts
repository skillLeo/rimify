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
        expect(formatCurrency(-990)).toBe(`-9,90${NNBSP}€`)
    })

    it('is what formatMoney writes for euros, cents included', () => {
        expect(formatMoney(5974800)).toBe(formatCurrency(5974800, 'EUR'))
        expect(formatMoney(5974850, true)).toBe(`59.749${NNBSP}€`)
    })
})
