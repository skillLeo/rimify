import { describe, expect, it } from 'vitest'
import { withUnit } from '../format'
import {
    edgeShiftMm,
    felgenModel,
    FAUSTREGEL_MAX_PERCENT,
    FAUSTREGEL_MIN_PERCENT,
    kmhText,
    percentText,
    REAR,
    rearFrame,
    rearScene,
    RIM_TYRE_RATIO_MAX,
    RIM_TYRE_RATIO_MIN,
    rimSuitsTyre,
    roundHalfAway,
    SCHEMATIC_MM,
    setupGeometry,
    signedText,
    tyreDiameterMm,
    wholeMmText,
    type FelgenModel,
    type RearScene,
    type WheelSetup,
} from './felgenGeometry'
import { ASPECTS, DIAMETERS_IN, ET_MAX, ET_MIN, RIM_WIDTHS_IN, TYRE_WIDTHS_MM } from './rechner'

const mm = (value: string) => withUnit(value, 'mm')

/* ±0,1 mm and ±0,01 % (ACCURACY.md §6). */
const MM_TOLERANCE = 0.1
const PERCENT_TOLERANCE = 0.01

function near(actual: number, expected: number, tolerance: number): void {
    expect(Math.abs(actual - expected), `${actual} ≈ ${expected}`).toBeLessThanOrEqual(tolerance)
}

function setup(widthIn: number, diameterIn: number, etMm: number, tyreWidthMm: number, aspect: number): WheelSetup {
    return { widthIn, diameterIn, etMm, tyreWidthMm, aspect }
}

/* The worked example: 225/45 R17 on 7,5J ET 45 → 225/35 R19 on 8,5J ET 35. */
const current = setup(7.5, 17, 45, 225, 45)
const next = setup(8.5, 19, 35, 225, 35)

/* ── A seeded pseudo-random walk over the grid the form offers (mulberry32) ───── */

