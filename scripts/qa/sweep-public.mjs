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

const BASE = (process.env.QA_BASE_URL ?? 'http://127.0.0.1:8014').replace(/\/+$/, '')
const OUT = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'docs/qa/sweep-public.json'
const SHOTS = 'docs/qa/shots/sweep-public'

const ENGINES = [
    { name: 'chromium-1440', type: chromium, use: { viewport: { width: 1440, height: 900 } } },
    { name: 'webkit-390', type: webkit, use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } } },
]

/** English that has no place in a German shop, as whole words in visible text. */
const ENGLISH = /\b(loading|submit|click here|read more|learn more|not found|error|undefined|null|lorem|ipsum|todo|coming soon|add to cart|checkout|sign in|log ?in|search results?|no results|required|invalid|success)\b/i
/** Families whose members contradict each other when they stand as ungrouped neighbours (D-199). */
const FAMILIES = { Schneeketten: /Schneeketten/i, Bördeln: /[Bb]ördel|Radhausausschnitt|Radlauf/, Achse: /nur an Achse|Vorderachse|Hinterachse/, Eintragung: /Eintragung|Änderungsabnahme/ }

async function inspect(page) {
    return page.evaluate(
        ({ english, families }) => {
            const visible = (el) => {
                const r = el.getBoundingClientRect()
                const s = getComputedStyle(el)

                return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0
            }
            const main = document.querySelector('main') ?? document.body
            const text = (main.innerText ?? '').replace(/ /g, ' ')
            const out = { content: [], dead: [], empty: [], layout: [], meaning: [], a11y: [], technical: [], speed: [] }
            const english_ = new RegExp(english, 'i')

            // 2.1 content
            for (const line of text.split('\n').map((l) => l.trim()).filter(Boolean)) {
                const m = english_.exec(line)

                if (m && !/RIMIFY-Check|TÜV|E-Mail|Cookies?|Demodaten|Online|Shop|Check\b/.test(m[0])) {
                    out.content.push(`English/placeholder „${m[0]}“ in: ${line.slice(0, 90)}`)
                }

                if (/\b[A-Z]{3,}_[A-Z_]{2,}\b/.test(line)) out.content.push(`raw code or enum: ${line.slice(0, 90)}`)
                if (/\d\.\d{2}\s?€/.test(line) && !/\d{1,3}\.\d{3},\d{2}\s?€/.test(line)) out.content.push(`price with a point: ${line.slice(0, 60)}`)
                if (/\d,\d{2}€/.test(line)) out.content.push(`no space before €: ${line.slice(0, 60)}`)
                if (/\b\d{4}-\d{2}-\d{2}\b/.test(line)) out.content.push(`date not written the German way: ${line.slice(0, 60)}`)
            }

            // 2.2 dead ends: links without a destination, buttons that are not buttons
            for (const a of main.querySelectorAll('a')) {
                const href = a.getAttribute('href')

                if (visible(a) && (!href || href === '#' || href.startsWith('javascript:'))) out.dead.push(`link without a destination: „${(a.textContent ?? '').trim().slice(0, 40)}“`)
                if (href?.startsWith('mailto:')) out.meaning.push(`mailto: left on „${(a.textContent ?? '').trim().slice(0, 40)}“`)
            }

            // 2.3 empty states: a value that is only a dash or nothing where a label promises one
            for (const el of main.querySelectorAll('dd, td, .value, [data-value]')) {
                const t = (el.textContent ?? '').trim()

                if (visible(el) && (t === '' || t === '–' || t === '—' || t === 'NaN' || t === 'undefined')) {
                    const label = el.previousElementSibling?.textContent?.trim() ?? el.closest('tr')?.querySelector('th,td')?.textContent?.trim() ?? ''
                    out.empty.push(`„${t || '(leer)'}“ for ${label.slice(0, 40) || el.className.toString().slice(0, 30)}`)
                }
            }

            // 2.4 layout: the page wider than the window; text cut off; controls on top of one another
            if (document.documentElement.scrollWidth > window.innerWidth + 1) out.layout.push(`page is ${document.documentElement.scrollWidth - window.innerWidth} px wider than the window`)

            const controls = [...document.querySelectorAll('a, button, input, select, [role="button"]')].filter(visible).map((el) => ({ el, r: el.getBoundingClientRect() })).filter((c) => c.r.top < window.innerHeight * 3)

            for (let i = 0; i < controls.length; i++) {
                for (let j = i + 1; j < controls.length; j++) {
                    const [a, b] = [controls[i], controls[j]]

                    if (a.el.contains(b.el) || b.el.contains(a.el)) continue

                    const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left)
                    const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top)

                    if (w > 6 && h > 6 && getComputedStyle(a.el).position !== 'fixed' && getComputedStyle(b.el).position !== 'fixed' && !a.el.closest('[aria-hidden="true"]') && !b.el.closest('[aria-hidden="true"]')) {
                        const top = document.elementFromPoint(Math.max(a.r.left, b.r.left) + w / 2, Math.max(a.r.top, b.r.top) + h / 2)

                        if (top && (a.el.contains(top) || b.el.contains(top))) out.layout.push(`controls overlap by ${Math.round(w)}×${Math.round(h)} px: „${(a.el.textContent || a.el.getAttribute('aria-label') || '').trim().slice(0, 24)}“ / „${(b.el.textContent || b.el.getAttribute('aria-label') || '').trim().slice(0, 24)}“`)
                    }
                }
            }

            for (const img of main.querySelectorAll('img')) {
                if (!visible(img) || !img.naturalWidth) continue

                const shown = img.getBoundingClientRect()
                const fit = getComputedStyle(img).objectFit

                if (fit !== 'contain' && fit !== 'cover' && Math.abs(shown.width / shown.height - img.naturalWidth / img.naturalHeight) > 0.06) out.layout.push(`image stretched: ${img.currentSrc.split('/').pop().slice(0, 40)}`)
            }

            // 2.6 meaning: bare codes; a price without its VAT line; conditions of one family as ungrouped neighbours
            // A code where a sentence belongs (R-15): A01, K1c, T87 as a word of its own — not the „R18“ of a tyre size,
            // and not inside a picture of a document (the homepage shows a Gutachten page as an example, role="img").
            const prose = [...main.querySelectorAll('[role="img"]')].reduce((t, el) => t.replace((el.innerText ?? '').replace(/ /g, ' '), ''), text)
            const codes = prose.match(/(?<![\w\/.\-])(?:[AKTSV]\d{2}[a-z]?|K\d[a-z])(?![\w\/.\-])/g)

            if (codes) out.meaning.push(`bare code(s) in the text: ${[...new Set(codes)].slice(0, 6).join(', ')}`)
            if (/\d,\d{2}\s€/.test(text) && !/MwSt|Mehrwertsteuer|Kleinunternehmer|§\s?19/.test(document.body.innerText)) out.meaning.push('a price on the page, and no word about VAT anywhere on it')

            for (const list of main.querySelectorAll('ul, ol')) {
                const items = [...list.children].filter((li) => li.tagName === 'LI').map((li) => li.textContent ?? '')

                for (const [family, pattern] of Object.entries(families)) {
                    const hits = items.filter((t) => new RegExp(pattern).test(t))
                    const labelled = list.previousElementSibling && /Nur (bei|mit)|Für jede/.test(list.previousElementSibling.textContent ?? '')

                    if (hits.length > 1 && !labelled && new Set(hits).size > 1 && /nicht zulässig|nur |ausschließlich/i.test(hits.join(' '))) out.meaning.push(`${hits.length} „${family}“ conditions as ungrouped neighbours: ${hits[0].trim().slice(0, 50)} | ${hits[1].trim().slice(0, 50)}`)
                }
            }

            // 2.7 accessibility (beyond axe): heading order, inputs without a name, alt text that says nothing
            let last = 0

            for (const h of document.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
                if (!visible(h)) continue

                const level = Number(h.tagName[1])

                if (last && level > last + 1) out.a11y.push(`heading jumps h${last} → h${level}: „${(h.textContent ?? '').trim().slice(0, 40)}“`)
                last = level
            }

            if (document.querySelectorAll('h1').length !== 1) out.a11y.push(`${document.querySelectorAll('h1').length} h1 on the page`)

            for (const input of main.querySelectorAll('input:not([type=hidden]), select, textarea')) {
                const named = input.labels?.length || input.getAttribute('aria-label') || input.getAttribute('aria-labelledby') || input.getAttribute('title')

                if (visible(input) && !named) out.a11y.push(`input without a label: ${input.getAttribute('name') || input.id || input.getAttribute('placeholder') || input.type}`)
            }

            for (const img of main.querySelectorAll('img')) {
                const alt = img.getAttribute('alt')

                if (!visible(img)) continue
                if (alt === null) out.a11y.push(`image without alt: ${img.currentSrc.split('/').pop().slice(0, 40)}`)
                else if (/\.(png|jpe?g|webp|svg)$|^(bild|image|foto|felge)$/i.test(alt.trim())) out.a11y.push(`alt says nothing: „${alt}“`)
            }

            // 2.8 technical: the same landmark twice
            for (const sel of ['header', 'footer', 'main', 'nav[aria-label]']) {
                const seen = [...document.querySelectorAll(sel)].filter(visible)
                const names = seen.map((n) => n.getAttribute('aria-label') ?? sel)

                if (sel !== 'nav[aria-label]' && seen.filter((n) => !n.closest('article, section, dialog, [role="dialog"]')).length > 1) out.technical.push(`${seen.length} visible <${sel}> on the page`)
                if (sel === 'nav[aria-label]' && new Set(names).size !== names.length) out.technical.push(`two navigations with the same name: ${names.join(', ')}`)
            }

            // 2.9 speed: images above the fold that load lazily; images without srcset
            for (const img of document.querySelectorAll('img')) {
                const r = img.getBoundingClientRect()

                if (!visible(img)) continue
                if (r.top < window.innerHeight && r.width > 80 && img.loading === 'lazy') out.speed.push(`lazy above the fold: ${img.currentSrc.split('/').pop().slice(0, 40)}`)
                if (r.width > 200 && !img.srcset && !img.closest('picture') && !/\.svg/.test(img.currentSrc)) out.speed.push(`no srcset on a ${Math.round(r.width)} px image: ${img.currentSrc.split('/').pop().slice(0, 40)}`)
            }

            return { findings: out, title: document.title, h1: document.querySelector('h1')?.textContent?.trim() ?? null, terms: Object.fromEntries(['Felge', 'Rad ', 'Räder', 'Freigabe', 'Gutachten', 'Warenkorb', 'Korb', 'Fahrzeug', 'Auto', 'Kasse', 'Bestellung', 'Komplettrad', 'Kompletträder'].map((t) => [t.trim(), (document.body.innerText.match(new RegExp(t, 'g')) ?? []).length])) }
        },
        { english: ENGLISH.source, families: Object.fromEntries(Object.entries(FAMILIES).map(([k, v]) => [k, v.source])) },
    )
}

/** Largest Contentful Paint and layout shift, where the engine measures them (WebKit does not). */
async function vitals(page) {
    return page.evaluate(
        () =>
            new Promise((resolve) => {
                const out = { lcp: null, lcpElement: null, cls: 0 }

                try {
                    new PerformanceObserver((list) => {
                        const last = list.getEntries().at(-1)
                        out.lcp = Math.round(last.startTime)
                        out.lcpElement = last.element ? `${last.element.tagName.toLowerCase()}${last.element.className ? '.' + String(last.element.className).split(' ')[0] : ''}` : null
                    }).observe({ type: 'largest-contentful-paint', buffered: true })
                    new PerformanceObserver((list) => {
                        for (const e of list.getEntries()) if (!e.hadRecentInput) out.cls += e.value
                    }).observe({ type: 'layout-shift', buffered: true })
                } catch {
                    // An engine without these entries: said as null.
                }

                setTimeout(() => resolve({ ...out, cls: Math.round(out.cls * 1000) / 1000 }), 600)
            }),
    )
}

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
