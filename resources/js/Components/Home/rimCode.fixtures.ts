/**
 * Test fixtures for the explainer: the MOTEC hero as the server formats it, and the anchors the
 * image pipeline measured on its front shot. Shared by the unit, component and page tests so they
 * all read the same wheel.
 */

import type { ImageManifest, WheelAnchors } from '../Ui/Picture.vue'
import type { RimFacts } from './rimCode'

const NBSP = ' '

/* GermanFormat joins a number and its unit, and the × of a bolt pattern, with no-break spaces. */
export const FACTS: RimFacts & { maxLoad: string; specLine: string } = {
    width: '8,5J',
    diameter: '19',
    et: `ET${NBSP}45`,
    boltPattern: `5${NBSP}×${NBSP}112`,
    centreBore: `66,6${NBSP}mm`,
    kba: '53810',
    maxLoad: `620${NBSP}kg`,
    specLine: `8,5J × 19 · ET 45 · LK 5 × 112 · MLB 66,6 mm · Traglast 620 kg`,
}

/* scripts/wheel-image.mjs, MOTEC MCR4 Ultimate front shot, 1080 × 1080. */
export const ANCHORS: WheelAnchors = {
    centre: { x: 0.4992, y: 0.4681 },
    wheel: { x: 0.5, y: 0.4708, r: 0.4086 },
    pcd: { x: 0.4992, y: 0.4681, r: 0.0854 },
    bore: { x: 0.5, y: 0.4704, r: 0.0554 },
    valve: { x: 0.4976, y: 0.8145 },
    kba: { x: 0.5, y: 0.8469, w: 0.0696, h: 0.0142 },
}

export function frame(name: string, anchors?: WheelAnchors): ImageManifest {
    return {
        name,
        base: `/storage/demo/wheels/motec/${name}`,
        width: 1080,
        height: 1080,
        widths: [480, 768, 1080],
        placeholder: 'data:image/png;base64,AAAA',
        fallback: 'png',
        ...(anchors ? { anchors } : {}),
    }
}

export const MANIFEST: ImageManifest = { ...frame('motec', ANCHORS), bare: frame('motec-bare', ANCHORS), stamp: '53810' }

export const PRODUCT = { brand: 'MOTEC', name: 'MCR4 Ultimate', finish: 'Light Grey D5', facts: FACTS, imageManifest: MANIFEST }
