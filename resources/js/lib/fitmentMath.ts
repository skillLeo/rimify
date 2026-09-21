/**
 * Fitment calculator math (F6 / OVERHAUL §7): what changes when a car owner moves from one
 * wheel-and-tyre size to another. Pure functions over inches and millimetres — no Vue, no DOM, no
 * HTTP. The teaser on the homepage, the full page at /felgenrechner and the clearance drawing all
 * read from `compare()`, so the number on the page and the number in the drawing can never disagree.
 *
 * None of this is a verdict. A figure here says how far an edge moves; only a Gutachten says
 * whether it may (CLAUDE.md §2). Anything that cannot be computed comes back as `NaN`, and the
 * interface shows a dash for it — never a number it made up. Nothing unknown is ever "ok".
 *
 * Sign convention: the mounting face (Anlagefläche) is the fixed reference, because it is the one
 * plane bolted to the car. A positive ET moves the mounting face outward, which pulls the wheel
 * inward. "Outer edge +x" means the outer rim edge moves x mm further out; "inner edge +x" means
 * the inner rim edge moves x mm further in, towards the suspension.
 */

import { decimal } from '../format'

export const MM_PER_INCH = 25.4

/**
 * Inches to millimetres without floating-point noise: `8.5 × 25.4` is 215,899…98 in binary, and
 * a poke of 72,95 would then print as 72,9. Multiplying by 254 first keeps every half-inch width
 * the form offers exact.
 */
export function inchesToMm(inches: number): number {
    return (inches * 254) / 10
}

/**
 * The loaded rolling circumference is shorter than the geometric one: under the car's weight the
 * tyre flattens at the contact patch, and the wheel covers about 3 % less ground per turn than
 * π × D says. 0,97 is the usual approximation (OVERHAUL §7); an exact figure would need the
 * manufacturer's data sheet for the specific tyre.
 */
export const ABROLL_FACTOR = 0.97

/**
 * The usual tolerance for a change of rolling circumference: −2,5 % … +1,5 %. This is a
 * practitioner's rule of thumb from the tyre trade, not a figure from a regulation — smaller is
 * tolerated more than larger because a smaller tyre makes the speedometer read high, which the law
 * allows, while a larger one makes it read low, which it never does. It is flagged for legal
 * review as item 34 of docs/client-questions.md.
 */
export const TOLERANCE_MIN_PERCENT = -2.5
export const TOLERANCE_MAX_PERCENT = 1.5

/**
 * What a speedometer may do (ECE R39 / § 57 StVZO): never read lower than the real speed, and
 * read at most 10 % + 4 km/h higher.
 */
export const SPEEDO_MAX_OVER_PERCENT = 10
export const SPEEDO_MAX_OVER_KMH = 4

/**
 * The circumference change below which an indicated 100 km/h would exceed the maximum even from
 * an exactly calibrated speedometer: 100 ≤ 1,1 × real + 4 ⇒ real ≥ 96 / 1,1 = 87,27 km/h, i.e.
 * −12,73 %. The specification rounds it to −12,7.
 */
export const SPEEDO_FLOOR_PERCENT = (100 - SPEEDO_MAX_OVER_KMH) / (1 + SPEEDO_MAX_OVER_PERCENT / 100) - 100

export type ToleranceStatus = 'ok' | 'warn' | 'bad'

/**
 * `ok` — the speedometer would keep reading right · `low` — it would read lower than the real
 * speed (a larger tyre) · `high` — it would read more than 10 % + 4 km/h too high (a much smaller
 * tyre). Judged from an exact calibration; a real speedometer already reads a little high.
 */
export type SpeedometerCheck = 'ok' | 'low' | 'high'

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
    /** The geometric circumference `π × D` (Umfang). */
    circumferenceMm: number
    /** The loaded rolling circumference `π × D × 0,97` (Abrollumfang). */
    abrollumfangMm: number
    /** Where the outer rim edge stands from the mounting face, outboard positive (the "poke"). */
    pokeMm: number
}

export interface Comparison {
    current: SetupMetrics
    next: SetupMetrics
    outerEdgeMm: number
    innerEdgeMm: number
    diameterDeltaMm: number
    diameterDeltaPercent: number
    circumferenceDeltaMm: number
    abrollDeltaMm: number
    /** Numerically equal to `diameterDeltaPercent` (the 0,97 cancels); both exist so the page can show both figures. */
    abrollDeltaPercent: number
    /** By construction equal to `outerEdgeMm`: the poke moves with the outer edge. */
    pokeDeltaMm: number
    /** The real speed, in km/h, while the speedometer (calibrated on `current`) shows 100. */
    speedoAt100KmH: number
    tolerance: ToleranceStatus
    speedometer: SpeedometerCheck
}

/** Sidewall height `h = width × aspect / 100`, in mm. */
export function sidewallHeightMm(widthMm: number, aspect: number): number {
    return (widthMm * aspect) / 100
}

/** Tyre outer diameter `D = rim × 25.4 + 2 × width × aspect / 100`, in mm. */
export function tyreDiameterMm(rimIn: number, widthMm: number, aspect: number): number {
    return inchesToMm(rimIn) + 2 * sidewallHeightMm(widthMm, aspect)
}

/**
 * Where the two rim edges end up, in mm, relative to the mounting face:
 * `outer = (W₂ − W₁) × 25.4 / 2 − (ET₂ − ET₁)` and `inner = (W₂ − W₁) × 25.4 / 2 + (ET₂ − ET₁)`.
 */
