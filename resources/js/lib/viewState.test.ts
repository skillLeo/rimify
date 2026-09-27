import { describe, expect, it } from 'vitest'
import { normalizeViewState, sameViewState } from './viewState'

/*
 * SV-13 at its root: a saved view is compared with the filters on screen by what they mean, never by
 * how they are spelled.
 */

describe('sameViewState', () => {
    it('takes „1000“, „1.000“, 1000 and „ 1000 “ for one amount — the five cases of SV-13', () => {
        const saved = { min: '1000' }

        expect(sameViewState(saved, { min: '1.000' })).toBe(true)
        expect(sameViewState(saved, { min: 1000 })).toBe(true)
        expect(sameViewState(saved, { min: ' 1000 ' })).toBe(true)
        expect(sameViewState(saved, { min: '1000' })).toBe(true)
        // And an empty value is no value, however it is written.
        expect(sameViewState({ q: null }, { q: '' })).toBe(true)
    })

    it('still tells a different amount, a set value and a different word apart', () => {
        expect(sameViewState({ min: '1000' }, { min: '1.001' })).toBe(false)
        expect(sameViewState({ min: '1000' }, {})).toBe(false)
        expect(sameViewState({ status: 'offen' }, { status: 'bezahlt' })).toBe(false)
    })

    it('ignores the order of keys and of a list, and reads true and false as themselves', () => {
        expect(sameViewState({ a: '1', b: 'x' }, { b: 'x', a: 1 })).toBe(true)
        expect(sameViewState({ columns: ['summe', 'datum'] }, { columns: ['datum', 'summe'] })).toBe(true)
        expect(sameViewState({ auflagen: 'true' }, { auflagen: true })).toBe(true)
    })

    it('keeps a text that is not a number a text — a date, a search, „12.5“', () => {
        expect(normalizeViewState({ von: '2026-09-01', q: ' Weber ', x: '12.5', y: '1.425,50' })).toEqual({ q: 'Weber', von: '2026-09-01', x: '12.5', y: 1425.5 })
    })
})
