/**
 * `sceneSVG` — the two named scenes (artwork spec §7).
 *
 * These fill the slots where a template would reach for stock photography: the "smiling diverse
 * team in a bright office" and the "flat people with laptops" illustration are both on the banned
 * list, and both appear in the client's own Figma. They are replaced here, not reproduced.
 *
 * `werkstatt` shows a wheel on a balancing machine. Never people.
 */

import { idFor } from './palette'
import { wheelSVG } from './wheel'

export type SceneName = 'lager' | 'werkstatt'

export interface SceneOptions {
    width?: number
    title?: string
}

export function sceneSVG(name: SceneName, options: SceneOptions = {}): string {
    return name === 'lager' ? lager(options) : werkstatt(options)
}

/** The warehouse slot: stacked wheel silhouettes in receding tonal bands. Abstract, monochrome. */
function lager(options: SceneOptions): string {
    const width = options.width ?? 640
    const id = idFor('scene', 'lager')
    const a11y = options.title
        ? `role="img" aria-label="${escapeAttr(options.title)}"`
        : 'role="presentation" aria-hidden="true"'

    const bands: string[] = []
    const tones = ['#171B22', '#1D222B', '#242A35', '#2C3340']

    for (let row = 0; row < 4; row++) {
        const y = 118 + row * 58
        const r = 52 - row * 7
        const tone = tones[3 - row]
        const cols = 6 + row

        for (let col = 0; col < cols; col++) {
            const x = 40 + (col * (560 - r)) / (cols - 1)
            bands.push(
                `<circle cx="${Math.round(x)}" cy="${y}" r="${r}" fill="${tone}"/>` +
                    `<circle cx="${Math.round(x)}" cy="${y}" r="${Math.round(r * 0.34)}" fill="#0E1116" opacity=".7"/>`
            )
        }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="${width}" height="${Math.round((width * 400) / 640)}" ${a11y} focusable="false">
  <defs>
    <linearGradient id="lg-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0B0D12"/>
      <stop offset="1" stop-color="#161B24"/>
    </linearGradient>
    <radialGradient id="lp-${id}" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#7896FF" stop-opacity=".2"/>
      <stop offset="1" stop-color="#7896FF" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="lc-${id}"><rect width="640" height="400" rx="14"/></clipPath>
  </defs>
  <g clip-path="url(#lc-${id})">
    <rect width="640" height="400" fill="url(#lg-${id})"/>
    <ellipse cx="330" cy="300" rx="320" ry="150" fill="url(#lp-${id})"/>
    ${bands.join('')}
  </g>
</svg>`
}

/** The support slot: a wheel on a balancing machine, silhouette, warm key light. */
function werkstatt(options: SceneOptions): string {
    const width = options.width ?? 640
    const id = idFor('scene', 'werkstatt')
    const a11y = options.title
        ? `role="img" aria-label="${escapeAttr(options.title)}"`
        : 'role="presentation" aria-hidden="true"'

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="${width}" height="${Math.round((width * 400) / 640)}" ${a11y} focusable="false">
  <defs>
    <linearGradient id="wg-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#12141A"/>
      <stop offset="1" stop-color="#1C1F27"/>
    </linearGradient>
    <radialGradient id="wk-${id}" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#F9C112" stop-opacity=".22"/>
      <stop offset="1" stop-color="#F9C112" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="wc-${id}"><rect width="640" height="400" rx="14"/></clipPath>
  </defs>
  <g clip-path="url(#wc-${id})">
    <rect width="640" height="400" fill="url(#wg-${id})"/>
    <ellipse cx="214" cy="120" rx="260" ry="200" fill="url(#wk-${id})"/>

    <!-- The machine: a base, a column and the spindle the wheel is mounted on. -->
    <rect x="392" y="300" width="196" height="76" rx="6" fill="#0B0D12"/>
    <rect x="436" y="120" width="34" height="196" fill="#0B0D12"/>
    <rect x="300" y="196" width="150" height="16" rx="6" fill="#0B0D12"/>
    <rect x="404" y="96" width="176" height="52" rx="8" fill="#0B0D12"/>
    <rect x="422" y="112" width="98" height="22" rx="4" fill="#1A44D4" opacity=".45"/>

    <g transform="translate(96 84)">${wheelSVG({ spokes: 10, finish: 'graphite', size: 232 })}</g>

    <rect x="0" y="376" width="640" height="24" fill="#0B0D12"/>
  </g>
</svg>`
}

function escapeAttr(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}
