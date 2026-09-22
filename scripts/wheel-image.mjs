// A demo wheel's cut-out, from one photograph to the files the Picture component reads.
//
//   node scripts/wheel-image.mjs --source <photo> --out <dir> --slug <slug> --public-base </storage/demo/wheels>
//                                (--circle cx,cy,r [--hub cx,cy,r] [--cutout <transparent png>] | --mask <grey png>)
//                                [--anchors '{"centre":[x,y],"pcd":[x,y,r],…}'] [--stamp 53810]
//                                [--colour cool|none] [--credit-json '{...}'] [--fingerprint <hash>]
//
// Called by `php artisan wheels:process-images` with an argument array (never a shell string); it
// can also be run by hand. What it does, in order:
//
//  1. Crop the photograph to the wheel's bounding square (`--circle`, measured once per photo in
//     database/seeders/content/wheel-photos.php) and make everything outside the circle
//     transparent with a three-pixel soft edge. When rembg has produced a `--cutout`, its alpha is
//     intersected with the circle: rembg separates the car from the background, the circle
//     separates the wheel from the car.
//     A studio shot from an angle is not a circle — the barrel shows — so it comes with a `--mask`
//     instead: a grey image whose value is the alpha (a background-removal service's result, at
//     any size; it is scaled to the photograph). The cut is the photograph's own pixels under that
//     mask, cropped to the mask's bounding box, and it is framed by its longer side.
//  2. Where the centre cap carries another company's mark (`--hub`, the cap as cx,cy,r in source
//     pixels, measured on its own because an off-axis photograph moves the hub away from the rim's
//     centre), paint a plain cap in the wheel's own finish over it (scripts/lib/plain-cap.mjs).
//  3. Neutralise the blue cast of daylight shade with a mild linear curve per channel
//     (8-bit levels): R × 1.02 + 2 · G × 1.00 + 0 · B × 0.95 − 4. `--colour none` skips it.
//  4. Stand the wheel on a contact shadow: two blurred ellipses tinted --c-ink-2 (#3a424d, the
//     dark end of the --c-band grey), a tight dark core directly under the tyre (alpha 0.55,
//     blur σ 10) and a wide soft halo (alpha 0.22, blur σ 26) — darkest and tightest under the
//     wheel, fading to nothing. The shadow is BAKED into the cut-out's alpha rather than written as
//     a separate layer: one request per tile, no compositing in CSS, and it scales with the image
//     at every width.
//  5. Export two frames — 1:1 (1080 × 1080, wheel diameter 82 % of the frame) and 4:3
//     (1080 × 810, wheel 78 % of the height) — each as AVIF, WebP, PNG and JPEG at 480, 768 and
//     1080 px plus a 24 px placeholder, and the 1:1 frame once more as `bare`: the same geometry
//     with no baked shadow, for a page that draws its own (the hero's one CSS contact shadow). The
//     JPEG is flattened on --c-band (#f3f4f6) for the places that cannot take transparency; the
//     manifest names PNG as the `<img>` fallback.
//  6. Carry the anchors (`--anchors`, measured on the photograph in source pixels) into every
//     frame: the same affine map that placed the wheel places each point, normalised to the frame
//     — x and y as fractions of its width and height, a radius or a stamp's width as a fraction
//     of its width, a stamp's height as a fraction of its height (docs/phase0/ACCURACY.md §4). The
//     `wheel` anchor, the outer lip, is never typed in: a circle cut is the circle, a masked cut is
//     the mask's bounding box (centre, half its longer side). No anchors given, none written.
//  7. Write manifest.json: the ImageManifest of the 1:1 frame at the top level with its anchors,
//     the 4:3 frame under `wide` with its own, the shadowless frame under `bare`, the approval
//     number the photograph shows under `stamp`, the credit and the fingerprint the command uses
//     to skip unchanged work.
import { Buffer } from 'node:buffer'
import console from 'node:console'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import process from 'node:process'
import sharp from 'sharp'
import { frameAnchors, parseAnchors } from './lib/anchors.mjs'
import { plainCap } from './lib/plain-cap.mjs'

const WIDTHS = [480, 768, 1080]
const FRAME = 1080
// A darker --c-band: --c-ink-2 from resources/css/tokens.css, the same cool grey hue.
const SHADOW_TINT = '#3a424d'
const JPEG_BACKGROUND = '#f3f4f6'
const PIPELINE_VERSION = 5

