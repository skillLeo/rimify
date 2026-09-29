import { describe, expect, it } from 'vitest'
import type { WheelFilters } from '../../../types/admin/felgen'
import { activeCount, felgen, nextSort, queryFromForm, sortQuery } from './list'

const plain: WheelFilters = { q: '', status: '', marke: '', freigaben: '', demo: '', sort: 'name', richtung: 'auf' }

describe('the Felgen list query', () => {
    it('is the bare URL for the plain list', () => {
        expect(queryFromForm({ status: '', marke: '', freigaben: '', demo: '' }, '  ', { sort: 'name', richtung: 'auf' })).toEqual({})
    })

    it('carries only the filters that are set, the search trimmed, and a sort that is not the default', () => {
        expect(queryFromForm({ status: 'draft', marke: '3', freigaben: 'keine', demo: '' }, ' fjord ', { sort: 'preis', richtung: 'auf' })).toEqual({
            q: 'fjord',
            status: 'draft',
            marke: '3',
            freigaben: 'keine',
            sort: 'preis',
            richtung: 'auf',
        })
    })

    it('leaves the default sort out', () => {
        expect(sortQuery({ sort: 'name', richtung: 'auf' })).toEqual({})
        expect(sortQuery({ sort: 'name', richtung: 'ab' })).toEqual({ sort: 'name', richtung: 'ab' })
    })
})

describe('sorting by a heading', () => {
    it('turns the same column around', () => {
        expect(nextSort({ sort: 'preis', richtung: 'auf' }, 'preis')).toEqual({ sort: 'preis', richtung: 'ab' })
    })

    it('starts names and prices from the lowest, changes and sizes from the most', () => {
        expect(nextSort({ sort: 'name', richtung: 'auf' }, 'preis').richtung).toBe('auf')
        expect(nextSort({ sort: 'name', richtung: 'auf' }, 'aktualisiert').richtung).toBe('ab')
        expect(nextSort({ sort: 'name', richtung: 'auf' }, 'groessen').richtung).toBe('ab')
    })
})

describe('the words around the list', () => {
    it('counts the filters that are on, not the search', () => {
        expect(activeCount({ ...plain, q: 'x', status: 'draft', demo: 'ja' })).toBe(2)
    })

    it('says Felge for one and Felgen for more, with German grouping', () => {
        expect(felgen(1)).toBe('1 Felge')
        expect(felgen(1200)).toBe('1.200 Felgen')
    })
})
