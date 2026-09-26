import { describe, expect, it } from 'vitest'
import { monogram } from './monogram'

describe('monogram', () => {
    it('takes the first letters of the first and the last name', () => {
        expect(monogram('Sabine Roth')).toBe('SR')
        expect(monogram('Kerem Yildiz')).toBe('KY')
    })

    it('skips a title and keeps German letters', () => {
        expect(monogram('Dr. Mirjam Halbach')).toBe('MH')
        expect(monogram('Özlem Übel')).toBe('ÖÜ')
    })

    it('makes do with one name, and never with none', () => {
        expect(monogram('Lea')).toBe('L')
        expect(monogram('  ')).toBe('?')
        expect(monogram(null)).toBe('?')
    })
})
