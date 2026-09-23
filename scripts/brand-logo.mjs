#!/usr/bin/env node
/**
 * The brand logos, turned into one-colour masks for the brand wall.
 *
 * Reads the official files in `database/seeders/content/brand-logos/source/` — downloaded from the
 * manufacturer's own site or press kit, provenance in `sources-1.json` / `sources-2.json` and in
 * `docs/image-credits.md` under "Markenlogos" — and writes ONE file per brand that the storefront
 * uses as a CSS mask and fills with an ink token (docs/design/sections/home-brands.md §5):
 *
 *   flatten  every painted shape of a vector source, in whatever colours it has, painted in one
 *            colour; transforms baked into the path data; the viewBox trimmed to the ink.
 *   knockout a logo whose lettering is white ON a coloured plate (BBS, CMS): the plate stays ink
 *            and the lettering becomes HOLES in it (`fill-rule="evenodd"`). A white fill would
 *            become ink in a mask and turn the lettering into a solid block, so white is never
 *            kept — the hole is the letter.
 *   bitmap   a raster source: an alpha mask, black, alpha = coverage × darkness of the source
 *            pixel, so a white vein inside a letter (ALUTEC) becomes a hole and an anti-aliased
 *            edge keeps its partial alpha; trimmed to the ink, at least 960 px on the long side.
 *
 * Nothing here redraws, traces, re-typesets or completes a logo: every path is the manufacturer's
 * own, moved and recoloured. A source this script does not understand makes it stop, never guess.
 *
 * ── Output location ────────────────────────────────────────────────────────────────────────────
 * `public/images/brands/<slug>.svg|png`, committed, plus `manifest.json` next to them.
 *
 * Not `storage/app/public`: the deploy branch ships `public/` exactly as it is in the repository,
 * so the logos are live on Hostinger with no extra step, while `storage/app/public` is not in the
 * repository (CI renders the demo imagery into it) and needs `artisan storage:link` on the host.
 * These files are small, reviewable build artefacts of sources that are themselves in the
 * repository. `brands.logo_path` holds `/images/brands/<file>` for them; any other value keeps its
 * old meaning — a path on the `public` disk, i.e. an admin upload (see app/Support/BrandLogos.php).
 *
 * manifest.json:
 *   { "logos": { "<slug>": { file, format, width, height, aspect, hash } }, "missing": { slug: why } }
 *   `aspect` is width / height rounded to 3 decimals — what the server ships as `logoAspect`, and
 *   what the brand wall sizes the mark by. `missing` records a brand that has no usable official
 *   logo, so the absence is a decision on the record rather than an oversight.
 *
 * ── Usage ──────────────────────────────────────────────────────────────────────────────────────
 *   node scripts/brand-logo.mjs                     every brand
 *   node scripts/brand-logo.mjs motec bbs           only these; the manifest keeps the rest
 *   node scripts/brand-logo.mjs --sheet <file.png>  also a contact sheet: every processed logo in
 *                                                   ink on the band colour at one height, slug
 *                                                   underneath, hairline box around the file's
 *                                                   own bounds so padding is visible
 *
 * No package is added: `sharp` is already a devDependency and does the rendering, measuring and
 * encoding; the SVG handling below is a small tokenizer for the well-formed exports these sources
 * are.
 */

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_DIR = path.join(ROOT, 'database', 'seeders', 'content', 'brand-logos', 'source')
const OUT_DIR = path.join(ROOT, 'public', 'images', 'brands')
const MANIFEST = path.join(OUT_DIR, 'manifest.json')

/** The one colour every mask is drawn in. The wall paints its own ink through the alpha. */
const INK = '#000'
/** `--c-band` in resources/css/tokens.css — the contact sheet's background. */
const BAND = '#f3f4f6'
const RULE = '#c9ced6'
const LABEL_INK = '#3a424d'

const MIN_LONG_SIDE = 960
const MAX_LONG_SIDE = 1600
/** The long side of the render the ink's bounding box is measured on. */
const MEASURE_PX = 4000
/** home-brands.md §5: an SVG mask stays small enough to sit in the first paint's budget. */
const MAX_SVG_BYTES = 8 * 1024

/**
 * What each brand's source is and how it is read. The expected colours are part of the recipe: if
 * a source is re-downloaded and its palette changes, the script stops instead of flattening a logo
 * it no longer recognises.
 */
const BRANDS = {
    motec: { source: 'motec.svg', recipe: 'flatten', colours: ['#ffffff'] },
    bbs: {
        source: 'bbs.svg',
        recipe: 'knockout',
        // White BBS lettering on the red plate: the plate is the ink, the letters are the holes.
        plate: [{ id: 'Pfad_81', colour: '#d70012' }],
        holes: [
            { id: 'Pfad_82', colour: '#ffffff' },
            { id: 'Pfad_83', colour: '#ffffff' },
            { id: 'Pfad_84', colour: '#ffffff' },
        ],
    },
    borbet: { source: 'borbet.svg', recipe: 'flatten', colours: ['#004f91'] },
    'oz-racing': { source: 'oz-racing.png', recipe: 'bitmap' },
    ronal: { source: 'ronal.svg', recipe: 'flatten', colours: ['#ffffff', '#d6232f'] },
    aez: { source: 'aez.png', recipe: 'bitmap' },
    rial: { source: 'rial.png', recipe: 'bitmap' },
    dezent: { source: 'dezent.svg', recipe: 'flatten', colours: ['#000000', '#9c9a88', '#d51130'] },
    dotz: { source: 'dotz.svg', recipe: 'flatten', colours: ['#ffffff'] },
    alutec: { source: 'alutec.png', recipe: 'bitmap' },
    ats: { source: 'ats.png', recipe: 'bitmap' },
    brock: { source: 'brock.png', recipe: 'bitmap' },
    cms: {
        source: 'cms.svg',
        recipe: 'knockout',
        /*
         * Painted shapes in document order: 0 and 1 a white badge and a white inner line, both
         * covered completely by 2, the charcoal badge; 3, 5, 7 the gold C, M and S; 4, 6, 8 a gold
         * keyline around each of them; 9 the ®, which sits outside the badge. What the gold covers
         * is the letter plus its keyline, which is exactly the region inside the keyline's OUTER
         * contour — so the hole is that contour, and the letter fill underneath it is redundant.
         */
        plate: [{ index: 2, colour: '#231f20' }],
        holes: [
            { index: 4, colour: '#f7b618', contour: 'outer' },
            { index: 6, colour: '#f7b618', contour: 'outer' },
            { index: 8, colour: '#f7b618', contour: 'outer' },
        ],
        ink: [{ index: 9, colour: '#231f20' }],
        covered: [
            { index: 0, colour: '#ffffff' },
            { index: 1, colour: '#ffffff' },
            { index: 3, colour: '#f7b618' },
            { index: 5, colour: '#f7b618' },
            { index: 7, colour: '#f7b618' },
        ],
    },
}

