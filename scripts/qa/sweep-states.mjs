#!/usr/bin/env node
// The second half of the public sweep (the operator's brief of 14.10.2026, §5), against a shop of our own that holds
// every answer the engine gives:
//
//   states    a product page in each verdict state, „Anlage liegt noch nicht vor“ among them — what the panel says,
//             what each size chip says, whether the wheel can be bought;
//   widths    twelve widths from 320 to 1920 and three short windows, layout only: nothing wider than the window, no
//             word cut off, no control on another, no bar eating a short screen;
//   basket    one line, then many, then the checkout filled in up to the order button — which is never pressed;
//   customer  signed in: the account, the contact form, the checkout.
//
// Every page's words are written to a text file as well: the German copy review reads that, not the code.
//
//   QA_BASE_URL=http://127.0.0.1:8016 node scripts/qa/sweep-states.mjs --states <states.json> [--only states,widths,basket,customer]
//
// It runs only against a local shop: the basket and the sign-in write to its session, and nothing is ordered.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { chromium, devices } from '@playwright/test'
import { inspect } from './sweep-lib.mjs'

const BASE = (process.env.QA_BASE_URL ?? 'http://127.0.0.1:8016').replace(/\/+$/, '')
const arg = (name, fallback) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback)
const ONLY = arg('--only', 'states,widths,basket,customer').split(',')
const OUT = arg('--out', 'docs/qa/sweep-states.json')
const TEXTS = arg('--texts', 'docs/qa/sweep-texte.txt')
const SHOTS = 'docs/qa/shots/sweep-states'
const STATES = JSON.parse(readFileSync(arg('--states', 'docs/qa/sweep-states-input.json'), 'utf8').replace(/^﻿/, ''))

if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE)) {
    throw new Error(`${BASE} is not a local shop: this sweep fills a basket and signs in, and runs only against our own.`)
}

const WIDTHS = [320, 360, 390, 414, 480, 600, 768, 1024, 1280, 1440, 1680, 1920]
const SHORT = [[1440, 720], [1280, 620], [1024, 768]]
const DESKTOP = { ...devices['Desktop Chrome'] }
const PHONE = { ...devices['Pixel 7'] }
const CONSENT = { name: 'rmf_consent', value: encodeURIComponent(JSON.stringify({ necessary: true, statistics: false, decidedAt: '2026-01-01T00:00:00.000Z' })), url: BASE }

const results = { base: BASE, at: new Date().toISOString(), states: [], widths: [], basket: [], customer: [] }
const texts = []
mkdirSync(SHOTS, { recursive: true })

/** The words of a page as a visitor reads them, for the copy review. */
async function words(page, label) {
    const text = await page.evaluate(() => (document.querySelector('main') ?? document.body).innerText.replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim())

    texts.push(`\n════ ${label} — ${page.url().replace(BASE, '')}\n${text}`)

    return text
}

