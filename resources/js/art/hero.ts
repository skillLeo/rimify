/**
 * `heroSceneSVG` — the homepage hero background.
 *
 * Six layers, back to front (artwork spec §3). The result must read as a photographic
 * studio shot, not as a diagram: the light pool, the blurred streaks and the near-invisible
 * blueprint grid are all doing that one job.
 *
 * It is the LCP element. It is painted immediately and never fades in — animating it would cost
 * the page its largest-contentful-paint budget for no gain the customer can see.
 */

import { carSVG } from './car'
import { idFor, type Finish } from './palette'

export interface HeroOptions {
    /** `mobile` crops the scene to 4:5 and turns the scrim top-to-bottom. */
    layout?: 'desktop' | 'mobile'
    finish?: Finish | string
    spokes?: number
}

export function heroSceneSVG(options: HeroOptions = {}): string {
    const mobile = options.layout === 'mobile'
    const w = mobile ? 780 : 1440
    const h = mobile ? 975 : 720
    const id = idFor('hero', mobile, options.finish ?? 'graphite', options.spokes ?? 5)

    const scrim = mobile
        ? `<linearGradient id="scrim-${id}" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0" stop-color="#04060A" stop-opacity=".94"/>
         <stop offset=".36" stop-color="#04060A" stop-opacity=".74"/>
         <stop offset=".66" stop-color="#04060A" stop-opacity=".12"/>
         <stop offset="1" stop-color="#04060A" stop-opacity="0"/>
       </linearGradient>`
        : `<linearGradient id="scrim-${id}" x1="0" y1="1" x2="1" y2="0" gradientTransform="rotate(10 .5 .5)">
         <stop offset="0" stop-color="#04060A" stop-opacity=".94"/>
         <stop offset=".36" stop-color="#04060A" stop-opacity=".74"/>
         <stop offset=".66" stop-color="#04060A" stop-opacity=".12"/>
         <stop offset="1" stop-color="#04060A" stop-opacity="0"/>
       </linearGradient>`

    // 5 · the car occupies the right 58% of the frame and bleeds off the right and bottom edges.
    const carW = w * 0.72
    const carX = mobile ? w * 0.2 : w * 0.46
    const carY = mobile ? h * 0.44 : h * 0.3

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" role="presentation" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="sky-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05070B"/>
      <stop offset=".55" stop-color="#0C1018"/>
      <stop offset="1" stop-color="#101726"/>
    </linearGradient>
    <radialGradient id="pool-${id}" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#7896FF" stop-opacity=".16"/>
      <stop offset="1" stop-color="#7896FF" stop-opacity="0"/>
    </radialGradient>
    <filter id="streak-${id}" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="34"/>
    </filter>
    <pattern id="grid-${id}" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0 H0 V40" fill="none" stroke="#FFF" stroke-opacity=".03" stroke-width="1"/>
    </pattern>
    <linearGradient id="gridfade-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFF" stop-opacity="0"/>
      <stop offset="1" stop-color="#FFF" stop-opacity="1"/>
    </linearGradient>
    <mask id="gridmask-${id}">
      <rect x="0" y="${h * 0.5}" width="${w}" height="${h * 0.5}" fill="url(#gridfade-${id})"/>
    </mask>
    ${scrim}
  </defs>

  <rect width="${w}" height="${h}" fill="url(#sky-${id})"/>

  <ellipse cx="${w * 0.54}" cy="${h * 0.62}" rx="${w * 0.52}" ry="${h * 0.22}" fill="url(#pool-${id})"/>

  <g filter="url(#streak-${id})">
    <path d="M${-w * 0.1} ${-h * 0.1} L${w * 0.42} ${h * 1.1} L${w * 0.5} ${h * 1.1} L${w * 0.02} ${-h * 0.1} Z" fill="#FFF" opacity=".1"/>
    <path d="M${w * 0.34} ${-h * 0.1} L${w * 0.86} ${h * 1.1} L${w * 0.9} ${h * 1.1} L${w * 0.4} ${-h * 0.1} Z" fill="#FFF" opacity=".08"/>
    <path d="M${w * 0.66} ${-h * 0.1} L${w * 1.12} ${h * 0.9} L${w * 1.16} ${h * 0.9} L${w * 0.72} ${-h * 0.1} Z" fill="#FFF" opacity=".12"/>
  </g>

  <rect x="0" y="0" width="${w}" height="${h}" fill="url(#grid-${id})" mask="url(#gridmask-${id})"/>

  <g transform="translate(${Math.round(carX)} ${Math.round(carY)})">${carSVG({
      variant: 'dark',
      finish: options.finish ?? 'graphite',
      spokes: options.spokes ?? 5,
      width: Math.round(carW),
  })}</g>

  <rect width="${w}" height="${h}" fill="url(#scrim-${id})"/>
</svg>`
}