/** Brands with no usable official logo. Empty: every brand researched has one. */
const MISSING = {}

// ───────────────────────────────────────────────────────────────────────────── numbers and colour

const round3 = (v) => Math.round(v * 1000) / 1000
const floor3 = (v) => Math.floor(v * 1000) / 1000
const ceil3 = (v) => Math.ceil(v * 1000) / 1000

const NAMED = { white: '#ffffff', black: '#000000', none: 'none', transparent: 'none' }

function colour(value) {
    const raw = String(value ?? '').trim().toLowerCase()

    if (raw === '' || raw === 'none' || raw === 'transparent') {
        return 'none'
    }

    if (NAMED[raw] !== undefined) {
        return NAMED[raw]
    }

    if (/^#[0-9a-f]{3}$/.test(raw)) {
        return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
    }

    if (/^#[0-9a-f]{6}$/.test(raw)) {
        return raw
    }

    const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(raw)

    if (rgb !== null) {
        const hex = (n) => Math.max(0, Math.min(255, Math.round(Number(n)))).toString(16).padStart(2, '0')

        return `#${hex(rgb[1])}${hex(rgb[2])}${hex(rgb[3])}`
    }

    throw new Error(`colour not understood: ${value}`)
}

// ─────────────────────────────────────────────────────────────────────────────────────────── XML

function decodeEntities(text) {
    return text.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (whole, code) => {
        if (code === 'amp') return '&'
        if (code === 'lt') return '<'
        if (code === 'gt') return '>'
        if (code === 'quot') return '"'
        if (code === 'apos') return "'"
        if (code.startsWith('#x')) return String.fromCodePoint(parseInt(code.slice(2), 16))

        return String.fromCodePoint(parseInt(code.slice(1), 10))
    })
}

function parseAttrs(source) {
    const attrs = {}

    for (const m of source.matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
        attrs[m[1]] = decodeEntities(m[2] ?? m[3] ?? '')
    }

    return attrs
}

/** A tolerant-but-strict reader for the well-formed SVG exports these sources are. */
function parseXml(source) {
    const root = { name: '#document', attrs: {}, children: [], text: '' }
    const stack = [root]
    const token =
        /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<!DOCTYPE[^>[]*(?:\[[\s\S]*?\])?\s*>|<\?[\s\S]*?\?>|<\/\s*([^\s>]+)\s*>|<([^\s/>!?]+)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g
    let at = 0
    let m

    while ((m = token.exec(source)) !== null) {
        if (m.index !== at) {
            throw new Error(`XML: cannot read at byte ${at}: ${source.slice(at, at + 40)}`)
        }

        at = token.lastIndex
        const top = stack[stack.length - 1]

        if (m[1] !== undefined) {
            top.text += m[1]
        } else if (m[2] !== undefined) {
            if (top.name !== m[2]) {
                throw new Error(`XML: </${m[2]}> closes <${top.name}>`)
            }

            stack.pop()
        } else if (m[3] !== undefined) {
            const element = { name: m[3], attrs: parseAttrs(m[4] ?? ''), children: [], text: '', parent: top }
            top.children.push(element)

            if (m[5] !== '/') {
                stack.push(element)
            }
        } else if (m[6] !== undefined) {
            top.text += decodeEntities(m[6])
        }
    }

    if (at !== source.length) {
        throw new Error(`XML: trailing bytes at ${at}`)
    }

    if (stack.length !== 1) {
        throw new Error(`XML: <${stack[stack.length - 1].name}> is never closed`)
    }

    return root
}

function find(element, name, out = []) {
    for (const child of element.children) {
        if (child.name === name) {
            out.push(child)
        }

        find(child, name, out)
    }

    return out
}

// ─────────────────────────────────────────────────────────────────────────────────────────── CSS

const PROPS = [
    'fill',
    'stroke',
    'stroke-width',
    'fill-rule',
    'stroke-linejoin',
    'stroke-linecap',
    'stroke-miterlimit',
    'visibility',
    'display',
    'opacity',
    'fill-opacity',
    'stroke-opacity',
    'clip-path',
    'mask',
    'filter',
]

const INHERITED = [
    'fill',
    'stroke',
    'stroke-width',
    'fill-rule',
    'stroke-linejoin',
    'stroke-linecap',
    'stroke-miterlimit',
    'visibility',
    'fill-opacity',
    'stroke-opacity',
]

function parseDeclarations(text) {
    const out = {}

    for (const part of text.split(';')) {
        const colon = part.indexOf(':')

        if (colon < 0) {
            continue
        }

        out[part.slice(0, colon).trim().toLowerCase()] = part.slice(colon + 1).trim()
    }

    return out
}

/** Only single-class rules, which is all these files use; anything else stops the script. */
function parseCss(element) {
    const rules = []

    for (const style of find(element, 'style')) {
        const text = style.text.replace(/\/\*[\s\S]*?\*\//g, '')

        for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
            const declarations = parseDeclarations(m[2])

            for (const selector of m[1].split(',').map((s) => s.trim()).filter(Boolean)) {
                if (!/^\.[A-Za-z0-9_-]+$/.test(selector)) {
                    throw new Error(`CSS selector not understood: ${selector}`)
                }

                rules.push({ className: selector.slice(1), declarations })
            }
        }
    }

    return rules
}

function ownStyle(element, rules) {
    const out = {}

    for (const property of PROPS) {
        if (element.attrs[property] !== undefined) {
            out[property] = element.attrs[property]
        }
    }

    const classes = (element.attrs.class ?? '').split(/\s+/).filter(Boolean)

    for (const rule of rules) {
        if (!classes.includes(rule.className)) {
            continue
        }

        for (const [property, value] of Object.entries(rule.declarations)) {
            if (PROPS.includes(property)) {
                out[property] = value
            }
        }
    }

    for (const [property, value] of Object.entries(parseDeclarations(element.attrs.style ?? ''))) {
        if (PROPS.includes(property)) {
            out[property] = value
        }
    }

    return out
}

// ───────────────────────────────────────────────────────────────────────────────────── transforms

const IDENTITY = [1, 0, 0, 1, 0, 0]

function multiply(a, b) {
    return [
        a[0] * b[0] + a[2] * b[1],
        a[1] * b[0] + a[3] * b[1],
        a[0] * b[2] + a[2] * b[3],
        a[1] * b[2] + a[3] * b[3],
        a[0] * b[4] + a[2] * b[5] + a[4],
        a[1] * b[4] + a[3] * b[5] + a[5],
    ]
}

function parseTransform(value) {
    let matrix = IDENTITY
    const re = /([a-zA-Z]+)\s*\(([^)]*)\)/g
    let m

    while ((m = re.exec(value)) !== null) {
        const args = m[2].trim().split(/[\s,]+/).filter(Boolean).map(Number)

        if (args.some(Number.isNaN)) {
            throw new Error(`transform not understood: ${value}`)
        }

        if (m[1] === 'translate') {
            matrix = multiply(matrix, [1, 0, 0, 1, args[0] ?? 0, args[1] ?? 0])
        } else if (m[1] === 'scale') {
            matrix = multiply(matrix, [args[0] ?? 1, 0, 0, args[1] ?? args[0] ?? 1, 0, 0])
        } else if (m[1] === 'matrix' && args.length === 6) {
            matrix = multiply(matrix, args)
        } else {
            throw new Error(`transform not supported (rotation or skew would move ink): ${value}`)
        }
    }

    return matrix
}

