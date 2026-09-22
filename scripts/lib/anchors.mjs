// Anchor points measured on a wheel photograph, carried into the frames the pipeline exports.
//
// Measured in source pixels, as pixel indices (the pixel whose centre is at index + 0.5):
//   centre [x, y] · wheel [x, y, r] · pcd [x, y, r] · bore [x, y, r] · valve [x, y] · kba [x, y, w, h]
// `wheel` is the rim's outer lip, `pcd` the circle through the bolt-hole centres, `bore` the cap
// over the centre bore, `kba` the stamped approval mark (its centre, width and height).
//
// Written to the manifest normalised to one frame (docs/phase0/ACCURACY.md §4, `WheelAnchors`):
// x and y are fractions of the frame's width and height, r and w fractions of its width, h a
// fraction of its height. So a page lays the anchors over the image at any displayed size.

/** How many numbers each anchor takes, in order. */
export const ANCHOR_SHAPES = { centre: 2, wheel: 3, pcd: 3, bore: 3, valve: 2, kba: 4 }

/** The keys each anchor is written with. */
const KEYS = { centre: ['x', 'y'], wheel: ['x', 'y', 'r'], pcd: ['x', 'y', 'r'], bore: ['x', 'y', 'r'], valve: ['x', 'y'], kba: ['x', 'y', 'w', 'h'] }

/**
 * Checks measured anchors and returns them as { name: [numbers] }. A centre is required; an
 * unknown name, a wrong count or a value that is not a finite, non-negative number throws rather
 * than being half-used.
 */
export function parseAnchors(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('anchors must be an object of name → [numbers]')
    }

    if (!('centre' in value)) {
        throw new Error('anchors need a centre')
    }

    const out = {}

    for (const [name, numbers] of Object.entries(value)) {
        const count = ANCHOR_SHAPES[name]

        if (count === undefined) {
            throw new Error(`unknown anchor "${name}"`)
        }

        if (!Array.isArray(numbers) || numbers.length !== count || !numbers.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0)) {
            throw new Error(`anchor "${name}" must be ${count} non-negative numbers`)
        }

        out[name] = numbers
    }

    return out
}

/**
 * Carries source-pixel anchors into one frame.
 *
 * The frame holds the cut (whose top-left corner is `origin` in the photograph and whose size is
 * `cut`) scaled to `placed.width` × `placed.height` at (`placed.left`, `placed.top`) — exactly the
 * composite the pipeline performs, so a point lands where its pixel was drawn.
 *
 * @param {Record<string, number[]>} anchors
 * @param {{ origin: {x: number, y: number}, cut: {width: number, height: number},
 *           placed: {left: number, top: number, width: number, height: number},
 *           frame: {width: number, height: number} }} geometry
 */
export function frameAnchors(anchors, geometry) {
    const { origin, cut, placed, frame } = geometry
    const sx = placed.width / cut.width
    const sy = placed.height / cut.height

    // A pixel index's centre, through the scale and the placement, as a fraction of the frame.
    const x = (index) => round((placed.left + (index + 0.5 - origin.x) * sx) / frame.width)
    const y = (index) => round((placed.top + (index + 0.5 - origin.y) * sy) / frame.height)
    const across = (pixels) => round((pixels * sx) / frame.width)
    const down = (pixels) => round((pixels * sy) / frame.height)

    const out = {}

    for (const name of Object.keys(KEYS)) {
        const values = anchors[name]

        if (values === undefined) {
            continue
        }

        const point = { x: x(values[0]), y: y(values[1]) }

        if (name === 'kba') {
            point.w = across(values[2])
            point.h = down(values[3])
        } else if (values.length === 3) {
            point.r = across(values[2])
        }

        out[name] = point
    }

    return out
}

/** Four decimals: a tenth of a pixel on a 1080 frame. */
function round(value) {
    return Math.round(value * 10_000) / 10_000
}
