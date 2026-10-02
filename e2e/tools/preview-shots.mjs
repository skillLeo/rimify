/*
 * Screenshots of a deployed homepage — the hero mid-roll and at rest, and „Was die Zahlen auf einer Felge bedeuten" —
 * at 1440 and 390, taken from the site itself, never from a local build (the operator's rule of 01.10.2026).
 *
 *   node e2e/tools/preview-shots.mjs docs/qa/shots/preview-home [https://rimify.skillleo.com]
 *
 * Each region is cut from a full-page capture, so a sticky header never lands in the middle of a picture.
 */

/* global window, document, location -- read inside page.evaluate(), in the browser */

import { chromium, devices } from '@playwright/test'
import fs from 'node:fs'

const OUT = process.argv[2] ?? 'docs/qa/shots/preview-home'
const BASE = process.argv[3] ?? 'https://rimify.skillleo.com'
fs.mkdirSync(OUT, { recursive: true })

const consent = { name: 'rmf_consent', value: encodeURIComponent(JSON.stringify({ necessary: true, statistics: false, decidedAt: '2026-10-01T00:00:00.000Z' })), url: BASE }
const browser = await chromium.launch()
const report = []

async function cut(page, selector, path) {
    const box = await page.locator(selector).first().boundingBox()

    if (!box) {
        return false
    }

    const fits = box.y >= 0 && box.y + box.height <= page.viewportSize().height
    const scroll = await page.evaluate(() => window.scrollY)
    await page.screenshot(fits
        ? { path, clip: { x: 0, y: box.y, width: page.viewportSize().width, height: box.height } }
        : { path, fullPage: true, clip: { x: 0, y: box.y + scroll, width: page.viewportSize().width, height: box.height } })

    return true
}

for (const [name, options] of [
    ['1440', { viewport: { width: 1440, height: 900 }, locale: 'de-DE' }],
    // Tall enough that the phone's hero stage is on the first screen: a full-page capture resizes the window mid-roll.
    ['390', { ...devices['iPhone 14'], viewport: { width: 390, height: 1500 }, locale: 'de-DE' }],
]) {
    const context = await browser.newContext(options)
    await context.addCookies([consent])
    const page = await context.newPage()
    // Once to fill the cache, as a returning visitor has it: the second load shows the roll with the photograph in it.
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    const response = await page.reload({ waitUntil: 'domcontentloaded' })
    const stage = name === '1440' ? '#h2' : '.hero-mobile'

    // Mid-roll: the wheel on its way in from the right (the phone's roll starts with the page's script, later).
    await page.waitForTimeout(name === '1440' ? 450 : 1100)
    await cut(page, stage, `${OUT}/home-${name}-rolling.png`)

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2500)
    await cut(page, stage, `${OUT}/home-${name}-hero.png`)

    const hero = await page.evaluate((selector) => {
        const root = document.querySelector(selector)
        const img = root?.querySelector('img')

        return {
            img: img ? (img.currentSrc || img.src).replace(location.origin, '') : null,
            loaded: img ? img.complete && img.naturalWidth > 0 : false,
            rolling: !!root?.querySelector('.hero__roll--rolling, .hero-frame__roll--rolling'),
            symbolbild: (root?.textContent ?? '').includes('Symbolbild'),
        }
    }, stage)

    const numbers = page.locator('[data-section="H8"]').first()
    const hasNumbers = (await numbers.count()) > 0

    if (hasNumbers) {
        // A viewport as tall as the section: no scrolling, so the sticky header never covers it.
        const height = Math.ceil((await numbers.boundingBox())?.height ?? 900)
        await page.setViewportSize({ width: page.viewportSize().width, height: height + 160 })
        await numbers.scrollIntoViewIfNeeded()
        await page.waitForTimeout(800)
        await numbers.screenshot({ path: `${OUT}/home-${name}-numbers.png` })
    }

    report.push({
        viewport: name,
        status: response?.status(),
        ...hero,
        numbersSection: hasNumbers,
        numbersPhoto: hasNumbers ? await numbers.locator('img').first().evaluate((el) => el.complete && el.naturalWidth > 0).catch(() => false) : false,
        chips: hasNumbers ? await numbers.locator('[data-token]').allInnerTexts() : [],
    })
    await context.close()
}

await browser.close()
console.log(JSON.stringify(report, null, 1))
