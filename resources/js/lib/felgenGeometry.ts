/**
 * The Felgenrechner's geometry (ACCURACY.md §6): the only place a wheel-and-tyre size becomes a
 * millimetre, a percentage or a coordinate of the drawing. The results, the full figures and the
 * drawing all read one `FelgenModel`, and the drawing is generated from that same model, so a drawn
 * length and its printed figure cannot disagree. Pure functions: no Vue, no DOM.
 *
 * None of this is a verdict. A figure says how far a rim edge moves or how a circumference
 * changes; only the vehicle's papers and the wheel's Gutachten or ABE say what applies to a car
 * (CLAUDE.md §2). A value that cannot be computed is `NaN`, is printed as a dash and is never
 * judged.
 *
 * The axis: the mounting face (Anlagefläche) is 0, because it is the one plane bolted to the car,
 * and outboard (towards the fender) is positive. A positive ET puts the rim's centre plane inboard
 * of the face, so the centre plane sits at −ET, the inner rim edge at −ET − W/2 and the outer rim
 * edge at −ET + W/2 (W: the rim width in mm). Seen from the face, the outer edge is W/2 − ET
 * outboard and the inner edge W/2 + ET inboard. The tyre is centred on the rim's centre plane.
 */

import { decimal, withUnit } from '../format'

export const MM_PER_INCH = 25.4

/**
 * Inches to millimetres without floating-point noise: `8.5 × 25.4` is 215,899…98 in binary.
 * Multiplying by 254 first keeps every half-inch width the form offers exact.
 */
export function inchesToMm(inches: number): number {
    return (inches * 254) / 10
}

/**
 * The *häufig genannte Faustregel* for a change of rolling circumference: −2,5 % … +1,5 %. It is a
 * rule of thumb from the tyre trade with no legal basis anywhere we could find — not in § 57 StVZO,
 * 75/443/EWG, UN R39, the accessible text of VdTÜV-Merkblatt 751 or any Gutachten
 * (docs/reviews/accuracy-research-motec.md §3c). The page shows it as a neutral reference and says
 * *keine gesetzliche Grenze*; it never lights anything green.
 */
export const FAUSTREGEL_MIN_PERCENT = -2.5
export const FAUSTREGEL_MAX_PERCENT = 1.5

/**
 * The speedometer rule the page quotes (UN R39 para. 5.4, 75/443/EWG Annex II 4.4, § 57 StVZO):
 * the indicated speed is never below the true speed and at most 10 % + 4 km/h above it.
 */
export const SPEEDO_MAX_OVER_PERCENT = 10
export const SPEEDO_MAX_OVER_KMH = 4

/**
 * Whether a rim and a tyre belong together at all — checked before anything is drawn or printed,
 * so the page never draws a 5,5J rim inside a 305 mm tyre as if that were a wheel.
 *
 * The convention behind it is ETRTO's (the European Tyre and Rim Technical Organisation, whose
 * Standards Manual the tyre and rim trade builds on): every tyre size has a measuring rim and a
 * list of approved rim widths around it. For passenger-car tyres those widths sit roughly between
 * two thirds of the nominal section width and about the section width itself — a 225/45 R17 is
 * commonly measured on 7,5J, 190,5 mm or 0,85 × 225. The manual itself is paywalled (it could not be
 * read for accuracy-research-motec.md), so the check is deliberately WIDER than that convention and
 * flags only what is clearly outside it:
 *
 *     rim width in mm < 0,60 × tyre width   or   rim width in mm > 1,05 × tyre width
 *
 * e.g. 5,5J (139,7 mm) with a 255 tyre is 0,55 and flagged; 8,5J (215,9 mm) with a 225 tyre is
 * 0,96 and not. Nothing inside the band is flagged — which does not make a pairing approved: that
 * is for the Reifenfreigabe and the wheel's Gutachten to say.
 */
export const RIM_TYRE_RATIO_MIN = 0.6
export const RIM_TYRE_RATIO_MAX = 1.05

