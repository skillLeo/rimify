import { describe, expect, it } from 'vitest'
import { cleanHsn, cleanTsn, isHsn, isTsn, parseKeyNumbers, parsePapers } from './fahrzeugschein'

describe('parseKeyNumbers', () => {
    it('reads the HSN after the 2.1 label', () => {
        expect(parseKeyNumbers('2.1 0005').hsn).toBe('0005')
    })

    it('reads a zero the OCR saw as the letter O', () => {
        expect(parseKeyNumbers('2.1: OOO5').hsn).toBe('0005')
    })

    it('takes the first three characters of field 2.2 as the TSN', () => {
        expect(parseKeyNumbers('2.2 582AAB').tsn).toBe('582')
    })

    it('reads both across line breaks, as a photographed form comes back', () => {
        const text = 'Zulassungsbescheinigung Teil I\n2.1\n0005\n\n2.2\n582AAB\n3 Fahrzeugklasse'
        expect(parseKeyNumbers(text)).toEqual({ hsn: '0005', tsn: '582' })
    })

    it('reads a lower-case, comma-separated, spaced-out label', () => {
        expect(parseKeyNumbers('2 ,1 - 0588\n2 .2: aas 12345')).toEqual({ hsn: '0588', tsn: 'AAS' })
    })

    it('reads nothing without the labels — a number somewhere on the page is not an HSN', () => {
        expect(parseKeyNumbers('Fahrzeug 0005 582 AAB')).toEqual({ hsn: null, tsn: null })
        expect(parseKeyNumbers('')).toEqual({ hsn: null, tsn: null })
    })

    it('does not mistake 12.1 or 2.10 for the label', () => {
        expect(parseKeyNumbers('12.1 0005').hsn).toBeNull()
        expect(parseKeyNumbers('2.10 0005').hsn).toBeNull()
        expect(parseKeyNumbers('2.2.1 0005').hsn).toBeNull()
    })

    it('rejects an HSN that is not four digits after the look-alike fix', () => {
        expect(parseKeyNumbers('2.1 00X5').hsn).toBeNull()
        expect(parseKeyNumbers('2.1 005').hsn).toBeNull()
        expect(parseKeyNumbers('2.1 00051').hsn).toBeNull()
    })

    it('returns one number when only one field could be read', () => {
        expect(parseKeyNumbers('2.1 0005\n2.2 ??')).toEqual({ hsn: '0005', tsn: null })
        expect(parseKeyNumbers('2.1 ----\n2.2 582AAB')).toEqual({ hsn: null, tsn: '582' })
    })

    it('survives noise around the fields', () => {
        const text = '|| 2.1 O0O5 ,, 2.2: 582 AAB Typ/Variante  9 Kraftstoff 0001'
        expect(parseKeyNumbers(text)).toEqual({ hsn: '0005', tsn: '582' })
    })
})

describe('parsePapers', () => {
    it('reads 8.1, 8.2, T and P.2 after their labels', () => {
        const text = 'Zulassungsbescheinigung Teil I\n8.1 1120\n8.2 1180\nT 250\nP.2/P.4 140/5500'

        expect(parsePapers(text)).toEqual({ axleFrontKg: 1120, axleRearKg: 1180, topSpeedKmh: 250, powerKw: 140 })
    })

    it('reads a load printed with a thousands point, and a comma or spaces in the label', () => {
        expect(parsePapers('8 ,1: 1.120  8 .2 - 1.180').axleFrontKg).toBe(1120)
        expect(parsePapers('8 ,1: 1.120  8 .2 - 1.180').axleRearKg).toBe(1180)
    })

    it('never takes the T of TSN or of a word for the speed field', () => {
        expect(parsePapers('TSN 582 Typ 3C Tür 2').topSpeedKmh).toBeNull()
        expect(parsePapers('2.2 582 T: 250').topSpeedKmh).toBe(250)
    })

    it('reads nothing without the labels, and nothing a car cannot have', () => {
        expect(parsePapers('1120 1180 250 140')).toEqual({ axleFrontKg: null, axleRearKg: null, topSpeedKmh: null, powerKw: null })
        expect(parsePapers('8.1 99999').axleFrontKg).toBeNull()
        expect(parsePapers('8.1 120').axleFrontKg).toBeNull()
        expect(parsePapers('T 999').topSpeedKmh).toBeNull()
    })

    it('does not mistake 18.1 or 8.12 for the axle fields', () => {
        expect(parsePapers('18.1 1120').axleFrontKg).toBeNull()
        expect(parsePapers('8.12 1120').axleFrontKg).toBeNull()
    })
})

describe('field cleaning', () => {
    it('strips pasted spaces and keeps the field length', () => {
        expect(cleanHsn(' 00 05 ')).toBe('0005')
        expect(cleanHsn('000512')).toBe('0005')
        expect(cleanTsn(' 5 8 2 ')).toBe('582')
        expect(cleanTsn('aasb')).toBe('AAS')
    })

    it('validates the two shapes', () => {
        expect(isHsn('0005')).toBe(true)
        expect(isHsn('005')).toBe(false)
        expect(isHsn('00A5')).toBe(false)
        expect(isTsn('582')).toBe(true)
        expect(isTsn('AAS')).toBe(true)
        expect(isTsn('58')).toBe(false)
        expect(isTsn('aas')).toBe(false)
    })
})
