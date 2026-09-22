// Build the harness, serve it with the project's public/3d, drive it in headless Chromium and
// write review shots + a JSON summary (ready time, canvas sizes, idle rAF count, requests).
//
//   node scripts/3d/harness/run.mjs [--browser chromium|firefox|webkit]
import { execSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, firefox, webkit } from '@playwright/test'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const project = resolve(here, '../../..')
const dist = join(tmpdir(), 'rimify-3d-harness')
const SHOTS = join(project, 'docs/reviews/shots/hero-3d')
mkdirSync(SHOTS, { recursive: true })

const browserName = process.argv[process.argv.indexOf('--browser') + 1] ?? 'chromium'
const engines = { chromium, firefox, webkit }
const engine = engines[browserName]
if (!engine) throw new Error(`unknown browser ${browserName}`)
// Chromium headless needs SwiftShader to have any WebGL; Firefox and WebKit use ANGLE/D3D as shipped.
const launchArgs = browserName === 'chromium' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : []
const shot = (name) => join(SHOTS, browserName === 'chromium' ? `${name}.png` : `${name}-${browserName}.png`)

execSync(`npx vite build --config "${join(here, 'vite.config.ts')}"`, { cwd: project, stdio: 'inherit', env: { ...process.env, HARNESS_OUT: dist } })

const MIME = { '.js': 'text/javascript', '.html': 'text/html; charset=utf-8', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.css': 'text/css' }

const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    let file
    if (url.pathname === '/') file = join(dist, 'index.html')
    else if (url.pathname.startsWith('/dist/')) file = join(dist, url.pathname.slice(6))
    else if (url.pathname.startsWith('/3d/')) file = join(project, 'public', url.pathname.slice(1))
    else file = join(project, url.pathname.slice(1))
    file = resolve(file)
    if (!existsSync(file) || statSync(file).isDirectory()) {
        res.writeHead(404)
        res.end()

        return
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const port = server.address().port

const browser = await engine.launch({ args: launchArgs })
const page = await browser.newPage({ viewport: { width: 640, height: 1040 }, deviceScaleFactor: 1 })
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text().slice(0, 400)}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()}`))
const requests = []
page.on('request', (r) => requests.push(r.url()))

const t0 = Date.now()
await page.goto(`http://127.0.0.1:${port}/`)
await page.waitForFunction(() => window.__harness?.ready === true && window.__harness?.bandReady === true, null, { timeout: 60_000 })
const readyMs = Date.now() - t0
await page.waitForTimeout(300)
const HERO = { x: 0, y: 0, width: 560, height: 560 }
const BAND = { x: 0, y: 584, width: 416, height: 416 }
const restHero = await page.screenshot({ clip: HERO })
const restBand = await page.screenshot({ clip: BAND })
await page.screenshot({ path: shot('harness-rest') })

// Cursor roll: ease to +8° and back; then count the viewer's own frames while idle (DEV builds only).
await page.evaluate(() => window.__harness.setRoll(8))
await page.waitForTimeout(350)
const rolledHero = await page.screenshot({ clip: HERO })
await page.screenshot({ path: shot('harness-roll-plus8') })
await page.evaluate(() => window.__harness.setRoll(0))
await page.waitForTimeout(350)
const backHero = await page.screenshot({ clip: HERO })
const before = await page.evaluate(() => window.__rimifyViewerRaf ?? 0)
await page.waitForTimeout(3000)
const after = await page.evaluate(() => window.__rimifyViewerRaf ?? 0)

// Band: the scroll roll is set directly.
await page.evaluate(() => window.__harness.setBandRoll(-60))
await page.waitForTimeout(200)
const rolledBand = await page.screenshot({ clip: BAND })
await page.screenshot({ path: shot('harness-band-roll-60') })

/** How many pixels differ between two shots of the same box — proves a re-render happened (or did not). */
async function differing(a, b) {
    const [pa, pb] = await Promise.all([a, b].map((buf) => sharp(buf).raw().toBuffer({ resolveWithObject: true })))
    let n = 0
    for (let i = 0; i < pa.data.length; i += pa.info.channels) {
        if (Math.abs(pa.data[i] - pb.data[i]) > 8 || Math.abs(pa.data[i + 1] - pb.data[i + 1]) > 8 || Math.abs(pa.data[i + 2] - pb.data[i + 2]) > 8) n++
    }

    return Number(((n / (pa.info.width * pa.info.height)) * 100).toFixed(2))
}
const pixels = {
    heroRestVsPlus8Percent: await differing(restHero, rolledHero),
    heroRestVsBackPercent: await differing(restHero, backHero),
    bandRestVsMinus60Percent: await differing(restBand, rolledBand),
}

const canvases = await page.evaluate(() =>
    Array.from(document.querySelectorAll('canvas')).map((c) => ({ width: c.width, height: c.height, clientWidth: c.clientWidth, clientHeight: c.clientHeight })),
)
const summary = {
    browser: browserName,
    readyMs,
    failed: await page.evaluate(() => window.__harness.failed),
    canvases,
    rafWhileIdle3s: after - before,
    rafTotal: after,
    pixels,
    requests: requests.filter((u) => /\.(glb|hdr)$/.test(u)).map((u) => u.replace(/^http:\/\/127\.0\.0\.1:\d+/, '')),
    logs,
}
writeFileSync(join(SHOTS, browserName === 'chromium' ? 'harness-summary.json' : `harness-summary-${browserName}.json`), JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify(summary, null, 2))
await browser.close()
server.close()
