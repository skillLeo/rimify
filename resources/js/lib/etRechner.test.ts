import { describe, expect, it } from 'vitest'
import {
    DEFAULT_ET_STATE,
    decodeEtState,
    edgeChange,
    encodeEtState,
    innerSentence,
    isEtSetup,
    mmText,
    outerSentence,
    parseMm,
    parseWidth,
    roundToTenths,
    signedMm,
    stepped,
    type EtSetup,
} from './etRechner'

const NN = ' '
const setup = (widthIn: number, etMm: number, spacerMm = 0): EtSetup => ({ widthIn, etMm, spacerMm })

/*
 * The Felgenrechner rebuilt close to the client's example (his #11; the operator's brief of 29.10.2026, Batch 2):
 * inner = width/2 + ET − spacer, outer = width/2 − ET + spacer, width × 25,4 mm, each change new − current — checked
 * against the brief's own hand calculations, in whole hundredths of a millimetre, rounded once, half up.
 */
describe('the edges of a new rim against the current one', () => {
    it.each([
        // current, new, inner, outer (tenths of a millimetre, as shown)
        ['8J ET35 → 8,5J ET35', setup(8, 35), setup(8.5, 35), 64, 64],
        ['8J ET45 → 8J ET35', setup(8, 45), setup(8, 35), -100, 100],
        ['8,5J ET40 → 9,5J ET45 + 10 mm', setup(8.5, 40), setup(9.5, 45, 10), 77, 177],
    ])('%s', (_, current, next, inner, outer) => {
        const change = edgeChange({ current, next })

        expect(roundToTenths(change.inner)).toBe(inner)
        expect(roundToTenths(change.outer)).toBe(outer)
    })

    it('shows 6,35 mm as „6,4 mm“, which a float rounds to 6,3', () => {
        const change = edgeChange({ current: setup(8, 35), next: setup(8.5, 35) })

        // The exact figure, in hundredths: 635 — and the float the browser would have used is below the half.
        expect(change.inner).toBe(635)
        expect((6.35).toFixed(1)).toBe('6.3')
        expect(mmText(roundToTenths(change.inner))).toBe(`6,4${NN}mm`)
    })

    it('rounds a half away from zero on both sides', () => {
        expect(roundToTenths(635)).toBe(64)
        expect(roundToTenths(-635)).toBe(-64)
        expect(roundToTenths(634)).toBe(63)
        expect(roundToTenths(-634)).toBe(-63)
        expect(roundToTenths(0)).toBe(0)
    })

    it('moves inner plus outer by exactly the change in width, whatever the ET and the spacer', () => {
        for (const current of [setup(7, 45), setup(8.5, 40, 5), setup(11, -20, 30)]) {
            for (const next of [setup(8, 35), setup(9.5, 45, 10), setup(13, 80, 50), setup(4, -50)]) {
                const change = edgeChange({ current, next })

                expect(change.inner + change.outer).toBe(Math.round((next.widthIn - current.widthIn) * 2540))
            }
        }
    })
})

describe('what the page says', () => {
    it('names the direction of each edge in a German sentence, one decimal with a comma', () => {
        expect(innerSentence(77)).toBe(`Innen: 7,7${NN}mm näher am Fahrwerk`)
        expect(innerSentence(-100)).toBe(`Innen: 10,0${NN}mm weiter vom Fahrwerk entfernt`)
        expect(innerSentence(0)).toBe('Innen: unverändert')
        expect(outerSentence(177)).toBe(`Außen: 17,7${NN}mm weiter heraus`)
        expect(outerSentence(-64)).toBe(`Außen: 6,4${NN}mm weiter hinein`)
        expect(outerSentence(0)).toBe('Außen: unverändert')
    })

    it('writes a signed figure with a real minus for the drawing', () => {
        expect(signedMm(64)).toBe(`+6,4${NN}mm`)
        expect(signedMm(-100)).toBe(`−10,0${NN}mm`)
        expect(signedMm(0)).toBe(`0,0${NN}mm`)
    })

    it('starts on his example: 8J ET45 against 8J ET40, five millimetres each way', () => {
        const change = edgeChange(DEFAULT_ET_STATE)

        expect(DEFAULT_ET_STATE).toEqual({ current: setup(8, 45), next: setup(8, 40) })
        expect(innerSentence(roundToTenths(change.inner))).toBe(`Innen: 5,0${NN}mm weiter vom Fahrwerk entfernt`)
        expect(outerSentence(roundToTenths(change.outer))).toBe(`Außen: 5,0${NN}mm weiter heraus`)
    })
})

