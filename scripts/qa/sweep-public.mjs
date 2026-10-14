#!/usr/bin/env node
// The public-page sweep (the operator's brief „FINISH THE PUBLIC PAGES“ §2–§3): every public page, in Chromium at
// 1440 × 900 and in WebKit at 390 × 844, hunted for what a machine can see of the nine classes — and written down per
// page, so a page counts as swept only when every class was looked for. What a machine cannot see (whether a word is
// the word a shop owner would use, whether four pixels are off) is the copy review's and the eye's; this names the rest.
//
//   QA_BASE_URL=https://rimify.skillleo.com node scripts/qa/sweep-public.mjs [--out docs/qa/sweep-public.json]
//
// It only reads: a visitor's page views, one car chosen through the picker (cookies), one wheel into the basket of its
// own session. No form is sent, no order placed.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { chromium, devices, webkit } from '@playwright/test'
import { inspect, vitals } from './sweep-lib.mjs'

const BASE = (process.env.QA_BASE_URL ?? 'http://127.0.0.1:8014').replace(/\/+$/, '')
const OUT = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'docs/qa/sweep-public.json'
const SHOTS = 'docs/qa/shots/sweep-public'

const ENGINES = [
    { name: 'chromium-1440', type: chromium, use: { viewport: { width: 1440, height: 900 } } },
    { name: 'webkit-390', type: webkit, use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } } },
]


const results = []
mkdirSync(SHOTS, { recursive: true })

