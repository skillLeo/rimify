import { describe, expect, it } from 'vitest'
import { fromGermanDate, toGermanDate } from './dateField'

describe('the German date field', () => {
    it('shows an ISO date the German way and leaves anything else as it is', () => {
        expect(toGermanDate('2024-03-12')).toBe('12.03.2024')
        expect(toGermanDate('')).toBe('')
        expect(toGermanDate(null)).toBe('')
        expect(toGermanDate('12.03.20')).toBe('12.03.20')
    })

    it('reads a whole German date, with or without leading zeros', () => {
        expect(fromGermanDate('12.03.2024')).toBe('2024-03-12')
        expect(fromGermanDate(' 1.3.2024 ')).toBe('2024-03-01')
        expect(fromGermanDate('')).toBe('')
    })

    it('refuses a date that does not exist or is not finished', () => {
        expect(fromGermanDate('31.02.2024')).toBeNull()
        expect(fromGermanDate('29.02.2023')).toBeNull()
        expect(fromGermanDate('12.03.24')).toBeNull()
        expect(fromGermanDate('2024-03-12')).toBeNull()
        expect(fromGermanDate('29.02.2024')).toBe('2024-02-29')
    })
})