/** Layout only, at whatever size the window has. */
async function layout(page) {
    return page.evaluate(() => {
        const out = []
        const vw = window.innerWidth
        const vh = window.innerHeight
        const visible = (el) => {
            const r = el.getBoundingClientRect()
            const s = getComputedStyle(el)

            return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0
        }
        const name = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''}`
        const scrolls = (el) => {
            for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
                const o = getComputedStyle(p).overflowX

                if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') return true
            }

            return false
        }

        // Wider than the window, and what makes it so.
        const over = document.documentElement.scrollWidth - vw

        if (over > 1) {
            const culprits = [...document.body.querySelectorAll('*')].filter((el) => visible(el) && el.getBoundingClientRect().right > vw + 1 && !scrolls(el)).slice(0, 3).map(name)
            out.push(`page is ${over} px wider than the window (${culprits.join(', ') || 'no single element'})`)
        }

        // A word cut off: an ellipsis, or text clipped by its own box.
        for (const el of document.querySelectorAll('main h1, main h2, main h3, main p, main li, main dd, main dt, main td, main th, main a, main button, main label, main span, header a, header button, footer a')) {
            // A visually hidden label is clipped on purpose: it is for a screen reader, not for the eye.
            if (!visible(el) || el.children.length > 2 || el.closest('.visually-hidden, .sr-only') || el.getBoundingClientRect().width <= 1) continue

            const s = getComputedStyle(el)
            const cut = el.scrollWidth - el.clientWidth

            if (cut > 2 && (s.overflowX === 'hidden' || s.overflowX === 'clip') && (el.textContent ?? '').trim().length > 2 && el.clientWidth > 0) {
                out.push(`${s.textOverflow === 'ellipsis' ? 'cut off with …' : 'clipped'} by ${cut} px: „${(el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 46)}“ (${name(el)})`)
            }
        }

        // Controls on top of one another, where a visitor can tap either.
        const controls = [...document.querySelectorAll('a, button, input, select, textarea, [role="button"]')].filter(visible).map((el) => ({ el, r: el.getBoundingClientRect() })).filter((c) => c.r.top < vh * 3 && c.r.bottom > 0)

        for (let i = 0; i < controls.length; i++) {
            for (let j = i + 1; j < controls.length; j++) {
                const [a, b] = [controls[i], controls[j]]

                if (a.el.contains(b.el) || b.el.contains(a.el)) continue

                const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left)
                const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top)
                const fixed = (el) => { for (let p = el; p; p = p.parentElement) { const pos = getComputedStyle(p).position; if (pos === 'fixed' || pos === 'sticky') return true } return false }

                if (w > 6 && h > 6 && !fixed(a.el) && !fixed(b.el) && !a.el.closest('[aria-hidden="true"]') && !b.el.closest('[aria-hidden="true"]')) {
                    out.push(`controls overlap by ${Math.round(w)}×${Math.round(h)} px: „${(a.el.textContent || a.el.getAttribute('aria-label') || a.el.getAttribute('name') || '').trim().slice(0, 22)}“ / „${(b.el.textContent || b.el.getAttribute('aria-label') || b.el.getAttribute('name') || '').trim().slice(0, 22)}“`)
                }
            }
        }

        // A target too small for a finger (WCAG 2.2, 2.5.8: 24 × 24) — not a link inside a sentence.
        if (vw <= 480) {
            const small = controls.filter((c) => (c.r.width < 24 || c.r.height < 24) && !(c.el.tagName === 'A' && c.el.parentElement && /^(P|LI|SPAN|DD|TD|SMALL|LABEL)$/.test(c.el.parentElement.tagName)) && c.el.type !== 'hidden' && c.el.type !== 'checkbox' && c.el.type !== 'radio')

            if (small.length) out.push(`${small.length} target(s) under 24 px: ${small.slice(0, 3).map((c) => `„${(c.el.textContent || c.el.getAttribute('aria-label') || '').trim().slice(0, 18)}“ ${Math.round(c.r.width)}×${Math.round(c.r.height)}`).join(', ')}`)
        }

        // Bars that stay on screen: how much of a short window they take.
        let pinned = 0

        for (const el of document.body.querySelectorAll('*')) {
            const s = getComputedStyle(el)

            if ((s.position === 'fixed' || s.position === 'sticky') && visible(el)) {
                const r = el.getBoundingClientRect()

                if (r.width > vw * 0.6 && (r.top <= 1 || r.bottom >= vh - 1) && r.height < vh * 0.6) pinned += Math.min(r.bottom, vh) - Math.max(r.top, 0)
            }
        }

        if (pinned / vh > 0.34) out.push(`bars that stay on screen take ${Math.round((pinned / vh) * 100)} % of the window's height`)

        return out
    })
}

const browser = await chromium.launch()

async function open(use, viewport) {
    const context = await browser.newContext({ ...use, viewport, locale: 'de-DE', timezoneId: 'Europe/Berlin' })
    await context.addCookies([CONSENT])
    const page = await context.newPage()
    page.setDefaultTimeout(8_000)
    const problems = []

    page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text().slice(0, 140)}`))
    page.on('pageerror', (e) => problems.push(`JS crash: ${e.message.slice(0, 140)}`))
    page.on('response', (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url().replace(BASE, '').slice(0, 100)}`))

    return { context, page, problems }
}

const go = async (page, path) => {
    const response = await page.goto(BASE + path, { waitUntil: 'load', timeout: 60_000 })
    await page.waitForTimeout(700)

    return response?.status() ?? 0
}

