/**
 * The contracts of the 3D wheel stage (docs/design/sections/home-overhaul.md §4.1, §5).
 *
 * Everything in millimetres, as the manifest written by scripts/3d/build-wheel.mjs states it; the
 * scene converts to metres once. Nothing here touches the DOM, so the ladder, the projection and
 * the finish table can be tested without a browser.
 */

export type SlotKey = 'widthDiameter' | 'offset' | 'boltCircle' | 'centreBore'

/** A point inside a square box, as percentages of its width and height. */
export interface BoxTarget {
    tx: number
    ty: number
}

export type BoxTargets = Record<SlotKey, BoxTarget>

/** `resources/js/Components/Home/Wheel3D/hero-wheel-3d.json`, written by `scripts/3d/build-wheel.mjs`. */
export interface Model3dManifest {
    url: string
    bytes: number
    licence: string
    spokes: number
    widthIn: number
    diameterIn: number
    etMm: number
    boltHoles: number
    boltCircleMm: number
    boreMm: number
    /** The flange's outer radius — the silhouette a face-on camera sees — and where along the axle it sits. */
    rimRadiusMm: number
    lipZMm: number
    hubRadiusMm: number
    hubFaceZMm: number
    halfWidthMm: number
    fovDeg: number
    /** Where the wheel stands in the poster: its diameter as a fraction of the square canvas. */
    poster: { fraction: number; centreX: number; centreY: number }
    /** The four callout features in model millimetres — all on circles about the axle. */
    targets3d: Record<SlotKey, [number, number, number]>
    /** The same four, projected at the rest pose, as percentages of the square canvas. */
    targets2d: BoxTargets
}

/** The offline-rendered frames of the sequence fallback (`scripts/3d/render-frames.mjs --sequence`). */
export interface SequenceManifest {
    base: string
    widths: number[]
    width: number
    height: number
    fallback: string
    yaw: { anglesDeg: number[] }
    roll: { frames: number; stepDeg: number }
}

export type Stage = '3d' | 'sequence' | 'poster'

export type ViewerMode = 'hero' | 'band'

/** The featured tyre's section, for the band's parametric tyre: `225/45` → `{ widthMm: 225, aspect: 45 }`. */
export interface TyreSection {
    widthMm: number
    aspect: number
}

/** PBR parameters of a catalogue finish. */
export interface FinishMaterial {
    color: string
    roughness: number
    metalness: number
}
