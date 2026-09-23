/**
 * The hero's picture and what it points at (docs/phase0/ACCURACY.md D10, §4) — pure data for both
 * documents: `Components/Home/HomeHero.vue` on the desktop and `HeroFrame.vue` on the phone. Every
 * position the page draws is computed here from the photograph's measured anchors, once, so the
 * server-rendered HTML already carries the final drawing and nothing is measured in the browser.
 *
 * The frame is a box of a fixed ratio; the square picture sits in it at a fixed place. An anchor
 * (a fraction of the picture) therefore maps to one fixed fraction of the frame at every width,
 * and a leader drawn in the frame's own units ends exactly on it. A callout box hugs the frame's
 * left or right edge and its leader starts under it, at that edge: the opaque box covers the start,
 * so the visible line leaves the box wherever its edge happens to be, however wide the text makes it.
 *
 * Only what a front view shows is pointed at: the bolt-hole circle (Lochkreis), the cap over the
 * centre bore (Mittenlochbohrung) and the stamped approval mark (KBA-Nummer). Width, diameter and
 * ET are in the spec line. No anchor, no callout; no photograph, no callout at all.
 */

import type { ImageManifest, WheelAnchors } from '../../Ui/Picture.vue'
import type { HeroProduct } from '../../../types/pages'

export type CalloutKey = 'boltCircle' | 'centreBore' | 'kba'

/** Where one callout stands in a layout. Lengths are percentages of the frame. */
export interface CalloutPlacement {
    key: CalloutKey
    /** The frame edge the box hugs. */
    side: 'left' | 'right'
    /** The box's vertical centre, in percent of the frame's height. */
    y: number
    /** Where the leader bends to run level into the box, in percent of the frame's width; straight without. */
    elbow?: number
    /** For a leader ending on a circle (the Lochkreis, the cap): where on it, in degrees clockwise from three o'clock. */
    angle?: number
}

export interface HeroLayout {
    /** The frame's width / height. */
    ratio: number
    /** The square picture: its side as a fraction of the frame's height, its left and top edges as fractions of the frame's width and height. */
    picture: { size: number; left: number; top: number }
    /** How far a box stands in from its edge, in percent of the frame's width. */
    inset: number
    /** The leader's stroke, in the drawing's units (the frame is 100 units tall). */
    weight: number
    callouts: readonly CalloutPlacement[]
    /** How far the wheel rolls in, in widths of the picture; ROLL_DISTANCE without. */
    rollDistance?: number
}

/**
 * The desktop stage, 3 : 2, the picture its full height and centred. The Lochkreis top right, the
 * cap and the stamp from below, where the wheel curves away and a box never covers the rim.
 */
export const DESKTOP_LAYOUT: HeroLayout = {
    ratio: 3 / 2,
    picture: { size: 1, left: 1 / 6, top: 0 },
    inset: 2,
    weight: 0.3,
    callouts: [
        { key: 'boltCircle', side: 'right', y: 12, elbow: 78, angle: -56 },
        { key: 'centreBore', side: 'left', y: 87, elbow: 32, angle: 165 },
        { key: 'kba', side: 'right', y: 87, elbow: 70 },
    ],
}

/**
 * The phone frame, 7 : 6, the picture 90 % of its height: two callouts, both on the right. The frame
 * clips, so the wheel rolls in from just past its right edge: 1,15 picture widths.
 */
export const PHONE_LAYOUT: HeroLayout = {
    ratio: 7 / 6,
    picture: { size: 0.9, left: (1 - (0.9 * 6) / 7) / 2, top: 0.02 },
    inset: 2,
    weight: 0.45,
    rollDistance: 1.15,
    callouts: [
        { key: 'boltCircle', side: 'right', y: 12, elbow: 72, angle: -56 },
        { key: 'kba', side: 'right', y: 89 },
    ],
}

/*
 * The picture's `sizes` on each document — how wide the square picture is at each viewport width.
 * resources/views/app.blade.php preloads the same file with the same strings (a Vitest holds them
 * equal): desktop, the frame's full height (≈ 490 px at ≥ 1280, two thirds of a 6-column stage at
 * 1024–1279, two thirds of a 560 px frame below); phone, 90 % of a 7 : 6 frame's height across the
 * container, i.e. 77 % of it.
 */
export const HERO_SIZES_DESKTOP = '(min-width: 1280px) 500px, (min-width: 1024px) 33vw, (min-width: 768px) 373px, calc(67vw - 27px)'
export const HERO_SIZES_PHONE = '(min-width: 768px) calc(77vw - 49px), calc(77vw - 31px)'

/**
 * How far the wheel rolls in on the desktop stage, in widths of the picture: 1,6 — from past the
 * viewport's right edge at common widths (the stage bleeds to it and the hero clips there), so it
 * visibly rolls about 225° without slipping. It fades in over the first part of the roll, so on a
 * very wide screen it never pops into view mid-stage.
 */
export const ROLL_DISTANCE = 1.6

/** The props of one `SpecCallout`, every length in percent of the frame. */
export interface Callout {
    key: CalloutKey
    label: string
    value: string
    note?: string
    side: 'left' | 'right'
    /** The box's distance from its edge. */
    x: number
    y: number
    /** Where the leader ends. */
    tx: number
    ty: number
    elbow?: number
    /** The dashed circle the Lochkreis leader ends on: centre in percent of the frame's width and height, radius in percent of its height. */
    ring?: { cx: number; cy: number; r: number }
}