for (const engine of ENGINES) {
    const browser = await engine.type.launch()
    const context = await browser.newContext({ ...engine.use, locale: 'de-DE', timezoneId: 'Europe/Berlin' })
    await context.addCookies([{ name: 'rmf_consent', value: encodeURIComponent(JSON.stringify({ necessary: true, statistics: false, decidedAt: '2026-01-01T00:00:00.000Z' })), url: BASE }])
    const page = await context.newPage()
    let problems = []
    page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text().slice(0, 140)}`))
    page.on('pageerror', (e) => problems.push(`JS crash: ${e.message.slice(0, 140)}`))
    page.on('requestfailed', (r) => r.failure()?.errorText !== 'net::ERR_ABORTED' && !/cancel/i.test(r.failure()?.errorText ?? '') && problems.push(`failed: ${r.url().slice(0, 110)} (${r.failure()?.errorText})`))
    page.on('response', (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url().slice(0, 110)}`))

    const visit = async (label, path, { expectStatus = 200, before } = {}) => {
        problems = []
        const response = await page.goto(BASE + path, { waitUntil: 'load', timeout: 60_000 }).catch((e) => ({ status: () => 0, error: e.message }))
        await page.waitForTimeout(1_200)
        if (before) await before()

        const status = response.status()
        const seen = await inspect(page).catch((e) => ({ findings: { technical: [`could not be inspected: ${e.message.slice(0, 80)}`] }, title: '', h1: null, terms: {} }))
        const v = await vitals(page).catch(() => ({ lcp: null, lcpElement: null, cls: null }))
        const shot = `${SHOTS}/${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${engine.name}.png`
        await page.screenshot({ path: shot }).catch(() => {})

        // Links of the page, each asked once (2.2): a 404 behind a link is a dead end.
        const links = [...new Set(await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.href).filter((h) => h.startsWith(location.origin)).map((h) => h.split('#')[0])))].slice(0, 80)

        results.push({
            label, path, url: page.url().replace(BASE, ''), engine: engine.name, status,
            statusOk: status === expectStatus,
            listeners: problems.filter((p) => !(expectStatus >= 400 && p.startsWith(`${expectStatus} `))).filter((p) => !/Refused to apply a stylesheet/.test(p)),
            title: seen.title, h1: seen.h1, terms: seen.terms, vitals: v, findings: seen.findings, links, shot,
        })
        process.stdout.write(`${engine.name} ${label}: ${status}${Object.values(seen.findings ?? {}).flat().length ? ' · ' + Object.values(seen.findings).flat().length + ' to look at' : ''}${problems.length ? ' · listeners ' + problems.length : ''}\n`)
    }

    await visit('Startseite', '/')
    await visit('Felgen ohne Fahrzeug', '/felgen')

    // A product and a filter the shop really has, taken from its own listing.
    const product = await page.locator('main a[href^="/felgen/"], main a[href*="/felgen/"]').evaluateAll((as) => as.map((a) => new URL(a.href).pathname).find((p) => /^\/felgen\/[^/]+$/.test(p)) ?? null)
    const filter = await page.locator('main a[href*="/felgen?"]').evaluateAll((as) => as.map((a) => new URL(a.href).pathname + new URL(a.href).search).find((h) => /zoll=|marke=/.test(h)) ?? null)

    await visit('Felgen mit Filter', filter ?? '/felgen?zoll=18')
    await visit('Felgen: Filter ohne Treffer', '/felgen?zoll=30')
    if (product) await visit('Produktseite ohne Fahrzeug', product)

    // The car, chosen as a visitor chooses it: Marke, Modell, Fahrzeug.
    let car = null
    try {
        await page.goto(BASE + '/felgen-suchen', { waitUntil: 'load' })
        await page.waitForTimeout(1_000)
        const makes = await page.request.get(`${BASE}/api/v1/vehicles/makes`, { headers: { Accept: 'application/json' } }).then((r) => (r.ok() ? r.json() : null)).catch(() => null)
        const make = makes?.makes?.[0]?.name ?? makes?.[0]?.name ?? 'BMW'
        const models = await page.request.get(`${BASE}/api/v1/vehicles/models?marke=${encodeURIComponent(make)}`, { headers: { Accept: 'application/json' } }).then((r) => (r.ok() ? r.json() : null)).catch(() => null)
        const model = models?.models?.[0]?.model ?? null
        const variants = model ? await page.request.get(`${BASE}/api/v1/vehicles/variants?marke=${encodeURIComponent(make)}&modell=${encodeURIComponent(model)}`, { headers: { Accept: 'application/json' } }).then((r) => (r.ok() ? r.json() : null)).catch(() => null) : null
        car = variants?.variants?.[0]?.id ?? null
    } catch {
        car = null
    }

    await visit('Fahrzeugwahl', '/felgen-suchen')

    if (car !== null) {
        await visit('Felgen mit Fahrzeug', `/felgen?fahrzeug=${car}`)
        if (product) await visit('Produktseite mit Fahrzeug', `${product}?fahrzeug=${car}`)
        await visit('RIMIFY-Check mit Fahrzeug', `/rimify-check?fahrzeug=${car}`)
    }

    await visit('RIMIFY-Check', '/rimify-check')
    await visit('Felgenrechner', '/felgenrechner')
    await visit('Vergleich leer', '/vergleich')
    await visit('Warenkorb leer', '/warenkorb')
    await visit('Kasse ohne Warenkorb', '/kasse')
    await visit('Konto', '/konto')
    await visit('FAQ', '/faq')
    await visit('Kontakt', '/kontakt')
    await visit('Rechtliches', '/rechtliches')
    for (const slug of ['impressum', 'datenschutz', 'agb', 'widerrufsbelehrung', 'versand']) await visit(`Rechtliches: ${slug}`, `/rechtliches/${slug}`)
    await visit('Suche', '/felgen?q=borbet')
    await visit('404', '/gibt-es-nicht', { expectStatus: 404 })

    // Every link met on the way, asked once.
    const all = [...new Set(results.filter((r) => r.engine === engine.name).flatMap((r) => r.links))]
    const dead = []

    for (const href of all) {
        const r = await page.request.get(href, { maxRedirects: 5 }).catch(() => null)

        if (!r || r.status() >= 400) dead.push(`${r ? r.status() : 'no answer'} ${href.replace(BASE, '')}`)
    }

    results.push({ label: 'Links', engine: engine.name, asked: all.length, dead })
    process.stdout.write(`${engine.name} links: ${all.length} asked, ${dead.length} dead\n`)
    await browser.close()
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify({ base: BASE, at: new Date().toISOString(), results }, null, 1))
process.stdout.write(`written: ${OUT}\n`)
