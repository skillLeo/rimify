// Shell states a plain screenshot does not show: the open Felgen panel, the command palette, the
// shortcut list, the vehicle chip's menu, the phone's vehicle sheet, the search suggestions, the
// scrolled header and the cookie settings dialog. Each is written to docs/reviews/shots/shell/.
//
//   node scripts/qa/probes/shell-states.mjs [--out docs/reviews/shots/shell]
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { BASE, newContext, parseArgs } from '../lib.mjs'

const args = parseArgs()
const out = args.out ?? 'docs/reviews/shots/shell'
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()

async function chooseVehicle(context) {
    const page = await context.newPage()
    await page.goto(BASE + '/felgen-suchen', { waitUntil: 'networkidle' })
    await page.fill('input[id^=hsn]', '0005')
    await page.fill('input[id^=tsn]', '582')
    await page.getByRole('button', { name: 'Fahrzeug wählen' }).first().click()
    await page.waitForLoadState('networkidle')
    await page.close()
}

async function settle(page, ms = 400) {
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(ms)
}

/* ── Desktop 1440 ─────────────────────────────────────────────────────────────── */
{
    const context = await newContext(browser, 1440, 900, false)
    const page = await context.newPage()
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await settle(page)

    // The Felgen panel on hover intent.
    await page.locator('.nav__trigger').first().hover()
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${out}/1440-mega-open.png`, animations: 'disabled' })
    await page.mouse.move(0, 600)
    await page.waitForTimeout(600)

    // The panel opened by keyboard: Enter on the trigger, then Tab into it.
    await page.locator('.nav__trigger').first().focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    await page.keyboard.press('Tab')
    await page.waitForTimeout(200)
    await page.screenshot({ path: `${out}/1440-mega-keyboard.png`, animations: 'disabled' })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Search: typing, results, no result.
    const sbox = page.locator('.sbox__input')
    await sbox.click()
    await page.keyboard.type('BBS')
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${out}/1440-search-results.png`, clip: { x: 560, y: 0, width: 880, height: 520 }, animations: 'disabled' })
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(200)
    await page.screenshot({ path: `${out}/1440-search-active.png`, clip: { x: 560, y: 0, width: 880, height: 520 }, animations: 'disabled' })
    await sbox.fill('')
    await page.keyboard.type('Xyzq')
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${out}/1440-search-empty.png`, clip: { x: 560, y: 0, width: 880, height: 320 }, animations: 'disabled' })
    await sbox.fill('')
    await page.keyboard.type('19')
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${out}/1440-search-size.png`, clip: { x: 560, y: 0, width: 880, height: 520 }, animations: 'disabled' })
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await page.mouse.click(700, 700)
    await page.waitForTimeout(300)

    // The palette.
    await page.keyboard.press('Control+k')
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${out}/1440-palette.png`, animations: 'disabled' })
    await page.keyboard.type('Aud')
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${out}/1440-palette-typed.png`, animations: 'disabled' })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // The shortcut list.
    await page.keyboard.press('Shift+?')
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${out}/1440-shortcuts.png`, animations: 'disabled' })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // The header once scrolled.
    await page.evaluate(() => window.scrollTo(0, 600))
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${out}/1440-header-scrolled.png`, clip: { x: 0, y: 0, width: 1440, height: 120 }, animations: 'disabled' })
    await page.evaluate(() => window.scrollTo(0, 0))

    // The cookie settings dialog from the footer.
    await page.locator('.footer__button', { hasText: 'Cookie-Einstellungen' }).click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${out}/1440-cookie-settings.png`, animations: 'disabled' })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)

    // The footer at full resolution.
    await page.locator('footer').scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await page.locator('footer').screenshot({ path: `${out}/1440-footer.png`, animations: 'disabled' })

    // Measured facts about the header.
    const facts = await page.evaluate(() => {
        const r = (sel) => {
            const el = document.querySelector(sel)
            if (!el) return null
            const b = el.getBoundingClientRect()
            return { w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10, x: Math.round(b.left * 10) / 10, y: Math.round(b.top * 10) / 10 }
        }
        return {
            utility: r('.utility'),
            header: r('.site-header'),
            bar: r('.sh__bar'),
            brand: r('.brand'),
            nav: r('.nav'),
            sbox: r('.sbox'),
            vchip: r('.sh__vchip'),
            cart: r('.sh__cart'),
            footerGrid: r('.footer__grid'),
            container: r('.site-header .container'),
        }
    })
    console.log('1440 facts', JSON.stringify(facts))
    await page.close()

    // With a vehicle: the chip's menu, the vehicle bar on / and /felgen.
    await chooseVehicle(context)
    const vpage = await context.newPage()
    await vpage.goto(BASE + '/', { waitUntil: 'networkidle' })
    await settle(vpage)
    await vpage.screenshot({ path: `${out}/1440-vehicle-home-fold.png`, animations: 'disabled' })
    await vpage.locator('.sh__vchip').click()
    await vpage.waitForTimeout(600)
    await vpage.screenshot({ path: `${out}/1440-vehicle-menu.png`, animations: 'disabled' })
    await vpage.screenshot({ path: `${out}/1440-vehicle-menu-clip.png`, clip: { x: 900, y: 0, width: 540, height: 360 }, animations: 'disabled' })
    await vpage.keyboard.press('Escape')
    await vpage.waitForTimeout(400)
    await vpage.keyboard.press('Control+k')
    await vpage.waitForTimeout(600)
    await vpage.screenshot({ path: `${out}/1440-vehicle-palette.png`, animations: 'disabled' })
    await vpage.keyboard.press('Escape')
    await vpage.waitForTimeout(400)
    const vfacts = await vpage.evaluate(() => {
        const r = (sel) => {
            const el = document.querySelector(sel)
            if (!el) return null
            const b = el.getBoundingClientRect()
            return { w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10, x: Math.round(b.left * 10) / 10, y: Math.round(b.top * 10) / 10 }
        }
        return { header: r('.site-header'), vbar: r('.vbar'), vchip: r('.sh__vchip'), mode: document.body.dataset.headerMode ?? null }
    })
    console.log('1440 vehicle facts', JSON.stringify(vfacts))
    await vpage.goto(BASE + '/felgen', { waitUntil: 'networkidle' })
    await settle(vpage)
    await vpage.screenshot({ path: `${out}/1440-vehicle-felgen-header.png`, clip: { x: 0, y: 0, width: 1440, height: 160 }, animations: 'disabled' })
    await vpage.goto(BASE + '/kontakt', { waitUntil: 'networkidle' })
    await settle(vpage)
    await vpage.screenshot({ path: `${out}/1440-vehicle-kontakt-header.png`, clip: { x: 0, y: 0, width: 1440, height: 160 }, animations: 'disabled' })
    await vpage.close()
    await context.close()
}

/* ── Tablet 768 ───────────────────────────────────────────────────────────────── */
{
    const context = await newContext(browser, 768, 1024, false)
    const page = await context.newPage()
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await settle(page)
    await page.screenshot({ path: `${out}/768-header.png`, clip: { x: 0, y: 0, width: 768, height: 120 }, animations: 'disabled' })
    await page.locator('footer').scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await page.locator('footer').screenshot({ path: `${out}/768-footer.png`, animations: 'disabled' })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.locator('button[aria-label="Suche"]').click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${out}/768-palette.png`, animations: 'disabled' })
    await page.keyboard.press('Escape')
    await page.close()
    await context.close()
}