const args = parse(process.argv.slice(2))
const source = args.source
const outDir = args.out
const slug = args.slug
const publicBase = (args['public-base'] || '/storage/demo/wheels').replace(/\/$/, '')

const maskPath = typeof args.mask === 'string' && args.mask !== '' ? args.mask : null

if (!source || !outDir || !slug || (!args.circle && maskPath === null)) {
    console.error('usage: node scripts/wheel-image.mjs --source <photo> --out <dir> --slug <slug> (--circle cx,cy,r [--hub cx,cy,r] [--cutout <png>] | --mask <png>) [--anchors <json>] [--stamp <number>] [--public-base <url>]')
    process.exit(1)
}

if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error(`slug "${slug}" must be lower-case letters, digits and hyphens`)
    process.exit(1)
}

if (maskPath !== null && !existsSync(maskPath)) {
    console.error(`--mask "${maskPath}" does not exist`)
    process.exit(1)
}

const [cx, cy, r] = maskPath !== null ? [0, 0, 1] : args.circle.split(',').map(Number)
const hub = typeof args.hub === 'string' && args.hub !== '' ? args.hub.split(',').map(Number) : null
const colour = args.colour || 'cool'

if (maskPath === null && (![cx, cy, r].every(Number.isFinite) || r <= 0)) {
    console.error(`--circle "${args.circle}" must be three numbers cx,cy,r with r > 0`)
    process.exit(1)
}

if (maskPath !== null && hub !== null) {
    console.error('--hub is measured against --circle; a masked photograph takes neither')
    process.exit(1)
}

if (hub !== null && (hub.length !== 3 || !hub.every(Number.isFinite) || hub[2] <= 0)) {
    console.error(`--hub "${args.hub}" must be three numbers cx,cy,r with r > 0`)
    process.exit(1)
}

let anchors = null

if (typeof args.anchors === 'string' && args.anchors !== '') {
    try {
        anchors = parseAnchors(JSON.parse(args.anchors))
    } catch (error) {
        console.error(`--anchors: ${error.message}`)
        process.exit(1)
    }
}

const stamp = typeof args.stamp === 'string' && args.stamp !== '' ? args.stamp : null

if (stamp !== null && !/^\d{5,6}$/.test(stamp)) {
    console.error(`--stamp "${stamp}" must be the five- or six-digit approval number`)
    process.exit(1)
}

mkdirSync(outDir, { recursive: true })

// ── 1 · The cut: a circle around the wheel, or the photograph under its mask ──────────────────
const rotated = sharp(source).rotate()
const meta = await rotated.metadata()
const photo = await rotated.toBuffer()
const size = Math.round(r * 2)

let wheel
// Where the cut sits in the photograph (its top-left corner, source pixels) and the wheel's outer
// lip in the photograph — what the anchors are carried through.
let cutOrigin
let wheelInSource

