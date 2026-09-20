/**
 * `wheelSVG` — the most important function in the build.
 *
 * A convincing alloy wheel in a 400×400 viewBox, drawn as nine layers back to front
 * (artwork spec §1). Rendered once, it appears everywhere: product cards, the PDP gallery,
 * cart lines, brand banners, and on the car in the hero.
 *
 * The ninth layer — one white arc at 18% opacity — is what makes it look like metal rather than a
 * diagram of a wheel. It is not optional.
 */

import { arc, idFor, paletteFor, polar, round, type Finish } from './palette'

export interface WheelOptions {
    /** 5, 7, 10 or 20. Vary it per product so the grid reads as a real catalogue. */
    spokes?: number
    finish?: Finish | string
    /** Rendered width and height in px. The viewBox is always 400×400. */
    size?: number
    /** Draw the tyre ring too — a Komplettrad rather than a bare rim. */
    tyre?: boolean
    /** One character in the centre cap. */
    initial?: string
    /** Decorative by default: the card beside it already names the wheel. */
    title?: string
}

const C = 200

/** How much of its angular slice a spoke occupies, at the hub and at the rim. */
const HUB_SHARE = 0.18
const RIM_SHARE = 0.32

export function wheelSVG(options: WheelOptions = {}): string {
    const spokes = normaliseSpokes(options.spokes ?? 5)
    const finish = options.finish ?? 'graphite'
    const size = options.size ?? 400
    const p = paletteFor(finish)
    const id = idFor('wheel', spokes, finish, options.tyre === true, options.initial ?? '')
    const initial = (options.initial ?? 'R').slice(0, 1).toUpperCase()

    const a11y = options.title
        ? `role="img" aria-label="${escapeAttr(options.title)}"`
        : 'role="presentation" aria-hidden="true"'

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${size}" height="${size}" ${a11y} focusable="false">
${defs(id, p.lipFrom, p.lipTo, p.face, p.spokeLight)}
${layer1ContactShadow(id)}
${options.tyre === true ? layer2TyreRing() : ''}
${layer3RimLip(id)}
${layer4BarrelShadow()}
${layer5Face(id)}
${layer6Spokes(spokes, id, p.spokeLight)}
${layer7BoltCircle(p.spokeLight)}
${layer8CentreCap(id, initial, p.spokeLight)}
${layer9Specular()}
</svg>`
}

/** Only the four counts the spec allows; anything else snaps to the nearest of them. */
function normaliseSpokes(n: number): number {
    const allowed = [5, 7, 10, 20]

    return allowed.reduce((best, candidate) =>
        Math.abs(candidate - n) < Math.abs(best - n) ? candidate : best
    )
}

function defs(id: string, lipFrom: string, lipTo: string, face: string, light: string): string {
    return `<defs>
  <linearGradient id="lip-${id}" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(-45 .5 .5)">
    <stop offset="0" stop-color="${lipFrom}"/>
    <stop offset="1" stop-color="${lipTo}"/>
  </linearGradient>
  <radialGradient id="face-${id}" cx="38%" cy="32%" r="78%">
    <stop offset="0" stop-color="${light}" stop-opacity=".55"/>
    <stop offset=".45" stop-color="${face}"/>
    <stop offset="1" stop-color="${face}" stop-opacity=".92"/>
  </radialGradient>
  <radialGradient id="cap-${id}" cx="36%" cy="30%" r="80%">
    <stop offset="0" stop-color="${light}"/>
    <stop offset="1" stop-color="${lipTo}"/>
  </radialGradient>
  <filter id="soft-${id}" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="10"/>
  </filter>
</defs>`
}

/* 1 · The wheel has to sit IN space rather than float on white — this ellipse is most of
      the reason the cards stopped looking cheap. */
function layer1ContactShadow(id: string): string {
    return `<ellipse cx="200" cy="378" rx="150" ry="14" fill="#0E1116" opacity=".16" filter="url(#soft-${id})"/>`
}

/* 2 · Komplettrad only: the tyre carcass, with 28 tread marks. */
function layer2TyreRing(): string {
    const treads: string[] = []

    for (let i = 0; i < 28; i++) {
        const deg = (i * 360) / 28
        const [x1, y1] = polar(C, C, 158, deg)
        const [x2, y2] = polar(C, C, 192, deg)
        treads.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`)
    }

    return `<path d="M200 4 A196 196 0 1 1 199.9 4 Z M200 50 A150 150 0 1 0 200.1 50 Z" fill="#15171B" fill-rule="evenodd"/>
<g stroke="#0B0C0F" stroke-width="7" stroke-linecap="butt">${treads.join('')}</g>`
}

