// The shell with a vehicle chosen: the chip with the car's name and its menu, the vehicle bar in
// both modes, the phone's blue dot and vehicle sheet, the toast after an add to basket, and the
// basket count. The vehicle is chosen through the guided drill (Marke → Modell → Variante), which
// posts /fahrzeug and lands on the listing. Written to docs/reviews/shots/shell/.
//
//   node scripts/qa/probes/shell-vehicle-states.mjs [--out docs/reviews/shots/shell]
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { BASE, newContext, parseArgs } from '../lib.mjs'

const args = parseArgs()
const out = args.out ?? 'docs/reviews/shots/shell'
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()

async function settle(page, ms = 400) {
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(ms)
}

/**
 * HSN 0005 / TSN 582 through the selector. The POST, its redirect and the SSR of the listing take
 * about three seconds on this machine, so the probe waits for the URL rather than for the network
 * to go quiet (which it already is the instant after the click).
 */
async function chooseVehicle(context) {
    const page = await context.newPage()
    await page.goto(BASE + '/felgen-suchen', { waitUntil: 'networkidle' })
    await page.fill('input[id^=hsn]', '0005')
    await page.fill('input[id^=tsn]', '582')
    await page.getByRole('button', { name: 'Fahrzeug wählen' }).first().click()
    const ok = await page.waitForURL('**/felgen', { timeout: 20000 }).then(() => true, () => false)
    console.log(`  vehicle chosen: ${ok} (${page.url()})`)
    await page.close()

    return ok
}

function measure() {
    const r = (sel) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const b = el.getBoundingClientRect()
        return { w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10, x: Math.round(b.left * 10) / 10, y: Math.round(b.top * 10) / 10 }
    }
    return {
        header: r('.site-header'),
        bar: r('.sh__bar'),
        vbar: r('.vbar'),
        vchip: r('.sh__vchip'),
        vchipText: document.querySelector('.sh__vchip')?.textContent.trim() ?? null,
        vbarText: document.querySelector('.vbar')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
        cartLabel: document.querySelector('.sh__cart')?.getAttribute('aria-label') ?? null,
        badge: r('.sh__badge') ?? r('.bnav__badge'),
    }
}

async function addToBasket(page) {
    await page.goto(BASE + '/felgen', { waitUntil: 'networkidle' })
    const href = await page.locator('a[href^="/felgen/"]').first().getAttribute('href')
    await page.goto(BASE + href, { waitUntil: 'networkidle' })
    await settle(page)
    const add = page.locator('.pdp__add')

    if (await add.isDisabled()) {
        const size = page.locator('.pdp button[aria-pressed]:not(:disabled)').first()
        if (await size.count()) await size.click()
        await page.waitForTimeout(300)
    }

    if (await add.isDisabled()) {
        console.log('  basket: the add button stays disabled on', href)
        return false
    }

    await add.click()
    const shown = await page.locator('.toast').waitFor({ state: 'visible', timeout: 15000 }).then(() => true, () => false)
    console.log(`  basket: toast ${shown ? 'shown' : 'not shown within 15 s'}`)
    await page.waitForTimeout(400)
    return shown
}