function prng(seed: number): () => number {
    let a = seed >>> 0

    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function pick<T>(random: () => number, list: readonly T[]): T {
    return list[Math.floor(random() * list.length)] as T
}

function randomSetup(random: () => number): WheelSetup {
    return setup(
        pick(random, RIM_WIDTHS_IN),
        pick(random, DIAMETERS_IN),
        ET_MIN + Math.floor(random() * (ET_MAX - ET_MIN + 1)),
        pick(random, TYRE_WIDTHS_MM),
        pick(random, ASPECTS)
    )
}

/** A setup whose rim and tyre belong together: the tyre width is picked to suit the rim. */
function randomPlausibleSetup(random: () => number): WheelSetup {
    for (;;) {
        const s = randomSetup(random)

        if (rimSuitsTyre(s)) {
            return s
        }
    }
}

const PAIRS = 2000

function eachPair(seed: number, check: (a: WheelSetup, b: WheelSetup) => void, plausibleOnly = false): void {
    const random = prng(seed)
    const draw = plausibleOnly ? randomPlausibleSetup : randomSetup

    for (let i = 0; i < PAIRS; i++) {
        check(draw(random), draw(random))
    }
}

function sceneOf(model: FelgenModel): RearScene {
    return rearScene(rearFrame(model), model)
}

/* ── Golden values ────────────────────────────────────────────────────────────── */

describe('golden values', () => {
    it('225/45 R17 is 634,3 mm and 225/35 R19 is 640,1 mm: +0,91 %', () => {
        near(tyreDiameterMm(17, 225, 45), 634.3, MM_TOLERANCE)
        near(tyreDiameterMm(19, 225, 35), 640.1, MM_TOLERANCE)

        const model = felgenModel(current, next)
        near(model.circumferenceDeltaPercent, 0.91, PERCENT_TOLERANCE)
        expect(model.shownPercent).toBe(0.91)
        expect(percentText(model.circumferenceDeltaPercent)).toBe(withUnit('+0,91', '%'))
        // A speed has one decimal, and the true speed is 100 plus the printed difference.
        expect(model.shownSpeedDeltaKmH).toBe(0.9)
        expect(kmhText(model.shownSpeedKmH)).toBe(withUnit('100,9', 'km/h'))
        expect(model.shownDiameterDeltaMm).toBe(6)
        expect(model.faustregel).toBe('inside')
    })

    it('155/45 R17 is 571,3 mm and 145/35 R14 is 457,1 mm: −19,99 %', () => {
        near(tyreDiameterMm(17, 155, 45), 571.3, MM_TOLERANCE)
        near(tyreDiameterMm(14, 145, 35), 457.1, MM_TOLERANCE)

        const model = felgenModel(setup(6, 17, 45, 155, 45), setup(6, 14, 45, 145, 35))
        near(model.circumferenceDeltaPercent, -19.99, PERCENT_TOLERANCE)
        expect(model.shownPercent).toBe(-19.99)
        expect(percentText(model.circumferenceDeltaPercent)).toBe(withUnit('−19,99', '%'))
        expect(kmhText(model.shownSpeedKmH)).toBe(withUnit('80,0', 'km/h'))
        expect(model.shownSpeedDeltaKmH).toBe(-20)
        expect(model.shownDiameterDeltaMm).toBe(-114)
        expect(model.faustregel).toBe('below')
    })

    it('7,5J ET 45 → 8,5J ET 35 moves the outer rim edge +22,7 mm and the inner rim edge +2,7 mm, closer to the strut', () => {
        const shift = edgeShiftMm({ widthIn: 7.5, etMm: 45 }, { widthIn: 8.5, etMm: 35 })
        near(shift.outer, 22.7, MM_TOLERANCE)
        near(shift.inner, 2.7, MM_TOLERANCE)

        const model = felgenModel(current, next)
        near(model.outer.mm, 22.7, MM_TOLERANCE)
        near(model.inner.mm, 2.7, MM_TOLERANCE)
        // Printed as whole millimetres, with the direction in words.
        expect(model.outer.shownMm).toBe(23)
        expect(model.inner.shownMm).toBe(3)
        expect(model.outer.value).toBe(mm('23'))
        expect(model.outer.way).toBe('weiter außen')
        expect(model.outer.text).toBe(`Außenkante: ${mm('23')} weiter außen`)
        expect(model.inner.text).toBe(`Innenkante: ${mm('3')} näher am Federbein`)
        // The inner edge moves towards the strut: inboard, to the left of the drawing.
        expect(model.inner.axis).toBe(-1)
        expect(model.outer.axis).toBe(1)
    })

    it('puts each rim edge where W and ET say, relative to the mounting face', () => {
        const g = setupGeometry(current)

        near(g.rimWidthMm, 190.5, MM_TOLERANCE)
        near(g.centreX, -45, MM_TOLERANCE)
        // The inner edge W/2 + ET inboard of the face, the outer edge W/2 − ET outboard of it.
        near(g.innerEdgeX, -(95.25 + 45), MM_TOLERANCE)
        near(g.outerEdgeX, 95.25 - 45, MM_TOLERANCE)
        near(g.circumferenceMm, 1992.7, MM_TOLERANCE)
        expect(g.tyreWidthMm).toBe(225)
        expect(wholeMmText(g.diameterMm)).toBe(mm('634'))
        expect(wholeMmText(g.circumferenceMm)).toBe(mm('1.993'))
    })

    it('judges the Faustregel on the printed percentage, never on a hidden digit', () => {
        // 225/45 R17 → 265/40 R16 is −2,507 %: printed −2,51 %, below the rule of thumb.
        const below = felgenModel(current, setup(7.5, 16, 45, 265, 40))
        expect(percentText(below.circumferenceDeltaPercent)).toBe(withUnit('−2,51', '%'))
        expect(below.faustregel).toBe('below')

        // 135/45 R13 → 155/25 R15 is +1,505 %: printed +1,51 %, above it.
        const above = felgenModel(setup(5.5, 13, 45, 135, 45), setup(5.5, 15, 45, 155, 25))
        expect(percentText(above.circumferenceDeltaPercent)).toBe(withUnit('+1,51', '%'))
        expect(above.faustregel).toBe('above')

        expect(FAUSTREGEL_MIN_PERCENT).toBe(-2.5)
        expect(FAUSTREGEL_MAX_PERCENT).toBe(1.5)
    })

    it('says unverändert, and draws no arrow, when an edge moves less than a printed millimetre', () => {
        // 1,5 inch wider, ET 19 more: the outer edge moves 19,05 − 19 = 0,05 mm outboard.
        const model = felgenModel(setup(7, 17, 30, 225, 45), setup(8.5, 17, 49, 225, 45))

        near(model.outer.mm, 0.05, 1e-6)
        expect(model.outer.shownMm).toBe(0)
        expect(model.outer.axis).toBe(0)
        expect(model.outer.value).toBeNull()
        expect(model.outer.text).toBe('Außenkante: unverändert')
        expect(model.inner.text).toBe(`Innenkante: ${mm('38')} näher am Federbein`)
        expect(sceneOf(model).outer.drawn).toBe(false)
        expect(sceneOf(model).outer.shaft).toBe('')
    })

    it('says weiter weg vom Federbein when the inner edge moves away from the strut', () => {
        const model = felgenModel(setup(8, 18, 45, 225, 40), setup(8, 18, 30, 225, 40))

        expect(model.inner.text).toBe(`Innenkante: ${mm('15')} weiter weg vom Federbein`)
        expect(model.outer.text).toBe(`Außenkante: ${mm('15')} weiter außen`)
        expect(model.inner.axis).toBe(1)
    })
})

describe('rounding and text', () => {
    it('rounds half away from zero, so a value and its negative print as each other’s negative', () => {
        expect(roundHalfAway(2.5)).toBe(3)
        expect(roundHalfAway(-2.5)).toBe(-3)
        expect(roundHalfAway(0.49)).toBe(0)
        expect(roundHalfAway(-0.49)).toBe(0)
        expect(Object.is(roundHalfAway(-0.4), 0)).toBe(true)
        expect(roundHalfAway(1.505, 2)).toBe(1.51)
        expect(roundHalfAway(Number.NaN)).toBeNaN()
    })

    it('writes a sign, a real minus and ± for nothing — and a dash for what does not exist', () => {
        expect(signedText(0.914, 2)).toBe('+0,91')
        expect(signedText(-19.9895, 2)).toBe('−19,99')
        expect(signedText(0.004, 2)).toBe('±0,00')
        expect(signedText(Number.NaN, 2)).toBe('–')
        expect(percentText(Number.NaN)).toBe('–')
        expect(wholeMmText(Number.POSITIVE_INFINITY)).toBe('–')
        expect(kmhText(Number.NaN)).toBe('–')
        expect(kmhText(100.94)).toBe(withUnit('100,9', 'km/h'))
    })
})

/* ── A tyre and a rim that do not belong together ─────────────────────────────── */

describe('rim and tyre that do not belong together', () => {
    it('flags a rim narrower than 0,60 × or wider than 1,05 × the tyre width, and nothing between', () => {
        expect(RIM_TYRE_RATIO_MIN).toBe(0.6)
        expect(RIM_TYRE_RATIO_MAX).toBe(1.05)

        // 5,5J = 139,7 mm: with a 255 tyre 0,55 (flagged), with a 225 tyre 0,62 (not).
        expect(rimSuitsTyre(setup(5.5, 17, 45, 255, 40))).toBe(false)
        expect(rimSuitsTyre(setup(5.5, 17, 45, 225, 40))).toBe(true)
        // 12J = 304,8 mm: with a 285 tyre 1,069 (flagged), with a 295 tyre 1,033 (not).
        expect(rimSuitsTyre(setup(12, 20, 45, 285, 30))).toBe(false)
        expect(rimSuitsTyre(setup(12, 20, 45, 295, 30))).toBe(true)
        expect(rimSuitsTyre(current)).toBe(true)
        expect(rimSuitsTyre(next)).toBe(true)
    })

    it('names the side whose tyre and rim do not belong together', () => {
        expect(felgenModel(current, next).implausible).toEqual([])
        expect(felgenModel(current, setup(5.5, 19, 35, 305, 30)).implausible).toEqual(['next'])
        expect(felgenModel(setup(12, 17, 45, 135, 45), next).implausible).toEqual(['current'])
        expect(felgenModel(setup(12, 17, 45, 135, 45), setup(5.5, 19, 35, 305, 30)).implausible).toEqual(['current', 'next'])
    })

    it('agrees with the ratio over the whole grid', () => {
        for (const widthIn of RIM_WIDTHS_IN) {
            for (const tyreWidthMm of TYRE_WIDTHS_MM) {
                const ratio = (widthIn * 25.4) / tyreWidthMm

                expect(rimSuitsTyre(setup(widthIn, 17, 45, tyreWidthMm, 45)), `${widthIn} J / ${tyreWidthMm}`).toBe(ratio >= 0.6 && ratio <= 1.05)
            }
        }
    })
})

/* ── Properties, over 2.000 pseudo-random pairs from the offered grid ─────────── */

describe('properties', () => {
    it('swapping current and new negates every delta and turns every direction round', () => {
        eachPair(20260922, (a, b) => {
            const ab = felgenModel(a, b)
            const ba = felgenModel(b, a)

            expect(ab.outer.mm + ba.outer.mm).toBeCloseTo(0, 9)
            expect(ab.inner.mm + ba.inner.mm).toBeCloseTo(0, 9)
            expect(ab.outer.shownMm + ba.outer.shownMm).toBe(0)
            expect(ab.inner.shownMm + ba.inner.shownMm).toBe(0)
            expect(ab.outer.axis + ba.outer.axis).toBe(0)
            expect(ab.inner.axis + ba.inner.axis).toBe(0)
            expect(ab.diameterDeltaMm + ba.diameterDeltaMm).toBeCloseTo(0, 9)
            expect(ab.shownDiameterDeltaMm + ba.shownDiameterDeltaMm).toBe(0)
            // Opposite signs (a sum, so +0 and −0 need no special case).
            expect(Math.sign(ab.circumferenceDeltaPercent) + Math.sign(ba.circumferenceDeltaPercent)).toBe(0)
            // What the speedometer does going a → b is the circumference change going b → a.
            expect(ab.speedoReadingDeltaPercent).toBeCloseTo(ba.circumferenceDeltaPercent, 9)
        })
    })

    it('gives zero everywhere for equal inputs', () => {
        eachPair(7, (a) => {
            const model = felgenModel(a, { ...a })

            expect(model.outer.mm).toBe(0)
            expect(model.inner.mm).toBe(0)
            expect(model.outer.shownMm).toBe(0)
            expect(model.inner.shownMm).toBe(0)
            expect(model.outer.axis).toBe(0)
            expect(model.inner.axis).toBe(0)
            expect(model.outer.phrase).toBe('unverändert')
            expect(model.inner.phrase).toBe('unverändert')
            expect(model.diameterDeltaMm).toBe(0)
            expect(model.circumferenceDeltaPercent).toBe(0)
            expect(model.shownPercent).toBe(0)
            expect(model.speedAt100KmH).toBe(100)
            expect(model.shownSpeedKmH).toBe(100)
            expect(model.speedoReadingDeltaPercent).toBe(0)
            expect(model.faustregel).toBe('inside')

            const scene = sceneOf(model)
            expect(scene.inner.shaft).toBe('')
            expect(scene.outer.shaft).toBe('')
            expect(scene.inner.head).toBe('')
            expect(scene.outer.head).toBe('')
            expect(scene.next.tyre).toEqual(scene.current.tyre)
            expect(scene.next.rim).toEqual(scene.current.rim)
        })
    })

    it('always gives the speedometer the opposite sign to the diameter', () => {
        eachPair(42, (a, b) => {
            const model = felgenModel(a, b)
            const diameter = Math.sign(model.diameterDeltaMm)

            expect(Math.sign(model.speedoReadingDeltaPercent) + diameter).toBe(0)
            // …and the true speed at an indicated 100 km/h moves with the diameter.
            expect(Math.sign(model.speedAt100KmH - 100)).toBe(diameter)
            // The printed speed is 100 plus the printed difference, so the two never disagree.
            expect(model.shownSpeedKmH).toBeCloseTo(100 + model.shownSpeedDeltaKmH, 9)
        })
    })

    it('prints the direction the edge really moves', () => {
        eachPair(1999, (a, b) => {
            const model = felgenModel(a, b)

            expect(model.inner.phrase.includes('näher am Federbein')).toBe(model.inner.shownMm > 0)
            expect(model.inner.phrase.includes('weiter weg vom Federbein')).toBe(model.inner.shownMm < 0)
            expect(model.outer.phrase.includes('weiter außen')).toBe(model.outer.shownMm > 0)
            expect(model.outer.phrase.includes('weiter innen')).toBe(model.outer.shownMm < 0)
            expect(model.outer.phrase === 'unverändert').toBe(model.outer.shownMm === 0)
            expect(model.inner.phrase === 'unverändert').toBe(model.inner.shownMm === 0)
        })
    })
})

/* ── The rear view is generated from the model ────────────────────────────────── */

describe('rear view', () => {
    it('draws the worked example: one wheel in its arch, the mounting face, the strut left, the fender right', () => {
        const model = felgenModel(current, next)
        const scene = sceneOf(model)
        const k = scene.unitsPerMm

        // The taller scene fills the sheet: 328 units for 2 × 320,05 + 60 mm.
        near(k, 328 / (2 * 320.05 + SCHEMATIC_MM.strutAbove), 1e-9)
        near(k, 0.4685, 1e-4)

        // The rim centre planes lie ET inboard of the face: 45 and 35 mm.
        near(scene.faceX - scene.current.centreX, 45 * k, 1e-9)
        near(scene.faceX - scene.next.centreX, 35 * k, 1e-9)
        // The rims' edges: W/2 − ET outboard of the face, W/2 + ET inboard of it.
        near(scene.current.outerEdgeX - scene.faceX, (95.25 - 45) * k, 1e-9)
        near(scene.faceX - scene.current.innerEdgeX, (95.25 + 45) * k, 1e-9)
        near(scene.next.outerEdgeX - scene.faceX, (107.95 - 35) * k, 1e-9)

        // The arrows: outer 22,7 mm outboard (printed 23), inner 2,7 mm towards the strut (printed 3).
        near(scene.outer.to - scene.outer.from, 22.7 * k, 1e-9)
        near(scene.inner.from - scene.inner.to, 2.7 * k, 1e-9)
        expect(scene.outer.drawn).toBe(true)
        expect(scene.inner.drawn).toBe(true)

        // The strut is inboard (left) of both wheels, the fender's lip outboard (right) and above.
        expect(scene.strut.rightX).toBeLessThan(scene.next.tyreLeftX)
        expect(scene.strut.rightX).toBeLessThan(scene.current.tyreLeftX)
        expect(scene.fender.lipX).toBeGreaterThan(scene.next.tyreRightX)
        expect(scene.fender.bottomY).toBeLessThan(scene.next.tyreTopY)

        // The new tyre is taller: 640,1 against 634,3 mm, on the same scale.
        near(scene.next.tyreBottomY - scene.next.tyreTopY, 640.1 * k, 1e-6)
        near(scene.current.tyreBottomY - scene.current.tyreTopY, 634.3 * k, 1e-6)
    })

    it('points each arrowhead at the new edge, the way the edge moved', () => {
        const scene = sceneOf(felgenModel(current, next))
        const numbers = (d: string) => d.match(/-?[\d.]+/g)?.map(Number) ?? []

        // `M base y L tip y L base y Z`: outer tip right of its base, inner tip left of it (towards the strut).
        const [outerBase, , outerTip] = numbers(scene.outer.head)
        const [innerBase, , innerTip] = numbers(scene.inner.head)
        near((outerTip ?? 0) - (outerBase ?? 0), REAR.head, 0.011)
        near((innerTip ?? 0) - (innerBase ?? 0), -REAR.head, 0.011)
        near(outerTip ?? 0, scene.outer.to, 0.01)
        near(innerTip ?? 0, scene.inner.to, 0.01)
    })

    it('keeps the mounting face one line for both wheels, and each wheel where its ET puts it', () => {
        eachPair(
            11,
            (a, b) => {
                const model = felgenModel(a, b)
                const scene = sceneOf(model)
                const k = scene.unitsPerMm

                expect(scene.face).toMatch(new RegExp(`^M${Math.round(scene.faceX * 100) / 100} `))
                near(scene.current.centreX - scene.faceX, model.current.centreX * k, 1e-9)
                near(scene.next.centreX - scene.faceX, model.next.centreX * k, 1e-9)
                // Swapping the sides changes neither the face, nor the scale, nor the car's parts.
                const swapped = sceneOf(felgenModel(b, a))
                expect(swapped.faceX).toBeCloseTo(scene.faceX, 9)
                expect(swapped.unitsPerMm).toBeCloseTo(k, 12)
                expect(swapped.strut).toEqual(scene.strut)
                expect(swapped.fender).toEqual(scene.fender)
            },
            true
        )
    })

    it('centres each tyre on its rim’s centre plane and draws both wheels to one scale', () => {
        eachPair(
            5,
            (a, b) => {
                const model = felgenModel(a, b)
                const scene = sceneOf(model)
                const k = scene.unitsPerMm

                for (const side of ['current', 'next'] as const) {
                    const w = scene[side]
                    const g = model[side]

                    near((w.tyreLeftX + w.tyreRightX) / 2, w.centreX, 1e-9)
                    near((w.innerEdgeX + w.outerEdgeX) / 2, w.centreX, 1e-9)
                    near(w.tyreRightX - w.tyreLeftX, g.tyreWidthMm * k, 1e-9)
                    near(w.outerEdgeX - w.innerEdgeX, g.rimWidthMm * k, 1e-9)
                    near(w.tyreBottomY - w.tyreTopY, g.diameterMm * k, 1e-9)
                    near(w.rim.height, g.rimDiameterMm * k, 0.01)
                    // The rounded markup never strays from the measured positions.
                    near(w.tyre.x + w.tyre.width / 2, w.centreX, 0.02)
                    near(w.rim.x + w.rim.width / 2, w.centreX, 0.02)
                }

                // A bigger tyre looks bigger, by exactly the difference on the one scale.
                const drawnDelta = scene.next.tyreBottomY - scene.next.tyreTopY - (scene.current.tyreBottomY - scene.current.tyreTopY)
                near(drawnDelta, model.diameterDeltaMm * k, 1e-9)
            },
            true
        )
    })

    it('moves each drawn edge by exactly the model’s shift times the one scale, and the inner edge towards the strut exactly when inner > 0', () => {
        eachPair(
            314,
            (a, b) => {
                const model = felgenModel(a, b)
                const scene = sceneOf(model)
                const k = scene.unitsPerMm

                near(scene.next.outerEdgeX - scene.current.outerEdgeX, model.outer.mm * k, 1e-9)
                near(scene.current.innerEdgeX - scene.next.innerEdgeX, model.inner.mm * k, 1e-9)

                // Towards the strut is to the left, and the gap to the strut shrinks by the same amount.
                const gapBefore = scene.current.innerEdgeX - scene.strut.rightX
                const gapAfter = scene.next.innerEdgeX - scene.strut.rightX
                expect(Math.sign(gapBefore - gapAfter)).toBe(Math.sign(model.inner.mm))
                near(gapBefore - gapAfter, model.inner.mm * k, 1e-9)
                expect(Math.sign(scene.inner.from - scene.inner.to)).toBe(Math.sign(model.inner.mm))
            },
            true
        )
    })

    it('draws an arrow exactly when a whole millimetre is printed, as long as the shift, within half a millimetre of the label', () => {
        eachPair(
            2718,
            (a, b) => {
                const model = felgenModel(a, b)
                const scene = sceneOf(model)
                const k = scene.unitsPerMm

                for (const side of ['outer', 'inner'] as const) {
                    const dim = scene[side]
                    const shift = model[side]

                    expect(dim.drawn).toBe(shift.shownMm !== 0)
                    expect(dim.shaft === '').toBe(shift.shownMm === 0)
                    expect(dim.head === '').toBe(shift.shownMm === 0)

                    if (dim.drawn) {
                        const [x1, , x2] = dim.shaft.match(/-?[\d.]+/g)?.map(Number) ?? []
                        const drawn = Math.abs((x2 ?? 0) - (x1 ?? 0))
                        near(drawn, Math.abs(shift.mm) * k, 0.011)
                        expect(Math.abs(drawn - Math.abs(shift.shownMm) * k)).toBeLessThanOrEqual(0.5 * k + 0.011)
                        // The head points the way the words say.
                        const [base, , tip] = dim.head.match(/-?[\d.]+/g)?.map(Number) ?? []
                        expect(Math.sign((tip ?? 0) - (base ?? 0))).toBe(shift.axis)
                    }
                }
            },
            true
        )
    })

    it('never lets the car’s schematic parts touch either wheel, and keeps everything on the sheet', () => {
        eachPair(
            99,
            (a, b) => {
                const scene = sceneOf(felgenModel(a, b))
                const k = scene.unitsPerMm
                const clearance = SCHEMATIC_MM.clearance * k - 1e-9

                for (const w of [scene.current, scene.next]) {
                    expect(Math.min(w.tyreLeftX, w.innerEdgeX) - scene.strut.rightX).toBeGreaterThanOrEqual(clearance)
                    expect(scene.fender.lipX - Math.max(w.tyreRightX, w.outerEdgeX)).toBeGreaterThanOrEqual(clearance)
                    expect(w.tyreTopY - scene.fender.bottomY).toBeGreaterThanOrEqual(SCHEMATIC_MM.archGap * k - 1e-9)
                    expect(w.tyre.x).toBeGreaterThanOrEqual(0)
                    expect(w.tyre.x + w.tyre.width).toBeLessThanOrEqual(REAR.width)
                    expect(w.tyre.y).toBeGreaterThanOrEqual(0)
                }

                expect(scene.strut.tube.x).toBeGreaterThanOrEqual(REAR.pad - 0.01)
                expect(scene.strut.tube.y).toBeGreaterThanOrEqual(REAR.pad - 0.01)

                const paths = [scene.face, scene.strut.spring, scene.fender.path, scene.current.ring, scene.next.ring]

                for (const dim of [scene.outer, scene.inner]) {
                    paths.push(dim.shaft, dim.head, dim.extFrom, dim.extTo)
                    expect(dim.anchor).toBeGreaterThanOrEqual(0)
                    expect(dim.anchor).toBeLessThanOrEqual(1)
                }

                // Every coordinate in every path (x and y alike) lies on the 320 × 380 sheet; collected
                // and asserted once, so 2.000 scenes stay fast.
                const off = paths.flatMap((d) => (d.match(/-?[\d.]+/g)?.map(Number) ?? []).filter((n) => n < 0 || n > REAR.height).map((n) => `${n} in ${d}`))
                expect(off).toEqual([])

                expect(scene.strut.anchor).toBeLessThan(scene.fender.anchor)
            },
            true
        )
    })
})