export interface HeroScene {
    /** The picture: the shadowless `bare` frame, else the square frame; null means the outline is drawn. */
    picture: ImageManifest | null
    anchors: WheelAnchors | null
    /** The CSS contact shadow under the wheel — only under `bare`, which has none baked in, and only with the wheel anchor. Percent of the picture. */
    shadow: { x: number; y: number; w: number } | null
    /** The roll-in: travel in percent of the picture's width, the matching turn in degrees, the axle in percent of the picture. */
    roll: { distance: number; angle: number; originX: number; originY: number } | null
    callouts: Callout[]
}

/** `53810 (ABE)`: a five-digit KBA number is the mark of an ABE (KBA, PM 18/2025); any other stays a bare number. */
export function kbaValue(kba: string): string {
    return /^\d{5}$/.test(kba) ? `${kba} (ABE)` : kba
}

const round = (n: number): number => Math.round(n * 100) / 100

/** A point of the picture (fractions of its side) in percent of the frame. */
export function toFrame(layout: HeroLayout, point: { x: number; y: number }): { x: number; y: number } {
    const { size, left, top } = layout.picture

    return { x: round((left + (point.x * size) / layout.ratio) * 100), y: round((top + point.y * size) * 100) }
}

/** A point on a circle of the picture, at `angle` degrees clockwise from three o'clock. */
function onCircle(circle: { x: number; y: number; r: number }, angle: number): { x: number; y: number } {
    const rad = (angle * Math.PI) / 180

    return { x: circle.x + circle.r * Math.cos(rad), y: circle.y + circle.r * Math.sin(rad) }
}

/**
 * Everything the hero draws for a product, in one layout. Fails closed: no manifest, no picture;
 * no anchor, no callout; a KBA number only where the photograph's own stamp is that number.
 */
export function heroScene(product: HeroProduct | null, layout: HeroLayout): HeroScene {
    const manifest = product?.imageManifest ?? null
    const bare = manifest?.bare ?? null
    const picture = bare ?? manifest
    // `bare` has the square frame's geometry, so either set of anchors applies to it.
    const anchors = picture === null ? null : (picture.anchors ?? manifest?.anchors ?? null)
    const wheel = anchors?.wheel ?? null

    const shadow = bare !== null && wheel !== null ? { x: round(wheel.x * 100), y: round((wheel.y + wheel.r) * 100), w: round(wheel.r * 2 * 78) } : null

    // Rolling without slipping: the turn is the distance over the radius, both in the picture's width.
    const rollDistance = layout.rollDistance ?? ROLL_DISTANCE
    const roll =
        bare !== null && wheel !== null && anchors !== null
            ? {
                  distance: round(rollDistance * 100),
                  angle: round(((rollDistance / wheel.r) * 180) / Math.PI),
                  originX: round(anchors.centre.x * 100),
                  originY: round(anchors.centre.y * 100),
              }
            : null

    const callouts: Callout[] = []

    if (product !== null && anchors !== null) {
        const { facts } = product

        for (const place of layout.callouts) {
            const base = { key: place.key, side: place.side, x: layout.inset, y: place.y, elbow: place.elbow }

            if (place.key === 'boltCircle' && anchors.pcd !== undefined) {
                const end = toFrame(layout, onCircle(anchors.pcd, place.angle ?? 0))
                const centre = toFrame(layout, anchors.pcd)
                // The radius runs through the bolt-hole centres; the picture is square, so it is one length.
                const ring = { cx: centre.x, cy: centre.y, r: round(anchors.pcd.r * layout.picture.size * 100) }

                callouts.push({ ...base, label: 'Lochkreis', value: facts.boltPattern, tx: end.x, ty: end.y, ring })
            }

            if (place.key === 'centreBore' && anchors.bore !== undefined) {
                // The bore itself is hidden behind the cap: the leader ends on the cap's edge, and the box says so.
                const end = toFrame(layout, onCircle(anchors.bore, place.angle ?? 0))

                callouts.push({ ...base, label: 'Mittenlochbohrung', value: facts.centreBore, note: 'hinter der Nabenkappe', tx: end.x, ty: end.y })
            }

            // The stamp's edge that faces the box; only when the photographed stamp is this configuration's number.
            if (place.key === 'kba' && anchors.kba !== undefined && facts.kba !== null && manifest?.stamp === facts.kba) {
                const edge = place.side === 'right' ? anchors.kba.x + anchors.kba.w / 2 : anchors.kba.x - anchors.kba.w / 2
                const end = toFrame(layout, { x: edge, y: anchors.kba.y })

                callouts.push({ ...base, label: 'KBA-Nummer', value: kbaValue(facts.kba), tx: end.x, ty: end.y })
            }
        }
    }

    return { picture, anchors, shadow, roll, callouts }
}

/**
 * The frame's own inline style: its ratio and where the picture sits, as the custom properties the
 * two components' stylesheets read. One source for the drawing and the layout.
 */
export function frameStyle(layout: HeroLayout): Record<string, string> {
    return {
        '--frame-ratio': String(round(layout.ratio * 10000) / 10000),
        '--pic-left': `${round(layout.picture.left * 100)}%`,
        '--pic-top': `${round(layout.picture.top * 100)}%`,
        '--pic-size': `${round((layout.picture.size / layout.ratio) * 100)}%`,
    }
}

/** The roll-in and the contact shadow as custom properties on the picture's box; none without a roll. */
export function rollStyle(scene: HeroScene): Record<string, string> {
    const out: Record<string, string> = {}

    if (scene.roll !== null) {
        out['--roll-distance'] = `${scene.roll.distance}%`
        out['--roll-angle'] = `${scene.roll.angle}deg`
        out['--roll-origin'] = `${scene.roll.originX}% ${scene.roll.originY}%`
    }

    if (scene.shadow !== null) {
        out['--contact-x'] = `${scene.shadow.x}%`
        out['--contact-y'] = `${scene.shadow.y}%`
        out['--contact-w'] = `${scene.shadow.w}%`
    }

    return out
}
