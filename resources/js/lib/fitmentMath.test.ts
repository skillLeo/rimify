import { describe, expect, it } from 'vitest'
import {
    compare,
    diameterDeltaPercent,
    edgeShiftMm,
    metrics,
    rollingCircumferenceMm,
    sidewallHeightMm,
    signedDecimal,
    speedoAt100,
    tyreDiameterMm,
    type WheelSetup,
} from './fitmentMath'

/* The worked example from the specification: 225/45 R17 on 7,5 J ET 45 → 225/35 R19 on 8,5 J ET 35. */
const current: WheelSetup = { widthIn: 7.5, diameterIn: 17, etMm: 45, tyreWidthMm: 225, aspect: 45 }
const next: WheelSetup = { widthIn: 8.5, diameterIn: 19, etMm: 35, tyreWidthMm: 225, aspect: 35 }

describe('tyreDiameterMm', () => {
    it('gives 634,3 mm for 225/45 R17', () => {
        expect(tyreDiameterMm(17, 225, 45)).toBeCloseTo(634.3, 1)
    })

    it('gives 640,1 mm for 225/35 R19', () => {
        expect(tyreDiameterMm(19, 225, 35)).toBeCloseTo(640.1, 1)
    })

    it('is the bare rim when the aspect ratio is 0', () => {
        expect(tyreDiameterMm(17, 225, 0)).toBeCloseTo(431.8, 1)
        expect(sidewallHeightMm(225, 0)).toBe(0)
    })
})

describe('edgeShiftMm', () => {
    it('moves the outer edge +22,7 mm and the inner edge +2,7 mm from 7,5 J ET 45 to 8,5 J ET 35', () => {
        const shift = edgeShiftMm({ widthIn: 7.5, etMm: 45 }, { widthIn: 8.5, etMm: 35 })

        expect(shift.outer).toBeCloseTo(22.7, 1)
        expect(shift.inner).toBeCloseTo(2.7, 1)
    })

    it('is zero on both edges for the same rim', () => {
        const shift = edgeShiftMm({ widthIn: 8, etMm: 40 }, { widthIn: 8, etMm: 40 })

        expect(shift.outer).toBe(0)
        expect(shift.inner).toBe(0)
    })

    it('handles negative ET: a lower ET pushes the wheel out, whichever side of zero it sits', () => {
        const shift = edgeShiftMm({ widthIn: 8, etMm: -10 }, { widthIn: 8, etMm: -20 })

        expect(shift.outer).toBeCloseTo(10, 1)
        expect(shift.inner).toBeCloseTo(-10, 1)
    })

    it('splits a wider rim evenly when the ET stays', () => {
        const shift = edgeShiftMm({ widthIn: 7.5, etMm: 45 }, { widthIn: 8.5, etMm: 45 })

        expect(shift.outer).toBeCloseTo(12.7, 1)
        expect(shift.inner).toBeCloseTo(12.7, 1)
    })

    it('moves the whole wheel when only the ET changes', () => {
        const shift = edgeShiftMm({ widthIn: 8, etMm: 45 }, { widthIn: 8, etMm: 55 })

        expect(shift.outer).toBeCloseTo(-10, 1)
        expect(shift.inner).toBeCloseTo(10, 1)
    })
})

describe('rollingCircumferenceMm', () => {
    it('is π times the diameter', () => {
        expect(rollingCircumferenceMm(634.3)).toBeCloseTo(1992.7, 1)
        expect(rollingCircumferenceMm(640.1)).toBeCloseTo(2010.9, 1)
        expect(rollingCircumferenceMm(0)).toBe(0)
    })
})

describe('speedoAt100', () => {
    it('reads 100,9 km/h when 225/45 R17 becomes 225/35 R19', () => {
        expect(speedoAt100(634.3, 640.1)).toBeCloseTo(100.9, 1)
    })

    it('reads exactly 100 for the same diameter', () => {
        expect(speedoAt100(634.3, 634.3)).toBe(100)
    })

    it('fails closed with NaN instead of dividing by nothing', () => {
        expect(speedoAt100(0, 640.1)).toBeNaN()
        expect(speedoAt100(-1, 640.1)).toBeNaN()
    })
})

