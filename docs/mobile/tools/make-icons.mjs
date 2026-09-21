// Renders the app icons from public/icons/rimify-mark.svg with sharp.
//
//   node docs/mobile/tools/make-icons.mjs
//
// `any` icons keep the mark at 70 % of the canvas; the maskable one at 58 %, inside the 80 %
// safe zone a launcher may crop to a circle. The Apple touch icon has no transparency at all.
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const OUT = 'public/icons'
const INK = { r: 11, g: 15, b: 20, alpha: 1 }
const svg = readFileSync(`${OUT}/rimify-mark.svg`)

async function icon(size, markFraction, file) {
    const mark = Math.round(size * markFraction)
    const glyph = await sharp(svg).resize(mark, mark).png().toBuffer()

    await sharp({ create: { width: size, height: size, channels: 4, background: INK } })
        .composite([{ input: glyph, gravity: 'centre' }])
        .png({ compressionLevel: 9 })
        .toFile(`${OUT}/${file}`)

    console.log(`${file} ${size}×${size}`)
}

await icon(192, 0.7, 'icon-192.png')
await icon(512, 0.7, 'icon-512.png')
await icon(512, 0.58, 'icon-maskable-512.png')
await icon(180, 0.7, 'apple-touch-icon.png')