if (maskPath !== null) {
    const cut = await maskedCut(photo, meta.width, meta.height, maskPath)
    wheel = sharp(cut.buffer)
    cutOrigin = { x: cut.left, y: cut.top }
    wheelInSource = cut.wheel
} else {
    cutOrigin = { x: Math.round(cx - r), y: Math.round(cy - r) }
    // The circle is drawn about the square's middle; as a pixel index that is half a pixel less.
    wheelInSource = [cutOrigin.x + size / 2 - 0.5, cutOrigin.y + size / 2 - 0.5, r]
    const square = await extractSquare(photo, meta.width, meta.height, cx, cy, r)

    const circleMask = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
            <defs><radialGradient id="e"><stop offset="${((r - 3) / r) * 100}%" stop-color="#fff" stop-opacity="1"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
            <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="url(#e)"/>
        </svg>`,
    )

    const layers = [{ input: circleMask, blend: 'dest-in' }]

    // rembg's alpha, inside the circle: the model's edge where the wheel meets air, the circle's
    // edge where the wheel meets the car.
    if (args.cutout && existsSync(args.cutout)) {
        const cutoutSquare = await extractSquare(await sharp(args.cutout).ensureAlpha().toBuffer(), meta.width, meta.height, cx, cy, r)
        const alpha = await sharp(cutoutSquare).ensureAlpha().extractChannel(3).toBuffer()
        const alphaAsMask = await sharp(alpha).joinChannel([alpha, alpha, alpha]).png().toBuffer()
        layers.push({ input: alphaAsMask, blend: 'dest-in' })
    }

    // ── 2 · A plain cap in the wheel's finish over a cap with someone else's mark ──────────────
    if (hub !== null) {
        // The square's top-left corner is (cx − r, cy − r) in the photograph, as extractSquare cut it.
        layers.push(await plainCap(square, { x: hub[0] - Math.round(cx - r), y: hub[1] - Math.round(cy - r), r: hub[2] }))
    }

    wheel = sharp(square).ensureAlpha().composite(layers)
}

// ── 3 · The colour curve ───────────────────────────────────────────────────────────────────────
if (colour === 'cool') {
    wheel = sharp(await wheel.png().toBuffer()).linear([1.02, 1.0, 0.95, 1.0], [2, 0, -4, 0])
}

const wheelPng = await wheel.png().toBuffer()
const wheelMeta = await sharp(wheelPng).metadata()

// The measured anchors plus the derived outer lip, in source pixels. A `wheel` typed in wins.
const sourceAnchors = anchors === null ? null : { ...anchors, wheel: anchors.wheel ?? wheelInSource }

// ── 4 + 5 · Two frames on their own contact shadow and one without, each at three widths ─────
const manifests = {}

for (const [key, frameWidth, frameHeight, share, shadowed] of [
    ['square', FRAME, FRAME, 0.82, true],
    ['wide', FRAME, Math.round((FRAME * 3) / 4), 0.78, true],
    ['bare', FRAME, FRAME, 0.82, false],
]) {
    // The box the wheel fills: a circle cut is square; a masked angle shot keeps its proportions
    // and fills the box by its longer side, standing on the same baseline.
    const diameter = Math.round(Math.min(frameWidth, frameHeight) * share)
    const scale = diameter / Math.max(wheelMeta.width, wheelMeta.height)
    const wheelWidth = Math.round(wheelMeta.width * scale)
    const wheelHeight = Math.round(wheelMeta.height * scale)
    const centreY = Math.round(frameHeight * 0.47)
    const left = Math.round((frameWidth - wheelWidth) / 2)
    const bottom = Math.round(centreY + diameter / 2)
    const top = bottom - wheelHeight

    const resizedWheel = await sharp(wheelPng).resize({ width: wheelWidth, height: wheelHeight, fit: 'fill' }).png().toBuffer()

    const layers = [{ input: resizedWheel, left, top }]

    if (shadowed) {
        layers.unshift({ input: await contactShadow(frameWidth, frameHeight, wheelWidth, bottom), left: 0, top: 0 })
    }

    const frame = await sharp({
        create: { width: frameWidth, height: frameHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
        .composite(layers)
        .png()
        .toBuffer()

    const name = { square: slug, wide: `${slug}-4x3`, bare: `${slug}-bare` }[key]
    const widths = []

    for (const width of WIDTHS) {
        const resized = sharp(frame).resize({ width })
        await resized.clone().avif({ quality: 60 }).toFile(join(outDir, `${name}-${width}.avif`))
        await resized.clone().webp({ quality: 82, alphaQuality: 90 }).toFile(join(outDir, `${name}-${width}.webp`))
        await resized.clone().png({ compressionLevel: 9 }).toFile(join(outDir, `${name}-${width}.png`))
        await resized
            .clone()
            .flatten({ background: JPEG_BACKGROUND })
            .jpeg({ quality: 82, mozjpeg: true })
            .toFile(join(outDir, `${name}-${width}.jpg`))
        widths.push(width)
    }

    const placeholder = await sharp(frame).resize({ width: 24 }).png().toBuffer()

    manifests[key] = {
        name,
        base: `${publicBase}/${slug}/${name}`,
        width: frameWidth,
        height: frameHeight,
        widths,
        fallback: 'png',
        placeholder: `data:image/png;base64,${placeholder.toString('base64')}`,
    }

    // ── 6 · The anchors, carried by the same map that placed the wheel in this frame ──────────
    if (sourceAnchors !== null) {
        manifests[key].anchors = frameAnchors(sourceAnchors, {
            origin: cutOrigin,
            cut: { width: wheelMeta.width, height: wheelMeta.height },
            placed: { left, top, width: wheelWidth, height: wheelHeight },
            frame: { width: frameWidth, height: frameHeight },
        })
    }
}

// ── 7 · The manifest ───────────────────────────────────────────────────────────────────────────
const manifest = {
    ...manifests.square,
    wide: manifests.wide,
    bare: manifests.bare,
    ...(stamp !== null ? { stamp } : {}),
    source: basename(source),
    credit: args['credit-json'] ? JSON.parse(args['credit-json']) : null,
    pipeline: PIPELINE_VERSION,
    fingerprint: args.fingerprint || null,
}

writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`${slug}: ${wheelMeta.width}×${wheelMeta.height} from ${basename(source)}${maskPath !== null ? ' (masked)' : ''} → ${outDir} (${WIDTHS.length} widths × 3 frames${sourceAnchors !== null ? ', anchored' : ''})`)

// ─────────────────────────────────────────────────────────────────────────────────────────────

/** `--key value` pairs into an object; a flag without a value is `true`. */
function parse(argv) {
    const out = {}
    for (let i = 0; i < argv.length; i++) {
        if (!argv[i].startsWith('--')) continue
        const key = argv[i].slice(2)
        const next = argv[i + 1]
        if (next === undefined || next.startsWith('--')) {
            out[key] = true
        } else {
            out[key] = next
            i++
        }
    }
    return out
}

/**
 * The 2r × 2r square around (cx, cy). A circle that runs past the photograph's edge is padded
 * with transparency so the wheel still sits centred in its square.
 */
async function extractSquare(buffer, width, height, cx, cy, r) {
    const size = Math.round(r * 2)
    const wantLeft = Math.round(cx - r)
    const wantTop = Math.round(cy - r)
    const left = Math.max(0, wantLeft)
    const top = Math.max(0, wantTop)
    const right = Math.min(width, wantLeft + size)
    const bottom = Math.min(height, wantTop + size)

    if (right <= left || bottom <= top) {
        throw new Error(`circle ${cx},${cy},${r} lies outside the ${width}×${height} photograph`)
    }

    return sharp(buffer)
        .ensureAlpha()
        .extract({ left, top, width: right - left, height: bottom - top })
        .extend({
            left: left - wantLeft,
            top: top - wantTop,
            right: wantLeft + size - right,
            bottom: wantTop + size - bottom,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()
}

/**
 * The photograph's own pixels under a grey mask scaled to it, cropped to the mask's bounding box
 * (alpha above 16) with a two-pixel margin so the soft edge is kept whole. Returns the cut, where
 * its top-left corner sits in the photograph, and the wheel's outer lip read off the bounding box:
 * its centre, and half its longer side (a shot not quite face-on foreshortens the shorter one).
 */
async function maskedCut(buffer, width, height, mask) {
    const alpha = await sharp(mask).extractChannel(0).resize(width, height, { kernel: 'lanczos3' }).extractChannel(0).raw().toBuffer()

    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (alpha[y * width + x] > 16) {
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
        }
    }

    if (maxX < 0) {
        throw new Error(`the mask ${mask} is empty`)
    }

    const left = Math.max(0, minX - 2)
    const top = Math.max(0, minY - 2)
    const right = Math.min(width, maxX + 3)
    const bottom = Math.min(height, maxY + 3)

    // Two pipelines, not one: sharp orders its operations itself, and in one chain `removeAlpha`
    // runs after `joinChannel` and strips the mask that was just added.
    const alphaImage = await sharp(alpha, { raw: { width, height, channels: 1 } }).png().toBuffer()
    const rgb = await sharp(buffer).removeAlpha().png().toBuffer()
    const cut = await sharp(rgb).joinChannel(alphaImage).png().toBuffer()

    return {
        buffer: await sharp(cut)
            .extract({ left, top, width: right - left, height: bottom - top })
            .png()
            .toBuffer(),
        left,
        top,
        // In pixel indices like every measured anchor: the middle pixel, and a radius in pixels.
        wheel: [(minX + maxX) / 2, (minY + maxY) / 2, Math.max(maxX - minX + 1, maxY - minY + 1) / 2],
    }
}

/**
 * The contact shadow: a tight dark core where the tyre meets the ground and a wide halo around
 * it, both tinted, both blurred, on a transparent frame.
 */
async function contactShadow(frameWidth, frameHeight, diameter, bottom) {
    const cx = frameWidth / 2
    const core = await ellipse(frameWidth, frameHeight, cx, bottom - diameter * 0.01, diameter * 0.34, diameter * 0.035, 0.55, 10)
    const halo = await ellipse(frameWidth, frameHeight, cx, bottom + diameter * 0.01, diameter * 0.5, diameter * 0.07, 0.22, 26)

    return sharp(halo).composite([{ input: core, blend: 'over' }]).png().toBuffer()
}

async function ellipse(width, height, cx, cy, rx, ry, alpha, blur) {
    const svg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
            <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${SHADOW_TINT}" fill-opacity="${alpha}"/>
        </svg>`,
    )

    return sharp(svg).ensureAlpha().blur(blur).png().toBuffer()
}
