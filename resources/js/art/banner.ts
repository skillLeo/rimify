/**
 * `brandBannerSVG` — the 16:9 card art under "Entdecke die beliebtesten Felgenmarken"
 * (artwork spec §5).
 *
 * The one place on the storefront where the brand blue appears as a large surface. It works
 * because the wheel is cropped and rotated rather than centred: a logo on a rectangle is a tile,
 * a wheel running off the edge is a photograph.
 */

import { idFor, type Finish } from './palette'
import { wheelSVG } from './wheel'

export interface BannerOptions {
    /** The brand wordmark, lower left. */
    brand: string
    finish?: Finish | string
    spokes?: number
    width?: number
}

export function brandBannerSVG(options: BannerOptions): string {
    const width = options.width ?? 640
    const height = Math.round((width * 9) / 16)
    const id = idFor('banner', options.brand, options.finish ?? 'graphite', options.spokes ?? 10)

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="${width}" height="${height}" role="img" aria-label="${escapeAttr(options.brand)}" focusable="false">
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0E1116"/>
      <stop offset=".62" stop-color="#1A2440"/>
      <stop offset="1.45" stop-color="#1A44D4"/>
    </linearGradient>
    <pattern id="tex-${id}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="10" stroke="#FFF" stroke-opacity=".03" stroke-width="1"/>
    </pattern>
    <clipPath id="clip-${id}"><rect width="640" height="360" rx="14"/></clipPath>
  </defs>

  <g clip-path="url(#clip-${id})">
    <rect width="640" height="360" fill="url(#bg-${id})"/>
    <rect width="640" height="360" fill="url(#tex-${id})"/>

    <g transform="translate(400 40) rotate(12)" opacity=".7">${wheelSVG({
        spokes: options.spokes ?? 10,
        finish: options.finish ?? 'graphite',
        size: 320,
    })}</g>

    <text x="36" y="316" font-family="Lato, Arial, sans-serif" font-size="34" font-weight="900" fill="#FFF">${escapeText(options.brand)}</text>
  </g>
</svg>`
}

function escapeText(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(s: string): string {
    return escapeText(s).replace(/"/g, '&quot;')
}
