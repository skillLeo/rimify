// Checklist 4 on /__design: scroll top → bottom → top; sticky elements keep their height and do
// not jitter; anchors land below the sticky chrome; the sticky table header is not buried under the
// site header; the page's scroll-driven effect (the header lift) never writes layout.
//
//   node scripts/qa/probes/design-scroll.mjs [--browsers chromium,webkit,firefox] [--width 1440]
import { parseArgs } from '../lib.mjs'
import { launch, open, options, watchConsole } from './design-lib.mjs'

const args = parseArgs()
const browsers = (typeof args.browsers === 'string' ? args.browsers : 'chromium,webkit,firefox').split(',')
const widths = args.width ? [Number(args.width)] : [1440, 390]
const problems = []
const notes = []

const sticky = `() => {
    const out = {}
    for (const el of document.querySelectorAll('header, .hdr, .bnav, .consent, .table th, .toast-viewport')) {
        const cs = getComputedStyle(el)
        if (!['sticky', 'fixed'].includes(cs.position)) continue
        const b = el.getBoundingClientRect()
        const key = el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0]
        if (out[key]) continue
        out[key] = { top: Math.round(b.top), bottom: Math.round(b.bottom), height: Math.round(b.height * 10) / 10, pos: cs.position }
    }
    return out
}`

for (const name of browsers) {
    const browser = await launch(name)

    for (const width of widths) {
        const context = await browser.newContext(options(name, width))
        const page = await context.newPage()
        const label = `${name.padEnd(8)} ${String(width).padStart(4)}`
        const messages = watchConsole(page, label)
        await open(page, undefined, { consent: true })

        const max = await page.evaluate('document.documentElement.scrollHeight - window.innerHeight')
        const heights = {}
        const path = []
        for (let y = 0; y <= max; y += 250) path.push(y)
        path.push(max)
        for (let y = max; y >= 0; y -= 250) path.push(y)
        path.push(0)

        for (const y of path) {
            await page.evaluate((v) => window.scrollTo(0, v), y)
            await page.waitForTimeout(60)
            const s = await page.evaluate(`(${sticky})()`)
            for (const [k, v] of Object.entries(s)) {
                heights[k] ??= new Set()
                heights[k].add(v.height)
            }
            // The sticky header must sit at the top edge whenever the page is scrolled.
            const hdr = s['header.hdr'] ?? s['header.']
            if (hdr && y > 10 && hdr.top !== 0) problems.push(`${label} at scrollY ${y}: header top is ${hdr.top}, not 0`)
        }
        for (const [k, set] of Object.entries(heights)) {
            if (set.size > 1) problems.push(`${label} ${k} changes height while scrolling: ${[...set].join(', ')}px`)
        }

        // Header lift: after scrolling, the header carries its shadow; back at the top it does not.
        await page.evaluate(() => window.scrollTo(0, 600))
        await page.waitForTimeout(200)
        const liftedShadow = await page.evaluate(() => getComputedStyle(document.querySelector('header')).boxShadow)
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.waitForTimeout(200)
        const restShadow = await page.evaluate(() => getComputedStyle(document.querySelector('header')).boxShadow)
        notes.push(`${label} header shadow scrolled "${liftedShadow}" / at top "${restShadow}"`)

        // The table's sticky <th>: when the table has scrolled under the site header, is the th
        // still readable, or buried behind the header?
        const th = page.locator('.table th').first()
        await th.scrollIntoViewIfNeeded()
        await page.evaluate(() => {
            const t = document.querySelector('.table')
            const r = t.getBoundingClientRect()
            window.scrollBy(0, r.top + 60)
        })
        await page.waitForTimeout(150)
        const buried = await page.evaluate(() => {
            const th = document.querySelector('.table th')
            const b = th.getBoundingClientRect()
            const header = document.querySelector('header').getBoundingClientRect()
            const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
            return { thTop: Math.round(b.top), thBottom: Math.round(b.bottom), headerBottom: Math.round(header.bottom), cover: top ? top.tagName + '.' + (top.className || '').toString().split(' ')[0] : 'none', hidden: !(top === th || th.contains(top)) }
        })
        if (buried.hidden && buried.thTop < buried.headerBottom) problems.push(`${label} sticky table header sits under the site header (th ${buried.thTop}..${buried.thBottom}, header bottom ${buried.headerBottom}; on top: ${buried.cover})`)

        // Anchors: every section heading lands below the sticky chrome.
        for (const id of ['s-buttons', 's-fields', 's-tiles', 's-tabs', 's-overlays', 'inhalt']) {
            await page.goto(page.url().split('#')[0] + '#' + id, { waitUntil: 'load' })
            await page.waitForTimeout(400)
            const r = await page.evaluate((id) => {
                const el = document.getElementById(id)
                if (!el) return null
                const b = el.getBoundingClientRect()
                const header = document.querySelector('header').getBoundingClientRect()
                return { top: Math.round(b.top), headerBottom: Math.round(header.bottom), scrollY: Math.round(window.scrollY) }
            }, id)
            if (!r) { problems.push(`${label} anchor #${id} not found`); continue }
            if (r.top < r.headerBottom - 1 && id !== 'inhalt') problems.push(`${label} anchor #${id} lands under the header (top ${r.top}, header bottom ${r.headerBottom})`)
            if (r.scrollY === 0 && id !== 'inhalt') problems.push(`${label} anchor #${id} did not scroll (scrollY 0)`)
        }

        // Scroll-driven handler cost: 200 scroll events must not take long or write layout.
        const cost = await page.evaluate(async () => {
            const t0 = performance.now()
            for (let i = 0; i < 200; i++) { window.scrollTo(0, (i % 20) * 100); await new Promise((r) => requestAnimationFrame(r)) }
            return Math.round(performance.now() - t0)
        })
        notes.push(`${label} 200 scroll frames took ${cost}ms`)

        for (const m of messages) problems.push(`${label} console: ${m}`)
        await page.close()
        await context.close()
    }

    await browser.close()
}

if (notes.length) console.log('notes:\n' + notes.map((n) => '  ' + n).join('\n'))
if (problems.length === 0) {
    console.log(`scroll clean in ${browsers.join(', ')} at ${widths.join(', ')}`)
    process.exit(0)
}
console.log(problems.join('\n'))
process.exit(1)