// ────────────────────────────────────────────────────────────────────────────────── path geometry

function parsePath(d) {
    const commands = []
    const length = d.length
    let i = 0

    const separator = () => {
        while (i < length && ' ,\n\r\t\f'.includes(d[i])) {
            i++
        }
    }

    const number = () => {
        separator()
        const m = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(d.slice(i))

        if (m === null) {
            throw new Error(`path: a number was expected at ${i}: ${d.slice(i, i + 24)}`)
        }

        i += m[0].length

        return Number(m[0])
    }

    const flag = () => {
        separator()

        if (d[i] !== '0' && d[i] !== '1') {
            throw new Error(`path: an arc flag was expected at ${i}`)
        }

        i++

        return d[i - 1] === '1' ? 1 : 0
    }

    const counts = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 }
    let command = null

    for (;;) {
        separator()

        if (i >= length) {
            break
        }

        if (/[MmLlHhVvCcSsQqTtAaZz]/.test(d[i])) {
            command = d[i]
            i++

            if (command === 'z' || command === 'Z') {
                commands.push({ command, args: [] })
                continue
            }
        } else if (command === null || command === 'z' || command === 'Z') {
            throw new Error(`path: a command was expected at ${i}: ${d.slice(i, i + 24)}`)
        }

        const upper = command.toUpperCase()
        const args = []

        if (upper === 'A') {
            args.push(number(), number(), number(), flag(), flag(), number(), number())
        } else {
            for (let k = 0; k < counts[upper]; k++) {
                args.push(number())
            }
        }

        commands.push({ command, args })

        // A second coordinate pair after M continues as a line, per the path grammar.
        if (command === 'M') {
            command = 'L'
        } else if (command === 'm') {
            command = 'l'
        }
    }

    return commands
}

/** Absolute segments: M, L, C, Q, A, Z — everything else expanded into them. */
function toAbsolute(commands) {
    const segments = []
    let x = 0
    let y = 0
    let startX = 0
    let startY = 0
    let lastCubic = null
    let lastQuad = null
    let open = false

    for (const { command, args } of commands) {
        const relative = command === command.toLowerCase()
        const upper = command.toUpperCase()

        // A drawing command after a closed subpath starts a new one at the closed subpath's start.
        if (upper !== 'M' && upper !== 'Z' && !open) {
            segments.push({ t: 'M', x, y })
            startX = x
            startY = y
            open = true
        }

        const ax = (v) => (relative ? x + v : v)
        const ay = (v) => (relative ? y + v : v)

        if (upper === 'M') {
            const nx = ax(args[0])
            const ny = ay(args[1])
            segments.push({ t: 'M', x: nx, y: ny })
            x = startX = nx
            y = startY = ny
            open = true
            lastCubic = lastQuad = null
        } else if (upper === 'L' || upper === 'H' || upper === 'V') {
            const nx = upper === 'V' ? x : ax(args[0])
            const ny = upper === 'H' ? y : ay(args[upper === 'L' ? 1 : 0])
            segments.push({ t: 'L', x: nx, y: ny })
            x = nx
            y = ny
            lastCubic = lastQuad = null
        } else if (upper === 'C' || upper === 'S') {
            const p = upper === 'C'
                ? [ax(args[0]), ay(args[1]), ax(args[2]), ay(args[3]), ax(args[4]), ay(args[5])]
                : [
                    lastCubic === null ? x : 2 * x - lastCubic[0],
                    lastCubic === null ? y : 2 * y - lastCubic[1],
                    ax(args[0]),
                    ay(args[1]),
                    ax(args[2]),
                    ay(args[3]),
                ]
            segments.push({ t: 'C', x1: p[0], y1: p[1], x2: p[2], y2: p[3], x: p[4], y: p[5] })
            lastCubic = [p[2], p[3]]
            lastQuad = null
            x = p[4]
            y = p[5]
        } else if (upper === 'Q' || upper === 'T') {
            const p = upper === 'Q'
                ? [ax(args[0]), ay(args[1]), ax(args[2]), ay(args[3])]
                : [
                    lastQuad === null ? x : 2 * x - lastQuad[0],
                    lastQuad === null ? y : 2 * y - lastQuad[1],
                    ax(args[0]),
                    ay(args[1]),
                ]
            segments.push({ t: 'Q', x1: p[0], y1: p[1], x: p[2], y: p[3] })
            lastQuad = [p[0], p[1]]
            lastCubic = null
            x = p[2]
            y = p[3]
        } else if (upper === 'A') {
            const nx = ax(args[5])
            const ny = ay(args[6])
            segments.push({
                t: 'A',
                rx: Math.abs(args[0]),
                ry: Math.abs(args[1]),
                rot: args[2],
                large: args[3],
                sweep: args[4],
                x: nx,
                y: ny,
            })
            x = nx
            y = ny
            lastCubic = lastQuad = null
        } else {
            segments.push({ t: 'Z' })
            x = startX
            y = startY
            open = false
            lastCubic = lastQuad = null
        }
    }

    return segments
}

