import { describe, expect, it } from 'vitest'
import type { OrderFilters } from '../../../types/admin/bestellungen'
import { activeCount, formFromFilters, nextSort, queryFromForm, sortQuery, type FilterForm } from './filters'

/*
 * The Bestellungen filter rules: defaults are the bare URL, amounts travel as typed, an own date
 * range is checked before anything is sent, and a column heading turns its own direction around.
 */

const TODAY = '2026-09-26'

const NONE: OrderFilters = {
    q: '', status: '', von: '', bis: '', zahlart: '', versandart: '', min: '', max: '', auflagen: false, sort: 'datum', richtung: 'ab',
}

const EMPTY_FORM: FilterForm = { status: '', zeitraum: '', von: '', bis: '', zahlart: '', versandart: '', min: '', max: '', auflagen: false }
const NEWEST = { sort: 'datum', richtung: 'ab' } as const

describe('queryFromForm', () => {
    it('leaves the plain list as the bare URL', () => {
        expect(queryFromForm(EMPTY_FORM, '  ', NEWEST, TODAY)).toEqual({ query: {} })
    })

    it('carries every filter, the search trimmed and the amounts exactly as typed', () => {
        const form: FilterForm = { ...EMPTY_FORM, status: 'offen', zeitraum: '7', zahlart: 'card', min: '1.425,50', auflagen: true }

        expect(queryFromForm(form, ' Weber ', { sort: 'summe', richtung: 'auf' }, TODAY)).toEqual({
            query: { q: 'Weber', status: 'offen', von: '2026-09-20', bis: '2026-09-26', zahlart: 'card', min: '1.425,50', auflagen: '1', sort: 'summe', richtung: 'auf' },
        })
    })

    it('says what is wrong with an own range instead of sending it', () => {
        expect(queryFromForm({ ...EMPTY_FORM, zeitraum: 'eigen', von: '31.02.2026' }, '', NEWEST, TODAY)).toEqual({
            error: 'Bitte schreib das Datum als TT.MM.JJJJ, zum Beispiel 01.09.2026.',
        })
        expect(queryFromForm({ ...EMPTY_FORM, zeitraum: 'eigen', von: '10.09.2026', bis: '01.09.2026' }, '', NEWEST, TODAY)).toEqual({
            error: 'Das Enddatum liegt vor dem Anfangsdatum.',
        })
    })
})

describe('formFromFilters', () => {
    it('shows a range the server applied as the preset it matches, or as an own range', () => {
        expect(formFromFilters({ ...NONE, von: '2026-08-28', bis: '2026-09-26' }, TODAY).zeitraum).toBe('30')
        expect(formFromFilters({ ...NONE, von: '2026-09-01', bis: '2026-09-02' }, TODAY)).toMatchObject({ zeitraum: 'eigen', von: '01.09.2026', bis: '02.09.2026' })
    })
})

describe('sorting', () => {
    it('keeps the default sort out of the URL', () => {
        expect(sortQuery(NEWEST)).toEqual({})
        expect(sortQuery({ sort: 'summe', richtung: 'ab' })).toEqual({ sort: 'summe', richtung: 'ab' })
    })

    it('turns a column around, and starts another where a person looks first', () => {
        expect(nextSort(NEWEST, 'datum')).toEqual({ sort: 'datum', richtung: 'auf' })
        expect(nextSort(NEWEST, 'summe')).toEqual({ sort: 'summe', richtung: 'ab' })
        expect(nextSort(NEWEST, 'status')).toEqual({ sort: 'status', richtung: 'auf' })
    })
})

describe('activeCount', () => {
    it('counts a range once and an amount range once, and not the search', () => {
        expect(activeCount({ ...NONE, q: 'x', von: '2026-09-01', bis: '2026-09-02', min: '1', max: '2', auflagen: true })).toBe(3)
    })
})