describe('the fields', () => {
    it('takes a width as people type it, in half inches only', () => {
        expect(parseWidth('8,5')).toBe(8.5)
        expect(parseWidth(' 9 ')).toBe(9)
        expect(parseWidth('8.5')).toBe(8.5)
        expect(parseWidth('8,25')).toBeNull()
        expect(parseWidth('3,5')).toBeNull()
        expect(parseWidth('13,5')).toBeNull()
        expect(parseWidth('acht')).toBeNull()
        expect(parseWidth('')).toBeNull()
    })

    // Interaction QA, 30.10.2026: the shop's own notation and a trailing zero were refused.
    it('takes a width in the shop\'s own notation, and a trailing zero', () => {
        expect(parseWidth('8,5J')).toBe(8.5)
        expect(parseWidth('9 J')).toBe(9)
        expect(parseWidth('8,50')).toBe(8.5)
        expect(parseWidth('8,55')).toBeNull()
    })

    it('takes an ET or a spacer with any minus, a plus, a zero after the comma, or its unit', () => {
        expect(parseMm('etMm', '–10')).toBe(-10)
        expect(parseMm('etMm', '−10')).toBe(-10)
        expect(parseMm('etMm', '+10')).toBe(10)
        expect(parseMm('etMm', '35,0')).toBe(35)
        expect(parseMm('etMm', '45 mm')).toBe(45)
        expect(parseMm('etMm', '35,5')).toBeNull()
        expect(parseMm('spacerMm', '–5')).toBeNull()
    })

    it('steps each field by its own step and stops at its ends', () => {
        expect(stepped('widthIn', 8, 1)).toBe(8.5)
        expect(stepped('widthIn', 13, 1)).toBe(13)
        expect(stepped('etMm', 45, -1)).toBe(44)
        expect(stepped('etMm', -50, -1)).toBe(-50)
        expect(stepped('spacerMm', 0, -1)).toBe(0)
        expect(stepped('spacerMm', 0, 1)).toBe(1)
    })

    it('accepts only a setup the form offers', () => {
        expect(isEtSetup(setup(8.5, 40, 10))).toBe(true)
        expect(isEtSetup(setup(8.25, 40))).toBe(false)
        expect(isEtSetup(setup(8, 81))).toBe(false)
        expect(isEtSetup(setup(8, 40, -1))).toBe(false)
        expect(isEtSetup(setup(8, 40.5))).toBe(false)
    })
})

describe('the address', () => {
    it('carries both setups and reads them back', () => {
        const state = { current: setup(8.5, 40), next: setup(9.5, 45, 10) }

        expect(encodeEtState(state)).toBe('8.5x40x0_9.5x45x10')
        expect(decodeEtState('8.5x40x0_9.5x45x10')).toEqual(state)
        expect(decodeEtState('8x-10x0_8x5x0')).toEqual({ current: setup(8, -10), next: setup(8, 5) })
    })

    it('ignores a link it could not have written: the defaults stand', () => {
        // The calculator before the rebuild wrote `W x D - ET - TW - A`; such a link opens on the defaults.
        expect(decodeEtState('7.5x17-45-225-45_8.5x19-35-225-35')).toBeNull()
        expect(decodeEtState('8.25x40x0_9x45x0')).toBeNull()
        expect(decodeEtState('8x40x0')).toBeNull()
        expect(decodeEtState(null)).toBeNull()
    })
})
