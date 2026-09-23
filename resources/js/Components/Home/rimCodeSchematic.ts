/**
 * The cross-section of *Was die Zahlen auf einer Felge bedeuten* (ACCURACY.md §5): the upper half of
 * a one-piece rim cut through its axis and through one bolt hole, in technical-drawing style.
 * Schematic and not to scale — the proportions are chosen so every term can be read — but the
 * definitions it illustrates are exact (ISO 3911 / ETRTO, `accuracy-research-motec.md` §3 (d)):
 *
 * - **Maulweite** runs between the INNER faces of the two flanges (Felgenhörner);
 * - **Felgendurchmesser** is taken at the bead seats (Wulstsitz), where the tyre bead sits, not at
 *   the flange — in a half-section that is a radius from the axis, labelled as half the diameter;
 * - the **rim centre plane** (Felgenmitte) lies exactly halfway between the flange inner faces;
 * - **Einpresstiefe** runs from that plane to the **Anlagefläche**, the face that is bolted to the
 *   hub. For a positive ET (ISO 3911 3.2.4, "inset") the Anlagefläche lies outboard of the centre
 *   plane, toward the fender;
 * - **Lochkreis** passes through the bolt-hole centres, **Mittenlochbohrung** is the opening round
 *   the axis: in the half-section, each is a radius labelled as half of it.
 *
 * Orientation: the vehicle's centre is on the left, the outside (the fender) on the right; the
 * wheel axis runs along the bottom. One user unit is one CSS pixel when the drawing is set at its
 * own width (360), so the labels set in `--fs-small` are 14 px there.
 */

import type { SchematicKey } from './rimCode'

/** Every coordinate the drawing uses; the component and the tests read the same numbers. */
export const SCHEMATIC = {
    width: 360,
    height: 294,
    /** The inner face of the flange on the vehicle side. */
    xFlangeIn: 98,
    /** The inner face of the flange on the outside. */
    xFlangeOut: 258,
    /** The rim centre plane: exactly halfway between the two inner faces. */
    xCentre: (98 + 258) / 2,
    /** The Anlagefläche, drawn for a positive ET: outboard of the centre plane. */
    xAnlage: 212,
    /** The hub pad's outboard face. */
    xPadOut: 226,
    yLip: 46,
    yBeadSeat: 74,
    /** Each hump — the ridge at the well side of a bead seat: its centre and half its width. */
    xHumpIn: 131,
    xHumpOut: 225,
    humpHalf: 3,
    /** The control point of the hump's curve; a quadratic reaches half as far, so the ridge peaks at 70. */
    yHumpControl: 66,
    yHumpPeak: (74 + 2 * 66 + 74) / 4,
    yUnderside: 80,
    yWell: 106,
    yPadTop: 174,
    /** The bolt hole: its centre on the Lochkreis radius, and its two walls. */
    yBolt: 230,
    yBoltTop: 224,
    yBoltBottom: 236,
    /** The edge of the Mittenlochbohrung. */
    yBore: 260,
    /** The wheel axis (Radachse). */
    yAxis: 286,
} as const

const S = SCHEMATIC

/**
 * The section's outline, one closed path: the flange on the vehicle side, its bead seat with the
 * hump, the barrel, the well (Tiefbett), the outer bead seat and flange; underneath, the barrel's
 * inside, the disc (Radschüssel) down to the hub pad whose inboard face is the Anlagefläche, cut
 * through the bolt hole.
 *
 * Both humps are drawn and both are labelled *Hump*. The drawing names the feature, never a rim's
 * hump designation: which designation a wheel carries is the Gutachten's statement about that wheel,
 * and `wheel_configs.hump` holds the same constant for every demo row, so no such designation may be
 * read off this drawing (CLAUDE.md §2).
 */
