import { describe, expect, it } from 'vitest'
import { HINT_COLOURS, hintColourLabel } from './hintColour'

describe('hint colours (D-439)', () => {
    it('offers Grün, Gelb and Rot, quiet to loud', () => {
        expect(HINT_COLOURS.map((c) => c.label)).toEqual(['Grün', 'Gelb', 'Rot'])
    })

    it('names each colour, and an unknown one as the default green', () => {
        expect(hintColourLabel('red')).toBe('Rot')
        expect(hintColourLabel('yellow')).toBe('Gelb')
        expect(hintColourLabel('green')).toBe('Grün')
        expect(hintColourLabel(null)).toBe('Grün')
    })
})
