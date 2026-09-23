/**
 * The image-sequence fallback for the one bundled model: five yaw frames for the hero and twelve
 * roll frames for the band, rendered offline from the same parametric wheel by
 * scripts/3d/render-frames.mjs --sequence. Typed once here, like the model.
 */

import heroWheelSeq from './hero-wheel-seq.json'
import type { SequenceManifest } from './types'

export const HERO_SEQUENCE: SequenceManifest = heroWheelSeq as SequenceManifest