export const PROFILE = [
    `M ${S.xFlangeIn} ${S.yBeadSeat}`,
    // Flange on the vehicle side: inner face up, the lip curled outward, the back face down.
    `L ${S.xFlangeIn} 54 Q ${S.xFlangeIn} ${S.yLip} 90 ${S.yLip} L 84 ${S.yLip} L 84 52 Q 92 52 92 60 L 92 ${S.yUnderside}`,
    // The barrel's inside, round the underside of the well.
    `L 157.6 ${S.yUnderside} L 167.6 112 L 208.4 112 L 218.4 ${S.yUnderside} L 244 ${S.yUnderside}`,
    // The disc down to the hub pad; the pad's inboard face is the Anlagefläche, cut by the bolt hole.
    `L ${S.xAnlage} ${S.yPadTop} L ${S.xAnlage} ${S.yBoltTop} L ${S.xPadOut} ${S.yBoltTop} L ${S.xPadOut} 188`,
    // The disc's outboard face up to the outer flange, its back face, the lip, its inner face.
    `L 264 90 L 264 60 Q 264 52 272 52 L 272 ${S.yLip} L 266 ${S.yLip} Q ${S.xFlangeOut} ${S.yLip} ${S.xFlangeOut} 54 L ${S.xFlangeOut} ${S.yBeadSeat}`,
    // The tyre side, right to left: outer bead seat, hump, barrel, the well, barrel, hump, inner bead seat.
    `L ${S.xHumpOut + S.humpHalf} ${S.yBeadSeat} Q ${S.xHumpOut} ${S.yHumpControl} ${S.xHumpOut - S.humpHalf} ${S.yBeadSeat}`,
    `L 214 ${S.yBeadSeat} L 204 ${S.yWell} L 172 ${S.yWell} L 162 ${S.yBeadSeat}`,
    `L ${S.xHumpIn + S.humpHalf} ${S.yBeadSeat} Q ${S.xHumpIn} ${S.yHumpControl} ${S.xHumpIn - S.humpHalf} ${S.yBeadSeat} Z`,
].join(' ')

/** The hub pad below the bolt hole, down to the edge of the Mittenlochbohrung (a separate island in the cut). */
export const PAD_BELOW = `M ${S.xAnlage} ${S.yBoltBottom} L ${S.xPadOut} ${S.yBoltBottom} L ${S.xPadOut} ${S.yBore} L ${S.xAnlage} ${S.yBore} Z`

/** How far short of the feature a leader stops, so the line points at it without touching it. */
const LEAD_GAP = 3

/** Oblique tick marks (Schrägstriche) at both ends of a dimension line, no arrowheads. */
function ticks(x1: number, y1: number, x2: number, y2: number): string {
    const t = 4

    return `M ${x1 - t} ${y1 + t} L ${x1 + t} ${y1 - t} M ${x2 - t} ${y2 + t} L ${x2 + t} ${y2 - t}`
}

export interface SchematicLabel {
    text: string
    x: number
    y: number
    anchor: 'start' | 'middle' | 'end'
    /** Degrees, about the label's own point: a vertical dimension reads from below (DIN ISO 129). */
    rotate?: number
}

export interface SchematicDimension {
    key: SchematicKey
    /** Extension lines from the feature out to the dimension line. */
    ext: string
    line: string
    ticks: string
    label: SchematicLabel
    /** The faces the dimension is taken from, traced over the outline when it is active. */
    faces: string
}

export const DIMENSIONS: Record<SchematicKey, SchematicDimension> = {
    // Between the INNER faces of the two flanges, above the rim.
    width: {
        key: 'width',
        ext: `M ${S.xFlangeIn} 50 L ${S.xFlangeIn} 28 M ${S.xFlangeOut} 50 L ${S.xFlangeOut} 28`,
        line: `M ${S.xFlangeIn} 32 L ${S.xFlangeOut} 32`,
        ticks: ticks(S.xFlangeIn, 32, S.xFlangeOut, 32),
        label: { text: 'Maulweite', x: S.xCentre, y: 24, anchor: 'middle' },
        faces: `M ${S.xFlangeIn} 54 L ${S.xFlangeIn} ${S.yBeadSeat} M ${S.xFlangeOut} 54 L ${S.xFlangeOut} ${S.yBeadSeat}`,
    },
    // From the axis up to the bead seat — a radius, so it is labelled as half the diameter.
    diameter: {
        key: 'diameter',
        ext: `M 88 ${S.yBeadSeat} L 26 ${S.yBeadSeat}`,
        line: `M 30 ${S.yBeadSeat} L 30 ${S.yAxis}`,
        ticks: ticks(30, S.yBeadSeat, 30, S.yAxis),
        label: { text: '½ Felgendurchmesser', x: 22, y: (S.yBeadSeat + S.yAxis) / 2, anchor: 'middle', rotate: -90 },
        faces: `M ${S.xFlangeIn} ${S.yBeadSeat} L 128 ${S.yBeadSeat} M 228 ${S.yBeadSeat} L ${S.xFlangeOut} ${S.yBeadSeat}`,
    },
    // From the centre plane to the Anlagefläche, in the open space inside the barrel.
    et: {
        key: 'et',
        ext: `M ${S.xAnlage} ${S.yPadTop - 4} L ${S.xAnlage} 152`,
        line: `M ${S.xCentre} 158 L ${S.xAnlage} 158`,
        ticks: ticks(S.xCentre, 158, S.xAnlage, 158),
        label: { text: 'Einpresstiefe (ET)', x: S.xCentre - 6, y: 162, anchor: 'end' },
        faces: `M ${S.xAnlage} ${S.yPadTop} L ${S.xAnlage} ${S.yBoltTop} M ${S.xAnlage} ${S.yBoltBottom} L ${S.xAnlage} ${S.yBore}`,
    },
    // From the axis to the bolt-hole centre.
    lk: {
        key: 'lk',
        ext: `M 234 ${S.yBolt} L 250 ${S.yBolt}`,
        line: `M 246 ${S.yBolt} L 246 ${S.yAxis}`,
        ticks: ticks(246, S.yBolt, 246, S.yAxis),
        label: { text: '½ Lochkreis', x: 252, y: 250, anchor: 'start' },
        faces: `M ${S.xAnlage} ${S.yBoltTop} L ${S.xPadOut} ${S.yBoltTop} M ${S.xAnlage} ${S.yBoltBottom} L ${S.xPadOut} ${S.yBoltBottom}`,
    },
    // From the axis to the edge of the bore.
    mlb: {
        key: 'mlb',
        ext: `M ${S.xAnlage - 2} ${S.yBore} L 198 ${S.yBore}`,
        line: `M 202 ${S.yBore} L 202 ${S.yAxis}`,
        ticks: ticks(202, S.yBore, 202, S.yAxis),
        label: { text: '½ Mittenlochbohrung', x: 196, y: 278, anchor: 'end' },
        faces: `M ${S.xAnlage} ${S.yBore} L ${S.xPadOut} ${S.yBore}`,
    },
}

