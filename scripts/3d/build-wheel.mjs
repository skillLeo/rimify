// Build the hero's parametric wheel as a GLB and write the manifest the viewer reads.
//
//   node scripts/3d/build-wheel.mjs [--spokes 10] [--width 8.5] [--diameter 19] [--et 35]
//                                   [--holes 5] [--pcd 112] [--bore 66.6]
//
// Output:
//   public/3d/wheel-{spokes}.glb                                   — EXT_meshopt_compression + KHR_mesh_quantization
//   resources/js/Components/Home/Wheel3D/hero-wheel-3d.json        — dimensions, targets, poster calibration
//
// The GLB is written with @gltf-transform (three's GLTFExporter needs a browser's FileReader).
// Compression is meshopt, not Draco: three's DRACOLoader decodes in a Worker built from a blob:
// URL, which the site's `worker-src 'self'` refuses; MeshoptDecoder runs on the main thread under
// `'wasm-unsafe-eval'`, which the CSP already grants for the OCR core. Budget: ≤ 1,5 MB (OVERHAUL §3).
import { mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Document, NodeIO } from '@gltf-transform/core'
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions'
import { dedup, meshopt, prune, quantize, reorder, weld } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'
import sharp from 'sharp'
import { buildWheel, calloutTargets3d, WHEEL_DEFAULTS } from './wheel-geometry.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const args = parseArgs(process.argv.slice(2))
const params = {
    ...WHEEL_DEFAULTS,
    ...(args.spokes ? { spokes: Number(args.spokes) } : {}),
    ...(args.width ? { widthIn: Number(args.width) } : {}),
    ...(args.diameter ? { diameterIn: Number(args.diameter) } : {}),
    ...(args.et ? { etMm: Number(args.et) } : {}),
    ...(args.holes ? { boltHoles: Number(args.holes) } : {}),
    ...(args.pcd ? { boltCircleMm: Number(args.pcd) } : {}),
    ...(args.bore ? { boreMm: Number(args.bore) } : {}),
}

const POSTER = join(root, 'public/images/hero-wheel/hero-wheel-1136.png')
const FOV_DEG = 18
const BUDGET_BYTES = 1.5 * 1024 * 1024

const { dims, parts } = buildWheel(params)

/* ── The glTF document ─────────────────────────────────────────────────────── */

const doc = new Document()
doc.createBuffer('wheel')
const material = doc
    .createMaterial('aluminium')
    .setBaseColorFactor([0.62, 0.64, 0.66, 1])
    .setMetallicFactor(1)
    .setRoughnessFactor(0.25)
    .setDoubleSided(false)

const mesh = doc.createMesh('wheel')
let vertices = 0
let triangles = 0

for (const [name, geometry] of Object.entries(parts)) {
    // glTF is metres; the geometry is millimetres.
    geometry.scale(0.001, 0.001, 0.001)
    const pos = geometry.getAttribute('position')
    const nrm = geometry.getAttribute('normal')
    // ExtrudeGeometry is non-indexed; a sequential index lets `weld()` merge its duplicates below.
    const idx = geometry.getIndex() ?? { array: Uint32Array.from({ length: pos.count }, (_, i) => i), count: pos.count }

    if (pos === undefined || nrm === undefined) {
        throw new Error(`${name}: geometry must carry position and normal`)
    }

    const prim = doc
        .createPrimitive()
        .setName(name)
        .setAttribute('POSITION', doc.createAccessor(`${name}.position`).setType('VEC3').setArray(new Float32Array(pos.array)))
        .setAttribute('NORMAL', doc.createAccessor(`${name}.normal`).setType('VEC3').setArray(new Float32Array(nrm.array)))
        .setIndices(doc.createAccessor(`${name}.indices`).setType('SCALAR').setArray(new Uint32Array(idx.array)))
        .setMaterial(material)
    mesh.addPrimitive(prim)
    vertices += pos.count
    triangles += idx.count / 3
}

doc.createScene('wheel').addChild(doc.createNode('wheel').setMesh(mesh))
doc.getRoot().getAsset().generator = 'rimify scripts/3d/build-wheel.mjs'
doc.getRoot().getAsset().copyright = 'RIMIFY — parametric wheel, CC0 1.0'

