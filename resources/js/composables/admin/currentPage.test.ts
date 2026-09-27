import { describe, expect, it } from 'vitest'
import { isCurrentPage } from './currentPage'

const RAIL = ['/admin', '/admin/fahrzeuge', '/admin/fahrzeuge/pruefung', '/admin/review', '/admin/review/rueckmeldungen', '/admin/seiten']

describe('where the reader is in the rail', () => {
    it('keeps a page current on its records', () => {
        expect(isCurrentPage('/admin/seiten', '/admin/seiten/7', RAIL)).toBe(true)
        expect(isCurrentPage('/admin/fahrzeuge', '/admin/fahrzeuge/12', RAIL)).toBe(true)
    })

    it('gives a nested rail page its own address: only it is current there', () => {
        expect(isCurrentPage('/admin/fahrzeuge/pruefung', '/admin/fahrzeuge/pruefung', RAIL)).toBe(true)
        expect(isCurrentPage('/admin/fahrzeuge', '/admin/fahrzeuge/pruefung', RAIL)).toBe(false)
        expect(isCurrentPage('/admin/review', '/admin/review/rueckmeldungen', RAIL)).toBe(false)
    })

    it('keeps the Übersicht to itself', () => {
        expect(isCurrentPage('/admin', '/admin/seiten', RAIL)).toBe(false)
        expect(isCurrentPage('/admin', '/admin/nachfrage', RAIL)).toBe(true)
    })
})
