// Isolates the focus-trap failure seen at 390: with the Sheet (or Drawer) open, Tab ×12 then
// Shift+Tab ×8, logging the focused element and the open state after every key. Runs the same
// keystrokes under four emulations so a page fault can be told from an emulation quirk:
// Chromium isMobile, Chromium desktop at 390 with the mobile UA, WebKit isMobile, Firefox (no isMobile).
//
//   node scripts/qa/probes/design-trap.mjs [--overlay "Sheet öffnen"]
import { parseArgs } from '../lib.mjs'
import { MOBILE_UA } from '../lib.mjs'
import { launch, open, options } from './design-lib.mjs'

const args = parseArgs()
const overlays = args.overlay ? [args.overlay] : ['Sheet öffnen', 'Drawer öffnen', 'Dialog öffnen']
let bad = 0

const runs = [
    ['chromium', { ...options('chromium', 390) }, 'isMobile+touch'],
    ['chromium', { viewport: { width: 390, height: 844 }, userAgent: MOBILE_UA, locale: 'de-DE' }, 'desktop emulation, mobile UA'],
    ['chromium', { ...options('chromium', 1440) }, 'desktop 1440'],
    ['webkit', { ...options('webkit', 390) }, 'isMobile+touch'],
    ['firefox', { ...options('firefox', 390) }, 'touch'],
]

const where = `() => {
    const el = document.activeElement
    const panel = document.querySelector('.dialog, .drawer, .sheet')
    const inside = !!panel && panel.contains(el)
    const text = el ? (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 14) : '-'
    return (inside ? 'IN ' : 'OUT ') + (el ? el.tagName + ' "' + text + '"' : 'none') + (panel ? '' : ' [closed]')
}`

for (const [name, ctxOptions, mode] of runs) {
    const browser = await launch(name)
    for (const trigger of overlays) {
        const context = await browser.newContext(ctxOptions)
        const page = await context.newPage()
        await open(page, undefined, { consent: true })
        const btn = page.getByRole('button', { name: trigger })
        await btn.evaluate((el) => el.scrollIntoView({ block: 'center' }))
        await btn.click()
        await page.locator('.dialog, .drawer, .sheet').first().waitFor({ state: 'visible' })
        await page.waitForTimeout(400)
        const steps = []
        let escaped = ''
        for (let i = 0; i < 12; i++) {
            await page.keyboard.press('Tab')
            await page.waitForTimeout(80)
            const w = await page.evaluate(`(${where})()`)
            steps.push(`T${i + 1} ${w}`)
            if (w.startsWith('OUT') && !escaped) escaped = `Tab #${i + 1}`
        }
        for (let i = 0; i < 8; i++) {
            await page.keyboard.press('Shift+Tab')
            await page.waitForTimeout(80)
            const w = await page.evaluate(`(${where})()`)
            steps.push(`S${i + 1} ${w}`)
            if (w.startsWith('OUT') && !escaped) escaped = `Shift+Tab #${i + 1}`
        }
        if (escaped) bad++
        console.log(`${name.padEnd(8)} ${mode.padEnd(28)} ${trigger.padEnd(14)} ${escaped ? 'ESCAPED at ' + escaped : 'trapped'}`)
        if (escaped) console.log('    ' + steps.join(' · '))
        await page.close()
        await context.close()
    }
    await browser.close()
}

process.exit(bad ? 1 : 0)
