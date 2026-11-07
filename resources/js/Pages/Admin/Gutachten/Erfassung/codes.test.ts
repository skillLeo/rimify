import { describe, expect, it } from 'vitest'
import { isCodeWord, normaliseCode, readCodes } from './codes'

describe('what a typed text of codes is', () => {
    it('splits codes that are codes by themselves, at a space, a comma or a semicolon', () => {
        expect(readCodes('11A 68B', [])).toEqual(['11A', '68B'])
        expect(readCodes('11A, 68B; 140', [])).toEqual(['11A', '68B', '140'])
    })

    it('keeps the words of one code together: the refusal sentence’s own example must pass', () => {
        expect(readCodes('Nicht 330D', [])).toEqual(['Nicht 330D'])
        expect(readCodes('Schrägheck 2-türig', [])).toEqual(['Schrägheck 2-türig'])
        expect(readCodes('Cabrio', [])).toEqual(['Cabrio'])
        expect(readCodes('Cabrio, Nicht 330D', [])).toEqual(['Cabrio', 'Nicht 330D'])
    })

    it('lets the paper’s own list decide, and spell', () => {
        expect(readCodes('nicht  330d', ['Nicht 330D'])).toEqual(['Nicht 330D'])
        expect(readCodes('11a', ['11A'])).toEqual(['11A'])
        expect(readCodes('A B', ['A B'])).toEqual(['A B'])
    })

    it('stores a code the way the server does: no printed closing bracket, one plain space', () => {
        expect(normaliseCode('16a)')).toBe('16a')
        expect(normaliseCode('0 )')).toBe('0')
        expect(normaliseCode('Nicht  330D')).toBe('Nicht 330D')
        expect(readCodes('16a) R)', [])).toEqual(['16a', 'R'])
    })

    it('reads nothing into nothing, and takes a code once', () => {
        expect(readCodes('', [])).toEqual([])
        expect(readCodes(' , ; ', [])).toEqual([])
        expect(readCodes('11A 11A', [])).toEqual(['11A'])
    })

    it('tells a word that ends a code from one that goes on', () => {
        expect(isCodeWord('11A')).toBe(true)
        expect(isCodeWord('K1c')).toBe(true)
        expect(isCodeWord('R')).toBe(true)
        expect(isCodeWord('Nicht')).toBe(false)
        expect(isCodeWord('Cabrio')).toBe(false)
        expect(isCodeWord('')).toBe(false)
    })
})