await MeshoptEncoder.ready
await doc.transform(
    weld(),
    dedup(),
    prune(),
    reorder({ encoder: MeshoptEncoder }),
    quantize({ quantizePosition: 14, quantizeNormal: 10 }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
)

const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({
    'meshopt.encoder': MeshoptEncoder,
})
const glb = await io.writeBinary(doc)

const outDir = join(root, 'public/3d')
mkdirSync(outDir, { recursive: true })
const file = `wheel-${params.spokes}.glb`
writeFileSync(join(outDir, file), glb)
const bytes = statSync(join(outDir, file)).size

if (bytes > BUDGET_BYTES) {
    throw new Error(`${file} is ${bytes} bytes, over the 1,5 MB budget`)
}

/* ── Poster calibration ─────────────────────────────────────────────────────── */

const poster = await measurePoster(POSTER)

/* ── The manifest ───────────────────────────────────────────────────────────── */

const targets3d = calloutTargets3d(params, dims)
const manifest = {
    url: `/3d/${file}`,
    bytes,
    format: 'glb',
    compression: 'meshopt',
    licence: 'CC0 1.0 - parametric mesh generated by scripts/3d/build-wheel.mjs, no third-party design',
    spokes: params.spokes,
    widthIn: params.widthIn,
    diameterIn: params.diameterIn,
    etMm: params.etMm,
    boltHoles: params.boltHoles,
    boltCircleMm: params.boltCircleMm,
    boreMm: params.boreMm,
    rimRadiusMm: round(dims.rimRadiusMm),
    lipZMm: round(dims.lipZMm),
    hubRadiusMm: round(dims.hubRadiusMm),
    hubFaceZMm: round(dims.hubFaceZ),
    halfWidthMm: round(dims.halfWidth),
    fovDeg: FOV_DEG,
    poster,
    targets3d,
    targets2d: projectTargets(targets3d, dims.rimRadiusMm, dims.lipZMm, poster.fraction, FOV_DEG),
    stats: { vertices, triangles },
}

const manifestPath = join(root, 'resources/js/Components/Home/Wheel3D/hero-wheel-3d.json')
mkdirSync(dirname(manifestPath), { recursive: true })
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

console.log(`public/3d/${file}: ${(bytes / 1024).toFixed(0)} KB, ${vertices} vertices, ${triangles} triangles`)
console.log(`poster: wheel spans ${(poster.fraction * 100).toFixed(1)} % of the canvas, centre ${poster.centreX} / ${poster.centreY}`)
console.log(`manifest: ${manifestPath}`)

/* ── helpers ────────────────────────────────────────────────────────────────── */

function parseArgs(argv) {
    const out = {}
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i]
        if (a.startsWith('--')) {
            out[a.slice(2)] = argv[i + 1]
            i++
        }
    }

    return out
}

function round(v) {
    return Math.round(v * 10) / 10
}

/** Where the wheel sits in the poster: the alpha bounding box as fractions of the canvas. */
async function measurePoster(path) {
    const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const { width, height, channels } = info
    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (data[(y * width + x) * channels + 3] > 32) {
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
        }
    }
    const w = maxX - minX + 1
    const h = maxY - minY + 1

    return {
        file: 'hero-wheel-1136.png',
        width,
        height,
        // The silhouette's diameter as a fraction of the canvas (the mean of both axes; a face-on wheel is round).
        fraction: Number((((w + h) / 2) / width).toFixed(4)),
        centreX: Number(((minX + maxX) / 2 / width).toFixed(4)),
        centreY: Number(((minY + maxY) / 2 / height).toFixed(4)),
    }
}

/**
 * Where the four targets land in the square canvas at the rest pose, as percentages — the same
 * arithmetic as resources/js/Components/Home/Wheel3D/targets.ts, written twice on purpose: the
 * Vitest there compares its projection with these numbers, so a drift in either is caught.
 */
function projectTargets(targets, rimRadiusMm, lipZMm, fraction, fovDeg) {
    const tanHalf = Math.tan((fovDeg / 2) * (Math.PI / 180))
    // The camera distance that makes the lip's silhouette span `fraction` of the canvas.
    const distance = rimRadiusMm / (fraction * tanHalf) + lipZMm
    const out = {}
    for (const [key, [x, y, z]] of Object.entries(targets)) {
        const half = (distance - z) * tanHalf
        out[key] = { tx: Number((50 + (50 * x) / half).toFixed(2)), ty: Number((50 - (50 * y) / half).toFixed(2)) }
    }

    return out
}
