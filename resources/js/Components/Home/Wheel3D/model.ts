/**
 * The one bundled 3D model: the parametric wheel built from the hero configuration by
 * scripts/3d/build-wheel.mjs. The JSON's tuples arrive as plain arrays, so the manifest is typed
 * here, once. When the catalogue carries licensed models, `hero.product.model3d` from the server
 * replaces this import in HomeHero and the band.
 */

import heroWheel3d from './hero-wheel-3d.json'
import type { Model3dManifest } from './types'

export const HERO_MODEL_3D: Model3dManifest = heroWheel3d as unknown as Model3dManifest
