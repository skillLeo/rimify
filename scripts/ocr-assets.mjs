// The Fahrzeugschein scan (F5) reads the photo on the customer's device with Tesseract. Nothing of
// that may come from a CDN — the CSP is `default-src 'self'` and the photo must not leave the
// browser — so this copies the worker, the LSTM core builds and the language data into
// public/ocr, once, as a development step (like scripts/cutout.mjs for the hero photograph).
//
//   node scripts/ocr-assets.mjs            # copies the worker and cores, downloads deu + eng
//   node scripts/ocr-assets.mjs --langs deu
//
// The language data is fetched from the tesseract.js-data package on jsDelivr into public/ocr
// and never fetched again while the file exists. `DocumentScan.vue` loads only from /ocr.
import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'ocr')

const args = process.argv.slice(2)
const langsAt = args.indexOf('--langs')
const langs = langsAt >= 0 && args[langsAt + 1] ? args[langsAt + 1].split(',') : ['deu', 'eng']

// The worker runs with `oem: 1` (LSTM only), so only the LSTM builds are needed; the worker picks
// the SIMD variant the device supports (tesseract.js src/worker-script/browser/getCore.js).
const CORES = ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js']
const DATA_BASE = 'https://cdn.jsdelivr.net/npm/@tesseract.js-data'
const DATA_VERSION = '4.0.0_best_int'

mkdirSync(out, { recursive: true })

const workerSrc = require.resolve('tesseract.js/dist/worker.min.js')
const coreDir = dirname(require.resolve('tesseract.js-core/package.json'))

function kb(path) {
    return `${Math.round(statSync(path).size / 1024)} KB`
}

copyFileSync(workerSrc, join(out, 'worker.min.js'))
console.log(`worker.min.js  ${kb(join(out, 'worker.min.js'))}`)

for (const core of CORES) {
    copyFileSync(join(coreDir, core), join(out, core))
    console.log(`${core}  ${kb(join(out, core))}`)
}

for (const lang of langs) {
    const target = join(out, `${lang}.traineddata.gz`)

    if (existsSync(target)) {
        console.log(`${lang}.traineddata.gz  ${kb(target)} (kept)`)
        continue
    }

    const url = `${DATA_BASE}/${lang}/${DATA_VERSION}/${lang}.traineddata.gz`
    const response = await fetch(url)

    if (!response.ok) {
        console.error(`${lang}: ${response.status} from ${url}`)
        process.exitCode = 1
        continue
    }

    writeFileSync(target, Buffer.from(await response.arrayBuffer()))
    console.log(`${lang}.traineddata.gz  ${kb(target)} (downloaded)`)
}