/* ── Phone 390 ────────────────────────────────────────────────────────────────── */
{
    const context = await newContext(browser, 390, 844, true)
    const page = await context.newPage()
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await settle(page)
    await page.screenshot({ path: `${out}/390-header.png`, clip: { x: 0, y: 0, width: 390, height: 80 }, animations: 'disabled' })
    await page.screenshot({ path: `${out}/390-bottombar.png`, clip: { x: 0, y: 844 - 80, width: 390, height: 80 }, animations: 'disabled' })

    // The palette as a sheet from the search icon.
    await page.locator('button[aria-label="Suche"]').tap()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${out}/390-palette.png`, animations: 'disabled' })
    await page.keyboard.type('BBS')
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${out}/390-palette-typed.png`, animations: 'disabled' })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // The footer.
    await page.locator('footer').scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await page.locator('footer').screenshot({ path: `${out}/390-footer.png`, animations: 'disabled' })
    await page.evaluate(() => window.scrollTo(0, 0))

    // Scrolled header.
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${out}/390-header-scrolled.png`, clip: { x: 0, y: 0, width: 390, height: 80 }, animations: 'disabled' })
    await page.evaluate(() => window.scrollTo(0, 0))

    // The shortcut list from the footer.
    await page.locator('.footer__button', { hasText: 'Tastenkürzel' }).scrollIntoViewIfNeeded()
    await page.locator('.footer__button', { hasText: 'Tastenkürzel' }).tap()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${out}/390-shortcuts.png`, animations: 'disabled' })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)

    // Cookie settings.
    await page.locator('.footer__button', { hasText: 'Cookie-Einstellungen' }).scrollIntoViewIfNeeded()
    await page.locator('.footer__button', { hasText: 'Cookie-Einstellungen' }).tap()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${out}/390-cookie-settings.png`, animations: 'disabled' })
    await page.keyboard.press('Escape')

    const facts = await page.evaluate(() => {
        const r = (sel) => {
            const el = document.querySelector(sel)
            if (!el) return null
            const b = el.getBoundingClientRect()
            return { w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10, x: Math.round(b.left * 10) / 10, y: Math.round(b.top * 10) / 10 }
        }
        const targets = [...document.querySelectorAll('.site-header a, .site-header button, .bnav a')].map((el) => {
            const b = el.getBoundingClientRect()
            return `${(el.getAttribute('aria-label') ?? el.textContent).trim().slice(0, 24)} ${Math.round(b.width)}×${Math.round(b.height)}`
        })
        return { header: r('.site-header'), bnav: r('.bnav'), main: r('main'), targets }
    })
    console.log('390 facts', JSON.stringify(facts))
    await page.close()

    // With a vehicle: the dot, the sheet, the vehicle bar.
    await chooseVehicle(context)
    const vpage = await context.newPage()
    await vpage.goto(BASE + '/', { waitUntil: 'networkidle' })
    await settle(vpage)
    await vpage.screenshot({ path: `${out}/390-vehicle-header.png`, clip: { x: 0, y: 0, width: 390, height: 110 }, animations: 'disabled' })
    await vpage.locator('.sh__vicon').tap()
    await vpage.waitForTimeout(600)
    await vpage.screenshot({ path: `${out}/390-vehicle-sheet.png`, animations: 'disabled' })
    await vpage.keyboard.press('Escape')
    await vpage.waitForTimeout(400)
    await vpage.goto(BASE + '/felgen', { waitUntil: 'networkidle' })
    await settle(vpage)
    await vpage.screenshot({ path: `${out}/390-vehicle-felgen-header.png`, clip: { x: 0, y: 0, width: 390, height: 110 }, animations: 'disabled' })
    await vpage.close()
    await context.close()
}

await browser.close()
console.log(`shell states in ${out}`)
