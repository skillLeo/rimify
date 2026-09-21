import { describe, expect, it } from 'vitest'
import { decimal } from '../format'
import {
    abrollDeltaPercent,
    abrollumfangMm,
    compare,
    diameterDeltaPercent,
    edgeShiftMm,
    innerClearanceDeltaMm,
    metrics,
    pokeMm,
    rollingCircumferenceMm,
    sidewallHeightMm,
    signedDecimal,
    SPEEDO_FLOOR_PERCENT,
    speedoAt100,
    speedometerRule,
    toleranceStatus,
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

describe('innerClearanceDeltaMm', () => {
    it('is the inner edge shift: +2,7 mm closer to the strut for the worked example', () => {
        expect(innerClearanceDeltaMm(current, next)).toBeCloseTo(2.7, 1)
    })

    it('is negative when the wheel moves away from the strut', () => {
        expect(innerClearanceDeltaMm({ widthIn: 8, etMm: 45 }, { widthIn: 8, etMm: 30 })).toBeCloseTo(-15, 1)
    })
})

describe('rollingCircumferenceMm', () => {
    it('is π times the diameter', () => {
        expect(rollingCircumferenceMm(634.3)).toBeCloseTo(1992.7, 1)
        expect(rollingCircumferenceMm(640.1)).toBeCloseTo(2010.9, 1)
        expect(rollingCircumferenceMm(0)).toBe(0)
    })
})

describe('abrollumfangMm', () => {
    it('is 3 % shorter than the geometric circumference: 1.932,9 mm for 225/45 R17, 1.950,6 mm for 225/35 R19', () => {
        expect(abrollumfangMm(tyreDiameterMm(17, 225, 45))).toBeCloseTo(1932.9, 1)
        expect(abrollumfangMm(tyreDiameterMm(19, 225, 35))).toBeCloseTo(1950.6, 1)
        expect(abrollumfangMm(634.3) / rollingCircumferenceMm(634.3)).toBeCloseTo(0.97, 10)
    })
})

describe('pokeMm', () => {
    it('puts 7,5 J ET 45 at 50,3 mm and 8,5 J ET 35 at 73,0 mm from the mounting face', () => {
        expect(pokeMm(7.5, 45)).toBeCloseTo(50.25, 2)
        expect(decimal(pokeMm(7.5, 45), 1)).toBe('50,3')
        // Exactly 72,95, which prints as the specification's 73,0 — not 72,949…98, which would print as 72,9.
        expect(pokeMm(8.5, 35)).toBeCloseTo(72.95, 2)
        expect(pokeMm(8.5, 35)).toBeGreaterThanOrEqual(72.95)
        expect(decimal(pokeMm(8.5, 35), 1)).toBe('73,0')
    })

    it('changes by exactly the outer edge shift: +22,7 mm', () => {
        expect(pokeMm(8.5, 35) - pokeMm(7.5, 45)).toBeCloseTo(22.7, 1)
        expect(pokeMm(8.5, 35) - pokeMm(7.5, 45)).toBeCloseTo(edgeShiftMm(current, next).outer, 10)
    })

    it('grows with a negative ET', () => {
        expect(pokeMm(8, -10)).toBeCloseTo(111.6, 1)
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

describe('abrollDeltaPercent', () => {
    it('is +0,9 % for the worked example and equals the diameter change', () => {
        expect(abrollDeltaPercent(634.3, 640.1)).toBeCloseTo(0.9, 1)
        expect(abrollDeltaPercent(634.3, 640.1)).toBeCloseTo(diameterDeltaPercent(634.3, 640.1), 10)
    })

    it('is zero for equal diameters and NaN without a reference', () => {
        expect(abrollDeltaPercent(634.3, 634.3)).toBe(0)
        expect(abrollDeltaPercent(0, 634.3)).toBeNaN()
    })
})

describe('toleranceStatus', () => {
    it('is ok for the worked example and warn or bad outside the rule of thumb', () => {
        expect(toleranceStatus(0.9)).toBe('ok')
        expect(toleranceStatus(-3)).toBe('warn')
        expect(toleranceStatus(2)).toBe('warn')
        expect(toleranceStatus(-13)).toBe('bad')
    })

    it('includes both ends of −2,5 … +1,5 and turns bad only below −12,7', () => {
        expect(toleranceStatus(-2.5)).toBe('ok')
        expect(toleranceStatus(1.5)).toBe('ok')
        expect(toleranceStatus(-2.5001)).toBe('warn')
        expect(toleranceStatus(1.5001)).toBe('warn')
        expect(toleranceStatus(-12.7)).toBe('warn')
        expect(toleranceStatus(SPEEDO_FLOOR_PERCENT)).toBe('warn')
        expect(toleranceStatus(SPEEDO_FLOOR_PERCENT - 0.001)).toBe('bad')
        expect(SPEEDO_FLOOR_PERCENT).toBeCloseTo(-12.7, 1)
    })

    it('never lights green for a change it cannot compute', () => {
        expect(toleranceStatus(Number.NaN)).toBe('bad')
        expect(toleranceStatus(Number.POSITIVE_INFINITY)).toBe('bad')
    })

    it('agrees with the real German sizes the specification names', () => {
        const d = (rim: number, width: number, aspect: number) => tyreDiameterMm(rim, width, aspect)

        // 195/65 R15 is the classic equivalent of 225/45 R17 (634,5 mm against 634,3 mm): ok.
        expect(abrollDeltaPercent(d(17, 225, 45), d(15, 195, 65))).toBeCloseTo(0.03, 2)
        expect(toleranceStatus(abrollDeltaPercent(d(17, 225, 45), d(15, 195, 65)))).toBe('ok')
        // 195/70 R15 (654,0 mm) is 3,1 % larger: outside the tolerance, the speedometer reads low.
        expect(abrollDeltaPercent(d(17, 225, 45), d(15, 195, 70))).toBeCloseTo(3.1, 1)
        expect(toleranceStatus(abrollDeltaPercent(d(17, 225, 45), d(15, 195, 70)))).toBe('warn')
        // 155/55 R13 (500,7 mm) is 21 % smaller — the speedometer would exceed 10 % + 4 km/h.
        expect(toleranceStatus(abrollDeltaPercent(d(17, 225, 45), d(13, 155, 55)))).toBe('bad')
    })
})

describe('speedometerRule', () => {
    it('reads low on a larger tyre, ok on an equal or slightly smaller one, high beyond 10 % + 4 km/h', () => {
        expect(speedometerRule(634.3, 640.1)).toBe('low')
        expect(speedometerRule(634.3, 634.3)).toBe('ok')
        expect(speedometerRule(634.3, 620)).toBe('ok')
        // 87,27 km/h real at an indicated 100 is the limit: 1,1 × 87,27 + 4 = 100.
        expect(speedometerRule(1000, 872.8)).toBe('ok')
        expect(speedometerRule(1000, 872.6)).toBe('high')
        expect(speedometerRule(634.3, 550)).toBe('high')
    })

    it('fails closed without a reference diameter', () => {
        expect(speedometerRule(0, 634.3)).toBe('high')
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
        expect(result.current.abrollumfangMm).toBeCloseTo(1932.9, 1)
        expect(result.next.abrollumfangMm).toBeCloseTo(1950.6, 1)
        expect(result.abrollDeltaPercent).toBeCloseTo(0.9, 1)
        expect(result.current.pokeMm).toBeCloseTo(50.25, 2)
        expect(result.next.pokeMm).toBeCloseTo(72.95, 2)
        expect(result.pokeDeltaMm).toBeCloseTo(22.7, 1)
        expect(result.pokeDeltaMm).toBeCloseTo(result.outerEdgeMm, 10)
        expect(result.speedoAt100KmH).toBeCloseTo(100.9, 1)
        expect(result.tolerance).toBe('ok')
        expect(result.speedometer).toBe('low')
    })

    it('is all zero, and the speedometer exact, for two identical setups', () => {
        const result = compare(current, current)

        expect(result.outerEdgeMm).toBe(0)
        expect(result.innerEdgeMm).toBe(0)
        expect(result.diameterDeltaMm).toBe(0)
        expect(result.diameterDeltaPercent).toBe(0)
        expect(result.circumferenceDeltaMm).toBe(0)
        expect(result.abrollDeltaPercent).toBe(0)
        expect(result.pokeDeltaMm).toBe(0)
        expect(result.speedoAt100KmH).toBe(100)
        expect(result.tolerance).toBe('ok')
        expect(result.speedometer).toBe('ok')
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
        expect(result.tolerance).toBe('bad')
        expect(result.speedometer).toBe('high')
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