export interface RimSpec {
    /** Rim width in inches — the "J" figure, `7.5` for `7,5J`. */
    widthIn: number
    /** Einpresstiefe in millimetres; positive puts the centre plane inboard of the mounting face. */
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

/** Which of the two setups: *Aktuell* (`current`) or *Neu* (`next`). */
export type SetupSide = 'current' | 'next'

export interface SetupGeometry {
    rimWidthMm: number
    rimDiameterMm: number
    /** The nominal section width of the tyre. */
    tyreWidthMm: number
    sidewallMm: number
    /** The tyre's geometric outer diameter from its nominal size: rim + 2 × sidewall. */
    diameterMm: number
    /** The geometric circumference `π × D`. */
    circumferenceMm: number
    /** Positions on the axis (mounting face 0, outboard positive), in mm. */
    centreX: number
    innerEdgeX: number
    outerEdgeX: number
}

export type EdgeSide = 'outer' | 'inner'

export interface EdgeShift {
    side: EdgeSide
    /** The exact shift in mm. Outer edge: positive is outboard. Inner edge: positive is towards the strut. */
    mm: number
    /** The shift as printed: whole millimetres, rounded half away from zero, so swapping negates it. */
    shownMm: number
    /**
     * Which way the drawing's arrow points: +1 outboard (right), −1 inboard (left), 0 when the shift
     * rounds to no whole millimetre — then there is no arrow and the edge reads *unverändert*.
     */
    axis: -1 | 0 | 1
    /** `23 mm`, or null when unchanged. */
    value: string | null
    /** `weiter außen` · `weiter innen` · `näher am Federbein` · `weiter weg vom Federbein`, or null. */
    way: string | null
    /** `23 mm weiter außen` · `3 mm näher am Federbein` · `unverändert`. */
    phrase: string
    /** `Außenkante: 23 mm weiter außen` — the label in the drawing and the row in the figures. */
    text: string
}

export type FaustregelPosition = 'below' | 'inside' | 'above'

export interface FelgenModel {
    /** The two setups this model was computed from. */
    input: Record<SetupSide, WheelSetup>
    current: SetupGeometry
    next: SetupGeometry
    /** The sides whose tyre and rim do not belong together; when not empty nothing is drawn or printed. */
    implausible: SetupSide[]
    outer: EdgeShift
    inner: EdgeShift
    diameterDeltaMm: number
    /** The diameter change as printed: whole millimetres. */
    shownDiameterDeltaMm: number
    /**
     * The change of the rolling circumference in percent, from the geometric diameters. The dynamic
     * rolling circumference is the geometric one times a factor for the tyre's deflection under
     * load (about 0,97); with the same factor on both sides it cancels out of the ratio, so the
     * percentage needs no factor. The absolute dynamic circumference does depend on it and on the
     * individual tyre, which is why the page prints no absolute Abrollumfang.
     */
    circumferenceDeltaPercent: number
    /** The percentage as printed: two decimals. The Faustregel is judged on this, never on a hidden digit. */
    shownPercent: number
    /** The true speed, in km/h, while a speedometer that suited the current size shows 100. */
    speedAt100KmH: number
    /** How much faster (+) or slower (−) than before, as printed: one decimal. */
    shownSpeedDeltaKmH: number
    /** The true speed as printed: `100 + shownSpeedDeltaKmH`, so the two figures always add up. */
    shownSpeedKmH: number
    /** How much more (+) or less (−) the speedometer reads than before at the same true speed, in %. */
    speedoReadingDeltaPercent: number
    /** Where the printed percentage lies against the Faustregel; null when nothing could be computed. */
    faustregel: FaustregelPosition | null
}

/* ── Rounding and text (R-10, through format.ts) ─────────────────────────────── */

/**
 * Rounds half away from zero, so a value and its negative always print as each other's negative
 * (`Math.round(−2.5)` would give −2). The small epsilon absorbs binary noise such as 150,4999…97.
 */
export function roundHalfAway(value: number, digits = 0): number {
    if (!Number.isFinite(value)) {
        return Number.NaN
    }

    const factor = 10 ** digits
    const rounded = Math.round(Math.abs(value) * factor + 1e-9) / factor

    return rounded === 0 ? 0 : Math.sign(value) * rounded
}

/**
 * A change as German text: a leading `+`, a real minus sign (U+2212), and `±` when the rounded
 * value is nothing — `+0,91`, `−19,99`, `±0,00`. A value that does not exist is a dash.
 */
export function signedText(value: number, digits: number): string {
    const rounded = roundHalfAway(value, digits)

    if (!Number.isFinite(rounded)) {
        return '–'
    }

    if (rounded === 0) {
        return `±${decimal(0, digits)}`
    }

    return `${rounded > 0 ? '+' : '−'}${decimal(Math.abs(rounded), digits)}`
}

/** `+0,91 %` */
export function percentText(value: number): string {
    return Number.isFinite(value) ? withUnit(signedText(value, 2), '%') : '–'
}

/** `634 mm` — whole millimetres. */
export function wholeMmText(value: number): string {
    return Number.isFinite(value) ? withUnit(decimal(roundHalfAway(value), 0), 'mm') : '–'
}

/** `100,9 km/h` — one decimal, the way a speed is said. */
export function kmhText(value: number): string {
    return Number.isFinite(value) ? withUnit(decimal(roundHalfAway(value, 1), 1), 'km/h') : '–'
}

/* ── One setup ────────────────────────────────────────────────────────────────── */

/** Sidewall height `h = width × aspect / 100`, in mm. */
export function sidewallHeightMm(widthMm: number, aspect: number): number {
    return (widthMm * aspect) / 100
}

/** Tyre outer diameter `D = rim × 25,4 + 2 × width × aspect / 100`, in mm. */
export function tyreDiameterMm(rimIn: number, widthMm: number, aspect: number): number {
    return inchesToMm(rimIn) + 2 * sidewallHeightMm(widthMm, aspect)
}

export function setupGeometry(s: WheelSetup): SetupGeometry {
    const rimWidthMm = inchesToMm(s.widthIn)
    const diameterMm = tyreDiameterMm(s.diameterIn, s.tyreWidthMm, s.aspect)

    return {
        rimWidthMm,
        rimDiameterMm: inchesToMm(s.diameterIn),
        tyreWidthMm: s.tyreWidthMm,
        sidewallMm: sidewallHeightMm(s.tyreWidthMm, s.aspect),
        diameterMm,
        circumferenceMm: Math.PI * diameterMm,
        centreX: -s.etMm,
        innerEdgeX: -s.etMm - rimWidthMm / 2,
        outerEdgeX: -s.etMm + rimWidthMm / 2,
    }
}

/** False when the rim is clearly too narrow or too wide for the tyre (see `RIM_TYRE_RATIO_MIN`). */
export function rimSuitsTyre(s: WheelSetup): boolean {
    const ratio = inchesToMm(s.widthIn) / s.tyreWidthMm

    // A hair of slack so a ratio that is exactly on the band's edge is never flagged by binary noise.
    return Number.isFinite(ratio) && ratio >= RIM_TYRE_RATIO_MIN - 1e-9 && ratio <= RIM_TYRE_RATIO_MAX + 1e-9
}

/* ── Two setups ───────────────────────────────────────────────────────────────── */

/**
 * How far each rim edge moves, in mm: `outer = ΔW × 25,4 / 2 − ΔET` (outboard positive) and
 * `inner = ΔW × 25,4 / 2 + ΔET` (towards the strut positive). Computed from the differences, not
 * from the two positions, so a pure width change splits into two exactly equal halves.
 */
export function edgeShiftMm(current: RimSpec, next: RimSpec): { outer: number; inner: number } {
    const halfWidthDelta = inchesToMm(next.widthIn - current.widthIn) / 2
    const etDelta = next.etMm - current.etMm

    return { outer: halfWidthDelta - etDelta, inner: halfWidthDelta + etDelta }
}

const EDGE_WORDS: Record<EdgeSide, { name: string; plus: string; minus: string }> = {
    outer: { name: 'Außenkante', plus: 'weiter außen', minus: 'weiter innen' },
    inner: { name: 'Innenkante', plus: 'näher am Federbein', minus: 'weiter weg vom Federbein' },
}

function edge(side: EdgeSide, mm: number): EdgeShift {
    const words = EDGE_WORDS[side]

    if (!Number.isFinite(mm)) {
        return { side, mm, shownMm: Number.NaN, axis: 0, value: null, way: null, phrase: '–', text: `${words.name}: –` }
    }

    // A shift that rounds to no whole millimetre is, as printed, no shift: no arrow, *unverändert*.
    const shownMm = roundHalfAway(mm)
    const sign = shownMm > 0 ? 1 : shownMm < 0 ? -1 : 0
    // The inner edge moving towards the strut is a move inboard, to the left of the drawing.
    const axis = (side === 'outer' ? sign : -sign) as -1 | 0 | 1
    const value = sign === 0 ? null : withUnit(decimal(Math.abs(shownMm), 0), 'mm')
    const way = sign === 0 ? null : sign > 0 ? words.plus : words.minus
    const phrase = value === null || way === null ? 'unverändert' : `${value} ${way}`

    return { side, mm, shownMm, axis: axis === 0 ? 0 : axis, value, way, phrase, text: `${words.name}: ${phrase}` }
}

function faustregelOf(shownPercent: number): FaustregelPosition | null {
    if (!Number.isFinite(shownPercent)) {
        return null
    }

    if (shownPercent < FAUSTREGEL_MIN_PERCENT) {
        return 'below'
    }

    return shownPercent > FAUSTREGEL_MAX_PERCENT ? 'above' : 'inside'
}

/** Everything the Felgenrechner prints and draws for `current → next`. */
export function felgenModel(current: WheelSetup, next: WheelSetup): FelgenModel {
    const a = setupGeometry(current)
    const b = setupGeometry(next)
    const shift = edgeShiftMm(current, next)
    const valid = a.diameterMm > 0 && b.diameterMm > 0
    // Geometric diameters only: the dynamic factor would multiply both and cancel (see the interface).
    const percent = valid ? ((b.diameterMm - a.diameterMm) / a.diameterMm) * 100 : Number.NaN
    // The ratio first, so equal diameters give exactly 100 and exactly 0.
    const speed = valid ? 100 * (b.diameterMm / a.diameterMm) : Number.NaN
    const shownPercent = roundHalfAway(percent, 2)
    const shownSpeedDelta = roundHalfAway(speed - 100, 1)
    const implausible: SetupSide[] = []

    if (!rimSuitsTyre(current)) {
        implausible.push('current')
    }

    if (!rimSuitsTyre(next)) {
        implausible.push('next')
    }

    return {
        input: { current: { ...current }, next: { ...next } },
        current: a,
        next: b,
        implausible,
        outer: edge('outer', shift.outer),
        inner: edge('inner', shift.inner),
        diameterDeltaMm: b.diameterMm - a.diameterMm,
        shownDiameterDeltaMm: roundHalfAway(b.diameterMm - a.diameterMm),
        circumferenceDeltaPercent: percent,
        shownPercent,
        speedAt100KmH: speed,
        shownSpeedDeltaKmH: shownSpeedDelta,
        shownSpeedKmH: 100 + shownSpeedDelta,
        speedoReadingDeltaPercent: valid ? (a.diameterMm / b.diameterMm - 1) * 100 : Number.NaN,
        faustregel: faustregelOf(shownPercent),
    }
}

/* ── The rear view (ClearanceDrawing.vue renders exactly this) ────────────────── */

/**
 * The sheet, in drawing units. What you see standing behind the car and looking at a rear wheel:
 * across is sideways (inside, the strut, on the left; outside, the fender, on the right), up is
 * height. Wheels and tyres are drawn to ONE true scale, `unitsPerMm`, the same for both wheels of a
 * comparison; it is chosen so the larger of the two scenes fills the sheet. Under the wheels a band
 * of the sheet carries the two dimension arrows.
 */
export const REAR = {
    width: 320,
    height: 380,
    pad: 10,
    /** The band under the wheels that carries the dimension arrows. */
    dimBand: 32,
    /** From the lowest point of the tyres down to the dimension arrows. */
    dimDrop: 18,
    /** Extension lines start this far below a rim and run this far past the arrow. */
    gap: 3,
    over: 4,
    /** An arrowhead: this long, and twice `headHalf` high. */
    head: 8,
    headHalf: 3.5,
} as const

/**
 * The car's parts, in millimetres — schematic. Where the strut and the fender really are depends on
 * the car, and the calculator does not know it; the drawing says so (*Lage schematisch – je nach
 * Fahrzeug*). They are the same for both wheels and are set `clearance` off whichever wheel comes
 * closer, so neither wheel ever touches them: a touch would read as a verdict nobody computed.
 */
export const SCHEMATIC_MM = {
    clearance: 25,
    strutTube: 40,
    strutSpring: 64,
    /** How far the strut rises above the taller tyre. */
    strutAbove: 60,
    /** The arch's underside above the taller tyre, its thickness, and how far its lip hangs down. */
    archGap: 25,
    fender: 12,
    fenderRadius: 30,
    lipDrop: 55,
    /** Half the height of the mounting face that is drawn: the car's hub, not the wheel's. */
    faceHalf: 80,
} as const

/** The numbers of one wheel the drawing is built from — what the component tweens. */
export interface WheelFrame {
    centreX: number
    tyreWidthMm: number
    diameterMm: number
    rimWidthMm: number
    rimDiameterMm: number
}

export type RearFrame = Record<SetupSide, WheelFrame>

export function rearFrame(model: FelgenModel): RearFrame {
    const frame = (g: SetupGeometry): WheelFrame => ({
        centreX: g.centreX,
        tyreWidthMm: g.tyreWidthMm,
        diameterMm: g.diameterMm,
        rimWidthMm: g.rimWidthMm,
        rimDiameterMm: g.rimDiameterMm,
    })

    return { current: frame(model.current), next: frame(model.next) }
}

/** A rectangle on the sheet, rounded to 0,01 units for the markup. */
export interface SheetRect {
    x: number
    y: number
    width: number
    height: number
}

export interface RearWheel {
    /** The tyre: a rounded shape as wide as the nominal section width and as high as the tyre. */
    tyre: SheetRect & { r: number }
    /** The rim inside it: as wide as the rim (Maulweite) and as high as the rim diameter. */
    rim: SheetRect
    /** The tyre minus the rim, for the new wheel's tint. */
    ring: string
    /** Unrounded sheet positions, for measuring: the rim's centre plane, its two edges and the tyre's. */
    centreX: number
    innerEdgeX: number
    outerEdgeX: number
    tyreLeftX: number
    tyreRightX: number
    rimBottomY: number
    tyreTopY: number
    tyreBottomY: number
}

export interface RearDimension {
    side: EdgeSide
    /** The current edge and the new edge, sheet x, unrounded. */
    from: number
    to: number
    y: number
    /** True when the shift prints as at least one whole millimetre; otherwise no arrow at all. */
    drawn: boolean
    /** The arrow's shaft from the current edge to the new one: exactly `|shift| × unitsPerMm` long. */
    shaft: string
    /** The arrowhead, its tip on the new edge, pointing the way the edge moved. */
    head: string
    /** Extension lines down from the current (dashed) and the new (solid) rim edge. */
    extFrom: string
    extTo: string
    /** Where the label goes, as a fraction of the sheet width: the middle of the arrow. */
    anchor: number
}

export interface RearScene {
    /** The one scale: drawing units per millimetre, for both wheels. */
    unitsPerMm: number
    /** The mounting face: the car's, so one line for both wheels. */
    faceX: number
    face: string
    current: RearWheel
    next: RearWheel
    strut: { tube: SheetRect; spring: string; rightX: number; anchor: number }
    fender: { path: string; lipX: number; bottomY: number; anchor: number }
    outer: RearDimension
    inner: RearDimension
}

function r2(n: number): number {
    return Math.round(n * 100) / 100
}

function rectPath(x: number, y: number, w: number, h: number): string {
    return `M${r2(x)} ${r2(y)} H${r2(x + w)} V${r2(y + h)} H${r2(x)} Z`
}

function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
    const arc = (tx: number, ty: number) => `A${r2(r)} ${r2(r)} 0 0 1 ${r2(tx)} ${r2(ty)}`

