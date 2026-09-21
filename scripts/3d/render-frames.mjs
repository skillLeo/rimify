// Render the parametric wheel offline with the same camera, environment and material the viewer
// uses — for review shots, the silhouette check against the poster, and (with --sequence) the
// image-sequence fallback frames.
//
//   node scripts/3d/render-frames.mjs                 → docs/reviews/shots/hero-3d/*.png + silhouette report
//   node scripts/3d/render-frames.mjs --sequence      → public/images/hero-wheel-seq/{yaw,roll}-*.{avif,webp,png}
//
// Runs headless Chromium (Playwright) against a throwaway same-origin static server so `three`
// resolves from node_modules through an import map; nothing here touches the Laravel app.
import { createServer } from 'node:http'
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const manifest = JSON.parse(readFileSync(join(root, 'resources/js/Components/Home/Wheel3D/hero-wheel-3d.json'), 'utf8'))
const sequence = process.argv.includes('--sequence')
const sweep = process.argv.includes('--sweep')
const SIZE = 1136
/** The environment's yaw and the material, shared with the viewer (Wheel3D/finish.ts and WheelScene.vue). */
const LOOK = { envRotationY: Math.PI, envIntensity: 1, color: '#c9ccd1', roughness: 0.25, metalness: 1 }
const SHOTS = join(root, 'docs/reviews/shots/hero-3d')
const SEQ = join(root, 'public/images/hero-wheel-seq')

const MIME = {
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.html': 'text/html; charset=utf-8',
    '.glb': 'model/gltf-binary',
    '.hdr': 'application/octet-stream',
    '.wasm': 'application/wasm',
    '.png': 'image/png',
    '.json': 'application/json',
}

const page = `<!doctype html><meta charset="utf-8"><title>wheel harness</title>
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
<style>html,body{margin:0;background:transparent}canvas{display:block}</style>
<canvas id="c" width="${SIZE}" height="${SIZE}"></canvas>
<script type="module">
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

const m = ${JSON.stringify(manifest)}
const canvas = document.getElementById('c')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(${SIZE}, ${SIZE}, false)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.setClearColor(0x000000, 0)

const scene = new THREE.Scene()
const tanHalf = Math.tan((m.fovDeg / 2) * Math.PI / 180)
const distance = (m.rimRadiusMm / (m.poster.fraction * tanHalf) + m.lipZMm) / 1000
const camera = new THREE.PerspectiveCamera(m.fovDeg, 1, 0.05, 10)
camera.position.set(0, 0, distance)
camera.lookAt(0, 0, 0)

const hdr = await new HDRLoader().loadAsync('/public/3d/studio_small_09_1k.hdr')
hdr.mapping = THREE.EquirectangularReflectionMapping
scene.environment = hdr

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)
const gltf = await loader.loadAsync(m.url.replace(/^\\/3d\\//, '/public/3d/'))
const material = new THREE.MeshStandardMaterial({ color: new THREE.Color('#c9ccd1'), metalness: 1, roughness: 0.25 })
gltf.scene.traverse((o) => { if (o.isMesh) { o.material = material } })
scene.add(gltf.scene)

window.__look = (look) => {
    scene.environmentRotation = new THREE.Euler(0, look.envRotationY, 0)
    scene.environmentIntensity = look.envIntensity
    material.color.set(look.color)
    material.roughness = look.roughness
    material.metalness = look.metalness
    material.needsUpdate = true
}
window.__render = (rollDeg, yawDeg) => {
    gltf.scene.rotation.set(0, (yawDeg ?? 0) * Math.PI / 180, (rollDeg ?? 0) * Math.PI / 180)
    renderer.render(scene, camera)
    return canvas.toDataURL('image/png')
}
window.__ready = true
</script>`

const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (url.pathname === '/') {
        res.writeHead(200, { 'content-type': MIME['.html'] })
        res.end(page)

        return
    }
    const file = join(root, decodeURIComponent(url.pathname))
    if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
        res.writeHead(404)
        res.end()

        return
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const port = server.address().port

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const tab = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 })
tab.on('console', (msg) => console.log('[browser]', msg.text()))
tab.on('pageerror', (err) => console.log('[pageerror]', err.message))
await tab.goto(`http://127.0.0.1:${port}/`)
await tab.waitForFunction(() => window.__ready === true, null, { timeout: 60_000 })

const frame = async (roll, yaw) => {
    const dataUrl = await tab.evaluate(([r, y]) => window.__render(r, y), [roll, yaw])

    return Buffer.from(dataUrl.split(',')[1], 'base64')
}
const look = (l) => tab.evaluate((v) => window.__look(v), l)

mkdirSync(SHOTS, { recursive: true })

// A contact sheet of looks — environment yaw × roughness — to choose the one the viewer ships.
if (sweep) {
    const cells = []
    const rotations = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75]
    for (const rough of [0.25, 0.4]) {
        for (const rot of rotations) {
            await look({ ...LOOK, envRotationY: rot * Math.PI, roughness: rough })
            const png = await sharp(await frame(0, 0)).resize(360, 360).png().toBuffer()
            cells.push({ png, label: `rot ${rot}π · rough ${rough}` })
        }
    }
    const cols = rotations.length
    const rows = Math.ceil(cells.length / cols)
    await sharp({ create: { width: cols * 360, height: rows * 360, channels: 4, background: '#F3F4F6' } })
        .composite(cells.map((c, i) => ({ input: c.png, left: (i % cols) * 360, top: Math.floor(i / cols) * 360 })))
        .png()
        .toFile(join(SHOTS, 'sweep-looks.png'))
    console.log('sweep:', cells.map((c) => c.label).join(' | '))
    await browser.close()
    server.close()
    process.exit(0)
}

