// Live resize with a proper settle time per step, plus a phone rotation (portrait → landscape →
// portrait) in a touch context. Reports every width at which the document overflows sideways, so a
// stale first step is distinguishable from a real reflow failure.
//
//   node scripts/qa/probes/design-resize.mjs [--browsers webkit] [--settle 150]
import { parseArgs } from '../lib.mjs'
import { launch, open, options } from './design-lib.mjs'

const args = parseArgs()
const browsers = (typeof args.browsers === 'string' ? args.browsers : 'chromium,webkit,firefox').split(',')
const settle = Number(args.settle ?? 150)
const problems = []

const measure = `() => {
    const vw = document.documentElement.clientWidth
    const over = document.documentElement.scrollWidth - vw
    const swatches = document.querySelector('.swatches').getBoundingClientRect().width
    const cols = getComputedStyle(document.querySelector('.swatches')).gridTemplateColumns.split(' ').length
    return { vw, over, swatches: Math.round(swatches), cols }
}`

for (const name of browsers) {
    const browser = await launch(name)

    // Desktop document, 1920 → 320 → 1920.
    const context = await browser.newContext(options(name, 1920))
    const page = await context.newPage()
    await open(page)
    const seq = []
    for (let w = 1920; w >= 320; w -= 40) seq.push(w)
    for (let w = 360; w <= 1920; w += 40) seq.push(w)
    for (const w of seq) {
        await page.setViewportSize({ width: w, height: 900 })
        await page.waitForTimeout(settle)
        const m = await page.evaluate(`(${measure})()`)
        if (m.over > 1) problems.push(`${name.padEnd(8)} desktop resize ${w}: overflow ${m.over}px (swatches ${m.swatches}px in ${m.cols} cols, vw ${m.vw})`)
    }
    await page.close()
    await context.close()

    // Phone rotation in a touch context.
    for (const [w, h] of [[390, 844], [430, 932], [320, 568]]) {
        const ctx = await browser.newContext(options(name, w))
        const p = await ctx.newPage()
        await open(p)
        for (const [vw, vh] of [[h, w], [w, h], [h, w], [w, h]]) {
            await p.setViewportSize({ width: vw, height: vh })
            await p.waitForTimeout(settle)
            const m = await p.evaluate(`(${measure})()`)
            // The phone document clips <main>, so document overflow stays 0; the grid's own width tells.
            if (m.over > 1 || m.swatches > m.vw - 1) problems.push(`${name.padEnd(8)} phone ${w} rotate to ${vw}×${vh}: overflow ${m.over}px, swatches ${m.swatches}px in ${m.cols} cols for a ${m.vw}px viewport`)
        }
        await p.close()
        await ctx.close()
    }

    await browser.close()
}

if (problems.length === 0) {
    console.log(`live resize clean in ${browsers.join(', ')} (settle ${settle}ms)`)
    process.exit(0)
}
console.log(problems.join('\n'))
process.exit(1)
