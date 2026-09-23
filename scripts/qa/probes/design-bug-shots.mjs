// Evidence for docs/qa/BUGS.md: one legible clip per finding, in the browser and at the width the
// bug shows. Written to docs/qa/shots/design-system/bug-<id>-*.png.
//
//   node scripts/qa/probes/design-bug-shots.mjs
import { SHOTS, acceptConsent, launch, open, options } from './design-lib.mjs'

async function clip(page, locator, path, pad = 16) {
    await locator.first().scrollIntoViewIfNeeded()
    await page.waitForTimeout(200)
    const b = await locator.first().boundingBox()
    if (!b) return console.log(`no box for ${path}`)
    const vw = (await page.viewportSize()).width
    await page.screenshot({ path, clip: { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: Math.min(vw, b.width + 2 * pad), height: b.height + 2 * pad }, animations: 'disabled' })
    console.log(path)
}

const chromium = await launch('chromium')

// DS-01 · callout frame collapsed, at 1440 and 390.
for (const width of [1440, 390]) {
    const context = await chromium.newContext(options('chromium', width))
    const page = await context.newPage()
    await open(page, undefined, { consent: true })
    await clip(page, page.locator('section[aria-labelledby=s-callout]'), `${SHOTS}/bug-ds-01-callout-${width}.png`, 8)
    await page.close()
    await context.close()
}

// DS-02 · table beyond the viewport at 390; DS-03 · tyre label at 320; DS-04 · buttons at 320.
{
    const context = await chromium.newContext(options('chromium', 390))
    const page = await context.newPage()
    await open(page, undefined, { consent: true })
    await clip(page, page.locator('section[aria-labelledby=s-table]'), `${SHOTS}/bug-ds-02-table-390.png`, 0)
    await page.close()
    await context.close()
}
{
    const context = await chromium.newContext(options('chromium', 320))
    const page = await context.newPage()
    await open(page, undefined, { consent: true })
    await clip(page, page.locator('section[aria-labelledby=s-tyre]'), `${SHOTS}/bug-ds-03-tyre-320.png`, 0)
    await clip(page, page.locator('section[aria-labelledby=s-buttons]'), `${SHOTS}/bug-ds-04-buttons-320.png`, 0)
    await clip(page, page.locator('section[aria-labelledby=s-tiles] .tile-grid').first(), `${SHOTS}/bug-ds-05-tiles-320.png`, 0)
    await page.close()
    await context.close()
}

// DS-05 · badge × compare at 390 (always visible on touch) and at 1024 on hover.
{
    const context = await chromium.newContext(options('chromium', 390))
    const page = await context.newPage()
    await open(page, undefined, { consent: true })
    await clip(page, page.locator('.tile').filter({ has: page.locator('.tile__badge') }).first(), `${SHOTS}/bug-ds-05-tile-390.png`, 4)
    await page.close()
    await context.close()
}
{
    const context = await chromium.newContext(options('chromium', 1024))
    const page = await context.newPage()
    await open(page, undefined, { consent: true })
    const tile = page.locator('.tile').filter({ has: page.locator('.tile__badge') }).first()
    await tile.scrollIntoViewIfNeeded()
    await tile.hover()
    await page.waitForTimeout(300)
    await clip(page, tile, `${SHOTS}/bug-ds-05-tile-1024-hover.png`, 4)
    await page.close()
    await context.close()
}

// DS-06 · the "Neu" tab and its hit area at 390.
{
    const context = await chromium.newContext(options('chromium', 390))
    const page = await context.newPage()
    await open(page, undefined, { consent: true })
    await clip(page, page.locator('.tabs__list'), `${SHOTS}/bug-ds-06-tabs-390.png`, 8)
    await page.close()
    await context.close()
}

// DS-07 · focus ring on the dark band at 1440.
{
    const context = await chromium.newContext(options('chromium', 1440))
    const page = await context.newPage()
    await open(page, undefined, { consent: true })
    const btn = page.locator('.btn--light').first()
    await btn.scrollIntoViewIfNeeded()
    await btn.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await page.waitForTimeout(150)
    await clip(page, page.locator('.specimen__dark'), `${SHOTS}/bug-ds-07-dark-focus-1440.png`, 8)
    await page.close()
    await context.close()
}

// DS-09 · sticky table header under the site header at 1440.
{
    const context = await chromium.newContext(options('chromium', 1440))
    const page = await context.newPage()
    await open(page, undefined, { consent: true })
    await page.locator('.table').scrollIntoViewIfNeeded()
    await page.evaluate(() => { const r = document.querySelector('.table').getBoundingClientRect(); window.scrollBy(0, r.top + 60) })
    await page.waitForTimeout(200)
    await page.screenshot({ path: `${SHOTS}/bug-ds-09-table-sticky-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 260 }, animations: 'disabled' })
    console.log(`${SHOTS}/bug-ds-09-table-sticky-1440.png`)
    await page.close()
    await context.close()
}

await chromium.close()

// DS-08 · WebKit: rotate a phone, the swatches keep their landscape columns.
const webkit = await launch('webkit')
{
    const context = await webkit.newContext(options('webkit', 390))
    const page = await context.newPage()
    await open(page, undefined, { consent: true })
    await page.setViewportSize({ width: 844, height: 390 })
    await page.waitForTimeout(300)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(300)
    await clip(page, page.locator('.swatches'), `${SHOTS}/bug-ds-08-webkit-rotate-390.png`, 8)
    await page.close()
    await context.close()
}
await webkit.close()