/* ── Desktop 1440 ─────────────────────────────────────────────────────────────── */
{
    const context = await newContext(browser, 1440, 900, false)
    console.log('1440')
    if (await chooseVehicle(context)) {
        const page = await context.newPage()

        // The listing: WHITE_BOX, the bar names the car.
        await page.goto(BASE + '/felgen', { waitUntil: 'networkidle' })
        await settle(page)
        await page.screenshot({ path: `${out}/1440-vehicle-felgen-fold.png`, animations: 'disabled' })
        await page.screenshot({ path: `${out}/1440-vehicle-felgen-header.png`, clip: { x: 0, y: 0, width: 1440, height: 150 }, animations: 'disabled' })
        console.log('  /felgen', JSON.stringify(await page.evaluate(measure)))

        // Scrolled, with the bar: the hairline sits under the bar.
        await page.evaluate(() => window.scrollTo(0, 600))
        await page.waitForTimeout(400)
        await page.screenshot({ path: `${out}/1440-vehicle-felgen-scrolled.png`, clip: { x: 0, y: 0, width: 1440, height: 130 }, animations: 'disabled' })
        console.log('  /felgen scrolled', JSON.stringify(await page.evaluate(measure)))
        await page.evaluate(() => window.scrollTo(0, 0))

        // The chip's menu.
        await page.locator('.sh__vchip').click()
        await page.waitForTimeout(600)
        await page.screenshot({ path: `${out}/1440-vehicle-menu.png`, animations: 'disabled' })
        await page.screenshot({ path: `${out}/1440-vehicle-menu-clip.png`, clip: { x: 860, y: 0, width: 580, height: 380 }, animations: 'disabled' })
        await page.keyboard.press('ArrowDown')
        await page.waitForTimeout(200)
        await page.screenshot({ path: `${out}/1440-vehicle-menu-keyboard.png`, clip: { x: 860, y: 0, width: 580, height: 380 }, animations: 'disabled' })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(400)

        // Chip hover and focus.
        await page.locator('.sh__vchip').hover()
        await page.waitForTimeout(250)
        await page.screenshot({ path: `${out}/1440-vehicle-chip-hover.png`, clip: { x: 900, y: 20, width: 540, height: 90 }, animations: 'disabled' })
        await page.mouse.move(0, 500)
        await page.locator('.sh__vchip').focus()
        await page.keyboard.press('Shift+Tab')
        await page.keyboard.press('Tab')
        await page.waitForTimeout(200)
        await page.screenshot({ path: `${out}/1440-vehicle-chip-focus.png`, clip: { x: 900, y: 20, width: 540, height: 90 }, animations: 'disabled' })

        // The palette with a vehicle.
        await page.keyboard.press('Control+k')
        await page.waitForTimeout(600)
        await page.screenshot({ path: `${out}/1440-vehicle-palette.png`, animations: 'disabled' })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(400)

        // Other routes: home and Kontakt (BLUE_BAR), Kasse (suppressed).
        for (const route of ['/', '/kontakt', '/kasse', '/warenkorb']) {
            await page.goto(BASE + route, { waitUntil: 'networkidle' })
            await settle(page)
            const name = route === '/' ? 'home' : route.slice(1)
            await page.screenshot({ path: `${out}/1440-vehicle-${name}-header.png`, clip: { x: 0, y: 0, width: 1440, height: 150 }, animations: 'disabled' })
            console.log(`  ${route}`, JSON.stringify(await page.evaluate(measure)))
        }

        // Vehicle bar link states.
        await page.goto(BASE + '/', { waitUntil: 'networkidle' })
        await settle(page)
        const change = page.locator('.vbar__link').first()
        if (await change.count()) {
            await change.hover()
            await page.waitForTimeout(250)
            await page.screenshot({ path: `${out}/1440-vehicle-bar-hover.png`, clip: { x: 0, y: 90, width: 1440, height: 60 }, animations: 'disabled' })
            await page.mouse.move(0, 600)
            await change.focus()
            await page.keyboard.press('Shift+Tab')
            await page.keyboard.press('Tab')
            await page.waitForTimeout(200)
            await page.screenshot({ path: `${out}/1440-vehicle-bar-focus.png`, clip: { x: 0, y: 90, width: 1440, height: 60 }, animations: 'disabled' })
        }

        // Toast and basket count.
        if (await addToBasket(page)) {
            await page.screenshot({ path: `${out}/1440-toast.png`, animations: 'disabled' })
            await page.screenshot({ path: `${out}/1440-toast-clip.png`, clip: { x: 0, y: 740, width: 520, height: 160 }, animations: 'disabled' })
            await page.screenshot({ path: `${out}/1440-cart-badge.png`, clip: { x: 1100, y: 0, width: 340, height: 150 }, animations: 'disabled' })
            console.log('  after add', JSON.stringify(await page.evaluate(measure)))
            const toast = await page.locator('.toast').evaluate((el) => {
                const cs = getComputedStyle(el)
                const b = el.getBoundingClientRect()
                return { text: el.textContent.trim(), x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), bg: cs.backgroundColor, shadow: cs.boxShadow, radius: cs.borderRadius }
            }).catch(() => null)
            console.log('  toast', JSON.stringify(toast))
        }

        await page.close()
    }
    await context.close()
}

