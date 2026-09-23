/**
 * The camera and the callout projection — pure arithmetic shared by the scene, the hero and the
 * tests. The camera looks down the axle; its distance is set so the flange's silhouette spans the
 * same fraction of the square canvas as the wheel does in the poster, so the swap moves nothing.
 *
 * The four targets are features on circles about the axle (the lip, the hub face, the bolt ring,
 * the bore), so a roll about the axle never moves what a line points at: the projection is taken
 * at the rest pose and holds under any roll. The same numbers are written by
 * scripts/3d/build-wheel.mjs into the manifest's `targets2d`; a Vitest keeps them equal.
 */

import type { BoxTarget, BoxTargets, Model3dManifest, SlotKey, TyreSection } from './types'

export const SLOT_KEYS: readonly SlotKey[] = ['widthDiameter', 'offset', 'boltCircle', 'centreBore']

/** The band leaves a little air around the tyre. */
const BAND_FRACTION = 0.96

function tanHalf(fovDeg: number): number {
    return Math.tan((fovDeg / 2) * (Math.PI / 180))
}

/** A tyre's outer radius on this rim: the bead seat plus the sidewall (width × aspect). */
export function tyreOuterRadiusMm(model: Pick<Model3dManifest, 'diameterIn'>, tyre: TyreSection): number {
    return (model.diameterIn * 25.4) / 2 + (tyre.widthMm * tyre.aspect) / 100
}

/**
 * How far the camera stands from the wheel's centre plane, in millimetres, so that a silhouette of
 * radius `radiusMm` at depth `zMm` spans `fraction` of the canvas.
 */
export function cameraDistanceMm(fovDeg: number, radiusMm: number, zMm: number, fraction: number): number {
    return radiusMm / (fraction * tanHalf(fovDeg)) + zMm
}

/** The hero: the rim fills the poster's fraction. The band: rim + tyre fill 96 % of the box. */
export function framing(
    model: Model3dManifest,
    tyre: TyreSection | null,
): { distanceMm: number; rimFraction: number; fraction: number } {
    if (tyre === null) {
        const fraction = model.poster.fraction

        return { distanceMm: cameraDistanceMm(model.fovDeg, model.rimRadiusMm, model.lipZMm, fraction), rimFraction: fraction, fraction }
    }

    const outer = tyreOuterRadiusMm(model, tyre)
    // The tread's front shoulder sits a little inboard of the tyre's half width.
    const treadZ = tyre.widthMm / 2 - 20
    const distanceMm = cameraDistanceMm(model.fovDeg, outer, treadZ, BAND_FRACTION)
    const rimFraction = model.rimRadiusMm / ((distanceMm - model.lipZMm) * tanHalf(model.fovDeg))

    return { distanceMm, rimFraction, fraction: BAND_FRACTION }
}

/** One model point → percentages of the square canvas, for a camera at `distanceMm` on the axle. */
export function projectPoint(point: readonly [number, number, number], fovDeg: number, distanceMm: number): BoxTarget {
    const [x, y, z] = point
    const half = (distanceMm - z) * tanHalf(fovDeg)

    return {
        tx: Number((50 + (50 * x) / half).toFixed(2)),
        ty: Number((50 - (50 * y) / half).toFixed(2)),
    }
}

/** All four targets at the rest pose, as percentages of the canvas. */
export function projectTargets(model: Model3dManifest, tyre: TyreSection | null = null): BoxTargets {
    const { distanceMm } = framing(model, tyre)
    const out = {} as BoxTargets

    for (const key of SLOT_KEYS) {
        out[key] = projectPoint(model.targets3d[key], model.fovDeg, distanceMm)
    }

    return out
}

/** A rectangle as the DOM measures it — the subset of `DOMRect` the mapping needs. */
export interface Box {
    left: number
    top: number
    width: number
    height: number
}

/**
 * A target inside the wheel's box, expressed in the frame's percentages — the leader lines are
 * drawn in the frame's space. Both rectangles come from `getBoundingClientRect()` after mount.
 */
export function boxToFrame(target: BoxTarget, box: Box, frame: Box): BoxTarget {
    if (frame.width <= 0 || frame.height <= 0) {
        return target
    }

    return {
        tx: Number((((box.left - frame.left + (target.tx / 100) * box.width) / frame.width) * 100).toFixed(2)),
        ty: Number((((box.top - frame.top + (target.ty / 100) * box.height) / frame.height) * 100).toFixed(2)),
    }
}

/**
 * The featured tyre's section from its title — `Continental PremiumContact 225/45 R17 94W` →
 * `225/45`. A title without a size gives null, and the band then uses a plain default; a wrong
 * tyre is never invented from a partial match.
 */
export function tyreSectionFromTitle(title: string | null | undefined): TyreSection | null {
    const hit = /(\d{3})\s*\/\s*(\d{2})\s*Z?R\s*\d{2}/i.exec(title ?? '')

    if (hit === null) {
        return null
    }

    return { widthMm: Number(hit[1]), aspect: Number(hit[2]) }
}