function applyMatrix(segments, matrix) {
    const [a, b, c, dd, e, f] = matrix
    const point = (px, py) => [a * px + c * py + e, b * px + dd * py + f]
    const axisAligned = Math.abs(b) < 1e-12 && Math.abs(c) < 1e-12

    return segments.map((s) => {
        if (s.t === 'M' || s.t === 'L') {
            const [x, y] = point(s.x, s.y)

            return { ...s, x, y }
        }

        if (s.t === 'C') {
            const [x1, y1] = point(s.x1, s.y1)
            const [x2, y2] = point(s.x2, s.y2)
            const [x, y] = point(s.x, s.y)

            return { t: 'C', x1, y1, x2, y2, x, y }
        }

        if (s.t === 'Q') {
            const [x1, y1] = point(s.x1, s.y1)
            const [x, y] = point(s.x, s.y)

            return { t: 'Q', x1, y1, x, y }
        }

        if (s.t === 'A') {
            if (!axisAligned) {
                throw new Error('an arc under rotation or skew is not supported')
            }

            if (Math.abs(Math.abs(a) - Math.abs(dd)) > 1e-9 && s.rot % 180 !== 0) {
                throw new Error('an arc under a non-uniform scale is not supported')
            }

            const [x, y] = point(s.x, s.y)

            return {
                ...s,
                rx: s.rx * Math.abs(a),
                ry: s.ry * Math.abs(dd),
                sweep: a * dd < 0 ? 1 - s.sweep : s.sweep,
                x,
                y,
            }
        }

        return s
    })
}

function arcPoints(x1, y1, s, steps = 48) {
    if ((x1 === s.x && y1 === s.y) || s.rx === 0 || s.ry === 0) {
        return [[s.x, s.y]]
    }

    let { rx, ry } = s
    const phi = (s.rot * Math.PI) / 180
    const cos = Math.cos(phi)
    const sin = Math.sin(phi)
    const dx = (x1 - s.x) / 2
    const dy = (y1 - s.y) / 2
    const x1p = cos * dx + sin * dy
    const y1p = -sin * dx + cos * dy
    const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)

    if (lambda > 1) {
        const k = Math.sqrt(lambda)
        rx *= k
        ry *= k
    }

    const numerator = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
    const denominator = rx * rx * y1p * y1p + ry * ry * x1p * x1p
    let scale = Math.sqrt(Math.max(0, numerator / denominator))

    if (s.large === s.sweep) {
        scale = -scale
    }

    const cxp = (scale * rx * y1p) / ry
    const cyp = (-scale * ry * x1p) / rx
    const cx = cos * cxp - sin * cyp + (x1 + s.x) / 2
    const cy = sin * cxp + cos * cyp + (y1 + s.y) / 2
    const angle = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
    const from = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
    let sweep = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)

    if (s.sweep === 0 && sweep > 0) {
        sweep -= 2 * Math.PI
    } else if (s.sweep === 1 && sweep < 0) {
        sweep += 2 * Math.PI
    }

    const points = []

    for (let k = 1; k <= steps; k++) {
        const t = from + (sweep * k) / steps
        const ex = rx * Math.cos(t)
        const ey = ry * Math.sin(t)
        points.push([cos * ex - sin * ey + cx, sin * ex + cos * ey + cy])
    }

    return points
}

/** Straight-line samples of the outline, for bounding boxes only. */
function polyline(segments, steps = 24) {
    const points = []
    let x = 0
    let y = 0
    let startX = 0
    let startY = 0

    for (const s of segments) {
        if (s.t === 'M') {
            points.push([s.x, s.y])
            x = startX = s.x
            y = startY = s.y
        } else if (s.t === 'L') {
            points.push([s.x, s.y])
            x = s.x
            y = s.y
        } else if (s.t === 'C') {
            for (let k = 1; k <= steps; k++) {
                const t = k / steps
                const u = 1 - t
                points.push([
                    u * u * u * x + 3 * u * u * t * s.x1 + 3 * u * t * t * s.x2 + t * t * t * s.x,
                    u * u * u * y + 3 * u * u * t * s.y1 + 3 * u * t * t * s.y2 + t * t * t * s.y,
                ])
            }

            x = s.x
            y = s.y
        } else if (s.t === 'Q') {
            for (let k = 1; k <= steps; k++) {
                const t = k / steps
                const u = 1 - t
                points.push([
                    u * u * x + 2 * u * t * s.x1 + t * t * s.x,
                    u * u * y + 2 * u * t * s.y1 + t * t * s.y,
                ])
            }

            x = s.x
            y = s.y
        } else if (s.t === 'A') {
            points.push(...arcPoints(x, y, s))
            x = s.x
            y = s.y
        } else {
            points.push([startX, startY])
            x = startX
            y = startY
        }
    }

    return points
}

function boxOf(points) {
    const xs = points.map((p) => p[0])
    const ys = points.map((p) => p[1])

    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
}

function union(boxes) {
    const x = Math.min(...boxes.map((b) => b.x))
    const y = Math.min(...boxes.map((b) => b.y))

    return {
        x,
        y,
        w: Math.max(...boxes.map((b) => b.x + b.w)) - x,
        h: Math.max(...boxes.map((b) => b.y + b.h)) - y,
    }
}

const inside = (inner, outer, slack = 0.05) =>
    inner.x >= outer.x - slack &&
    inner.y >= outer.y - slack &&
    inner.x + inner.w <= outer.x + outer.w + slack &&
    inner.y + inner.h <= outer.y + outer.h + slack

function subpaths(segments) {
    const out = []
    let current = null

    for (const s of segments) {
        if (s.t === 'M') {
            current = [s]
            out.push(current)
        } else if (current !== null) {
            current.push(s)
        }
    }

    return out
}

/** Compact relative path data; every point is the difference of two already-rounded points. */
function serialise(segments) {
    let out = ''
    let previous = null
    let x = 0
    let y = 0
    let startX = 0
    let startY = 0
    let first = true

    const format = (v) => {
        const value = round3(v) === 0 ? 0 : round3(v)
        let text = String(value)

        if (text.startsWith('0.')) {
            text = text.slice(1)
        } else if (text.startsWith('-0.')) {
            text = `-${text.slice(2)}`
        }

        return text
    }

    const letter = (l) => {
        out += l
        previous = null
    }

    const number = (v) => {
        const text = format(v)
        // Two numbers may touch only when the second starts with a minus, or starts with a dot
        // after a number that already has one ("1.5.5" is 1.5 then .5). Otherwise: a space.
        const touches = text.startsWith('-') || (text.startsWith('.') && previous !== null && /[.eE]/.test(previous))

        if (previous !== null && !touches) {
            out += ' '
        }

        out += text
        previous = text
    }

    for (const s of segments) {
        if (s.t === 'M') {
            const nx = round3(s.x)
            const ny = round3(s.y)

            if (first) {
                letter('M')
                number(nx)
                number(ny)
                first = false
            } else {
                letter('m')
                number(nx - x)
                number(ny - y)
            }

            x = startX = nx
            y = startY = ny
        } else if (s.t === 'L') {
            const nx = round3(s.x)
            const ny = round3(s.y)

            if (ny === y && nx !== x) {
                letter('h')
                number(nx - x)
            } else if (nx === x) {
                letter('v')
                number(ny - y)
            } else {
                letter('l')
                number(nx - x)
                number(ny - y)
            }

            x = nx
            y = ny
        } else if (s.t === 'C') {
            letter('c')
            number(round3(s.x1) - x)
            number(round3(s.y1) - y)
            number(round3(s.x2) - x)
            number(round3(s.y2) - y)
            number(round3(s.x) - x)
            number(round3(s.y) - y)
            x = round3(s.x)
            y = round3(s.y)
        } else if (s.t === 'Q') {
            letter('q')
            number(round3(s.x1) - x)
            number(round3(s.y1) - y)
            number(round3(s.x) - x)
            number(round3(s.y) - y)
            x = round3(s.x)
            y = round3(s.y)
        } else if (s.t === 'A') {
            letter('a')
            number(s.rx)
            number(s.ry)
            number(s.rot)
            number(s.large)
            number(s.sweep)
            number(round3(s.x) - x)
            number(round3(s.y) - y)
            x = round3(s.x)
            y = round3(s.y)
        } else {
            letter('z')
            x = startX
            y = startY
        }
    }

    return out
}

