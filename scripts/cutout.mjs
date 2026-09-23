// A front-facing wheel cut-out from a photograph, as a development step (never at runtime).
//
//   node scripts/cutout.mjs <source> <name> --circle cx,cy,r [--hub cx,cy,r]
//
// The wheel is round, so its silhouette is a circle: the photograph is cropped to the wheel's
// bounding square and everything outside the circle is made transparent, with a soft edge of a
// few pixels. `--hub` paints a plain cap in the wheel's own finish over a centre cap that carries
// another company's mark (scripts/lib/plain-cap.mjs; the same values as the photograph's entry in
// database/seeders/content/wheel-photos.php). Output: transparent AVIF, WebP and PNG at 480, 768
// and the crop's own width, plus a manifest for the Picture component.
//
//   node scripts/cutout.mjs storage/app/public/placeholder/pexels-14649125.jpg hero-wheel \
//        --circle 2365,2642,785 --hub 2373,2602,94
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'
import sharp from 'sharp'
import { plainCap } from './lib/plain-cap.mjs'

const [source, name, ...rest] = process.argv.slice(2)
const circleArg = rest.indexOf('--circle')
const hubArg = rest.indexOf('--hub')

if (!source || !name || circleArg < 0) {
    console.error('usage: node scripts/cutout.mjs <source> <name> --circle cx,cy,r [--hub cx,cy,r]')
    process.exit(1)
}

const [cx, cy, r] = rest[circleArg + 1].split(',').map(Number)
const hub = hubArg >= 0 ? rest[hubArg + 1].split(',').map(Number) : null
const size = r * 2

const outDir = `public/images/${name}`
mkdirSync(outDir, { recursive: true })
mkdirSync('resources/js/images', { recursive: true })

const cropped = await sharp(source)
    .rotate()
    .extract({ left: Math.round(cx - r), top: Math.round(cy - r), width: size, height: size })
    .toBuffer()

// A circle with a three-pixel soft edge, carried in the mask's ALPHA channel: `dest-in` keeps the
// photo only where the mask is opaque, so the outside must be transparent, not black.
const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <defs><radialGradient id="e"><stop offset="${((r - 3) / r) * 100}%" stop-color="#fff" stop-opacity="1"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
        <circle cx="${r}" cy="${r}" r="${r}" fill="url(#e)"/>
    </svg>`,
)

const layers = [{ input: mask, blend: 'dest-in' }]

if (hub !== null) {
    // The crop's top-left corner is (cx − r, cy − r) in the photograph.
    layers.push(await plainCap(cropped, { x: hub[0] - Math.round(cx - r), y: hub[1] - Math.round(cy - r), r: hub[2] }))
}

// The largest export is capped: the hero renders at 540 CSS px, so 1080 px covers a 2× screen
// and the AVIF stays under the 160 KB budget for the LCP asset.
const largest = Math.min(size, 1080)
const cut = await sharp(cropped).ensureAlpha().composite(layers).png().toBuffer()
const master = largest < size ? await sharp(cut).resize({ width: largest }).png().toBuffer() : cut
const widths = [480, 768, largest].filter((w, i, a) => w <= largest && a.indexOf(w) === i)

for (const width of widths) {
    const resized = sharp(master).resize({ width })
    await resized.clone().avif({ quality: 55 }).toFile(`${outDir}/${name}-${width}.avif`)
    await resized.clone().webp({ quality: 82, alphaQuality: 90 }).toFile(`${outDir}/${name}-${width}.webp`)
    await resized.clone().png({ compressionLevel: 9 }).toFile(`${outDir}/${name}-${width}.png`)
}

const placeholder = await sharp(master).resize({ width: 24 }).png().toBuffer()

// Anything hand-written into the manifest — the callout targets, calibrated against the picture —
// survives a re-cut; only the measured fields are rewritten.
const manifestPath = `resources/js/images/${name}.json`
const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}

writeFileSync(
    manifestPath,
    JSON.stringify(
        {
            ...previous,
            name,
            base: `/images/${name}/${name}`,
            width: largest,
            height: largest,
            widths,
            fallback: 'png',
            placeholder: `data:image/png;base64,${placeholder.toString('base64')}`,
            source: basename(source),
        },
        null,
        2,
    ),
)

console.log(`${name}: ${size}×${size}, ${widths.length} sizes → ${outDir}`)
