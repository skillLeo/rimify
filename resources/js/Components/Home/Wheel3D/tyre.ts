/**
 * The band's tyre as a lathe profile — a closed loop of (r, z) points in millimetres, turned about
 * the axle at runtime. Bead, sidewall bulge, shoulder and a tread with four circumferential
 * grooves: a plain tyre with no sidewall lettering and no mark. Pure data, so the profile is
 * testable without three.
 */

import type { Model3dManifest, TyreSection } from './types'

export interface ProfilePoint {
    r: number
    z: number
}

const GROOVES = 4
const GROOVE_WIDTH = 4
const GROOVE_DEPTH = 7

/**
 * @param model the rim the tyre sits on (its bead seat and half width)
 * @param tyre the section: width across the sidewalls and the aspect ratio in percent
 */
export function tyreProfile(model: Pick<Model3dManifest, 'diameterIn' | 'halfWidthMm'>, tyre: TyreSection): ProfilePoint[] {
    const seat = (model.diameterIn * 25.4) / 2
    const sidewall = (tyre.widthMm * tyre.aspect) / 100
    const outer = seat + sidewall
    const half = tyre.widthMm / 2
    const bead = model.halfWidthMm - 8
    const treadHalf = half - 22

    const front: ProfilePoint[] = [
        { r: seat + 1, z: bead },
        { r: seat + 6, z: bead + 6 },
        { r: seat + sidewall * 0.35, z: half - 4 },
        { r: seat + sidewall * 0.62, z: half },
        { r: outer - 14, z: half - 4 },
        { r: outer - 5, z: treadHalf + 8 },
        { r: outer, z: treadHalf },
    ]

    // The tread: flat, with the grooves cut in as notches, from the front shoulder to the rear one.
    const tread: ProfilePoint[] = []
    const pitch = (2 * treadHalf) / (GROOVES + 1)

    for (let g = 1; g <= GROOVES; g++) {
        const zc = treadHalf - g * pitch
        tread.push({ r: outer, z: zc + GROOVE_WIDTH / 2 })
        tread.push({ r: outer - GROOVE_DEPTH, z: zc + GROOVE_WIDTH / 2 - 0.6 })
        tread.push({ r: outer - GROOVE_DEPTH, z: zc - GROOVE_WIDTH / 2 + 0.6 })
        tread.push({ r: outer, z: zc - GROOVE_WIDTH / 2 })
    }

    const back = front
        .slice()
        .reverse()
        .map((p) => ({ r: p.r, z: -p.z }))

    // Close the loop along the bead seat (the surface against the rim, never seen).
    return [...front, ...tread, ...back, { r: seat + 1, z: -bead }, { r: seat + 1, z: bead }]
}