// ────────────────────────────────────────────────────────────────────────────────── reading an SVG

const SKIP = [
    'defs',
    'clipPath',
    'mask',
    'symbol',
    'style',
    'title',
    'desc',
    'metadata',
    'filter',
    'marker',
    'pattern',
    'linearGradient',
    'radialGradient',
    'script',
    'switch',
]

const REFUSE = ['use', 'image', 'text', 'tspan', 'foreignObject', 'animate', 'animateTransform']

function geometry(element) {
    const n = (name, fallback = 0) => {
        const raw = element.attrs[name]

        return raw === undefined ? fallback : Number(raw)
    }

    if (element.name === 'path') {
        return element.attrs.d ?? null
    }

    if (element.name === 'polygon' || element.name === 'polyline') {
        const values = (element.attrs.points ?? '').trim().split(/[\s,]+/).filter(Boolean).map(Number)

        if (values.length < 4 || values.length % 2 !== 0) {
            return null
        }

        const pairs = []

        for (let i = 0; i < values.length; i += 2) {
            pairs.push(`${values[i]},${values[i + 1]}`)
        }

        return `M${pairs.join('L')}${element.name === 'polygon' ? 'Z' : ''}`
    }

    if (element.name === 'rect') {
        if (Number(element.attrs.rx ?? 0) !== 0 || Number(element.attrs.ry ?? 0) !== 0) {
            throw new Error('a rounded rect is not supported')
        }

        const x = n('x')
        const y = n('y')
        const w = n('width')
        const h = n('height')

        return w > 0 && h > 0 ? `M${x},${y}H${x + w}V${y + h}H${x}Z` : null
    }

    if (element.name === 'circle' || element.name === 'ellipse') {
        const cx = n('cx')
        const cy = n('cy')
        const rx = element.name === 'circle' ? n('r') : n('rx')
        const ry = element.name === 'circle' ? n('r') : n('ry')

        return rx > 0 && ry > 0
            ? `M${cx - rx},${cy}A${rx},${ry},0,1,0,${cx + rx},${cy}A${rx},${ry},0,1,0,${cx - rx},${cy}Z`
            : null
    }

    return null
}

function readSvg(source) {
    const document = parseXml(source)
    const svg = document.children.find((child) => child.name === 'svg')

    if (svg === undefined) {
        throw new Error('no <svg> element')
    }

    const rules = parseCss(svg)
    const shapes = []
    const clipPaths = {}

    for (const clip of find(svg, 'clipPath')) {
        if (clip.attrs.id !== undefined) {
            clipPaths[clip.attrs.id] = clip
        }
    }

    const base = {
        fill: '#000000',
        stroke: 'none',
        'stroke-width': '1',
        'fill-rule': 'nonzero',
        'stroke-linejoin': 'miter',
        'stroke-linecap': 'butt',
        'stroke-miterlimit': '4',
        visibility: 'visible',
        'fill-opacity': '1',
        'stroke-opacity': '1',
    }

    const walk = (element, inherited, matrix, clips) => {
        if (SKIP.includes(element.name)) {
            return
        }

        if (REFUSE.includes(element.name)) {
            throw new Error(`<${element.name}> is not allowed in a mask`)
        }

        if (element.attrs['xlink:href'] !== undefined || element.attrs.href !== undefined) {
            throw new Error('an external reference is not allowed in a mask')
        }

        const own = ownStyle(element, rules)

        if ((own.display ?? '') === 'none') {
            return
        }

        for (const property of ['mask', 'filter']) {
            if (own[property] !== undefined && own[property] !== 'none') {
                throw new Error(`${property} is not supported`)
            }
        }

        if (own.opacity !== undefined && Number(own.opacity) !== 1) {
            throw new Error('a partly transparent group cannot become a one-colour mask')
        }

        const style = { ...inherited }

        for (const property of INHERITED) {
            if (own[property] !== undefined && own[property] !== 'inherit') {
                style[property] = own[property]
            }
        }

        const here = element.attrs.transform === undefined ? matrix : multiply(matrix, parseTransform(element.attrs.transform))
        const clipped = own['clip-path'] !== undefined && own['clip-path'] !== 'none'
            ? [...clips, { reference: own['clip-path'], matrix: here }]
            : clips

        const d = geometry(element)
        const segments = d === null || d === undefined ? [] : applyMatrix(toAbsolute(parsePath(d)), here)

        // An empty `d` draws nothing and would give a bounding box of infinities.
        if (segments.length > 0) {
            shapes.push({
                index: shapes.length,
                id: element.attrs.id ?? null,
                name: element.name,
                style,
                matrix: here,
                clips: clipped,
                segments,
            })
        }

        for (const child of element.children) {
            walk(child, style, here, clipped)
        }
    }

    for (const child of svg.children) {
        walk(child, base, IDENTITY, [])
    }

    for (const shape of shapes) {
        shape.box = boxOf(polyline(shape.segments))
        checkClips(shape, clipPaths)
    }

    return { svg, shapes }
}

/**
 * A clip is accepted only when it changes nothing: these exports carry a clip rectangle the size
 * of the artwork. A clip that would actually cut ink stops the script.
 */
