// Isolates the 600px jump seen when the Sheet opens after the Dialog and the Drawer were used: the
// customer's sequence is open → wheel on the scrim → Esc, three times over, and the page must not
// move at any point. Logs scrollY after every step.
//
//   node scripts/qa/probes/design-scroll-sequence.mjs [--browsers chromium,webkit,firefox]
import { parseArgs } from '../lib.mjs'
import { launch, open, options } from './design-lib.mjs'

const args = parseArgs()
const browsers = (typeof args.browsers === 'string' ? args.browsers : 'chromium,webkit,firefox').split(',')
let bad = 0

for (const name of browsers) {
    const browser = await launch(name)
    const context = await browser.newContext(options(name, 1440))
    const page = await context.newPage()
    await open(page)
    const y = () => page.evaluate('window.scrollY')
    const log = []
    const step = async (what) => {
        await page.waitForTimeout(400)
        log.push(`${what}=${await y()}`)
    }

    const first = page.getByRole('button', { name: 'Dialog öffnen' })
    await first.scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, -200))
    await step('start')
    const start = await y()

    for (const trigger of ['Dialog öffnen', 'Drawer öffnen', 'Sheet öffnen']) {
        await page.getByRole('button', { name: trigger }).click()
        await step(`${trigger.split(' ')[0]} open`)
        await page.mouse.move(10, 450)
        await page.mouse.wheel(0, 600)
        await step('wheel')
        await page.keyboard.press('Escape')
        await step('esc')
        // What a customer does next: nothing for a moment, then reads on.
        await page.waitForTimeout(800)
        await step('idle')
    }

    const end = await y()
    const flag = end !== start ? '  <-- MOVED' : ''
    if (flag) bad++
    console.log(`${name.padEnd(8)} ${log.join(' · ')}${flag}`)
    await browser.close()
}

process.exit(bad ? 1 : 0)