// ── states ────────────────────────────────────────────────────────────────────────────────────────────────────────────
if (ONLY.includes('states')) {
    for (const [size, use, viewport] of [['1440', DESKTOP, { width: 1440, height: 900 }], ['390', PHONE, { width: 390, height: 844 }]]) {
        const { context, page, problems } = await open(use, viewport)

        for (const [state, where] of Object.entries(STATES.states)) {
            problems.length = 0
            const status = await go(page, `/felgen/${where.slug}?fahrzeug=${where.vehicle}`)
            const inch = String(where.inch).replace('.', ',')
            const chip = page.locator('#groessen .chip', { hasText: new RegExp(`^\\s*${inch}\\s*$`) }).first()

            // The size the answer belongs to, where it can be chosen (a refused size is a chip that cannot be pressed).
            if ((await chip.count()) > 0 && !(await chip.isDisabled()) && (await chip.getAttribute('aria-pressed')) !== 'true') {
                await chip.click()
                await page.waitForTimeout(500)
            }

            const read = await page.evaluate(() => {
                const panel = document.querySelector('.pdp__fit')
                const text = (el) => (el ? el.innerText.replace(/ /g, ' ').replace(/\s+\n/g, '\n').trim() : null)
                const buy = [...document.querySelectorAll('main button, main a')].find((b) => /In den Warenkorb/.test(b.textContent ?? ''))

                return {
                    panel: text(panel),
                    panelState: panel?.getAttribute('data-status') ?? panel?.className ?? null,
                    chips: [...document.querySelectorAll('#groessen .chip')].map((c) => ({ label: c.textContent.trim(), on: c.getAttribute('aria-pressed') === 'true', blocked: c.disabled, unconfirmed: c.classList.contains('chip--unconfirmed'), title: c.getAttribute('title') })),
                    legend: text(document.querySelector('#groessen')?.parentElement?.querySelector('.pdp__chips ~ p, .pdp__chips ~ .small')),
                    buy: buy ? { text: buy.textContent.trim().slice(0, 40), disabled: buy.disabled === true || buy.getAttribute('aria-disabled') === 'true' } : null,
                    badge: text(document.querySelector('.pdp .badge, .pdp [class*="verdict"]')),
                }
            })
            const seen = await inspect(page).catch(() => ({ findings: {} }))
            const shot = `${SHOTS}/zustand-${state.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${size}.png`

            await page.locator('.pdp__fit').first().scrollIntoViewIfNeeded().catch(() => {})
            await page.screenshot({ path: shot }).catch(() => {})
            await words(page, `Produktseite, ${state}, ${size}`)
            results.states.push({ state, size, path: `/felgen/${where.slug}?fahrzeug=${where.vehicle}`, status, ...read, findings: seen.findings, layout: await layout(page), listeners: [...problems], shot })
            process.stdout.write(`state ${size} ${state}: ${status} · ${(read.panel ?? '(no panel)').split('\n')[0].slice(0, 90)}\n`)
        }

        await context.close()
    }
}

// ── basket, checkout ──────────────────────────────────────────────────────────────────────────────────────────────────
/** One wheel into the basket through the product page, as a visitor does it; false where the page offers none. */
async function buy(page, slug, vehicle) {
    await go(page, `/felgen/${slug}?fahrzeug=${vehicle}`)

    for (const chip of await page.locator('#groessen .chip:not([disabled])').all()) {
        const button = page.getByRole('button', { name: /In den Warenkorb/ }).first()

        if ((await button.count()) > 0 && (await button.isEnabled())) {
            // An Auflage to be acknowledged first, where the answer has one.
            for (const box of await page.locator('main input[type="checkbox"][required], main .pdp__fit input[type="checkbox"]').all()) {
                if (await box.isVisible()) await box.check().catch(() => {})
            }

            await button.click()
            await page.waitForTimeout(1_200)

            return true
        }

        await chip.click().catch(() => {})
        await page.waitForTimeout(400)
    }

    return false
}

