/**
 * German formatting in the browser (R-10): the one place a measure or a size is turned into text.
 * Numbers and units are joined with a narrow no-break space, so `72,6 mm` never breaks across a
 * line. The numbers themselves come from `lib/num.ts`, the one module that formats and parses them —
 * and money only from its `formatMoney`, the one way an amount becomes text (the launch release §4).
 */

import { NNBSP, formatNumber } from './lib/num'

export { NNBSP }

/** `1.234,5` — thousands point, decimal comma, a fixed number of places. */
export function decimal(value: number, digits = 1): string {
    return formatNumber(value, digits)
}

/** `72,6 mm`, `71 dB`, `ET 35` — a value and its unit, inseparable. */
export function withUnit(value: string | number, unit: string): string {
    return `${value}${NNBSP}${unit}`
}

/** `18 Zoll`, `18,5 Zoll`; a list reads `17 · 18 · 19 Zoll`. */
/** `1 Felge` · `12 Felgen` — one spelling for every count of wheels on the site. */
export function felgen(count: number): string {
    return `${decimal(count, 0)}${NNBSP}${count === 1 ? 'Felge' : 'Felgen'}`
}

export function zoll(inches: number | string | (number | string)[]): string {
    const list = Array.isArray(inches) ? inches : [inches]
    const values = list.map((v) => (typeof v === 'number' ? decimal(v, Number.isInteger(v) ? 0 : 1) : v))

    return withUnit(values.join(' · '), 'Zoll')
}

/**
 * A text the team typed in Inhalte, as the paragraphs they meant: a blank line starts a new one
 * (the editor says so under every long field). One rule for the Ratgeber, the legal pages and the
 * FAQ, so no page prints a typed paragraph break as a single run-on block.
 */
export function paragraphs(text: string | null | undefined): string[] {
    return (text ?? '')
        .replace(/\r\n?/g, '\n')
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p !== '')
}
