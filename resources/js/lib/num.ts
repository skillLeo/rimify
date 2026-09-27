/**
 * Numbers, the German way (R-10) — the one module where a number becomes text or text becomes a
 * number. `format.ts` builds units and sizes on it; nothing else in the app formats a number itself
 * (ESLint refuses `toLocaleString` and `Intl.NumberFormat` outside this file).
 *
 *   formatNumber(1234.5, 1)        → `1.234,5`
 *   formatCurrency(142550)         → `1.425,50 €`   (tables, order detail)
 *   formatCurrency(142550, false)  → `1.426 €`      (tiles, charts: no cents)
 *   formatPercent(12.4)            → `+12,4 %`
 *   parseNumber('1.425,50')        → 1425.5         (and `1000`, `1.000`, ` 1000 ` → 1000)
 *
 * A number and its unit are joined by a narrow no-break space, so `189 €` never breaks apart.
 */

export const NNBSP = ' '

const cache = new Map<string, Intl.NumberFormat>()

function formatter(min: number, max: number): Intl.NumberFormat {
    const key = `${min}:${max}`
    let cached = cache.get(key)

    if (cached === undefined) {
        cached = new Intl.NumberFormat('de-DE', { minimumFractionDigits: min, maximumFractionDigits: max })
        cache.set(key, cached)
    }

    return cached
}

/** `1.234,5` — thousands point, decimal comma, exactly `digits` places. */
export function formatNumber(value: number, digits = 0): string {
    return formatter(digits, digits).format(value)
}

/** `1.425,50 €` from integer cents; `1.426 €` without the cents, for a tile or a chart. */
export function formatCurrency(cents: number, withCents = true): string {
    return `${formatNumber(withCents ? cents / 100 : Math.round(cents / 100), withCents ? 2 : 0)}${NNBSP}€`
}

/** `+12,4 %` (with its sign), or `12,4 %` with `sign: false`. */
export function formatPercent(value: number, digits = 1, sign = true): string {
    const text = formatNumber(Math.abs(value), digits)
    const prefix = !sign || value === 0 ? (value < 0 ? '−' : '') : value > 0 ? '+' : '−'

    return `${prefix}${text}${NNBSP}%`
}

/** A German number as a person types it: `1000`, `1.000`, `1.425,50`, `−12,5`, spaces around. */
const GROUPED = /^[+\-−]?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/
const PLAIN = /^[+\-−]?\d+(?:,\d+)?$/

/**
 * The number a German text means, or null where it is not unambiguously one: `12.5` is neither
 * twelve and a half (that is `12,5`) nor a thousands group, so it is not a number. A number is
 * itself; an empty value is null.
 */
export function parseNumber(value: unknown): number | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null
    }

    if (typeof value !== 'string') {
        return null
    }

    const text = value.trim()

    if (!GROUPED.test(text) && !PLAIN.test(text)) {
        return null
    }

    const number = Number(text.replace(/−/g, '-').replace(/\./g, '').replace(',', '.'))

    return Number.isFinite(number) ? number : null
}