export function edgeShiftMm(current: RimSpec, next: RimSpec): EdgeShift {
    const halfWidthDelta = inchesToMm(next.widthIn - current.widthIn) / 2
    const etDelta = next.etMm - current.etMm

    return { outer: halfWidthDelta - etDelta, inner: halfWidthDelta + etDelta }
}

/** How much closer the inner rim edge moves to the strut, in mm (negative: further away). */
export function innerClearanceDeltaMm(current: RimSpec, next: RimSpec): number {
    return edgeShiftMm(current, next).inner
}

/** The geometric circumference `U = π × D`, in mm (Umfang). */
export function rollingCircumferenceMm(diameterMm: number): number {
    return Math.PI * diameterMm
}

/** The loaded rolling circumference `π × D × 0,97`, in mm (Abrollumfang, see `ABROLL_FACTOR`). */
export function abrollumfangMm(diameterMm: number): number {
    return Math.PI * diameterMm * ABROLL_FACTOR
}

/**
 * Where the outer rim edge stands from the mounting face, in mm: `W × 25.4 / 2 − ET`. Positive
 * is outboard — the larger the figure, the further the wheel "pokes" towards the fender.
 */
export function pokeMm(widthIn: number, etMm: number): number {
    return inchesToMm(widthIn) / 2 - etMm
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

/**
 * Change of the loaded rolling circumference in percent:
 * `(abrollumfang(D₂) − abrollumfang(D₁)) / abrollumfang(D₁) × 100`. The 0,97 cancels, so the
 * figure equals `diameterDeltaPercent`; it is computed from the circumferences anyway so the
 * page's "{new} mm statt {old} mm" line and this percentage always come from the same numbers.
 */
export function abrollDeltaPercent(currentDiameterMm: number, nextDiameterMm: number): number {
    const from = abrollumfangMm(currentDiameterMm)

    if (!(from > 0)) {
        return Number.NaN
    }

    return ((abrollumfangMm(nextDiameterMm) - from) / from) * 100
}

/**
 * The tolerance light, judged on the unrounded change: `ok` within −2,5 % … +1,5 %, `bad` below
 * the speedometer floor (`SPEEDO_FLOOR_PERCENT`, −12,73 %), `warn` everywhere else. A change that
 * cannot be computed is `bad` — nothing unknown ever lights green (CLAUDE.md §2).
 */
export function toleranceStatus(deltaPercent: number): ToleranceStatus {
    if (!Number.isFinite(deltaPercent)) {
        return 'bad'
    }

    if (deltaPercent >= TOLERANCE_MIN_PERCENT && deltaPercent <= TOLERANCE_MAX_PERCENT) {
        return 'ok'
    }

    return deltaPercent < SPEEDO_FLOOR_PERCENT ? 'bad' : 'warn'
}

/**
 * What an exactly calibrated speedometer would do at an indicated 100 km/h on the new size:
 * read `low` (the real speed is higher — a larger tyre), read `high` beyond 10 % + 4 km/h (a much
 * smaller tyre), or stay within the rule. Unknown fails closed as `high`.
 */
export function speedometerRule(currentDiameterMm: number, nextDiameterMm: number): SpeedometerCheck {
    const real = speedoAt100(currentDiameterMm, nextDiameterMm)

    if (!Number.isFinite(real)) {
        return 'high'
    }

    if (real > 100) {
        return 'low'
    }

    return 100 > (1 + SPEEDO_MAX_OVER_PERCENT / 100) * real + SPEEDO_MAX_OVER_KMH ? 'high' : 'ok'
}

/** The measured facts of one setup on its own. */
export function metrics(setup: WheelSetup): SetupMetrics {
    const diameterMm = tyreDiameterMm(setup.diameterIn, setup.tyreWidthMm, setup.aspect)

    return {
        rimWidthMm: inchesToMm(setup.widthIn),
        rimDiameterMm: inchesToMm(setup.diameterIn),
        sidewallMm: sidewallHeightMm(setup.tyreWidthMm, setup.aspect),
        diameterMm,
        circumferenceMm: rollingCircumferenceMm(diameterMm),
        abrollumfangMm: abrollumfangMm(diameterMm),
        pokeMm: pokeMm(setup.widthIn, setup.etMm),
    }
}

/** Everything the calculator shows for `current → next`, from the formulas above. */
export function compare(current: WheelSetup, next: WheelSetup): Comparison {
    const a = metrics(current)
    const b = metrics(next)
    const edges = edgeShiftMm(current, next)
    const abrollDelta = abrollDeltaPercent(a.diameterMm, b.diameterMm)

    return {
        current: a,
        next: b,
        outerEdgeMm: edges.outer,
        innerEdgeMm: edges.inner,
        diameterDeltaMm: b.diameterMm - a.diameterMm,
        diameterDeltaPercent: diameterDeltaPercent(a.diameterMm, b.diameterMm),
        circumferenceDeltaMm: b.circumferenceMm - a.circumferenceMm,
        abrollDeltaMm: b.abrollumfangMm - a.abrollumfangMm,
        abrollDeltaPercent: abrollDelta,
        pokeDeltaMm: b.pokeMm - a.pokeMm,
        speedoAt100KmH: speedoAt100(a.diameterMm, b.diameterMm),
        tolerance: toleranceStatus(abrollDelta),
        speedometer: speedometerRule(a.diameterMm, b.diameterMm),
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