/* 3 · The lip, lit from the upper left at 135°. */
function layer3RimLip(id: string): string {
    return `<circle cx="200" cy="200" r="150" fill="url(#lip-${id})"/>`
}

/* 4 · The barrel falling away behind the face. */
function layer4BarrelShadow(): string {
    return '<circle cx="200" cy="200" r="138" fill="#000" opacity=".35"/>'
}

/* 5 · The face, its highlight offset so the light reads as coming from the upper left. */
function layer5Face(id: string): string {
    return `<circle cx="200" cy="200" r="132" fill="url(#face-${id})"/>`
}

/* 6 · N copies of one tapered wedge, each rotated into place. The 1px lighter leading edge and
      darker trailing edge are the machined bevel — without them the spokes read as flat cutouts. */
function layer6Spokes(n: number, id: string, light: string): string {
    const slice = 360 / n
    const hub = slice * HUB_SHARE
    const rim = slice * RIM_SHARE

    // Drawn pointing north, then rotated — so every spoke is the same path, which is also what
    // keeps the markup small enough to inline twelve of these on a listing page.
    const [ix1, iy1] = polar(C, C, 44, -90 - hub)
    const [ox1, oy1] = polar(C, C, 128, -90 - rim)
    const [ox2, oy2] = polar(C, C, 128, -90 + rim)
    const [ix2, iy2] = polar(C, C, 44, -90 + hub)

    const body =
        `M${ix1} ${iy1} L${ox1} ${oy1} ` +
        `A128 128 0 0 1 ${ox2} ${oy2} ` +
        `L${ix2} ${iy2} ` +
        `A44 44 0 0 0 ${ix1} ${iy1} Z`

    const lead = `M${ix1} ${iy1} L${ox1} ${oy1}`
    const trail = `M${ix2} ${iy2} L${ox2} ${oy2}`

    const one =
        `<path d="${body}" fill="url(#face-${id})"/>` +
        `<path d="${body}" fill="${light}" opacity=".10"/>` +
        `<path d="${lead}" stroke="${light}" stroke-width="1" fill="none" opacity=".55"/>` +
        `<path d="${trail}" stroke="#000" stroke-width="1" fill="none" opacity=".35"/>`

    const all: string[] = []

    for (let i = 0; i < n; i++) {
        all.push(`<g transform="rotate(${round((i * 360) / n)} 200 200)">${one}</g>`)
    }

    return all.join('\n')
}

/* 7 · Five recessed bolt holes, each with a lit arc along its lower edge so it reads as a
      countersink rather than a dot. */
function layer7BoltCircle(light: string): string {
    const holes: string[] = []

    for (let i = 0; i < 5; i++) {
        const deg = -90 + (i * 360) / 5
        const [x, y] = polar(C, C, 52, deg)
        holes.push(
            `<circle cx="${x}" cy="${y}" r="9" fill="#0A0B0D" opacity=".85"/>` +
                `<path d="${arc(x, y, 9, 20, 160)}" stroke="${light}" stroke-width="1" fill="none" opacity=".45"/>`
        )
    }

    return holes.join('')
}

/* 8 · The cap, with the brand initial. */
function layer8CentreCap(id: string, initial: string, light: string): string {
    return `<circle cx="200" cy="200" r="34" fill="url(#cap-${id})"/>
<circle cx="200" cy="200" r="34" fill="none" stroke="${light}" stroke-width="1" opacity=".5"/>
<text x="200" y="208" text-anchor="middle" font-family="Lato, Arial, sans-serif" font-size="20" font-weight="900" fill="#FFF" opacity=".85">${escapeText(initial)}</text>`
}

/* 9 · One stroke. This is what makes it look like metal. */
function layer9Specular(): string {
    return `<path d="${arc(C, C, 145, 200, 320)}" stroke="#FFF" stroke-opacity=".18" stroke-width="5" stroke-linecap="round" fill="none"/>`
}

function escapeText(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(s: string): string {
    return escapeText(s).replace(/"/g, '&quot;')
}
