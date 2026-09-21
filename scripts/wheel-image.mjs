// A demo wheel's cut-out, from one photograph to the files the Picture component reads.
//
//   node scripts/wheel-image.mjs --source <photo> --out <dir> --slug <slug> --public-base </storage/demo/wheels>
//                                --circle cx,cy,r [--cap r] [--cutout <transparent png>]
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
//  2. Cover the hub with a plain centre cap (`--cap`) where the photograph shows a brand mark.
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
//     1080 px plus a 24 px placeholder. The JPEG is flattened on --c-band (#f3f4f6) for the places
//     that cannot take transparency; the manifest names PNG as the `<img>` fallback.
//  6. Write manifest.json: the ImageManifest of the 1:1 frame at the top level, the 4:3 frame
//     under `wide`, the credit and the fingerprint the command uses to skip unchanged work.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import sharp from 'sharp'

const WIDTHS = [480, 768, 1080]
const FRAME = 1080
// A darker --c-band: --c-ink-2 from resources/css/tokens.css, the same cool grey hue.
const SHADOW_TINT = '#3a424d'
const JPEG_BACKGROUND = '#f3f4f6'
const PIPELINE_VERSION = 2

const args = parse(process.argv.slice(2))
const source = args.source
const outDir = args.out
const slug = args.slug
const publicBase = (args['public-base'] || '/storage/demo/wheels').replace(/\/$/, '')

if (!source || !outDir || !slug || !args.circle) {
    console.error('usage: node scripts/wheel-image.mjs --source <photo> --out <dir> --slug <slug> --circle cx,cy,r [--cap r] [--cutout <png>] [--public-base <url>]')
    process.exit(1)
}

if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error(`slug "${slug}" must be lower-case letters, digits and hyphens`)
    process.exit(1)
}

const [cx, cy, r] = args.circle.split(',').map(Number)
const cap = args.cap ? Number(args.cap) : 0
const colour = args.colour || 'cool'

if (![cx, cy, r].every(Number.isFinite) || r <= 0) {
    console.error(`--circle "${args.circle}" must be three numbers cx,cy,r with r > 0`)
    process.exit(1)
}

mkdirSync(outDir, { recursive: true })

// ── 1 · The wheel's bounding square, transparent outside the circle ────────────────────────────
const rotated = sharp(source).rotate()
const meta = await rotated.metadata()
const photo = await rotated.toBuffer()
const size = Math.round(r * 2)

const square = await extractSquare(photo, meta.width, meta.height, cx, cy, r)

const circleMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <defs><radialGradient id="e"><stop offset="${((r - 3) / r) * 100}%" stop-color="#fff" stop-opacity="1"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="url(#e)"/>
    </svg>`,
)

const layers = [{ input: circleMask, blend: 'dest-in' }]

// rembg's alpha, inside the circle: the model's edge where the wheel meets air, the circle's edge
// where the wheel meets the car.
if (args.cutout && existsSync(args.cutout)) {
    const cutoutSquare = await extractSquare(await sharp(args.cutout).ensureAlpha().toBuffer(), meta.width, meta.height, cx, cy, r)
    const alpha = await sharp(cutoutSquare).ensureAlpha().extractChannel(3).toBuffer()
    const alphaAsMask = await sharp(alpha).joinChannel([alpha, alpha, alpha]).png().toBuffer()
    layers.push({ input: alphaAsMask, blend: 'dest-in' })
}

// ── 2 · A plain centre cap over a branded hub ──────────────────────────────────────────────────
if (cap > 0) {
    layers.push({
        input: Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
                <defs><radialGradient id="c" cx="40%" cy="35%" r="70%"><stop offset="0%" stop-color="#2a313b"/><stop offset="100%" stop-color="#11151b"/></radialGradient></defs>
                <circle cx="${size / 2}" cy="${size / 2}" r="${cap}" fill="url(#c)"/>
                <circle cx="${size / 2}" cy="${size / 2}" r="${Math.max(1, cap - 3)}" fill="none" stroke="#3a424d" stroke-width="1.5"/>
            </svg>`,
        ),
        blend: 'over',
    })
}

let wheel = sharp(square).ensureAlpha().composite(layers)

// ── 3 · The colour curve ───────────────────────────────────────────────────────────────────────
if (colour === 'cool') {
    wheel = sharp(await wheel.png().toBuffer()).linear([1.02, 1.0, 0.95, 1.0], [2, 0, -4, 0])
}

const wheelPng = await wheel.png().toBuffer()

// ── 4 + 5 · Two frames, each on its own contact shadow, each at three widths ──────────────────
const manifests = {}

for (const [key, frameWidth, frameHeight, share] of [
    ['square', FRAME, FRAME, 0.82],
    ['wide', FRAME, Math.round((FRAME * 3) / 4), 0.78],
]) {
    const diameter = Math.round(Math.min(frameWidth, frameHeight) * share)
    const centreY = Math.round(frameHeight * 0.47)
    const left = Math.round((frameWidth - diameter) / 2)
    const top = Math.round(centreY - diameter / 2)
    const bottom = top + diameter

    const resizedWheel = await sharp(wheelPng).resize({ width: diameter, height: diameter, fit: 'fill' }).png().toBuffer()

    const shadow = await contactShadow(frameWidth, frameHeight, diameter, bottom)

    const frame = await sharp({
        create: { width: frameWidth, height: frameHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
        .composite([
            { input: shadow, left: 0, top: 0 },
            { input: resizedWheel, left, top },
        ])
        .png()
        .toBuffer()

    const name = key === 'square' ? slug : `${slug}-4x3`
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
}

// ── 6 · The manifest ───────────────────────────────────────────────────────────────────────────
const manifest = {
    ...manifests.square,
    wide: manifests.wide,
    source: basename(source),
    credit: args['credit-json'] ? JSON.parse(args['credit-json']) : null,
    pipeline: PIPELINE_VERSION,
    fingerprint: args.fingerprint || null,
}

writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`${slug}: ${size}×${size} from ${basename(source)} → ${outDir} (${WIDTHS.length} widths × 2 frames)`)

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
