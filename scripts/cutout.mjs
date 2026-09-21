// A front-facing wheel cut-out from a photograph, as a development step (never at runtime).
//
//   node scripts/cutout.mjs <source> <name> --circle cx,cy,r [--cap r]
//
// The wheel is round, so its silhouette is a circle: the photograph is cropped to the wheel's
// bounding square and everything outside the circle is made transparent, with a soft edge of a
// few pixels. `--cap` draws a plain centre cap over the hub, for a photo whose hub carries a
// third-party mark. Output: transparent AVIF, WebP and PNG at 480, 768 and the crop's own width,
// plus a manifest for the Picture component.
import { mkdirSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'
import sharp from 'sharp'

const [source, name, ...rest] = process.argv.slice(2)
const circleArg = rest.indexOf('--circle')
const capArg = rest.indexOf('--cap')

if (!source || !name || circleArg < 0) {
    console.error('usage: node scripts/cutout.mjs <source> <name> --circle cx,cy,r [--cap r]')
    process.exit(1)
}

const [cx, cy, r] = rest[circleArg + 1].split(',').map(Number)
const cap = capArg >= 0 ? Number(rest[capArg + 1]) : 0
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

if (cap > 0) {
    layers.push({
        input: Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
                <circle cx="${r}" cy="${r}" r="${cap}" fill="#161B22"/>
                <circle cx="${r}" cy="${r}" r="${cap - 3}" fill="none" stroke="#2A313B" stroke-width="1.5"/>
            </svg>`,
        ),
        blend: 'over',
    })
}

const master = await sharp(cropped).ensureAlpha().composite(layers).png().toBuffer()
const widths = [480, 768, size].filter((w, i, a) => w <= size && a.indexOf(w) === i)

for (const width of widths) {
    const resized = sharp(master).resize({ width })
    await resized.clone().avif({ quality: 60 }).toFile(`${outDir}/${name}-${width}.avif`)
    await resized.clone().webp({ quality: 82, alphaQuality: 90 }).toFile(`${outDir}/${name}-${width}.webp`)
    await resized.clone().png({ compressionLevel: 9 }).toFile(`${outDir}/${name}-${width}.png`)
}

const placeholder = await sharp(master).resize({ width: 24 }).png().toBuffer()

writeFileSync(
    `resources/js/images/${name}.json`,
    JSON.stringify(
        {
            name,
            base: `/images/${name}/${name}`,
            width: size,
            height: size,
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
