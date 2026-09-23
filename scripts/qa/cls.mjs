// Which nodes shift while a page loads on a slow phone: every layout-shift entry with its source
// nodes and their rectangles, so a CLS number has a cause. The consent cookie is set, because the
// sheet on top would otherwise be the whole story. Usage: node scripts/qa/cls.mjs [--url /felgen]
import { chromium, devices } from '@playwright/test'
import { BASE, parseArgs } from './lib.mjs'

const args = parseArgs()
const url = BASE + (args.url ?? '/')

const browser = await chromium.launch()
const context = await browser.newContext({ ...devices['Pixel 5'], viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75 })

await context.addCookies([
    {
        name: 'rmf_consent',
        value: encodeURIComponent(JSON.stringify({ necessary: true, statistics: false, decidedAt: '2026-01-01T00:00:00.000Z' })),
        url: BASE,
    },
])

const page = await context.newPage()
const cdp = await context.newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
})

await page.addInitScript(() => {
    window.__shifts = []

    const describe = (n) => {
        if (!n || n.nodeType !== 1) {
            return String(n)
        }

        const cls = typeof n.className === 'string' ? n.className.trim().split(/\s+/).slice(0, 3).join('.') : ''

        return `${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}${cls ? '.' + cls : ''}`
    }

    new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
            if (e.hadRecentInput) {
                continue
            }

            window.__shifts.push({
                t: Math.round(e.startTime),
                value: +e.value.toFixed(4),
                sources: (e.sources ?? []).map((s) => ({
                    node: describe(s.node),
                    from: [s.previousRect.x, s.previousRect.y, s.previousRect.width, s.previousRect.height].map(Math.round),
                    to: [s.currentRect.x, s.currentRect.y, s.currentRect.width, s.currentRect.height].map(Math.round),
                })),
            })
        }
    }).observe({ type: 'layout-shift', buffered: true })
})

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)

const shifts = await page.evaluate(() => window.__shifts)
const total = shifts.reduce((sum, s) => sum + s.value, 0)

console.log(`${url}: CLS ${total.toFixed(4)} over ${shifts.length} shifts`)

for (const s of shifts) {
    console.log(`@${s.t} ms  ${s.value}`)

    for (const src of s.sources) {
        console.log(`    ${src.node}  ${src.from.join(',')} -> ${src.to.join(',')}`)
    }
}

await browser.close()
process.exit(total > 0.02 ? 1 : 0)