function checkClips(shape, clipPaths) {
    for (const clip of shape.clips) {
        const id = /url\(\s*#([^)\s]+)\s*\)/.exec(clip.reference)?.[1]
        const element = id === undefined ? undefined : clipPaths[id]

        if (element === undefined) {
            throw new Error(`clip-path ${clip.reference} was not found`)
        }

        const boxes = []

        for (const child of element.children) {
            const d = geometry(child)

            if (d === null || d === undefined) {
                continue
            }

            const matrix = child.attrs.transform === undefined
                ? clip.matrix
                : multiply(clip.matrix, parseTransform(child.attrs.transform))
            boxes.push(boxOf(polyline(applyMatrix(toAbsolute(parsePath(d)), matrix))))
        }

        if (boxes.length === 0 || !inside(shape.box, union(boxes))) {
            throw new Error(`clip-path ${clip.reference} would cut ink`)
        }
    }
}

function strokeWidth(shape) {
    const raw = Number(String(shape.style['stroke-width']).replace('px', ''))
    const scale = Math.sqrt(Math.abs(shape.matrix[0] * shape.matrix[3] - shape.matrix[1] * shape.matrix[2]))

    return Number.isFinite(raw) ? raw * scale : 0
}

function paint(shape) {
    const fill = shape.style.visibility === 'hidden' ? 'none' : colour(shape.style.fill)
    const stroke = shape.style.visibility === 'hidden' ? 'none' : colour(shape.style.stroke)

    return {
        fill: fill !== 'none' && Number(shape.style['fill-opacity']) !== 0 ? fill : 'none',
        stroke: stroke !== 'none' && Number(shape.style['stroke-opacity']) !== 0 && strokeWidth(shape) > 0 ? stroke : 'none',
    }
}

const isPainted = (shape) => {
    const { fill, stroke } = paint(shape)

    return fill !== 'none' || stroke !== 'none'
}

// ──────────────────────────────────────────────────────────────────────────────────────── recipes

function flatten(spec, shapes) {
    const painted = shapes.filter(isPainted)

    if (painted.length === 0) {
        throw new Error('no painted shape')
    }

    const seen = new Set()

    for (const shape of painted) {
        const { fill, stroke } = paint(shape)

        if (fill !== 'none') seen.add(fill)
        if (stroke !== 'none') seen.add(stroke)
    }

    const expected = new Set(spec.colours ?? [])
    const surprises = [...seen].filter((c) => !expected.has(c))

    if (surprises.length > 0) {
        throw new Error(`colours not in the recipe: ${surprises.join(', ')} (expected ${[...expected].join(', ')})`)
    }

    const out = []

    for (const shape of painted) {
        const { fill, stroke } = paint(shape)
        const d = serialise(shape.segments)
        out.push({
            d,
            fill: fill !== 'none',
            rule: String(shape.style['fill-rule'] ?? 'nonzero'),
            stroke: stroke !== 'none'
                ? {
                    width: round3(strokeWidth(shape)),
                    join: String(shape.style['stroke-linejoin']),
                    cap: String(shape.style['stroke-linecap']),
                    miter: String(shape.style['stroke-miterlimit']),
                }
                : null,
            box: shape.box,
        })
    }

    // A stroke-only copy of a shape that is already filled and stroked the same way adds no ink
    // (the DEZENT sprite carries such duplicates); the same shape twice adds none either.
    return out.filter((shape, i) => !out.some((other, j) => {
        if (j >= i) {
            return false
        }

        if (other.d !== shape.d) {
            return false
        }

        const sameStroke = JSON.stringify(other.stroke) === JSON.stringify(shape.stroke)

        return (sameStroke && other.fill === shape.fill) || (sameStroke && other.fill && !shape.fill)
    }))
}

function knockout(spec, shapes) {
    const used = new Set()

    const pick = (selector) => {
        const shape = selector.id !== undefined
            ? shapes.find((candidate) => candidate.id === selector.id)
            : shapes[selector.index]

        if (shape === undefined) {
            throw new Error(`shape ${selector.id ?? selector.index} was not found`)
        }

        const { fill, stroke } = paint(shape)

        if (fill !== selector.colour) {
            throw new Error(`shape ${selector.id ?? selector.index} is ${fill}, the recipe expects ${selector.colour}`)
        }

        if (stroke !== 'none') {
            throw new Error(`shape ${selector.id ?? selector.index} is stroked; a knockout takes fills only`)
        }

        used.add(shape.index)

        return shape
    }

    const contours = (shape, selector) => {
        const parts = subpaths(shape.segments)

        if (selector.contour !== 'outer') {
            return parts
        }

        if (parts.length !== 2) {
            throw new Error(`shape ${selector.id ?? selector.index}: an outer contour needs exactly two subpaths`)
        }

        const boxes = parts.map((part) => boxOf(polyline(part)))
        const outer = boxes[0].w * boxes[0].h >= boxes[1].w * boxes[1].h ? 0 : 1

        if (!inside(boxes[1 - outer], boxes[outer])) {
            throw new Error(`shape ${selector.id ?? selector.index}: the two subpaths are not one inside the other`)
        }

        return [parts[outer]]
    }

    const plates = (spec.plate ?? []).map((selector) => pick(selector))
    const plateBox = union(plates.map((shape) => shape.box))
    const segments = plates.flatMap((shape) => shape.segments)

    for (const selector of spec.holes ?? []) {
        const shape = pick(selector)

        if (!inside(shape.box, plateBox)) {
            throw new Error(`shape ${selector.id ?? selector.index} is not inside the plate, so it cannot be a hole`)
        }

        for (const part of contours(shape, selector)) {
            segments.push(...part)
        }
    }

    for (const selector of spec.ink ?? []) {
        segments.push(...pick(selector).segments)
    }

    for (const selector of spec.covered ?? []) {
        pick(selector)
    }

    for (const shape of shapes) {
        if (isPainted(shape) && !used.has(shape.index)) {
            throw new Error(`painted shape ${shape.index} (${shape.name}) is in no part of the recipe`)
        }
    }

    return [{ d: serialise(segments), fill: true, rule: 'evenodd', stroke: null, box: union(shapes.filter((s) => used.has(s.index)).map((s) => s.box)) }]
}

function body(parts) {
    return parts
        .map((part) => {
            const attrs = [`d="${part.d}"`]

            if (!part.fill) {
                attrs.unshift('fill="none"')
            } else if (part.rule === 'evenodd') {
                attrs.unshift('fill-rule="evenodd"')
            }

            if (part.stroke !== null) {
                attrs.unshift(
                    `stroke="${INK}"`,
                    `stroke-width="${part.stroke.width}"`,
                    `stroke-linejoin="${part.stroke.join}"`,
                    `stroke-linecap="${part.stroke.cap}"`,
                    `stroke-miterlimit="${part.stroke.miter}"`,
                )
            }

            return `<path ${attrs.join(' ')}/>`
        })
        .join('')
}

/**
 * The ink's bounding box, measured on a render rather than computed: strokes, mitre spikes and
 * curve overshoot are then included exactly as they will be drawn.
 */
async function measure(markup, guess) {
    const pad = Math.max(guess.w, guess.h) * 0.05 + 1
    const wide = { x: guess.x - pad, y: guess.y - pad, w: guess.w + 2 * pad, h: guess.h + 2 * pad }
    const scale = MEASURE_PX / Math.max(wide.w, wide.h)
    const width = Math.max(1, Math.ceil(wide.w * scale))
    const height = Math.max(1, Math.ceil(wide.h * scale))
    const box = { x: wide.x, y: wide.y, w: width / scale, h: height / scale }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" fill="${INK}">${markup}</svg>`
    const { data, info } = await sharp(Buffer.from(svg), { density: 72 })
        .toColourspace('srgb')
        .ensureAlpha()
        .extractChannel(3)
        .raw()
        .toBuffer({ resolveWithObject: true })

    let minX = info.width
    let minY = info.height
    let maxX = -1
    let maxY = -1

    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            if (data[y * info.width + x] > 0) {
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
        }
    }

    if (maxX < 0) {
        throw new Error('nothing was rendered')
    }

    if (minX === 0 || minY === 0 || maxX === info.width - 1 || maxY === info.height - 1) {
        throw new Error('the ink touches the measuring frame; the first guess at the box was too small')
    }

    const unitX = box.w / info.width
    const unitY = box.h / info.height
    const x0 = floor3(box.x + minX * unitX)
    const y0 = floor3(box.y + minY * unitY)
    const x1 = ceil3(box.x + (maxX + 1) * unitX)
    const y1 = ceil3(box.y + (maxY + 1) * unitY)

    return { x: x0, y: y0, w: round3(x1 - x0), h: round3(y1 - y0) }
}

