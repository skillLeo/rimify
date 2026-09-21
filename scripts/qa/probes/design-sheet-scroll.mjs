// Isolates one finding: does opening the Sheet (or any overlay) move the page's scroll position?
// Opens each overlay from a mid-page scroll position with nothing else in between, and logs scrollY
// before, right after opening, after a wheel on the scrim, and after closing.
//
//   node scripts/qa/probes/design-sheet-scroll.mjs [--browsers chromium,webkit,firefox] [--width 1440]
import { parseArgs } from '../lib.mjs'
import { launch, open, options } from './design-lib.mjs'

const args = parseArgs()
const browsers = (typeof args.browsers === 'string' ? args.browsers : 'chromium,webkit,firefox').split(',')
const widths = args.width ? [Number(args.width)] : [1440, 390]
let bad = 0

for (const name of browsers) {
    const browser = await launch(name)
    for (const width of widths) {
        for (const trigger of ['Dialog öffnen', 'Drawer öffnen', 'Sheet öffnen']) {
            const context = await browser.newContext(options(name, width))
            const page = await context.newPage()
            await open(page)
            const btn = page.getByRole('button', { name: trigger })
            await btn.scrollIntoViewIfNeeded()
            await page.evaluate(() => window.scrollBy(0, -200))
            await page.waitForTimeout(200)
            const y0 = await page.evaluate('window.scrollY')
            const max = await page.evaluate('document.documentElement.scrollHeight - window.innerHeight')
            await btn.click()
            await page.waitForTimeout(500)
            const y1 = await page.evaluate('window.scrollY')
            const body = await page.evaluate('getComputedStyle(document.body).overflow + " / " + document.body.style.paddingRight')
            const h = await page.evaluate('document.documentElement.scrollHeight')
            await page.mouse.move(10, 300)
            await page.mouse.wheel(0, 600)
            await page.waitForTimeout(400)
            const y2 = await page.evaluate('window.scrollY')
            await page.keyboard.press('Escape')
            await page.waitForTimeout(500)
            const y3 = await page.evaluate('window.scrollY')
            const flag = y1 !== y0 || y2 !== y0 || y3 !== y0 ? '  <-- MOVED' : ''
            if (flag) bad++
            console.log(`${name.padEnd(8)} ${String(width).padStart(4)} ${trigger.padEnd(14)} before ${y0} (max ${max}) open ${y1} wheel ${y2} closed ${y3}  body ${body} docH ${h}${flag}`)
            await page.close()
            await context.close()
        }
    }
    await browser.close()
}

process.exit(bad ? 1 : 0)