async function journey(label, use, viewport, { signIn = false } = {}) {
    const { context, page, problems } = await open(use, viewport)
    const record = async (group, name, extra = {}) => {
        const seen = await inspect(page).catch(() => ({ findings: {} }))
        const shot = `${SHOTS}/${group}-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${label}.png`

        await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
        await words(page, `${name}, ${label}`)
        results[group].push({ name, size: label, url: page.url().replace(BASE, ''), findings: seen.findings, layout: await layout(page), listeners: [...problems], shot, ...extra })
        process.stdout.write(`${group} ${label} ${name}: ${Object.values(seen.findings ?? {}).flat().length} to look at, layout ${results[group].at(-1).layout.length}, listeners ${problems.length}\n`)
        problems.length = 0
    }

    if (signIn) {
        await go(page, '/konto/anmelden')
        await record('customer', 'Anmelden')
        await page.locator('input[type="email"]').first().fill(STATES.account)
        await page.locator('input[type="password"]').first().fill('sweep-ein-langes-passwort')
        // The form's own button — the phone's menu holds an „Anmelden“ of its own.
        await page.locator('main form').getByRole('button', { name: /Anmelden/ }).first().click()
        await page.waitForTimeout(1_500)
        await go(page, '/konto')
        await record('customer', 'Konto', { signedIn: /\/konto$/.test(page.url()) })
        await go(page, '/kontakt')
        await record('customer', 'Kontakt, angemeldet', { emailPrefilled: await page.locator('#kon-email').inputValue().catch(() => null), copyPromised: (await page.locator('.kon__copy').count()) > 0 })
    }

    const group = signIn ? 'customer' : 'basket'
    const car = STATES.states['PERMITTED/PLAIN']?.vehicle ?? 1
    const first = await buy(page, STATES.states['PERMITTED/PLAIN']?.slug ?? 'nordfelge-fjord', car)

    await go(page, '/warenkorb')
    await record(group, 'Warenkorb, eine Zeile', { added: first })

    let added = first ? 1 : 0

    for (const slug of STATES.sellable ?? []) {
        if (added >= 5) break
        if (await buy(page, slug, car)) added++
    }

    await go(page, '/warenkorb')
    await record(group, 'Warenkorb, viele Zeilen', { lines: await page.locator('.bl__entry, [data-line], .basket__line').count(), added })

    await go(page, '/kasse')
    await record(group, 'Kasse, wie geöffnet')

    // Filled in as a customer would, step by step, up to the order button — which stays unpressed.
    const fill = async (key, value) => {
        const field = page.locator(`main [data-key="${key}"]`).first()

        if ((await field.count()) > 0 && (await field.isVisible()) && (await field.inputValue().catch(() => '')) === '') await field.fill(value).catch(() => {})
    }
    const next = async () => {
        const button = page.locator('main').getByRole('button', { name: /^Weiter/ }).first()

        if ((await button.count()) === 0) return false
        await button.click()
        await page.waitForTimeout(1_500)

        return true
    }

    await fill('email', 'kundin@example.test')
    await fill('name', 'Jana Beispiel')
    await fill('street', 'Musterweg')
    await fill('houseNumber', '12a')
    await fill('zip', '50667')
    await fill('city', 'Köln')
    await record(group, 'Kasse 1, Adresse ausgefüllt')

    if (await next()) {
        await record(group, 'Kasse 2, Optionen und Versand')

        if (await next()) {
            const order = page.getByRole('button', { name: /bestellen|kaufen|bezahlen/i }).first()

            await record(group, 'Kasse 3, Zahlung', { orderButton: (await order.count()) > 0 ? { text: (await order.textContent())?.trim(), enabled: await order.isEnabled() } : null, pressed: false })
        }
    }

    await context.close()
}

if (ONLY.includes('basket')) {
    await journey('1440', DESKTOP, { width: 1440, height: 900 })
    await journey('390', PHONE, { width: 390, height: 844 })
}

if (ONLY.includes('customer')) {
    await journey('1440', DESKTOP, { width: 1440, height: 900 }, { signIn: true })
    await journey('390', PHONE, { width: 390, height: 844 }, { signIn: true })
}

