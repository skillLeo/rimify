/**
 * Fitment calculator math (F6): what changes when a car owner moves from one wheel-and-tyre
 * size to another. Pure functions over inches and millimetres — no Vue, no DOM, no HTTP. The
 * calculator on the homepage and the cross-section drawing both read from `compare()`, so the
 * number on the page and the number in the drawing can never disagree.
 *
 * None of this is a verdict. A figure here says how far an edge moves; only a Gutachten says
 * whether it may (CLAUDE.md §2). Anything that cannot be computed comes back as `NaN`, and the
 * interface shows a dash for it — never a number it made up.
 *
 * Sign convention: the mounting face (Anlagefläche) is the fixed reference, because it is the one
 * plane bolted to the car. A positive ET moves the mounting face outward, which pulls the wheel
 * inward. "Outer edge +x" means the outer rim edge moves x mm further out; "inner edge +x" means
 * the inner rim edge moves x mm further in, towards the suspension.
 */

import { decimal } from '../format'

export const MM_PER_INCH = 25.4

export interface RimSpec {
    /** Rim width in inches — the "J" figure, `7.5` for `7,5 J`. */
    widthIn: number
    /** Einpresstiefe in millimetres; positive moves the mounting face outward. */
    etMm: number
}

export interface WheelSetup extends RimSpec {
    /** Rim diameter in inches (Zoll). */
    diameterIn: number
    /** Tyre section width in millimetres — the `225` in `225/45 R17`. */
    tyreWidthMm: number
    /** Aspect ratio in percent of the section width — the `45` in `225/45 R17`. */
    aspect: number
}

export interface EdgeShift {
    /** Millimetres the outer rim edge moves outward (positive) or inward (negative). */
    outer: number
    /** Millimetres the inner rim edge moves inward, towards the suspension (positive), or outward. */
    inner: number
}

export interface SetupMetrics {
    rimWidthMm: number
    rimDiameterMm: number
    sidewallMm: number
    diameterMm: number
    circumferenceMm: number
}

export interface Comparison {
    current: SetupMetrics
    next: SetupMetrics
    outerEdgeMm: number
    innerEdgeMm: number
    diameterDeltaMm: number
    diameterDeltaPercent: number
    circumferenceDeltaMm: number
    /** The real speed, in km/h, while the speedometer (calibrated on `current`) shows 100. */
    speedoAt100KmH: number
}

/** Sidewall height `h = width × aspect / 100`, in mm. */
export function sidewallHeightMm(widthMm: number, aspect: number): number {
    return (widthMm * aspect) / 100
}

/** Tyre outer diameter `D = rim × 25.4 + 2 × width × aspect / 100`, in mm. */
export function tyreDiameterMm(rimIn: number, widthMm: number, aspect: number): number {
    return rimIn * MM_PER_INCH + 2 * sidewallHeightMm(widthMm, aspect)
}

/**
 * Where the two rim edges end up, in mm, relative to the mounting face:
 * `outer = (W₂ − W₁) × 25.4 / 2 − (ET₂ − ET₁)` and `inner = (W₂ − W₁) × 25.4 / 2 + (ET₂ − ET₁)`.
 */
export function edgeShiftMm(current: RimSpec, next: RimSpec): EdgeShift {
    const halfWidthDelta = ((next.widthIn - current.widthIn) * MM_PER_INCH) / 2
    const etDelta = next.etMm - current.etMm

    return { outer: halfWidthDelta - etDelta, inner: halfWidthDelta + etDelta }
}

/** Rolling circumference `U = π × D`, in mm. */
export function rollingCircumferenceMm(diameterMm: number): number {
    return Math.PI * diameterMm
}

/** Real speed at an indicated 100 km/h: `v = 100 × D₂ / D₁`. `NaN` unless `D₁ > 0`. */
export function speedoAt100(currentDiameterMm: number, nextDiameterMm: number): number {
    if (!(currentDiameterMm > 0)) {
        return Number.NaN
    }

    return (100 * nextDiameterMm) / currentDiameterMm
}

/** Diameter change in percent: `(D₂ − D₁) / D₁ × 100`. `NaN` unless `D₁ > 0`. */
export function diameterDeltaPercent(currentDiameterMm: number, nextDiameterMm: number): number {
    if (!(currentDiameterMm > 0)) {
        return Number.NaN
    }

    return ((nextDiameterMm - currentDiameterMm) / currentDiameterMm) * 100
}

/** The measured facts of one setup on its own. */
export function metrics(setup: WheelSetup): SetupMetrics {
    const diameterMm = tyreDiameterMm(setup.diameterIn, setup.tyreWidthMm, setup.aspect)

    return {
        rimWidthMm: setup.widthIn * MM_PER_INCH,
        rimDiameterMm: setup.diameterIn * MM_PER_INCH,
        sidewallMm: sidewallHeightMm(setup.tyreWidthMm, setup.aspect),
        diameterMm,
        circumferenceMm: rollingCircumferenceMm(diameterMm),
    }
}

/** Everything the calculator shows for `current → next`, from the formulas above. */
export function compare(current: WheelSetup, next: WheelSetup): Comparison {
    const a = metrics(current)
    const b = metrics(next)
    const edges = edgeShiftMm(current, next)

    return {
        current: a,
        next: b,
        outerEdgeMm: edges.outer,
        innerEdgeMm: edges.inner,
        diameterDeltaMm: b.diameterMm - a.diameterMm,
        diameterDeltaPercent: diameterDeltaPercent(a.diameterMm, b.diameterMm),
        circumferenceDeltaMm: b.circumferenceMm - a.circumferenceMm,
        speedoAt100KmH: speedoAt100(a.diameterMm, b.diameterMm),
    }
}

/**
 * A change as German text: a leading `+`, a real minus sign (U+2212), and `±` when the rounded
 * value is nothing — `+22,7`, `−10,0`, `±0,0`. Rounded first, so `−0,04` never prints as `−0,0`.
 */
export function signedDecimal(value: number, digits = 1): string {
    if (!Number.isFinite(value)) {
        return '–'
    }

    const factor = 10 ** digits
    const rounded = Math.round(value * factor) / factor

    if (rounded === 0) {
        return `±${decimal(0, digits)}`
    }

    return `${rounded > 0 ? '+' : '−'}${decimal(Math.abs(rounded), digits)}`
}