await look(LOOK)

// The rest pose, raw (alpha) and composited on the band grey for a human eye.
const rest = await frame(0, 0)
writeFileSync(join(SHOTS, 'rest-alpha.png'), rest)
await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: '#F3F4F6' } })
    .composite([{ input: rest }])
    .png()
    .toFile(join(SHOTS, 'rest-on-band.png'))
await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: '#0B0F14' } })
    .composite([{ input: await frame(-60, 0) }])
    .png()
    .toFile(join(SHOTS, 'roll-60-on-dark.png'))
await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: '#F3F4F6' } })
    .composite([{ input: await frame(8, 0) }])
    .png()
    .toFile(join(SHOTS, 'roll-8-on-band.png'))

// Silhouette: the poster's alpha mask against the render's — outer silhouette and spoke windows.
const posterMask = await mask(join(root, 'public/images/hero-wheel/hero-wheel-1136.png'))
const renderMask = await mask(rest)
let differ = 0
let posterOn = 0
let renderOn = 0
for (let i = 0; i < posterMask.length; i++) {
    if (posterMask[i] !== renderMask[i]) differ++
    if (posterMask[i]) posterOn++
    if (renderMask[i]) renderOn++
}
const report = {
    pixels: posterMask.length,
    differingPercent: Number(((differ / posterMask.length) * 100).toFixed(2)),
    posterCoveragePercent: Number(((posterOn / posterMask.length) * 100).toFixed(2)),
    renderCoveragePercent: Number(((renderOn / posterMask.length) * 100).toFixed(2)),
    outerDiameter: { poster: await diameter(posterMask), render: await diameter(renderMask) },
}
writeFileSync(join(SHOTS, 'silhouette.json'), JSON.stringify(report, null, 2) + '\n')
console.log('silhouette', JSON.stringify(report))

if (sequence) {
    rmSync(SEQ, { recursive: true, force: true })
    mkdirSync(SEQ, { recursive: true })
    const yawAngles = [-10, -5, 0, 5, 10]
    const rollFrames = 12
    const rollStep = 360 / manifest.spokes / rollFrames
    const outputs = []

    for (const yaw of yawAngles) {
        outputs.push(await writeFrame(await frame(0, yaw), `yaw-${yaw < 0 ? 'm' : ''}${Math.abs(yaw)}`))
    }
    for (let k = 0; k < rollFrames; k++) {
        outputs.push(await writeFrame(await frame(-k * rollStep, 0), `roll-${String(k).padStart(2, '0')}`))
    }

    const seqManifest = {
        base: '/images/hero-wheel-seq',
        widths: [480, 768],
        width: 768,
        height: 768,
        fallback: 'webp',
        yaw: { anglesDeg: yawAngles },
        roll: { frames: rollFrames, stepDeg: Number(rollStep.toFixed(3)) },
        licence: manifest.licence,
        files: outputs,
    }
    writeFileSync(join(root, 'resources/js/Components/Home/Wheel3D/hero-wheel-seq.json'), JSON.stringify(seqManifest, null, 2) + '\n')
    console.log(`sequence: ${outputs.length} frames x 2 widths x 2 formats (AVIF, WebP) -> ${SEQ}`)
}

await browser.close()
server.close()

/* ── helpers ────────────────────────────────────────────────────────────────── */

async function mask(input) {
    const { data, info } = await sharp(input).resize(SIZE, SIZE).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const out = new Uint8Array(info.width * info.height)
    for (let i = 0; i < out.length; i++) {
        out[i] = data[i * info.channels + 3] > 32 ? 1 : 0
    }

    return out
}

async function diameter(m) {
    let minX = SIZE
    let maxX = -1
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (m[y * SIZE + x]) {
                if (x < minX) minX = x
                if (x > maxX) maxX = x
            }
        }
    }

    return maxX - minX + 1
}

/**
 * AVIF and WebP only: every browser that reaches the sequence rung (a desktop without WebGL2)
 * decodes WebP, so WebP is the `<img>` fallback and no PNG is written. Budget: ≤ 40 KB per
 * 768 px AVIF frame (home-overhaul.md §4.1).
 */
async function writeFrame(png, name) {
    const sizes = {}
    for (const w of [480, 768]) {
        const base = sharp(png).resize(w, w)
        await base.clone().avif({ quality: 50, effort: 6 }).toFile(join(SEQ, `${name}-${w}.avif`))
        await base.clone().webp({ quality: 78, alphaQuality: 85 }).toFile(join(SEQ, `${name}-${w}.webp`))
        sizes[w] = statSync(join(SEQ, `${name}-${w}.avif`)).size
    }

    if (sizes[768] > 40 * 1024) {
        console.warn(`${name}-768.avif is ${(sizes[768] / 1024).toFixed(0)} KB, over the 40 KB budget`)
    }

    return { name, avifBytes: sizes }
}