// ── texts ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Every public page's words at both widths, header and footer once, for the German copy review.
if (ONLY.includes('texts')) {
    const PAGES = ['/', '/felgen', '/felgen?zoll=30', '/felgen?q=xyzxyz', '/felgen-suchen', '/rimify-check', '/felgenrechner', '/vergleich', '/warenkorb', '/kasse', '/konto/anmelden', '/konto/passwort-vergessen', '/faq', '/kontakt', '/ratgeber', '/rechtliches', '/rechtliches/impressum', '/rechtliches/datenschutz', '/rechtliches/agb', '/rechtliches/widerrufsbelehrung', '/rechtliches/versand', '/rechtliches/widerrufsformular', '/gibt-es-nicht']

    for (const [size, use, viewport] of [['1440', DESKTOP, { width: 1440, height: 900 }], ['390', PHONE, { width: 390, height: 844 }]]) {
        const { context, page } = await open(use, viewport)

        await go(page, '/')
        texts.push(`\n════ Kopf und Fuß, ${size}\n${await page.evaluate(() => [...document.querySelectorAll('header, footer')].map((el) => el.innerText.replace(/ /g, ' ').trim()).join('\n────\n'))}`)

        for (const path of PAGES) {
            await go(page, path)
            await words(page, `Seite ${path}, ${size}`)
        }

        // A product page without a car, the way a visitor arrives from a search engine.
        await go(page, `/felgen/${STATES.states['PERMITTED/PLAIN']?.slug ?? 'nordfelge-fjord'}`)
        await words(page, `Produktseite ohne Fahrzeug, ${size}`)
        await context.close()
        process.stdout.write(`texts ${size}: ${PAGES.length + 1} pages\n`)
    }
}

// ── widths ────────────────────────────────────────────────────────────────────────────────────────────────────────────
if (ONLY.includes('widths')) {
    const car = STATES.states['PERMITTED/PLAIN']?.vehicle ?? 1
    const product = `/felgen/${STATES.states['CONDITIONAL/EINTRAGUNG']?.slug ?? 'nordfelge-fjord'}?fahrzeug=${STATES.states['CONDITIONAL/EINTRAGUNG']?.vehicle ?? car}`
    const open_ = `/felgen/${STATES.states['UNKNOWN/TYRE_UNKNOWN']?.slug ?? 'nordfelge-fjord'}?fahrzeug=${STATES.states['UNKNOWN/TYRE_UNKNOWN']?.vehicle ?? car}`
    const PAGES = ['/', `/felgen?fahrzeug=${car}`, '/felgen?zoll=30', product, open_, '/felgen-suchen', '/rimify-check', '/felgenrechner', '/vergleich', '/warenkorb', '/kasse', '/konto/anmelden', '/faq', '/kontakt', '/rechtliches/impressum', '/gibt-es-nicht']
    const sizes = [...WIDTHS.map((w) => [w, w <= 480 ? 844 : 900]), ...SHORT]

    for (const [width, height] of sizes) {
        const { context, page, problems } = await open(width <= 480 ? PHONE : DESKTOP, { width, height })

        // A basket with something in it, so the basket and the checkout are pages and not empty states.
        await buy(page, STATES.states['PERMITTED/PLAIN']?.slug ?? 'nordfelge-fjord', car)

        for (const path of PAGES) {
            problems.length = 0
            const status = await go(page, path)
            const found = await layout(page)
            const expected = path === '/gibt-es-nicht' ? 404 : 200
            const noise = problems.filter((p) => !(expected === 404 && p.startsWith('404 ')))

            if (found.length || noise.length || status !== expected) {
                const shot = `${SHOTS}/breite-${width}x${height}-${path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'start'}.png`

                await page.screenshot({ path: shot }).catch(() => {})
                results.widths.push({ size: `${width}×${height}`, path, status, layout: found, listeners: noise, shot })
                process.stdout.write(`width ${width}×${height} ${path}: ${[...found, ...noise].slice(0, 4).join(' | ').slice(0, 260)}\n`)
            }
        }

        process.stdout.write(`width ${width}×${height}: ${PAGES.length} pages\n`)
        await context.close()
    }

    results.widthsSwept = { sizes: sizes.map(([w, h]) => `${w}×${h}`), pages: PAGES }
}

await browser.close()
writeFileSync(OUT, JSON.stringify(results, null, 1))
writeFileSync(TEXTS, texts.join('\n'))
process.stdout.write(`written: ${OUT}, ${TEXTS}\n`)
