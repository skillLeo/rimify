// The image pipeline. A source photograph becomes AVIF, WebP and JPEG at 480, 768, 1080, 1440
// and 1920 px, plus a 24 px placeholder, and a manifest with the dimensions the markup needs.
//
//   node scripts/images.mjs <source> <name> [--crop left,top,width,height]
//
// Output: public/images/<name>/<name>-<width>.{avif,webp,jpg} and
//         resources/js/images/<name>.json — imported by the Picture component.
import { mkdirSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'
import sharp from 'sharp'

const WIDTHS = [480, 768, 1080, 1440, 1920]

const [source, name, ...rest] = process.argv.slice(2)

if (!source || !name) {
    console.error('usage: node scripts/images.mjs <source> <name> [--crop left,top,width,height]')
    process.exit(1)
}

const cropArg = rest.indexOf('--crop')
const crop = cropArg >= 0 ? rest[cropArg + 1].split(',').map(Number) : null

const outDir = `public/images/${name}`
mkdirSync(outDir, { recursive: true })
mkdirSync('resources/js/images', { recursive: true })

let image = sharp(source).rotate()

if (crop) {
    const [left, top, width, height] = crop
    image = image.extract({ left, top, width, height })
}

const master = await image.toBuffer()
const { width: fullWidth, height: fullHeight } = await sharp(master).metadata()
const sources = { avif: [], webp: [], jpg: [] }

for (const width of WIDTHS.filter((w) => w <= fullWidth)) {
    const resized = sharp(master).resize({ width, withoutEnlargement: true })
    await resized.clone().avif({ quality: 55 }).toFile(`${outDir}/${name}-${width}.avif`)
    await resized.clone().webp({ quality: 78 }).toFile(`${outDir}/${name}-${width}.webp`)
    await resized.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(`${outDir}/${name}-${width}.jpg`)
    sources.avif.push(width)
    sources.webp.push(width)
    sources.jpg.push(width)
}

// A 24 px placeholder, inlined, so the frame is never empty while the real file arrives.
const placeholder = await sharp(master).resize({ width: 24 }).jpeg({ quality: 50 }).toBuffer()

const manifest = {
    name,
    base: `/images/${name}/${name}`,
    width: fullWidth,
    height: fullHeight,
    widths: sources.jpg,
    placeholder: `data:image/jpeg;base64,${placeholder.toString('base64')}`,
    source: basename(source),
}

writeFileSync(`resources/js/images/${name}.json`, JSON.stringify(manifest, null, 2))
console.log(`${name}: ${fullWidth}×${fullHeight}, ${sources.jpg.length} sizes → ${outDir}`)
