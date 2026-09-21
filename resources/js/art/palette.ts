/**
 * Finish palettes and the small helpers every generator shares.
 *
 * Rule 1 of the build: every visual is drawn in SVG or CSS. There are no image files, no
 * placeholders and no empty boxes — so these five palettes are the entire product photography
 * budget of the site, and the hex values are verbatim from artwork spec §1.
 */

export type Finish = 'graphite' | 'silver' | 'black' | 'bronze' | 'polished'

export interface Palette {
    /** Rim-lip gradient, 135°: start → end. */
    readonly lipFrom: string
    readonly lipTo: string
    /** The wheel face, under the spokes. */
    readonly face: string
    /** The machined bevel along a spoke's leading edge. */
    readonly spokeLight: string
}

export const PALETTES: Readonly<Record<Finish, Palette>> = {
    graphite: { lipFrom: '#3A3E45', lipTo: '#1C1F24', face: '#2A2E34', spokeLight: '#565B63' },
    silver: { lipFrom: '#D8DBE0', lipTo: '#9BA1AA', face: '#C3C8CF', spokeLight: '#F1F3F6' },
    black: { lipFrom: '#1A1C20', lipTo: '#0A0B0D', face: '#16181C', spokeLight: '#34373D' },
    bronze: { lipFrom: '#8A6A3C', lipTo: '#4E3A1F', face: '#6F552F', spokeLight: '#B9915A' },
    polished: { lipFrom: '#E9ECEF', lipTo: '#A8AEB6', face: '#D5DAE0', spokeLight: '#FFFFFF' },
}

export const FINISHES: readonly Finish[] = Object.keys(PALETTES) as Finish[]

export function isFinish(value: string): value is Finish {
    return value in PALETTES
}

/** Unknown finish names fall back to graphite rather than throwing — a catalogue row with a
 *  colour we have not drawn yet must still produce a card, not a blank grid cell. */
export function paletteFor(finish: string): Palette {
    return isFinish(finish) ? PALETTES[finish] : PALETTES.graphite
}

/**
 * A deterministic id suffix so several wheels on one page never share a gradient.
 *
 * It must be a pure function of the inputs: a counter or a random value would differ between the
 * SSR render and the client render, and Vue would tear the whole tree down as a hydration
 * mismatch. Identical inputs producing identical ids is harmless — the gradients are identical too.
 */
export function idFor(...parts: (string | number | boolean)[]): string {
    const key = parts.join('|')
    let h = 0x811c9dc5

    for (let i = 0; i < key.length; i++) {
        h ^= key.charCodeAt(i)
        h = Math.imul(h, 0x01000193)
    }

    return (h >>> 0).toString(36)
}

/** Cartesian point on a circle centred at (cx, cy). Degrees, 0° = east, clockwise on screen. */
export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
    const rad = (deg * Math.PI) / 180

    return [round(cx + r * Math.cos(rad)), round(cy + r * Math.sin(rad))]
}

/** Three decimals is well under a device pixel at any size we render, and keeps the markup small. */
export function round(n: number): number {
    return Math.round(n * 1000) / 1000
}

/** An SVG arc segment as a path `d`, drawn the short way round unless it exceeds 180°. */
export function arc(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
    const [x1, y1] = polar(cx, cy, r, fromDeg)
    const [x2, y2] = polar(cx, cy, r, toDeg)
    const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0
    const sweep = toDeg > fromDeg ? 1 : 0

    return `M${x1} ${y1} A${r} ${r} 0 ${large} ${sweep} ${x2} ${y2}`
}
