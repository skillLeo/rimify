/**
 * The drawn artwork named outside §4 of the artwork spec (artwork spec §9).
 *
 * Every one of these replaces something a template would reach for: an emoji tick, a stock
 * "secure payment" badge, a gradient login background, a charting library.
 */

import { idFor, round } from './palette'

/** §9 · The confirmation tick. Drawn, never an emoji — emoji are banned outright. */
export function thankYouCheckSVG(size = 56): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88" width="${size + 32}" height="${size + 32}" role="presentation" aria-hidden="true" focusable="false">
  <circle cx="44" cy="44" r="44" fill="#E8F4E5"/>
  <path d="M27 45.5 39 57 62 32" fill="none" stroke="#1A44D4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
}

/** §9 · The `SSL SECURED` mark: a monochrome lock, no badge, no colour, no shield-with-a-tick. */
export function sslLockSVG(size = 20): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
  <rect x="4.5" y="10" width="15" height="10.2" rx="2"/>
  <path d="M8 10V7.8a4 4 0 0 1 8 0V10"/>
  <path d="M12 14v2.4"/>
</svg>`
}

/**
 * §9 · The admin login backdrop: a wheel in orthographic projection with bolt-circle construction
 * lines, the centre bore and ET dimension arrows, 1px strokes at 5% white, bleeding off the edges.
 *
 * Engineering drawing, not decoration. It is the one piece of artwork on the site whose subject is
 * the measurement rather than the product.
 */
export function adminBackdropSVG(width = 900): string {
    const id = idFor('admin-backdrop')
    const cx = 420
    const cy = 300
    const spokes: string[] = []

    for (let i = 0; i < 12; i++) {
        const deg = (i * 360) / 12
        const rad = (deg * Math.PI) / 180
        spokes.push(
            `<line x1="${round(cx + 60 * Math.cos(rad))}" y1="${round(cy + 60 * Math.sin(rad))}" x2="${round(cx + 250 * Math.cos(rad))}" y2="${round(cy + 250 * Math.sin(rad))}"/>`
        )
    }

    const bolts: string[] = []

    for (let i = 0; i < 5; i++) {
        const rad = ((-90 + (i * 360) / 5) * Math.PI) / 180
        const bx = round(cx + 104 * Math.cos(rad))
        const by = round(cy + 104 * Math.sin(rad))
        bolts.push(
            `<circle cx="${bx}" cy="${by}" r="16"/><line x1="${bx - 24}" y1="${by}" x2="${bx + 24}" y2="${by}"/><line x1="${bx}" y1="${by - 24}" x2="${bx}" y2="${by + 24}"/>`
        )
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="${width}" height="${Math.round((width * 600) / 900)}" preserveAspectRatio="xMidYMid slice" role="presentation" aria-hidden="true" focusable="false">
  <g data-drawing="${id}" fill="none" stroke="#FFF" stroke-opacity=".05" stroke-width="1">
    <circle cx="${cx}" cy="${cy}" r="286"/>
    <circle cx="${cx}" cy="${cy}" r="250"/>
    <circle cx="${cx}" cy="${cy}" r="104" stroke-dasharray="8 6"/>
    <circle cx="${cx}" cy="${cy}" r="60"/>
    <circle cx="${cx}" cy="${cy}" r="33"/>
    ${spokes.join('')}
    ${bolts.join('')}
    <line x1="0" y1="${cy}" x2="900" y2="${cy}" stroke-dasharray="14 8"/>
    <line x1="${cx}" y1="0" x2="${cx}" y2="600" stroke-dasharray="14 8"/>

    <!-- ET: the offset dimension, the number this whole business turns on. -->
    <line x1="${cx + 286}" y1="96" x2="${cx + 286}" y2="${cy - 286}"/>
    <line x1="${cx}" y1="96" x2="${cx}" y2="${cy - 60}"/>
    <line x1="${cx}" y1="112" x2="${cx + 286}" y2="112"/>
    <path d="M${cx} 112 l10 -5 v10 Z M${cx + 286} 112 l-10 -5 v10 Z" fill="#FFF" fill-opacity=".05" stroke="none"/>
    <text x="${cx + 132}" y="102" font-family="'IBM Plex Mono', monospace" font-size="13" fill="#FFF" fill-opacity=".07" stroke="none">ET</text>
  </g>
</svg>`
}

export interface SparkPoint {
    readonly label: string
    readonly value: number
}

/**
 * §9 · The dashboard revenue chart: a 2px blue line, a 12% blue fill, faint horizontal grid only,
 * the endpoint dotted and labelled.
 *
 * No library, no axis furniture, no tooltip. Twelve points and a shape.
 */
export function revenueChartSVG(points: readonly SparkPoint[], width = 720, height = 220): string {
    const last = points[points.length - 1]

    if (points.length < 2 || last === undefined) {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="presentation" aria-hidden="true" focusable="false"></svg>`
    }

    const id = idFor('revenue', points.length, last.value)
    const padL = 8
    const padR = 56
    const padT = 16
    const padB = 28
    const values = points.map((p) => p.value)
    const max = Math.max(...values)
    const min = Math.min(...values)
    // A flat series must not collapse onto the axis and read as zero revenue.
    const span = max - min === 0 ? Math.max(1, max) : max - min

    const x = (i: number): number =>
        round(padL + (i * (width - padL - padR)) / (points.length - 1))
    const y = (v: number): number =>
        round(height - padB - ((v - min) / span) * (height - padT - padB))

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)} ${y(p.value)}`).join(' ')
    const area = `${line} L${x(points.length - 1)} ${height - padB} L${x(0)} ${height - padB} Z`

    const grid: string[] = []

    for (let g = 0; g <= 3; g++) {
        const gy = round(padT + (g * (height - padT - padB)) / 3)
        grid.push(`<line x1="${padL}" y1="${gy}" x2="${width - padR}" y2="${gy}"/>`)
    }

    const lastX = x(points.length - 1)
    const lastY = y(last.value)

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="presentation" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="fill-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1A44D4" stop-opacity=".12"/>
      <stop offset="1" stop-color="#1A44D4" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g stroke="currentColor" stroke-opacity=".12" stroke-width="1">${grid.join('')}</g>
  <path d="${area}" fill="url(#fill-${id})"/>
  <path d="${line}" fill="none" stroke="#1A44D4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${lastX}" cy="${lastY}" r="4" fill="#1A44D4"/>
  <circle cx="${lastX}" cy="${lastY}" r="8" fill="none" stroke="#1A44D4" stroke-opacity=".35" stroke-width="1"/>
  <text x="${lastX + 12}" y="${lastY + 4}" font-family="'IBM Plex Mono', monospace" font-size="12" fill="currentColor" fill-opacity=".7">${escapeText(last.label)}</text>
</svg>`
}

function escapeText(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
