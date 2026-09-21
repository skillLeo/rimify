// Screenshots for a design review: the first screen and the full page at 390, 768 and 1440, and
// the hover and focus states of the interactive elements a reviewer names.
//
//   node scripts/qa/review-shots.mjs --route / --out docs/reviews/shots/h2
//   node scripts/qa/review-shots.mjs --route / --states ".btn--primary,.hdr__link" --vehicle
//
// `--vehicle` chooses a car first (HSN 0005 / TSN 582), so the vehicle-aware states are captured.
// `--width 1440` limits the run to one viewport.
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { BASE, VIEWPORTS, chooseVehicle, newContext, open, parseArgs, slug } from './lib.mjs'

const args = parseArgs()
const route = args.route ?? '/'
const out = args.out ?? `docs/reviews/shots/${slug(route)}`
const states = typeof args.states === 'string' ? args.states.split(',').map((s) => s.trim()) : []
const widths = args.width ? [Number(args.width)] : Object.keys(VIEWPORTS).map(Number)

mkdirSync(out, { recursive: true })
const browser = await chromium.launch()

for (const width of widths) {
    const { height, mobile } = VIEWPORTS[width]
    // `--consent` keeps the cookie sheet in the shots; by default the choice is already made.
    const context = await newContext(browser, width, height, mobile, { consent: !args.consent })

    if (args.vehicle) {
        await chooseVehicle(context)
    }

    const page = await context.newPage()
    await open(page, route)
    await page.waitForTimeout(300)

    const stem = `${out}/${width}${args.vehicle ? '-vehicle' : ''}`
    await page.screenshot({ path: `${stem}-fold.png`, animations: 'disabled' })
    await page.screenshot({ path: `${stem}-full.png`, fullPage: true, animations: 'disabled' })

    // `--sections`: one legible shot per section, at full resolution, for reading the details a
    // full-page shot is too small to show.
    if (args.sections) {
        const sections = page.locator('main section')
        const count = await sections.count()

        // The sticky header would sit over the top of every section shot; it is hidden for these.
        // Through the CSSOM rather than a <style> element, which the nonce-based CSP refuses.
        await page.evaluate(() => {
            for (const el of document.querySelectorAll('header')) {
                el.style.setProperty('visibility', 'hidden', 'important')
            }
        })

        for (let i = 0; i < count; i++) {
            const section = sections.nth(i)
            const id = (await section.getAttribute('id')) ?? (await section.getAttribute('aria-labelledby')) ?? `section-${i + 1}`
            await section.scrollIntoViewIfNeeded()
            await page.waitForTimeout(150)
            await section.screenshot({ path: `${stem}-${id.replace(/[^a-z0-9-]/gi, '-')}.png`, animations: 'disabled' }).catch(() => {})
        }
    }

    for (const selector of states) {
        const target = page.locator(selector).first()

        if ((await target.count()) === 0 || !(await target.isVisible())) {
            console.log(`${width}: ${selector} not on this width`)
            continue
        }

        // One state that cannot be captured must not end the run; it is reported instead.
        try {
            await target.scrollIntoViewIfNeeded({ timeout: 5000 })
            const box = await target.boundingBox()

            if (!box) {
                continue
            }

            const clip = {
                x: Math.max(0, box.x - 24),
                y: Math.max(0, box.y - 24),
                width: Math.min(width - Math.max(0, box.x - 24), box.width + 48),
                height: box.height + 48,
            }
            const name = selector.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')

            if (!mobile) {
                await target.hover({ timeout: 5000 })
                await page.waitForTimeout(250)
                await page.screenshot({ path: `${stem}-${name}-hover.png`, clip, animations: 'disabled' })
                await page.mouse.move(0, 0)
                await page.keyboard.press('Escape')
            }

            await target.focus({ timeout: 5000 })
            // :focus-visible needs a keyboard interaction to show; a Tab away and back is the cheapest.
            await page.keyboard.press('Shift+Tab')
            await page.keyboard.press('Tab')
            await page.waitForTimeout(150)
            await page.screenshot({ path: `${stem}-${name}-focus.png`, clip, animations: 'disabled' })
        } catch (error) {
            console.log(`${width}: ${selector} state not captured — ${String(error.message).split('\n')[0]}`)
        }
    }

    await page.close()
    await context.close()
}

await browser.close()
console.log(`shots in ${out}`)
