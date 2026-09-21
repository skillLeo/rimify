import { describe, expect, it } from 'vitest'
import {
    ASPECTS,
    DEFAULT_STATE,
    DIAMETERS_IN,
    DISCLAIMER,
    decodeState,
    encodeState,
    felgenrechnerHref,
    fromPrefill,
    isSetup,
    isState,
    RIM_WIDTHS_IN,
    sameState,
    SHARE_PATTERN,
    TYRE_WIDTHS_MM,
} from './rechner'

const EXAMPLE = '7.5x17-45-225-45_8.5x19-35-225-35'

describe('what the form offers', () => {
    it('is the specification’s ranges', () => {
        expect(RIM_WIDTHS_IN[0]).toBe(5.5)
        expect(RIM_WIDTHS_IN[RIM_WIDTHS_IN.length - 1]).toBe(12)
        expect(RIM_WIDTHS_IN).toContain(8.5)
        expect(DIAMETERS_IN).toEqual([13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24])
        expect(TYRE_WIDTHS_MM[0]).toBe(135)
        expect(TYRE_WIDTHS_MM[TYRE_WIDTHS_MM.length - 1]).toBe(355)
        expect(ASPECTS[0]).toBe(25)
        expect(ASPECTS[ASPECTS.length - 1]).toBe(85)
    })

    it('accepts only figures from those lists and an ET of −30 … 70', () => {
        expect(isSetup(DEFAULT_STATE.current)).toBe(true)
        expect(isSetup({ ...DEFAULT_STATE.current, widthIn: 7.25 })).toBe(false)
        expect(isSetup({ ...DEFAULT_STATE.current, etMm: -30 })).toBe(true)
        expect(isSetup({ ...DEFAULT_STATE.current, etMm: -31 })).toBe(false)
        expect(isSetup({ ...DEFAULT_STATE.current, etMm: 70 })).toBe(true)
        expect(isSetup({ ...DEFAULT_STATE.current, etMm: 71 })).toBe(false)
        expect(isSetup({ ...DEFAULT_STATE.current, etMm: 35.5 })).toBe(false)
        expect(isSetup({ ...DEFAULT_STATE.current, aspect: 85 })).toBe(true)
        expect(isSetup({ ...DEFAULT_STATE.current, aspect: 90 })).toBe(false)
        expect(isState(null)).toBe(false)
        expect(isState(DEFAULT_STATE)).toBe(true)
    })
})

describe('fromPrefill', () => {
    it('turns the server’s prefill into a setup when the form offers every figure', () => {
        expect(fromPrefill({ widthIn: 8, diameterIn: 18, etMm: 40, tyreWidth: 235, aspect: 40 })).toEqual({
            widthIn: 8,
            diameterIn: 18,
            etMm: 40,
            tyreWidthMm: 235,
            aspect: 40,
        })
    })

    it('refuses a size the form could not have produced, and nothing at all', () => {
        expect(fromPrefill({ widthIn: 7.25, diameterIn: 17, etMm: 45, tyreWidth: 225, aspect: 45 })).toBeNull()
        expect(fromPrefill(null)).toBeNull()
        expect(fromPrefill(undefined)).toBeNull()
    })
})

describe('the share parameter', () => {
    it('encodes the worked example as the specification writes it', () => {
        expect(encodeState(DEFAULT_STATE)).toBe(EXAMPLE)
        expect(felgenrechnerHref(DEFAULT_STATE)).toBe(`/felgenrechner?rechner=${EXAMPLE}`)
    })

    it('reads the same comparison back', () => {
        const state = decodeState(EXAMPLE)

        expect(state).not.toBeNull()
        expect(sameState(state as NonNullable<typeof state>, DEFAULT_STATE)).toBe(true)
    })

    it('round-trips a whole-number width and a negative ET', () => {
        const param = '8x17--10-225-45_8x17--20-225-45'
        const state = decodeState(param)

        expect(state?.current.etMm).toBe(-10)
        expect(state?.next.etMm).toBe(-20)
        expect(state?.current.widthIn).toBe(8)
        expect(encodeState(state as NonNullable<typeof state>)).toBe(param)
    })

    it('matches each half against the server’s pattern', () => {
        expect(SHARE_PATTERN.test('7.5x17-45-225-45')).toBe(true)
        expect(SHARE_PATTERN.test('8x17--10-225-45')).toBe(true)
        expect(SHARE_PATTERN.test('7.5-17-45-225-45')).toBe(false)
        expect(SHARE_PATTERN.test('7.5x17-45-225-45_8.5x19-35-225-35')).toBe(false)
    })

    it('fails closed on anything the form does not offer', () => {
        expect(decodeState('99x1-999-1-1_7.5x17-45-225-45')).toBeNull()
        expect(decodeState('7.5x17-45-225-45')).toBeNull()
        expect(decodeState('7.5x17-71-225-45_8.5x19-35-225-35')).toBeNull()
        expect(decodeState('7.5x17-45-225-45_8.5x19-35-225-35_1x1-1-1-1')).toBeNull()
        expect(decodeState('')).toBeNull()
        expect(decodeState(null)).toBeNull()
        expect(decodeState(undefined)).toBeNull()
    })
})

describe('the disclaimer', () => {
    it('is the specification’s sentence, verbatim', () => {
        expect(DISCLAIMER).toBe(
            'Rechenwerte ersetzen kein Gutachten – ob eine Kombination zulässig ist, steht im Gutachten. Alle Angaben ohne Gewähr; verbindlich sind Fahrzeugschein bzw. CoC und die Reifenfreigabe.'
        )
    })
})