/* ── Tablet 768 (desktop document, phone layout) ──────────────────────────────── */
{
    const context = await newContext(browser, 768, 1024, false)
    console.log('768')
    if (await chooseVehicle(context)) {
        const page = await context.newPage()
        await page.goto(BASE + '/felgen', { waitUntil: 'networkidle' })
        await settle(page)
        await page.screenshot({ path: `${out}/768-vehicle-felgen-header.png`, clip: { x: 0, y: 0, width: 768, height: 120 }, animations: 'disabled' })
        console.log('  /felgen', JSON.stringify(await page.evaluate(measure)))
        await page.locator('.sh__vicon').click()
        await page.waitForTimeout(600)
        await page.screenshot({ path: `${out}/768-vehicle-sheet.png`, animations: 'disabled' })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(400)
        if (await addToBasket(page)) {
            await page.screenshot({ path: `${out}/768-toast.png`, animations: 'disabled' })
            const toast = await page.locator('.toast').evaluate((el) => {
                const b = el.getBoundingClientRect()
                const nav = document.querySelector('.bnav')?.getBoundingClientRect()
                return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), bottom: Math.round(b.bottom), navTop: nav ? Math.round(nav.top) : null }
            }).catch(() => null)
            console.log('  toast', JSON.stringify(toast))
        }
        await page.close()
    }
    await context.close()
}

/* ── Phone 390 ────────────────────────────────────────────────────────────────── */
{
    const context = await newContext(browser, 390, 844, true)
    console.log('390')
    if (await chooseVehicle(context)) {
        const page = await context.newPage()
        await page.goto(BASE + '/felgen', { waitUntil: 'networkidle' })
        await settle(page)
        await page.screenshot({ path: `${out}/390-vehicle-felgen-fold.png`, animations: 'disabled' })
        await page.screenshot({ path: `${out}/390-vehicle-felgen-header.png`, clip: { x: 0, y: 0, width: 390, height: 110 }, animations: 'disabled' })
        console.log('  /felgen', JSON.stringify(await page.evaluate(measure)))
        await page.screenshot({ path: `${out}/390-vehicle-icon.png`, clip: { x: 300, y: 0, width: 90, height: 56 }, animations: 'disabled' })

        await page.locator('.sh__vicon').tap()
        await page.waitForTimeout(700)
        await page.screenshot({ path: `${out}/390-vehicle-sheet.png`, animations: 'disabled' })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(400)

        await page.goto(BASE + '/', { waitUntil: 'networkidle' })
        await settle(page)
        await page.screenshot({ path: `${out}/390-vehicle-home-header.png`, clip: { x: 0, y: 0, width: 390, height: 110 }, animations: 'disabled' })
        console.log('  /', JSON.stringify(await page.evaluate(measure)))

        await page.keyboard.press('Control+k')
        await page.waitForTimeout(600)
        await page.screenshot({ path: `${out}/390-vehicle-palette.png`, animations: 'disabled' })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(400)

        if (await addToBasket(page)) {
            await page.screenshot({ path: `${out}/390-toast.png`, animations: 'disabled' })
            await page.goto(BASE + '/', { waitUntil: 'networkidle' })
            await settle(page)
            await page.screenshot({ path: `${out}/390-cart-badge.png`, clip: { x: 0, y: 844 - 70, width: 390, height: 70 }, animations: 'disabled' })
            console.log('  after add', JSON.stringify(await page.evaluate(measure)))
        }
        await page.close()
    }
    await context.close()
}

await browser.close()
console.log(`vehicle states in ${out}`)
