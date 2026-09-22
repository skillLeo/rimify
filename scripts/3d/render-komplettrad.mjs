// Render the Kompletträder band's illustration: the parametric rim with a parametric tyre, face-on,
// generated here and nowhere photographed (docs/phase0/ACCURACY.md §3.1). No car, no brake, no
// brand, no lettering on the tyre — the page labels it "Illustration".
//
//   node scripts/3d/render-komplettrad.mjs
//     → public/images/komplettrad-illustration/komplettrad-illustration-{480,768}.{avif,webp,png}
//     → resources/js/images/komplettrad-illustration.json (the Picture manifest)
//
// The same camera, environment and rim material as scripts/3d/render-frames.mjs; the tyre is the
// lathe profile the live band used (Wheel3D/tyre.ts) and the framing is Wheel3D/targets.ts's, so
// the rim and the tyre come from one model. Runs headless Chromium (Playwright) against a throwaway
// same-origin static server; nothing here touches the Laravel app.
import { createServer } from 'node:http'
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import { RUBBER } from '../../resources/js/Components/Home/Wheel3D/finish.ts'
import { framing } from '../../resources/js/Components/Home/Wheel3D/targets.ts'
import { tyreProfile } from '../../resources/js/Components/Home/Wheel3D/tyre.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const model = JSON.parse(readFileSync(join(root, 'resources/js/Components/Home/Wheel3D/hero-wheel-3d.json'), 'utf8'))
const SIZE = 1080
const NAME = 'komplettrad-illustration'
const OUT = join(root, 'public/images', NAME)
const MANIFEST = join(root, 'resources/js/images', `${NAME}.json`)
const WIDTHS = [480, 768]

/** A plain section that suits the 8,5J × 19 rim; an illustration names no tyre and claims no size. */
const TYRE = { widthMm: 245, aspect: 35 }
/** The rim's look, shared with render-frames.mjs (and the viewer's finish table). */
const LOOK = { envRotationY: Math.PI, color: '#c9ccd1', roughness: 0.25, metalness: 1 }

const { distanceMm } = framing(model, TYRE)
const profile = tyreProfile(model, TYRE)

const MIME = {
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.html': 'text/html; charset=utf-8',
    '.glb': 'model/gltf-binary',
    '.hdr': 'application/octet-stream',
    '.wasm': 'application/wasm',
}

const page = `<!doctype html><meta charset="utf-8"><title>komplettrad harness</title>
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
<style>html,body{margin:0;background:transparent}canvas{display:block}</style>
<canvas id="c" width="${SIZE}" height="${SIZE}"></canvas>
<script type="module">
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

const m = ${JSON.stringify(model)}
const look = ${JSON.stringify(LOOK)}
const rubber = ${JSON.stringify(RUBBER)}
const profile = ${JSON.stringify(profile)}
const MM = 0.001
const canvas = document.getElementById('c')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(${SIZE}, ${SIZE}, false)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.setClearColor(0x000000, 0)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(m.fovDeg, 1, 0.05, 10)
camera.position.set(0, 0, ${distanceMm} * MM)
camera.lookAt(0, 0, 0)

const hdr = await new HDRLoader().loadAsync('/public/3d/studio_small_09_1k.hdr')
hdr.mapping = THREE.EquirectangularReflectionMapping
scene.environment = hdr
scene.environmentRotation = new THREE.Euler(0, look.envRotationY, 0)

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)
const gltf = await loader.loadAsync(m.url.replace(/^\\/3d\\//, '/public/3d/'))
const rim = new THREE.MeshStandardMaterial({ color: new THREE.Color(look.color), metalness: look.metalness, roughness: look.roughness })
gltf.scene.traverse((o) => { if (o.isMesh) { o.material = rim } })
scene.add(gltf.scene)

// The tyre: the lathe turns about Y, the axle is Z.
const geometry = new THREE.LatheGeometry(profile.map((p) => new THREE.Vector2(p.r * MM, p.z * MM)), 240)
geometry.rotateX(Math.PI / 2)
geometry.computeVertexNormals()
scene.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: new THREE.Color(rubber.color), metalness: rubber.metalness, roughness: rubber.roughness })))

window.__render = () => {
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
tab.on('pageerror', (err) => console.log('[pageerror]', err.message))
await tab.goto(`http://127.0.0.1:${port}/`)
await tab.waitForFunction(() => window.__ready === true, null, { timeout: 120_000 })

const dataUrl = await tab.evaluate(() => window.__render())
const png = Buffer.from(dataUrl.split(',')[1], 'base64')

await browser.close()
server.close()

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

for (const w of WIDTHS) {
    const base = sharp(png).resize(w, w)
    await base.clone().avif({ quality: 50, effort: 6 }).toFile(join(OUT, `${NAME}-${w}.avif`))
    await base.clone().webp({ quality: 78, alphaQuality: 85 }).toFile(join(OUT, `${NAME}-${w}.webp`))
    await base.clone().png({ compressionLevel: 9, palette: true }).toFile(join(OUT, `${NAME}-${w}.png`))
}

// A transparent cut-out gets no blurred placeholder in Picture.vue; the manifest carries one anyway.
const tiny = await sharp(png).resize(24, 24).png().toBuffer()

const manifest = {
    name: NAME,
    base: `/images/${NAME}/${NAME}`,
    width: WIDTHS.at(-1),
    height: WIDTHS.at(-1),
    widths: WIDTHS,
    fallback: 'png',
    placeholder: `data:image/png;base64,${tiny.toString('base64')}`,
    licence: 'CC0 1.0 - rendered by scripts/3d/render-komplettrad.mjs from the parametric wheel and tyre, no third-party design',
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')

// For a human eye, on request: the illustration on the dark band it sits on (`--preview <file.png>`).
const previewAt = process.argv.indexOf('--preview')

if (previewAt !== -1 && process.argv[previewAt + 1] !== undefined) {
    await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: '#0B0F14' } })
        .composite([{ input: png }])
        .png()
        .toFile(resolve(process.argv[previewAt + 1]))
}

console.log(`komplettrad illustration: ${WIDTHS.length} widths x 3 formats -> ${OUT}`)
