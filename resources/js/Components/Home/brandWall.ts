/**
 * The brand wall of homepage H6 (docs/design/sections/home-brands.md §9.2): pure helpers, identical
 * in the SSR render and in the browser, so nothing about the wall is measured after hydration.
 *
 * - The wall has one closing cell after the brands; the column count per tier is derived from the
 *   number of cells so the closing cell always completes the last row (§2.2). No empty cells.
 * - A logo is drawn only when every check passes (§4.2) — fail closed: a mis-sized or mis-quoted
 *   logo is never drawn, the brand's name is the mark instead.
 * - The logo box is constant area with two caps (§3.4). The tier values are tokens in tokens.css;
 *   this file only supplies the logo's own aspect and its square root, because CSS has no sqrt().
 * - A brand without stock stays in the wall but is not a link (`isLinked`): a tile that opens an
 *   empty listing is a dead end (CLAUDE.md §2). The cell is greyed and says so where its count
 *   would be, and the note under the wall changes to describe the greyed cells.
 */

import type { StartseiteProps } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'

export type Brand = StartseiteProps['brands'][number]

/** What a brand cell shows on its stage. */
export type CellKind = 'mark' | 'name' | 'sample'

/** Most columns per tier: S < 768 · M 768–1023 · L 1024–1279 · XL ≥ 1280 (§2.2). */
export const WALL_MAX_COLUMNS = { s: 2, m: 4, l: 5, xl: 6 } as const

export type WallTier = keyof typeof WALL_MAX_COLUMNS

export interface WallLayout {
    rows: number
    columns: number
    /** Columns the closing cell spans; always 1 ≤ span ≤ columns. */
    closingSpan: number
}

/** Up to this many brands share one row, with the closing link as a footer strip under them (§2.2). */
const FOOTER_MAX_BRANDS = 3

/**
 * Fewest rows first, then the most even rows (§2.2). `cells` counts the closing cell. With one to
 * three brands the closing link is never a peer cell as wide and tall as a brand: the brands share
 * one row at every tier and the link is a full-width footer strip under them.
 */
export function wallLayout(cells: number, maxColumns: number): WallLayout {
    const brands = Math.max(1, cells - 1)

    if (brands <= FOOTER_MAX_BRANDS) {
        return { rows: 2, columns: brands, closingSpan: brands }
    }

    const rows = Math.ceil(cells / maxColumns)
    const columns = Math.ceil(cells / rows)

    return { rows, columns, closingSpan: columns * rows - cells + 1 }
}

/** Inline custom properties for the `<ul>`: every tier's columns and closing span; brandCount ≥ 1. */
export function wallStyle(brandCount: number): Record<string, string> {
    const style: Record<string, string> = {}

    for (const [tier, max] of Object.entries(WALL_MAX_COLUMNS)) {
        const { columns, closingSpan } = wallLayout(brandCount + 1, max)
        style[`--wall-cols-${tier}`] = String(columns)
        style[`--wall-span-${tier}`] = String(closingSpan)
    }

    return style
}

/**
 * An absolute path on this origin to an SVG, PNG or WebP — nothing that could break out of
 * `url("…")`, and never a protocol-relative `//host/…` (the same pattern as BrandLogos::URL_PATTERN).
 */
const LOGO_PATH = /^\/(?!\/)[A-Za-z0-9/_.-]+\.(svg|png|webp)(\?v=[A-Za-z0-9]+)?$/

/** The narrowest and the widest logo the wall accepts (width / height). */
const ASPECT_MIN = 0.2
const ASPECT_MAX = 20

/** The seeded sample range: labelled as what it is, never dressed up as a manufacturer. */
export const isSampleRange = (brand: Brand): boolean => brand.slug === 'demo'

/** True only when every check passes (§4.2); otherwise the cell shows the wordmark. */
export function hasMark(brand: Brand): boolean {
    const aspect: unknown = brand.logoAspect

    return (
        !isSampleRange(brand) &&
        typeof brand.logo === 'string' &&
        LOGO_PATH.test(brand.logo) &&
        typeof aspect === 'number' &&
        Number.isFinite(aspect) &&
        aspect >= ASPECT_MIN &&
        aspect <= ASPECT_MAX
    )
}

/**
 * The mark's inline custom properties: its aspect and the aspect's square root (3 decimals), and
 * the mask image. CSS then does `min(k·√a, Wmax, Hmax·a, 100%)` with the tier's tokens.
 *
 * The image travels as a custom property rather than as `maskImage` / `WebkitMaskImage`: Vue's
 * server renderer writes `WebkitMaskImage` as `webkit-mask-image` (no leading dash), which no
 * browser reads. A custom property is written verbatim on both sides. Call only when hasMark().
 */
export function markStyle(brand: Brand): Record<string, string> {
    const aspect = brand.logoAspect ?? 1

    return {
        '--logo-aspect': aspect.toFixed(3),
        '--logo-sqrt': Math.sqrt(aspect).toFixed(3),
        '--logo-url': `url("${brand.logo ?? ''}")`,
    }
}

/** The wordmark's step from the name's longest word: ≤ 5 characters `s`, 6–8 `m`, ≥ 9 `l` (§3.3). */
export function wordmarkSize(name: string): 's' | 'm' | 'l' {
    const longest = Math.max(0, ...name.trim().split(/\s+/).map((word) => Array.from(word).length))

    return longest <= 5 ? 's' : longest <= 8 ? 'm' : 'l'
}

/** Prop order, with the sample range moved to the end of the brands. Presentation only. */
export const orderedBrands = (list: readonly Brand[]): Brand[] => [
    ...list.filter((brand) => !isSampleRange(brand)),
    ...list.filter(isSampleRange),
]

/**
 * A cell is a link only when there is something to list: a count above zero AND the server's link
 * to it. Either missing, the cell is greyed and goes nowhere — fail closed, never a tile into an
 * empty listing (CLAUDE.md §2).
 */
export function isLinked(brand: Brand): boolean {
    return typeof brand.count === 'number' && brand.count > 0 && typeof brand.href === 'string' && brand.href !== ''
}

/** What a greyed cell says where its count would be. */
export const NO_STOCK_LINE = 'Noch keine Felgen auf Lager'

/** The closing cell's link text (§4.1). */
export function closingLabel(vehicle: VehicleProp | null): string {
    return vehicle ? 'Passende Felgen anzeigen' : 'Alle Felgen ansehen'
}

const RULE = 'Nur Marken, von denen gerade Felgen auf Lager sind.'

/** The rule once the wall holds a greyed brand: the old sentence would no longer be true. */
const RULE_WITH_GREYED = 'Ausgegraute Marken haben gerade keine Felgen auf Lager.'

/**
 * The note under the wall (§4.1). It states the wall's own rule — which sentence depends on
 * whether a greyed brand is on the wall (`someWithoutStock`), so the note is always true. With a
 * vehicle it adds that the counts are the brand's catalogue counts, because the size tiles right
 * above count only what fits — RIMIFY may not let a bare `18 Felgen` read as "18 fit my car"
 * (CLAUDE.md §2).
 */
export function noteText(vehicle: VehicleProp | null, someWithoutStock = false): string {
    const rule = someWithoutStock ? RULE_WITH_GREYED : RULE

    return vehicle
        ? `${rule} Die Zahl ist der gesamte Lagerbestand der Marke; welche davon an deinen ${vehicle.short} passen, zeigt dir die Liste.`
        : rule
}