async function vector(slug, spec) {
    const source = await readFile(path.join(SOURCE_DIR, spec.source), 'utf8')
    const { shapes } = readSvg(source)
    const parts = spec.recipe === 'knockout' ? knockout(spec, shapes) : flatten(spec, shapes)
    const markup = body(parts)
    const box = await measure(markup, union(parts.map((part) => part.box)))
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" width="${box.w}" height="${box.h}" fill="${INK}">${markup}</svg>\n`

    if (Buffer.byteLength(svg) > MAX_SVG_BYTES) {
        throw new Error(`${slug}: ${Buffer.byteLength(svg)} bytes, over the ${MAX_SVG_BYTES} byte budget`)
    }

    await writeFile(path.join(OUT_DIR, `${slug}.svg`), svg, 'utf8')

    return { file: `${slug}.svg`, format: 'svg', width: box.w, height: box.h, aspect: round3(box.w / box.h), hash: hash(svg) }
}

const luma = (r, g, b) => Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)

async function bitmap(slug, spec) {
    const file = path.join(SOURCE_DIR, spec.source)
    const { data, info } = await sharp(file).ensureAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true })

    if (info.channels !== 4) {
        throw new Error(`${slug}: expected RGBA, got ${info.channels} channels`)
    }

    const pixels = info.width * info.height
    const histogram = new Uint32Array(256)
    let opaque = 0

    for (let i = 0; i < pixels; i++) {
        if (data[i * 4 + 3] === 255) {
            histogram[luma(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])]++
            opaque++
        }
    }

    if (opaque === 0) {
        throw new Error(`${slug}: no opaque pixel — not a logo on a transparent background`)
    }

    // The ink's own tone: the median of the opaque pixels. The kits' "black" is about #1a1a1a.
    let seen = 0
    let ink = 0

    for (let value = 0; value < 256; value++) {
        seen += histogram[value]

        if (seen * 2 >= opaque) {
            ink = value
            break
        }
    }

    if (ink > 128) {
        throw new Error(`${slug}: the ink reads light (luma ${ink}); this recipe expects a dark logo on transparency`)
    }

    // A background built in means there is (almost) nothing transparent to keep. A logo that is
    // cut tight can touch its own corners — AEZ's slanted mark and ATS's do — so the corners
    // alone prove nothing.
    if (opaque > pixels * 0.97) {
        throw new Error(`${slug}: ${Math.round((100 * opaque) / pixels)} % of the pixels are opaque — the source has a background built in, and a background is never cut away here`)
    }

    const alpha = Buffer.alloc(pixels)

    for (let i = 0; i < pixels; i++) {
        const a = data[i * 4 + 3]

        if (a === 0) {
            continue
        }

        // Every colour is ink — a yellow, red or blue element of a mark is part of its silhouette —
        // and only paper-white is a hole (ALUTEC's lightning veins, a knockout drawn as white).
        // "White" is judged by the smallest channel, so a saturated yellow (bright to the eye,
        // but with little blue) stays ink; a short ramp keeps the anti-aliased edge of a hole.
        const whiteness = Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])
        const darkness = whiteness >= 235 ? 0 : whiteness <= 200 ? 1 : (235 - whiteness) / 35
        const value = Math.round(a * darkness)
        alpha[i] = value <= 3 ? 0 : value
    }

    let minX = info.width
    let minY = info.height
    let maxX = -1
    let maxY = -1

    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            if (alpha[y * info.width + x] > 0) {
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
        }
    }

    if (maxX < 0) {
        throw new Error(`${slug}: nothing is left after the background was removed`)
    }

    const cropWidth = maxX - minX + 1
    const cropHeight = maxY - minY + 1
    const cropped = Buffer.alloc(cropWidth * cropHeight)

    for (let y = 0; y < cropHeight; y++) {
        alpha.copy(cropped, y * cropWidth, (minY + y) * info.width + minX, (minY + y) * info.width + minX + cropWidth)
    }

    const long = Math.max(cropWidth, cropHeight)
    const target = long < MIN_LONG_SIDE ? MIN_LONG_SIDE : Math.min(long, MAX_LONG_SIDE)
    let image = sharp(cropped, { raw: { width: cropWidth, height: cropHeight, channels: 1 } })

    if (target !== long) {
        image = image.resize(
            Math.max(1, Math.round((cropWidth * target) / long)),
            Math.max(1, Math.round((cropHeight * target) / long)),
            { kernel: 'lanczos3', fit: 'fill' },
        )
    }

    // sharp resizes a one-channel raw image into sRGB (three channels); asked for as `b-w` again,
    // the buffer is one byte per pixel, which is what the loop below reads.
    const resized = await image.toColourspace('b-w').raw().toBuffer({ resolveWithObject: true })

    if (resized.info.channels !== 1 || resized.data.length !== resized.info.width * resized.info.height) {
        throw new Error(`${slug}: expected a one-channel mask after resizing, got ${resized.info.channels} channels`)
    }

    const greyAlpha = Buffer.alloc(resized.info.width * resized.info.height * 2)

    for (let i = 0; i < resized.info.width * resized.info.height; i++) {
        greyAlpha[i * 2] = 0
        greyAlpha[i * 2 + 1] = resized.data[i]
    }

    const png = await sharp(greyAlpha, { raw: { width: resized.info.width, height: resized.info.height, channels: 2 } })
        .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
        .toBuffer()

    await writeFile(path.join(OUT_DIR, `${slug}.png`), png)

    return {
        file: `${slug}.png`,
        format: 'png',
        width: resized.info.width,
        height: resized.info.height,
        aspect: round3(resized.info.width / resized.info.height),
        hash: hash(png),
        note: long < MIN_LONG_SIDE ? `source only ${long} px on the long side; scaled up, no detail added` : undefined,
    }
}

