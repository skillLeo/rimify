/**
 * `tyreSVG` — a tyre, in a 400×400 viewBox (artwork spec §4).
 *
 * The sidewall carries its own size in 11px mono, which is the only text in the artwork layer and
 * the reason it never needs a caption: a cart line showing `225/35 R18 87Y` on the tyre itself is
 * telling the customer the one fact that matters about it.
 */

import { idFor, polar, round } from './palette'

export interface TyreOptions {
    /** As printed on the sidewall — `245/45 R18 92Y`. Formatted by the caller, never here. */
    label?: string
    size?: number
    title?: string
}

const C = 200
const TREADS = 32

export function tyreSVG(options: TyreOptions = {}): string {
    const label = options.label ?? ''
    const size = options.size ?? 400
    const id = idFor('tyre', label)

    const a11y = options.title
        ? `role="img" aria-label="${options.title.replace(/"/g, '&quot;')}"`
        : 'role="presentation" aria-hidden="true"'

    const blocks: string[] = []

    for (let i = 0; i < TREADS; i++) {
        const deg = (i * 360) / TREADS
        const [x1, y1] = polar(C, C, 156, deg)
        const [x2, y2] = polar(C, C, 190, deg)
        blocks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`)
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${size}" height="${size}" ${a11y} focusable="false">
  <defs>
    <radialGradient id="carcass-${id}" cx="38%" cy="30%" r="82%">
      <stop offset="0" stop-color="#2B2F36"/>
      <stop offset=".6" stop-color="#15171B"/>
      <stop offset="1" stop-color="#0B0C0F"/>
    </radialGradient>
    <radialGradient id="bore-${id}" cx="40%" cy="32%" r="80%">
      <stop offset="0" stop-color="#8E959F"/>
      <stop offset="1" stop-color="#3A3E45"/>
    </radialGradient>
    <filter id="tsoft-${id}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
    <path id="sidewall-${id}" d="M200 316 A116 116 0 1 1 200.1 316" fill="none"/>
  </defs>

  <ellipse cx="200" cy="378" rx="146" ry="13" fill="#0E1116" opacity=".16" filter="url(#tsoft-${id})"/>

  <circle cx="200" cy="200" r="194" fill="url(#carcass-${id})"/>
  <g stroke="#0B0C0F" stroke-width="8">${blocks.join('')}</g>

  <!-- The sidewall ring: one tone lighter, which is what makes the tread read as a separate
       surface rather than a texture painted on a disc. -->
  <circle cx="200" cy="200" r="150" fill="none" stroke="#22262C" stroke-width="56"/>
  <circle cx="200" cy="200" r="178" fill="none" stroke="#000" stroke-width="1" opacity=".5"/>
  <circle cx="200" cy="200" r="122" fill="none" stroke="#000" stroke-width="1" opacity=".5"/>

  <circle cx="200" cy="200" r="120" fill="url(#bore-${id})"/>
  <circle cx="200" cy="200" r="120" fill="none" stroke="#0A0B0D" stroke-width="6" opacity=".6"/>

  <path d="M${round(C - 86)} ${round(C + 64)} A118 118 0 0 1 ${round(C - 92)} ${round(C - 52)}"
        stroke="#FFF" stroke-opacity=".14" stroke-width="5" stroke-linecap="round" fill="none"/>

  ${
      label === ''
          ? ''
          : `<text font-family="'IBM Plex Mono', ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.6" fill="#C3C8CF" fill-opacity=".85">
    <textPath href="#sidewall-${id}" startOffset="50%" text-anchor="middle">${escape(label)}</textPath>
  </text>`
  }
</svg>`
}

function escape(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
