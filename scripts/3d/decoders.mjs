// Copy the glTF decoders three.js ships into public/3d/, same-origin, so no model or texture ever
// pulls code from a CDN (the CSP is `default-src 'self'`).
//
//   public/3d/draco/  — draco_decoder.js, draco_decoder.wasm, draco_wasm_wrapper.js
//   public/3d/basis/  — basis_transcoder.js, basis_transcoder.wasm (KTX2)
//
// Note for the viewer: three's DRACOLoader and KTX2Loader run their decoders in Workers created
// from a blob: URL, which `worker-src 'self'` refuses. The parametric wheel therefore ships with
// EXT_meshopt_compression (decoded on the main thread by three's bundled MeshoptDecoder, whose
// WebAssembly is covered by `'wasm-unsafe-eval'`). The files copied here serve a future licensed
// GLB once the CSP grants `worker-src blob:` — until then they are present but unused.
import { copyFileSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const libs = join(root, 'node_modules/three/examples/jsm/libs')

const files = [
    ['draco/gltf/draco_decoder.js', 'draco/draco_decoder.js'],
    ['draco/gltf/draco_decoder.wasm', 'draco/draco_decoder.wasm'],
    ['draco/gltf/draco_wasm_wrapper.js', 'draco/draco_wasm_wrapper.js'],
    ['basis/basis_transcoder.js', 'basis/basis_transcoder.js'],
    ['basis/basis_transcoder.wasm', 'basis/basis_transcoder.wasm'],
]

let total = 0
for (const [from, to] of files) {
    const dest = join(root, 'public/3d', to)
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(join(libs, from), dest)
    const bytes = statSync(dest).size
    total += bytes
    console.log(`public/3d/${to}  ${(bytes / 1024).toFixed(0)} KB`)
}
console.log(`decoders: ${files.length} files, ${(total / 1024).toFixed(0)} KB`)