describe('diameterDeltaPercent', () => {
    it('is +0,9 % from 634,3 mm to 640,1 mm', () => {
        expect(diameterDeltaPercent(634.3, 640.1)).toBeCloseTo(0.9, 1)
    })

    it('is zero for equal diameters and NaN without a reference', () => {
        expect(diameterDeltaPercent(634.3, 634.3)).toBe(0)
        expect(diameterDeltaPercent(0, 634.3)).toBeNaN()
    })
})

describe('compare', () => {
    it('returns every figure the calculator shows for the worked example', () => {
        const result = compare(current, next)

        expect(result.current.diameterMm).toBeCloseTo(634.3, 1)
        expect(result.next.diameterMm).toBeCloseTo(640.1, 1)
        expect(result.outerEdgeMm).toBeCloseTo(22.7, 1)
        expect(result.innerEdgeMm).toBeCloseTo(2.7, 1)
        expect(result.diameterDeltaMm).toBeCloseTo(5.8, 1)
        expect(result.diameterDeltaPercent).toBeCloseTo(0.9, 1)
        expect(result.current.circumferenceMm).toBeCloseTo(1992.7, 1)
        expect(result.next.circumferenceMm).toBeCloseTo(2010.9, 1)
        expect(result.circumferenceDeltaMm).toBeCloseTo(18.2, 1)
        expect(result.speedoAt100KmH).toBeCloseTo(100.9, 1)
    })

    it('is all zero, and the speedometer exact, for two identical setups', () => {
        const result = compare(current, current)

        expect(result.outerEdgeMm).toBe(0)
        expect(result.innerEdgeMm).toBe(0)
        expect(result.diameterDeltaMm).toBe(0)
        expect(result.diameterDeltaPercent).toBe(0)
        expect(result.circumferenceDeltaMm).toBe(0)
        expect(result.speedoAt100KmH).toBe(100)
    })

    it('carries the rim and sidewall measures the drawing needs', () => {
        const m = metrics(current)

        expect(m.rimWidthMm).toBeCloseTo(190.5, 1)
        expect(m.rimDiameterMm).toBeCloseTo(431.8, 1)
        expect(m.sidewallMm).toBeCloseTo(101.25, 2)
    })

    it('survives a tyre with no sidewall and a negative ET without throwing', () => {
        const flat: WheelSetup = { widthIn: 8, diameterIn: 17, etMm: -15, tyreWidthMm: 225, aspect: 0 }
        const result = compare(current, flat)

        expect(result.next.diameterMm).toBeCloseTo(431.8, 1)
        expect(result.outerEdgeMm).toBeCloseTo(66.35, 2)
        expect(result.innerEdgeMm).toBeCloseTo(-53.65, 2)
        expect(Number.isFinite(result.speedoAt100KmH)).toBe(true)
    })
})

describe('signedDecimal', () => {
    it('writes a leading plus, a real minus sign and a decimal comma', () => {
        expect(signedDecimal(22.7)).toBe('+22,7')
        expect(signedDecimal(2.7)).toBe('+2,7')
        expect(signedDecimal(-10)).toBe('−10,0')
        expect(signedDecimal(1234.56, 2)).toBe('+1.234,56')
    })

    it('writes ± for nothing, including a value that rounds to nothing', () => {
        expect(signedDecimal(0)).toBe('±0,0')
        expect(signedDecimal(-0.04)).toBe('±0,0')
        expect(signedDecimal(0.04)).toBe('±0,0')
    })

    it('shows a dash rather than a number for a value that does not exist', () => {
        expect(signedDecimal(Number.NaN)).toBe('–')
        expect(signedDecimal(Number.POSITIVE_INFINITY)).toBe('–')
    })
})
