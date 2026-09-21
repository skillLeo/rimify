// Isolates one finding: WebKit logged a CSP style-src violation during the viewport run. Is it the
// page, or Playwright's own style injection for `animations: 'disabled'` screenshots?
//
//   node scripts/qa/probes/design-csp.mjs
import { launch, open, options, watchConsole } from './design-lib.mjs'

for (const name of ['webkit', 'chromium', 'firefox']) {
    const browser = await launch(name)
    const context = await browser.newContext(options(name, 1440))
    const page = await context.newPage()
    const messages = watchConsole(page, name)
    await open(page)
    await page.mouse.wheel(0, 2000)
    await page.waitForTimeout(500)
    const afterLoad = messages.length
    await page.screenshot({ path: `${process.env.TEMP ?? '.'}/csp-probe-plain.png` })
    await page.waitForTimeout(300)
    const afterPlainShot = messages.length
    await page.screenshot({ path: `${process.env.TEMP ?? '.'}/csp-probe-anim.png`, animations: 'disabled' })
    await page.waitForTimeout(300)
    const afterAnimShot = messages.length
    console.log(`${name.padEnd(8)} load+scroll: ${afterLoad} · plain screenshot: +${afterPlainShot - afterLoad} · animations:disabled screenshot: +${afterAnimShot - afterPlainShot}`)
    for (const m of messages) console.log('   ' + m)
    await browser.close()
}