/** The order the dimensions are drawn in (and read by assistive technology in the description). */
export const DIMENSION_ORDER: SchematicKey[] = ['width', 'diameter', 'et', 'lk', 'mlb']

/** Named parts, each with the dimension that makes it the subject when active. */
export interface SchematicPart {
    id: string
    label: SchematicLabel
    /** A short leader from the label to the part, where the label cannot sit on it. */
    leader?: string
    /** The dimensions for which this part is the reference, set in the full ink when they are active. */
    for: SchematicKey[]
}

export const PARTS: SchematicPart[] = [
    { id: 'flange-in', label: { text: 'Felgenhorn', x: 82, y: 40, anchor: 'end' }, for: ['width'] },
    { id: 'flange-out', label: { text: 'Felgenhorn', x: 274, y: 40, anchor: 'start' }, for: ['width'] },
    // The bead seats and the well are named from the upper row, the humps from the row beneath it, so
    // that every leader reaches its feature through open space.
    { id: 'bead-seat', label: { text: 'Wulstsitz', x: 102, y: 48, anchor: 'start' }, leader: `M 106 52 L 106 ${S.yBeadSeat - LEAD_GAP}`, for: ['diameter'] },
    { id: 'well', label: { text: 'Tiefbett', x: 186, y: 48, anchor: 'start' }, leader: `M 190 52 L 190 ${S.yWell - LEAD_GAP}`, for: [] },
    { id: 'hump-in', label: { text: 'Hump', x: S.xHumpIn, y: 64, anchor: 'middle' }, for: [] },
    { id: 'hump-out', label: { text: 'Hump', x: S.xHumpOut, y: 64, anchor: 'middle' }, for: [] },
    { id: 'centre-plane', label: { text: 'Felgenmitte', x: 148, y: 182, anchor: 'end' }, leader: `M 152 178 L ${S.xCentre - LEAD_GAP} 178`, for: ['et'] },
    { id: 'anlage', label: { text: 'Anlagefläche', x: 180, y: 212, anchor: 'end' }, leader: `M 184 208 L ${S.xAnlage - LEAD_GAP} 208`, for: ['et'] },
    { id: 'disc', label: { text: 'Radschüssel', x: 272, y: 144, anchor: 'start' }, leader: 'M 268 140 L 248 140', for: [] },
    { id: 'axis', label: { text: 'Radachse', x: 276, y: 278, anchor: 'start' }, for: [] },
]

/**
 * The rim centre plane: a dashed line through the whole section, past the ET dimension and far enough
 * below it for the *Felgenmitte* leader to end on the line rather than on its tip.
 */
export const CENTRE_PLANE = { x: S.xCentre, y1: 38, y2: 186 } as const

/** The bolt hole's own centre line, and the wheel axis — both dash-dot, as a drawing office draws an axis. */
export const BOLT_AXIS = `M 204 ${S.yBolt} L 234 ${S.yBolt}`
export const WHEEL_AXIS = `M 8 ${S.yAxis} L 352 ${S.yAxis}`

/** `transform` for a rotated label. */
export function labelTransform(label: SchematicLabel): string | undefined {
    return label.rotate === undefined ? undefined : `rotate(${label.rotate} ${label.x} ${label.y})`
}
