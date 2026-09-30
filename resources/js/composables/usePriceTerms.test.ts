import { describe, expect, it } from 'vitest'
import { SMALL_BUSINESS_TERMS, STANDARD_TERMS, priceTerms, totalNote } from './usePriceTerms'

/*
 * One flag, every price note (App\Support\Seller::smallBusiness): the standard shop names the VAT in its prices and
 * totals; a Kleinunternehmer (§ 19 UStG) names none anywhere, and says why.
 */
describe('priceTerms', () => {
    it('names the VAT beside a price and in the footer, as a standard shop must', () => {
        expect(priceTerms(false)).toBe(STANDARD_TERMS)
        expect(STANDARD_TERMS.note).toBe('inkl. MwSt., zzgl. Versand')
        expect(STANDARD_TERMS.footer).toBe('Alle Preise inkl. gesetzl. MwSt., zzgl. Versandkosten.')
    })

    it('names no VAT for a Kleinunternehmer, and gives § 19 UStG as the reason', () => {
        expect(priceTerms(true)).toBe(SMALL_BUSINESS_TERMS)

        for (const text of [SMALL_BUSINESS_TERMS.note, SMALL_BUSINESS_TERMS.footer]) {
            expect(text).not.toMatch(/inkl\.[^,]*MwSt/)
            expect(text).toMatch(/§\s19 UStG/)
        }
    })
})

describe('totalNote', () => {
    it('names the VAT the total contains, with or without a shipping price', () => {
        expect(totalNote(false, '127,09 €', false)).toBe('inkl. 127,09 € MwSt. und Versand')
        expect(totalNote(false, '127,09 €', true)).toBe('inkl. 127,09 € MwSt. · Versandkosten werden noch festgelegt')
    })

    it('has no VAT line for a Kleinunternehmer, whatever figure it is handed', () => {
        expect(totalNote(true, '127,09 €', false)).toBe('inkl. Versand, keine MwSt. nach § 19 UStG')
        expect(totalNote(true, '127,09 €', true)).toBe('Versandkosten werden noch festgelegt · keine MwSt. nach § 19 UStG')
        expect(totalNote(true, '127,09 €', false)).not.toContain('127,09')
    })
})
