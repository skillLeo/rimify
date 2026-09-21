/**
 * German formatting in the browser (R-10): the one place a price, a measure or a size is turned
 * into text. Numbers and units are joined with a narrow no-break space, so `189,00 €` and
 * `72,6 mm` never break across a line and never drift apart.
 */

export const NNBSP = ' '

const decimals = new Map<number, Intl.NumberFormat>()

function formatter(digits: number): Intl.NumberFormat {
    let cached = decimals.get(digits)

    if (cached === undefined) {
        cached = new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits })
        decimals.set(digits, cached)
    }

    return cached
}

/** `1.234,5` — thousands point, decimal comma, a fixed number of places. */
export function decimal(value: number, digits = 1): string {
    return formatter(digits).format(value)
}

/** `1.234,00 €` from integer cents. */
export function euro(cents: number): string {
    return `${decimal(cents / 100, 2)}${NNBSP}€`
}

/** `72,6 mm`, `71 dB`, `ET 35` — a value and its unit, inseparable. */
export function withUnit(value: string | number, unit: string): string {
    return `${value}${NNBSP}${unit}`
}

/** `18 Zoll`, `18,5 Zoll`; a list reads `17 · 18 · 19 Zoll`. */
export function zoll(inches: number | string | (number | string)[]): string {
    const list = Array.isArray(inches) ? inches : [inches]
    const values = list.map((v) => (typeof v === 'number' ? decimal(v, Number.isInteger(v) ? 0 : 1) : v))

    return withUnit(values.join(' · '), 'Zoll')
}
