/**
 * `carSVG` — a front three-quarter sports coupé in a 1200×520 viewBox.
 *
 * A silhouette with highlights, not an illustration of a cartoon car. A confident shape in two
 * greys reads as premium; a detailed drawing reads as clip art (artwork spec §2). So there
 * are no door handles, no badges, no headlight detail — a body gradient, glass, one specular line.
 *
 * The front wheel is a real `wheelSVG()`, which is the whole point: the hero literally shows a
 * RIMIFY wheel fitted to a car.
 */

import { idFor, type Finish } from './palette'
import { wheelSVG } from './wheel'

export type CarVariant = 'white' | 'dark'

export interface CarOptions {
    variant?: CarVariant
    /** The finish shown on the car's own wheels. */
    finish?: Finish | string
    spokes?: number
    width?: number
    title?: string
}

const BODY: Readonly<Record<CarVariant, { from: string; to: string }>> = {
    white: { from: '#E8EAEE', to: '#A9AFB8' },
    dark: { from: '#23262B', to: '#0E1014' },
}

export function carSVG(options: CarOptions = {}): string {
    const variant = options.variant ?? 'white'
    const body = BODY[variant]
    const finish = options.finish ?? 'graphite'
    const spokes = options.spokes ?? 5
    const width = options.width ?? 1200
    const id = idFor('car', variant, finish, spokes)

    const a11y = options.title
        ? `role="img" aria-label="${options.title.replace(/"/g, '&quot;')}"`
        : 'role="presentation" aria-hidden="true"'

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 520" width="${width}" height="${Math.round((width * 520) / 1200)}" ${a11y} focusable="false">
  <defs>
    <linearGradient id="body-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${body.from}"/>
      <stop offset="1" stop-color="${body.to}"/>
    </linearGradient>
    <filter id="ground-${id}" x="-20%" y="-60%" width="140%" height="240%">
      <feGaussianBlur stdDeviation="16"/>
    </filter>
  </defs>

  <ellipse cx="640" cy="470" rx="470" ry="26" fill="#05070B" opacity=".45" filter="url(#ground-${id})"/>

  <path d="M118 396 C118 412 128 424 150 424 L1100 421 C1118 420 1128 412 1128 392
           L1126 352 C1124 320 1108 304 1072 300 L900 292 L836 226
           C812 200 785 188 742 186 L610 183 C580 184 560 190 545 205
           L478 258 C460 282 440 288 400 292 L240 302
           C170 312 130 330 120 372 Z"
        fill="url(#body-${id})"/>

  <path d="M506 274 L562 220 C574 208 590 204 612 204 L736 206
           C772 208 792 218 810 238 L862 292 Z"
        fill="#151A22" opacity=".9"/>

  <path d="M596 205 L586 292" stroke="#0E1116" stroke-width="3" opacity=".35" fill="none"/>

  <!-- The 2px shoulder line. One highlight along the body's widest point is the whole
       lighting scheme: it is what tells the eye the panel is curved. -->
  <path d="M152 352 C300 318 400 302 470 296 L1092 318"
        stroke="#FFF" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round"/>

  <!-- Arch shadows sit behind the wheels so the tyres read as sunk into the body. -->
  <circle cx="300" cy="424" r="104" fill="#05070B" opacity=".55"/>
  <circle cx="925" cy="428" r="94" fill="#05070B" opacity=".55"/>

  <g transform="translate(214 338)">${wheelSVG({ spokes, finish, size: 172 })}</g>
  <g transform="translate(847 350)">${wheelSVG({ spokes, finish, size: 156 })}</g>
</svg>`
}
