/**
 * The artwork layer.
 *
 * Rule 1 of the build: every visual is drawn in SVG or CSS. There are no image files, no
 * placeholders and no empty boxes. Each function is pure and deterministic — the same arguments
 * always produce the same string — which is what lets the server render and the client hydrate
 * without tearing the tree down over a mismatched gradient id.
 */

export { brandBannerSVG, type BannerOptions } from './banner'
export { carSVG, type CarOptions, type CarVariant } from './car'
export { docSVG, type DocOptions, type DocVariant } from './doc'
export { heroSceneSVG, type HeroOptions } from './hero'
export { ICON_NAMES, icon, isIconName, type IconName, type IconOptions } from './icons'
export {
    adminBackdropSVG,
    revenueChartSVG,
    sslLockSVG,
    thankYouCheckSVG,
    type SparkPoint,
} from './misc'
export { FINISHES, PALETTES, isFinish, paletteFor, type Finish, type Palette } from './palette'
export { sceneSVG, type SceneName, type SceneOptions } from './scene'
export { tyreSVG, type TyreOptions } from './tyre'
export { wheelSVG, type WheelOptions } from './wheel'