const hash = (content) => createHash('sha256').update(content).digest('hex').slice(0, 12)

// ──────────────────────────────────────────────────────────────────────────────── the contact sheet

async function alphaOf(entry, height) {
    const file = path.join(OUT_DIR, entry.file)
    const width = Math.max(1, Math.round(height * entry.aspect))

    if (entry.format === 'svg') {
        const svg = (await readFile(file, 'utf8'))
            .replace(/\swidth="[^"]*"/, ` width="${width}"`)
            .replace(/\sheight="[^"]*"/, ` height="${height}"`)

        return {
            width,
            height,
            data: await sharp(Buffer.from(svg), { density: 72 }).toColourspace('srgb').ensureAlpha().extractChannel(3).raw().toBuffer(),
        }
    }

    return {
        width,
        height,
        // A grey+alpha mask has two bands; sRGB first, so channel 3 is the alpha in both cases.
        data: await sharp(file)
            .resize(width, height, { fit: 'fill' })
            .toColourspace('srgb')
            .ensureAlpha()
            .extractChannel(3)
            .raw()
            .toBuffer(),
    }
}

async function contactSheet(target, manifest, order) {
    const height = 72
    const padX = 26
    const padY = 22
    const label = 26
    const columns = 4
    const entries = order.filter((slug) => manifest.logos[slug] !== undefined).map((slug) => [slug, manifest.logos[slug]])

    if (entries.length === 0) {
        return
    }

    const tiles = []

    for (const [slug, entry] of entries) {
        tiles.push({ slug, entry, mask: await alphaOf(entry, height) })
    }

    const cellWidth = Math.max(...tiles.map((tile) => tile.mask.width)) + padX * 2
    const cellHeight = height + padY * 2 + label
    const rows = Math.ceil(tiles.length / columns)
    const width = cellWidth * columns
    const sheetHeight = cellHeight * rows
    const composites = []
    let marks = ''

    tiles.forEach((tile, i) => {
        const column = i % columns
        const row = Math.floor(i / columns)
        const left = column * cellWidth + Math.round((cellWidth - tile.mask.width) / 2)
        const top = row * cellHeight + padY
        const rgba = Buffer.alloc(tile.mask.width * tile.mask.height * 4)

        for (let p = 0; p < tile.mask.width * tile.mask.height; p++) {
            rgba[p * 4 + 3] = tile.mask.data[p]
        }

        composites.push({
            input: rgba,
            raw: { width: tile.mask.width, height: tile.mask.height, channels: 4 },
            left,
            top,
        })

        // The hairline is the file's own bounds: padding inside a logo shows up as a gap.
        marks += `<rect x="${left - 0.5}" y="${top - 0.5}" width="${tile.mask.width + 1}" height="${tile.mask.height + 1}" fill="none" stroke="${RULE}" stroke-width="1"/>`
        marks += `<text x="${column * cellWidth + cellWidth / 2}" y="${row * cellHeight + padY + height + 18}" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="${LABEL_INK}" text-anchor="middle">${tile.slug} · ${tile.entry.aspect}</text>`
    })

    composites.push({
        input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${sheetHeight}">${marks}</svg>`),
        left: 0,
        top: 0,
    })

    await sharp({ create: { width, height: sheetHeight, channels: 4, background: BAND } })
        .composite(composites)
        .png()
        .toFile(target)
}

// ──────────────────────────────────────────────────────────────────────────────────────────── main

async function readManifest() {
    try {
        const raw = JSON.parse(await readFile(MANIFEST, 'utf8'))

        return { logos: raw.logos ?? {}, missing: raw.missing ?? {} }
    } catch {
        return { logos: {}, missing: {} }
    }
}

async function main() {
    const args = process.argv.slice(2)
    const sheetAt = args.indexOf('--sheet')
    const sheet = sheetAt >= 0 ? args[sheetAt + 1] : null
    const sheetValueAt = sheetAt >= 0 ? sheetAt + 1 : -1
    const only = args.filter((arg, i) => !arg.startsWith('--') && i !== sheetValueAt)
    const order = Object.keys(BRANDS)
    const slugs = only.length > 0 ? only : order

    for (const slug of slugs) {
        if (BRANDS[slug] === undefined) {
            throw new Error(`no recipe for ${slug}`)
        }
    }

    await mkdir(OUT_DIR, { recursive: true })
    const manifest = await readManifest()
    const failures = []

    for (const slug of slugs) {
        const spec = BRANDS[slug]

        try {
            const entry = spec.recipe === 'bitmap' ? await bitmap(slug, spec) : await vector(slug, spec)
            const { note, ...record } = entry
            manifest.logos[slug] = record
            delete manifest.missing[slug]
            console.log(`${slug.padEnd(10)} ${record.file.padEnd(16)} ${record.width} × ${record.height}  aspect ${record.aspect}${note === undefined ? '' : `  — ${note}`}`)
        } catch (error) {
            failures.push(`${slug}: ${error.message}`)
            console.error(`${slug.padEnd(10)} FAILED  ${error.message}`)
        }
    }

    for (const [slug, why] of Object.entries(MISSING)) {
        manifest.missing[slug] = why
        delete manifest.logos[slug]
    }

    const ordered = {}

    for (const slug of order) {
        if (manifest.logos[slug] !== undefined) {
            ordered[slug] = manifest.logos[slug]
        }
    }

    await writeFile(
        MANIFEST,
        `${JSON.stringify({ generator: 'scripts/brand-logo.mjs', logos: ordered, missing: manifest.missing }, null, 4)}\n`,
        'utf8',
    )

    if (sheet !== null) {
        await mkdir(path.dirname(path.resolve(sheet)), { recursive: true })
        await contactSheet(sheet, { logos: ordered }, order)
        console.log(`contact sheet: ${sheet}`)
    }

    if (failures.length > 0) {
        console.error(`\n${failures.length} logo(s) not written:\n${failures.map((f) => `  ${f}`).join('\n')}`)
        process.exitCode = 1
    }
}

await main()