    return (
        `M${r2(x + r)} ${r2(y)} H${r2(x + w - r)} ${arc(x + w, y + r)} V${r2(y + h - r)} ${arc(x + w - r, y + h)} ` +
        `H${r2(x + r)} ${arc(x, y + h - r)} V${r2(y + r)} ${arc(x + r, y)} Z`
    )
}

/**
 * Every shape of the rear view from the two wheels' numbers. The component tweens a `RearFrame`
 * and calls this for each frame; directions and whether an arrow is drawn come from the model's
 * printed values, the labels from its texts.
 */
export function rearScene(frame: RearFrame, model: FelgenModel): RearScene {
    const s = SCHEMATIC_MM
    const wheels = [frame.current, frame.next]

    const maxR = Math.max(...wheels.map((w) => w.diameterMm / 2))
    // The widest reach of either wheel, inboard and outboard — tyre or rim, whichever sticks out.
    const innerMost = Math.min(...wheels.map((w) => w.centreX - Math.max(w.tyreWidthMm, w.rimWidthMm) / 2))
    const outerMost = Math.max(...wheels.map((w) => w.centreX + Math.max(w.tyreWidthMm, w.rimWidthMm) / 2))

    const strutRight = innerMost - s.clearance
    const strutLeft = strutRight - s.strutSpring
    const strutCentre = strutRight - s.strutSpring / 2
    const strutTop = maxR + s.strutAbove
    const lipX = outerMost + s.clearance
    const archY = maxR + s.archGap

    // The scene in millimetres (y up from the axle); the mounting face is always inside it.
    const xMin = Math.min(strutLeft, 0)
    const xMax = Math.max(lipX + s.fender, 0)
    const yMin = -maxR
    const yMax = Math.max(strutTop, archY + s.fender)

    const areaW = REAR.width - 2 * REAR.pad
    const areaH = REAR.height - 2 * REAR.pad - REAR.dimBand
    const k = Math.min(areaW / (xMax - xMin), areaH / (yMax - yMin))
    const left = REAR.pad + (areaW - (xMax - xMin) * k) / 2
    const floor = REAR.pad + areaH

    const X = (x: number): number => left + (x - xMin) * k
    const Y = (y: number): number => floor - (y - yMin) * k

    const wheel = (w: WheelFrame): RearWheel => {
        const tyreLeftX = X(w.centreX - w.tyreWidthMm / 2)
        const tyreRightX = X(w.centreX + w.tyreWidthMm / 2)
        const innerEdgeX = X(w.centreX - w.rimWidthMm / 2)
        const outerEdgeX = X(w.centreX + w.rimWidthMm / 2)
        const tyreTopY = Y(w.diameterMm / 2)
        const tyreBottomY = Y(-w.diameterMm / 2)
        const rimTopY = Y(w.rimDiameterMm / 2)
        const rimBottomY = Y(-w.rimDiameterMm / 2)
        const tw = tyreRightX - tyreLeftX
        const th = tyreBottomY - tyreTopY
        // The shoulder: a sixth of the section width (the section is never taller than the tyre is high).
        const r = Math.min(tw, th) * 0.16
        // The tint fills the tyre around the rim; a rim wider than the tyre does not tint outside it.
        const holeLeft = Math.max(innerEdgeX, tyreLeftX)
        const holeRight = Math.min(outerEdgeX, tyreRightX)

        return {
            tyre: { x: r2(tyreLeftX), y: r2(tyreTopY), width: r2(tw), height: r2(th), r: r2(r) },
            rim: { x: r2(innerEdgeX), y: r2(rimTopY), width: r2(outerEdgeX - innerEdgeX), height: r2(rimBottomY - rimTopY) },
            ring: `${roundedRectPath(tyreLeftX, tyreTopY, tw, th, r)} ${rectPath(holeLeft, rimTopY, holeRight - holeLeft, rimBottomY - rimTopY)}`,
            centreX: X(w.centreX),
            innerEdgeX,
            outerEdgeX,
            tyreLeftX,
            tyreRightX,
            rimBottomY,
            tyreTopY,
            tyreBottomY,
        }
    }

    const current = wheel(frame.current)
    const next = wheel(frame.next)
    const dimY = floor + REAR.dimDrop

    const dimension = (side: EdgeSide, from: number, to: number, fromBottom: number, toBottom: number): RearDimension => {
        const shift = model[side]
        const drawn = shift.axis !== 0
        const lo = Math.min(from, to)
        const hi = Math.max(from, to)
        const tip = r2(to)
        const base = r2(to - shift.axis * REAR.head)
        const h = REAR.headHalf
        const ext = (x: number, bottom: number) => `M${r2(x)} ${r2(bottom + REAR.gap)} V${r2(dimY + REAR.over)}`

        return {
            side,
            from,
            to,
            y: dimY,
            drawn,
            shaft: drawn ? `M${r2(lo)} ${r2(dimY)} H${r2(hi)}` : '',
            head: drawn ? `M${base} ${r2(dimY - h)} L${tip} ${r2(dimY)} L${base} ${r2(dimY + h)} Z` : '',
            extFrom: drawn ? ext(from, fromBottom) : '',
            extTo: drawn ? ext(to, toBottom) : '',
            anchor: (drawn ? (from + to) / 2 : to) / REAR.width,
        }
    }

    const faceX = X(0)
    const tubeLeft = X(strutCentre - s.strutTube / 2)
    const tubeTop = Y(strutTop)
    const tubeBottom = Y(-0.1 * maxR)

    // The coil: a zigzag across the spring's width, from well above the axle to near the strut top.
    const coilTop = strutTop - 8
    const coilBottom = 0.45 * maxR
    const turns = 7
    const coil = Array.from({ length: turns + 1 }, (_, i) => {
        const y = Y(coilTop - ((coilTop - coilBottom) * i) / turns)
        const x = X(i % 2 === 0 ? strutLeft : strutRight)

        return `${i === 0 ? 'M' : 'L'}${r2(x)} ${r2(y)}`
    }).join(' ')

    // The fender over the wheel, from beside the strut to its lip outboard of the wheel, rounded
    // like a body panel. The inner fillet stays inside the lip's corner, so it never nears a wheel.
    const fx0 = X(strutRight + 8)
    const outerR = s.fenderRadius * k
    const innerR = (s.fenderRadius - s.fender) * k
    const fenderPath =
        `M${r2(fx0)} ${r2(Y(archY + s.fender))} H${r2(X(lipX + s.fender) - outerR)} ` +
        `A${r2(outerR)} ${r2(outerR)} 0 0 1 ${r2(X(lipX + s.fender))} ${r2(Y(archY + s.fender) + outerR)} ` +
        `V${r2(Y(archY - s.lipDrop))} H${r2(X(lipX))} V${r2(Y(archY) + innerR)} ` +
        `A${r2(innerR)} ${r2(innerR)} 0 0 0 ${r2(X(lipX) - innerR)} ${r2(Y(archY))} H${r2(fx0)} Z`

    return {
        unitsPerMm: k,
        faceX,
        face: `M${r2(faceX)} ${r2(Y(s.faceHalf))} V${r2(Y(-s.faceHalf))}`,
        current,
        next,
        strut: {
            tube: { x: r2(tubeLeft), y: r2(tubeTop), width: r2(s.strutTube * k), height: r2(tubeBottom - tubeTop) },
            spring: coil,
            rightX: X(strutRight),
            anchor: X(strutCentre) / REAR.width,
        },
        fender: { path: fenderPath, lipX: X(lipX), bottomY: Y(archY), anchor: X(lipX + s.fender / 2) / REAR.width },
        outer: dimension('outer', current.outerEdgeX, next.outerEdgeX, current.rimBottomY, next.rimBottomY),
        inner: dimension('inner', current.innerEdgeX, next.innerEdgeX, current.rimBottomY, next.rimBottomY),
    }
}
