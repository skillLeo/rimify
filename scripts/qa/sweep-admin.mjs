// Client-ready click-through of the admin on a deployed copy, once per review role (Admin, Verkauf, Lager), at
// 1440 × 900 and 390 × 844 (the phone document is decided by the User-Agent on the server, so 390 sends a phone UA).
//
//   node scripts/qa/sweep-admin.mjs [--base https://rimify.skillleo.com] [--roles admin,verkauf,lager]
//                                   [--widths 1440,390] [--no-links] [--no-shots]
//
// The review password is read from REVIEW_PASSWORD, else from the table in docs/review/ACCOUNTS.md — it is never
// written into this file.
//
// READ-ONLY. Every request that is not GET/HEAD is aborted in the browser, except signing in (POST /admin/anmelden)
// and confirming the password (POST /admin/bestaetigen) — so nothing is released, published, saved, refunded or
// invited, whatever the page does on its own (an automatic write is reported as a finding of its own). Exports, CSV
// files, invoices and „Abmelden“ are never requested. Side effects a look cannot avoid: one sign-in per role and width,
// and one `permission.denied` entry in the Protokoll per forbidden page probed (EnsureAdminMay records every refusal).
//
// Writes: docs/qa/sweep-admin/results-<stamp>.json (everything measured), docs/qa/sweep-admin/auto-findings-<stamp>.md
// (one line per automatic finding, in the format of docs/reviews/sweep-admin.md, to be curated by a person) and the
// screenshots under docs/qa/shots/sweep-admin/<role>-<width>-<page>.png.
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { MOBILE_UA, parseArgs } from './lib.mjs'

const args = parseArgs()
const BASE = String(typeof args.base === 'string' ? args.base : process.env.QA_BASE_URL ?? 'https://rimify.skillleo.com').replace(/\/$/, '')
const ORIGIN = new URL(BASE).origin
const ROOT = process.cwd()
const SHOTS = path.join(ROOT, 'docs', 'qa', 'shots', 'sweep-admin')
const OUT = path.join(ROOT, 'docs', 'qa', 'sweep-admin')
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const WIDTHS = (typeof args.widths === 'string' ? args.widths : '1440,390').split(',').map(Number)
// Admin first: its walk finds the detail pages (an order, a Gutachten, …) the other roles are then probed with.
const ROLE_ORDER = (typeof args.roles === 'string' ? args.roles : 'admin,verkauf,lager').split(',')
const CHECK_LINKS = !args['no-links']
const TAKE_SHOTS = !args['no-shots']

const ACCOUNTS = {
    admin: 'admin@rimify.test',
    verkauf: 'verkauf@rimify.test',
    lager: 'lager@rimify.test',
}

/** AdminNavigation::BUILT plus the pages beneath the Übersicht — every page a role may or may not open. */
const BUILT = [
    '/admin', '/admin/review', '/admin/review/rueckmeldungen', '/admin/felgen', '/admin/marken', '/admin/katalog/import',
    '/admin/gutachten', '/admin/auflagen', '/admin/konflikte', '/admin/fahrzeuge', '/admin/fahrzeuge/pruefung',
    '/admin/abdeckung', '/admin/bestellungen', '/admin/rueckbuchungen', '/admin/anfragen', '/admin/zubehoerpreise',
    '/admin/benutzer', '/admin/rollen', '/admin/protokoll', '/admin/seiten', '/admin/faq', '/admin/navigation',
    '/admin/system', '/admin/einstellungen/speicher', '/admin/einstellungen/zahlung', '/admin/einstellungen/verkaeufer-versand',
    '/admin/nachfrage',
]

/** What docs/review/ACCOUNTS.md promises each role: in the rail (must) and never in it (never). */
const PROMISE = {
    verkauf: { must: ['/admin/bestellungen'], never: ['/admin/gutachten', '/admin/fahrzeuge', '/admin/katalog/import', '/admin/benutzer', '/admin/rollen', '/admin/system', '/admin/einstellungen/zahlung'] },
    lager: { must: ['/admin/felgen', '/admin/anfragen', '/admin/gutachten', '/admin/fahrzeuge'], never: ['/admin/bestellungen', '/admin/rueckbuchungen', '/admin/benutzer', '/admin/rollen', '/admin/system', '/admin/einstellungen/zahlung'] },
    admin: { must: ['/admin/bestellungen', '/admin/felgen', '/admin/katalog/import', '/admin/gutachten', '/admin/fahrzeuge', '/admin/system', '/admin/protokoll', '/admin/rollen'], never: [] },
}

/** Writes the sweep may let through: signing in, and the password once more (sudo). Nothing else. */
const ALLOWED_WRITES = [/^\/admin\/anmelden$/, /^\/admin\/bestaetigen$/]

/** Links never requested by the link check: they download, write or end the session. */
const SKIP_LINK = [/abmelden/, /export/, /\.csv(\?|$)/, /\/rechnung/, /\/bild$/, /^\/admin\/einladung\//]

const RELEASE_PHRASE = 'Nicht im Browser geklickt: freigegeben auf schriftliche Anweisung des Betreibers für die Testumgebung (staging), über die Kommandozeile'
const NOTE = 'Platzhalterpreise, vom Kunden zu ersetzen'
const X3_SIZES = ['235/45 R19', '245/40 R19', '255/40 R19']

/* ── Text rules (visible text only) ──────────────────────────────────────── */

const RULES = [
    // English a German admin should never show. Case-sensitive on purpose: „null“ in German prose is rare, `null` from JS is not.
    { kind: 'english', sev: 'S2', re: /\b(Review|Staging|Jobs?|Dashboard|Settings|Feedback|Draft|Preview|Save|Cancel|Delete|Submit|Loading|Overview|Orders?|Customers?|Products?|Pending|Published|Archived|Failed|Success|Unknown|Permitted|Conditional|Refund(?:ed)?|Dispute|Uploads?|Download|Sign in|Logout|Login|Check|Top-\w+|None|N\/A)\b/g },
    { kind: 'machine', sev: 'S1', re: /\b(undefined|null|NaN|Invalid Date|true|false)\b|\[object Object\]/g },
    { kind: 'raw-code', sev: 'S2', re: /\b(?:[A-Z]{2,}(?:_[A-Z0-9]+)+|PERMITTED|CONDITIONAL|NOT_PERMITTED|UNKNOWN|[a-z]{3,}(?:_[a-z0-9]+)+)\b/g },
    // `approval.released`, `permission.denied`: an event key printed instead of its sentence. Addresses and file names are not.
    { kind: 'raw-key', sev: 'S2', re: /(?<![@\w/.-])[a-z]{3,}\.[a-z_]{3,}(?:\.[a-z_]+)?(?![\w/@-])/g, drop: /\.(com|de|test|io|org|net|pdf|png|jpe?g|svg|webp|csv|xlsx)$|rimify|skillleo|stripe/ },
    { kind: 'todo', sev: 'S2', re: /\b(TODO|FIXME|XXX|Lorem ipsum|lorem ipsum|tbd|TBD)\b/g },
    { kind: 'placeholder', sev: 'S3', re: /Platzhalter\w*/g },
    { kind: 'em-dash', sev: 'S4', re: /\S{0,24}\s?—\s?\S{0,24}/g },
    { kind: 'format', sev: 'S2', re: /\b\d{1,3}(?:,\d{3})+\.\d{2}\b|\b\d+\.\d{2}\s?€|€\s?\d|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{1,2}:\d{2}\s?(?:AM|PM)\b|\b\d+\.\d{1,2}\s?(?:mm|kg|J|km\/h|%)(?!\w)/g },
    { kind: 'server-error', sev: 'S1', re: /SQLSTATE|Stack trace|Whoops|Server Error|Exception\b|Symfony\\|Illuminate\\/g },
]

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function password() {
    if (process.env.REVIEW_PASSWORD) {
        return process.env.REVIEW_PASSWORD
    }

    const doc = fs.readFileSync(path.join(ROOT, 'docs', 'review', 'ACCOUNTS.md'), 'utf8')
    const line = doc.split('\n').find((l) => l.includes('`verkauf@rimify.test`'))
    const ticks = line ? [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]) : []

    if (ticks.length < 2) {
        throw new Error('Kein Passwort: REVIEW_PASSWORD setzen oder docs/review/ACCOUNTS.md prüfen.')
    }

    return ticks[1]
}

function slug(href) {
    const s = href.replace(/^\/admin\/?/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()

    return s === '' ? 'uebersicht' : s.slice(0, 80)
}

function berlinToday() {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date())
}

async function settle(page, ms = 300) {
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(ms)
}

async function waitForApp(page) {
    await page.waitForFunction(() => document.querySelector('#app')?.__vue_app__ !== undefined, null, { timeout: 20_000 }).catch(() => {})
}

/** The rail as the server shipped it (HandleInertiaRequests: `admin.nav`), read from the mounted app. */
async function navOf(page) {
    return page.evaluate(() => {
        const app = document.querySelector('#app')?.__vue_app__
        const fromApp = app?.config?.globalProperties?.$page?.props?.admin?.nav
        let nav = fromApp

        if (!nav) {
            const raw = document.querySelector('#app')?.getAttribute('data-page') ?? document.querySelector('script[data-page]')?.textContent

            try {
                nav = raw ? JSON.parse(raw).props?.admin?.nav : null
            } catch {
                nav = null
            }
        }

        return (nav ?? []).map((g) => ({ group: g.label, pages: g.pages.map((p) => ({ label: p.label, href: p.href, count: p.count })) }))
    })
}

/** Everything measured on one page, in the browser. */
async function scan(page) {
    return page.evaluate(() => {
        const vw = window.innerWidth
        const doc = document.documentElement
        const describe = (el) => {
            const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean)[0] : ''

            return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '')
        }
        const visible = (el) => {
            const r = el.getBoundingClientRect()
            const s = getComputedStyle(el)

            return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
        }

        // Horizontal overflow, and the elements that cause it (not those inside a box that scrolls or clips on its own).
        const overflowX = Math.max(doc.scrollWidth, document.body.scrollWidth) - vw
        const offenders = []

        if (overflowX > 1) {
            for (const el of document.querySelectorAll('body *')) {
                if (offenders.length >= 8) {
                    break
                }

                const r = el.getBoundingClientRect()

                if (r.width === 0 || r.right <= vw + 1) {
                    continue
                }

                let a = el.parentElement
                let clipped = false

                while (a && a !== document.body) {
                    if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(a).overflowX)) {
                        clipped = true
                        break
                    }

                    a = a.parentElement
                }

                if (!clipped) {
                    offenders.push(`${describe(el)} → ${Math.round(r.right)} px`)
                }
            }
        }

        // Figures: a tile or a number cell that shows a dash, nothing, or something that is no number.
        const figures = []

        for (const el of document.querySelectorAll('.kpi__value, td.num, .num, [class*="__count"], [class*="__value"], [class*="__figure"]')) {
            if (!visible(el)) {
                continue
            }

            const t = (el.textContent ?? '').replace(/\s+/g, ' ').trim()

            if (t === '' || t === '–' || t === '—' || t === '-' || /NaN|undefined|null/.test(t)) {
                figures.push(`${describe(el)} „${t}“`)
            }
        }

        // Empty boxes: a panel, card, tile or widget with nothing in it.
        const empties = []

        for (const el of document.querySelectorAll('[class*="panel"], [class*="card"], [class*="tile"], [class*="widget"], .adm-section')) {
            if (!visible(el)) {
                continue
            }

            const t = (el.innerText ?? '').trim()

            if (t === '' && !el.querySelector('img, svg, canvas, input, select, textarea, iframe')) {
                empties.push(describe(el))
            }
        }

        // Empty states: each must say a sentence and offer an action.
        const states = [...document.querySelectorAll('.adm-state')].filter(visible).map((el) => ({
            heading: el.querySelector('.adm-state__heading')?.textContent?.trim() ?? '',
            text: el.querySelector('.adm-state__text')?.textContent?.trim() ?? '',
            action: [...el.querySelectorAll('a, button')].map((a) => a.textContent?.trim()).filter(Boolean),
        }))

        const images = [...document.images].filter((img) => img.complete && img.naturalWidth === 0 && visible(img)).map((img) => img.currentSrc || img.src)

        const links = [...document.querySelectorAll('a[href]')]
            .map((a) => ({ href: a.getAttribute('href') ?? '', text: (a.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60) }))
            .filter((l) => l.href !== '' && !l.href.startsWith('#') && !/^(mailto|tel|javascript):/i.test(l.href))

        return {
            url: location.pathname + location.search,
            title: document.querySelector('h1')?.textContent?.trim() ?? '',
            crumbs: [...document.querySelectorAll('nav[aria-label*="Brot"] li, .adm-crumbs li, [class*="crumb"] li')].map((li) => li.textContent?.trim()),
            overflowX,
            offenders,
            figures,
            empties,
            states,
            images,
            links,
            main: (document.querySelector('main') ?? document.body).innerText,
            whole: document.body.innerText,
        }
    })
}

/* ── The run ─────────────────────────────────────────────────────────────── */

const results = { base: BASE, stamp: STAMP, today: berlinToday(), roles: {}, checks: [], findings: [] }
const pass = password()
const detailPages = {}

function finding(sev, role, pageName, width, what, expected, evidence = null) {
    results.findings.push({ sev, role, page: pageName, width, what, expected, evidence })
}

fs.mkdirSync(SHOTS, { recursive: true })
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()

for (const role of ROLE_ORDER) {
    results.roles[role] = { nav: {}, pages: [], forbidden: [], links: [], blocked: [] }

    for (const width of WIDTHS) {
        const mobile = width < 768
        const context = await browser.newContext(mobile
            ? { viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: MOBILE_UA, locale: 'de-DE', timezoneId: 'Europe/Berlin' }
            : { viewport: { width, height: 900 }, locale: 'de-DE', timezoneId: 'Europe/Berlin' })

        await context.addCookies([{ name: 'rmf_consent', value: encodeURIComponent(JSON.stringify({ necessary: true, statistics: false, decidedAt: '2026-01-01T00:00:00.000Z' })), url: BASE }])

        // The read-only guard.
        await context.route('**/*', (route) => {
            const req = route.request()
            const url = new URL(req.url())

            if (['GET', 'HEAD', 'OPTIONS'].includes(req.method())) {
                return route.continue()
            }

            if (url.origin === ORIGIN && ALLOWED_WRITES.some((re) => re.test(url.pathname))) {
                return route.continue()
            }

            results.roles[role].blocked.push({ width, method: req.method(), path: url.pathname, on: current.href })

            return route.abort('blockedbyclient')
        })

        const page = await context.newPage()
        let current = { href: '(sign-in)', console: [], requests: [] }

        page.on('console', (m) => {
            const text = m.text()

            if ((m.type() === 'error' || m.type() === 'warning') && !/ERR_BLOCKED_BY_CLIENT/.test(text) && !(current.expectStatus && /Failed to load resource.*(403|404)/.test(text))) {
                current.console.push(`${m.type()}: ${text.slice(0, 220)}`)
            }
        })
        page.on('pageerror', (e) => current.console.push(`pageerror: ${String(e.message).slice(0, 220)}`))
        page.on('requestfailed', (r) => {
            if (!/ERR_BLOCKED_BY_CLIENT|ERR_ABORTED/.test(r.failure()?.errorText ?? '')) {
                current.requests.push(`failed ${r.url()} (${r.failure()?.errorText})`)
            }
        })
        page.on('response', (r) => {
            const u = r.url()

            if (r.status() >= 400 && !(current.expectStatus && r.request().isNavigationRequest()) && !(current.expectStatus && r.request().headers()['x-inertia'])) {
                current.requests.push(`http ${r.status()} ${u.startsWith(ORIGIN) ? u.slice(ORIGIN.length) : u}`)
            }
        })

        // Sign in.
        try {
            await page.goto(`${BASE}/admin/anmelden`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
            await waitForApp(page)
            await page.fill('#lg-mail', ACCOUNTS[role])
            await page.fill('#lg-pass', pass)
            await page.locator('button[type=submit]').first().click()
            await page.waitForURL(/\/admin(\?.*)?$/, { timeout: 45_000 })
            await waitForApp(page)
            await settle(page)
        } catch (e) {
            finding('S1', role, 'Anmelden', width, `Anmeldung gescheitert: ${String(e.message).split('\n')[0]}`, 'Anmeldung mit dem Konto aus docs/review/ACCOUNTS.md')
            await page.screenshot({ path: path.join(SHOTS, `${role}-${width}-anmelden-fehler.png`), fullPage: true }).catch(() => {})
            await context.close()
            continue
        }

        const nav = await navOf(page)
        const navHrefs = nav.flatMap((g) => g.pages.map((p) => p.href))
        results.roles[role].nav[width] = nav

        if (width === WIDTHS[0]) {
            const promise = PROMISE[role]

            for (const href of promise?.must ?? []) {
                if (!navHrefs.includes(href)) {
                    finding('S2', role, 'Navigation', width, `${href} fehlt in der Navigation`, 'Laut docs/review/ACCOUNTS.md gehört die Seite zu dieser Rolle')
                }
            }

            for (const href of promise?.never ?? []) {
                if (navHrefs.includes(href)) {
                    finding('S1', role, 'Navigation', width, `${href} steht in der Navigation`, 'Laut docs/review/ACCOUNTS.md darf die Rolle die Seite nicht öffnen')
                }
            }
        }

        /** Open one address, follow the password question, scan, screenshot. */
        async function visit(href, name, { expectStatus = null } = {}) {
            current = { href, console: [], requests: [], expectStatus }
            let response = null

            try {
                response = await page.goto(BASE + href, { waitUntil: 'domcontentloaded', timeout: 60_000 })
            } catch (e) {
                current.console.push(`navigation: ${String(e.message).split('\n')[0]}`)
            }

            await waitForApp(page)
            await settle(page)

            let sudo = false

            if (new URL(page.url()).pathname === '/admin/bestaetigen' && expectStatus === null) {
                sudo = true
                await page.fill('#sudo-password', pass)
                await page.locator('form button[type=submit]').first().click()
                await page.waitForURL((u) => u.pathname !== '/admin/bestaetigen', { timeout: 30_000 }).catch(() => {})
                await waitForApp(page)
                await settle(page)
            }

            // Down and back up once, so lazy blocks render before they are measured.
            await page.evaluate(async () => {
                const step = window.innerHeight
                const end = document.documentElement.scrollHeight
                const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

                for (let y = 0; y < end + step; y += step) {
                    window.scrollTo(0, y)
                    await frame()
                }

                window.scrollTo(0, 0)
                await frame()
            }).catch(() => {})

            const data = await scan(page).catch((e) => ({ error: String(e.message) }))
            const shot = path.join(SHOTS, `${role}-${width}-${slug(name ?? href)}.png`)

            if (TAKE_SHOTS) {
                await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
            }

            const record = {
                width,
                href,
                name: name ?? href,
                status: response?.status() ?? 0,
                final: data.url,
                sudo,
                title: data.title,
                console: current.console,
                requests: current.requests,
                overflowX: data.overflowX,
                offenders: data.offenders,
                figures: data.figures,
                empties: data.empties,
                states: data.states,
                images: data.images,
                shot: TAKE_SHOTS ? path.relative(ROOT, shot).replace(/\\/g, '/') : null,
                text: {},
                links: data.links ?? [],
            }

            // Text rules over the page's own content (main); the rail is measured once, on the Übersicht, as „whole“.
            const body = href === '/admin' ? data.whole ?? '' : data.main ?? ''

            for (const rule of RULES) {
                const hits = [...new Set([...(body.matchAll(rule.re) ?? [])].map((m) => m[0].trim()))].filter((h) => !(rule.drop && rule.drop.test(h)))

                if (hits.length) {
                    record.text[rule.kind] = hits.slice(0, 25)
                }
            }

            return record
        }

        function judge(record) {
            const name = record.name
            const w = record.width

            if (record.status >= 500) {
                finding('S1', role, name, w, `antwortet ${record.status}`, 'Seite lädt')
            }

            if (record.status === 403 || record.status === 404) {
                finding('S2', role, name, w, `antwortet ${record.status} („${record.title}“) – über die Navigation erreicht`, 'Was die Navigation anbietet, öffnet sich')
            }

            if (record.overflowX > 1) {
                finding(w < 768 ? 'S2' : 'S3', role, name, w, `waagrechtes Scrollen um ${record.overflowX} px: ${record.offenders.join('; ')}`, 'Kein waagrechtes Scrollen', record.shot)
            }

            for (const c of record.console) {
                finding(/pageerror|hydration/i.test(c) ? 'S1' : c.startsWith('warning') ? 'S3' : 'S2', role, name, w, `Konsole: ${c}`, 'Keine Meldung in der Konsole')
            }

            for (const r of record.requests) {
                finding('S2', role, name, w, `Anfrage: ${r}`, 'Keine fehlgeschlagene Anfrage')
            }

            for (const f of record.figures) {
                finding(/NaN|undefined|null/.test(f) ? 'S1' : 'S3', role, name, w, `Zahl fehlt: ${f}`, 'Eine Zahl oder ein Satz, der sagt, warum keine da ist', record.shot)
            }

            for (const e of record.empties) {
                finding('S3', role, name, w, `leerer Kasten: ${e}`, 'Inhalt oder ein Satz', record.shot)
            }

            for (const s of record.states) {
                if (!s.text && !s.heading) {
                    finding('S3', role, name, w, 'Leerzustand ohne Satz', 'Ein Satz, was hier stehen wird')
                }

                if (s.action.length === 0) {
                    finding('S3', role, name, w, `Leerzustand ohne Aktion: „${s.heading || s.text}“`, 'Ein Weg weiter (Link oder Knopf)')
                }
            }

            for (const img of record.images) {
                finding('S2', role, name, w, `Bild lädt nicht: ${img}`, 'Bild oder ein gestalteter Ersatz')
            }

            for (const [kind, hits] of Object.entries(record.text)) {
                const rule = RULES.find((r) => r.kind === kind)
                finding(rule.sev, role, name, w, `${kind}: ${hits.map((h) => `„${h}“`).join(', ')}`, kind === 'placeholder' ? 'Platzhalter sind als solche markiert (prüfen)' : 'Deutsch, ohne Codes, ohne Maschinentext')
            }
        }

        const pages = []
        const extra = []

        // Every page the rail offers.
        for (const href of navHrefs) {
            pages.push([href, href])
        }

        // Pages behind the rail.
        extra.push(['/admin/profil', 'Profil'], ['/admin/benachrichtigungen', 'Benachrichtigungen'])

        if (navHrefs.includes('/admin/gutachten')) {
            extra.push(['/admin/nachfrage', 'Nachfrage'])
        }

        if (navHrefs.includes('/admin/zubehoerpreise')) {
            extra.push(['/admin/zubehoerpreise/rdks', 'Zubehörpreise RDKS'])
        }

        for (const [href, name] of [...pages, ...extra]) {
            const record = await visit(href, name)
            results.roles[role].pages.push(record)
            judge(record)

            // The first record of each kind, so the detail pages can be walked and probed for the other roles.
            for (const link of record.links) {
                const m = link.href.match(/^\/admin\/(bestellungen|gutachten|fahrzeuge|konflikte|seiten|katalog\/import|felgen)\/(\d+)$/)

                if (m && !detailPages[m[1]]) {
                    detailPages[m[1]] = link.href
                }
            }
        }

        // One record of each kind this role may open.
        for (const [kind, href] of Object.entries(detailPages)) {
            const list = kind === 'katalog/import' ? '/admin/katalog/import' : `/admin/${kind}`

            if (navHrefs.includes(list)) {
                const record = await visit(href, `${list} › Detail`)
                results.roles[role].pages.push(record)
                judge(record)
            }
        }

        /* ── The checks the caller named ──────────────────────────────────── */

        // DB8GT2: the internal note in the list and above the Felge.
        if (navHrefs.includes('/admin/felgen')) {
            const check = { id: 'DB8GT2-Notiz', role, width, ok: false, evidence: {} }
            await visit('/admin/felgen?q=DB8GT2', 'Felgen DB8GT2 (Liste)')
            const row = await page.evaluate((note) => {
                const tr = [...document.querySelectorAll('tbody tr')].find((r) => /DB8GT2/i.test(r.textContent ?? ''))

                return tr ? { text: tr.innerText.replace(/\s+/g, ' ').trim(), href: tr.querySelector('a[href^="/admin/felgen/"]')?.getAttribute('href') ?? null, note: (tr.textContent ?? '').includes(note) } : null
            }, NOTE)
            check.evidence.list = row

            if (row?.href) {
                const record = await visit(row.href, 'Felge BORBET DB8GT2')
                results.roles[role].pages.push(record)
                judge(record)
                check.evidence.detail = await page.evaluate((note) => {
                    const memo = document.querySelector('.fe-memo')
                    const top = (sel) => document.querySelector(sel)?.getBoundingClientRect().top ?? null

                    return { memo: memo?.textContent?.replace(/\s+/g, ' ').trim() ?? null, hasNote: (memo?.textContent ?? '').includes(note), memoTop: top('.fe-memo'), checkTop: top('.fe-check'), formTop: top('form.fe-form'), titleTop: top('h1') }
                }, NOTE)
            }

            const d = check.evidence.detail
            check.ok = Boolean(row?.note && d?.hasNote && d.memoTop !== null && d.formTop !== null && d.memoTop < d.formTop)
            results.checks.push(check)

            if (!check.ok) {
                finding('S2', role, 'Felge BORBET DB8GT2', width, `Interne Notiz „${NOTE}“ nicht in Liste und über der Felge: ${JSON.stringify(check.evidence)}`, 'Notiz in der Liste und über dem Formular der Felge')
            }
        }

        // ABE 55255 › Vorschau im Shop › BMW X3 X83: the Auflagen grouped by size, never both snow-chain sentences in one list.
        if (navHrefs.includes('/admin/gutachten')) {
            const check = { id: 'ABE55255-Vorschau', role, width, ok: false, evidence: {} }
            await visit('/admin/gutachten', 'Gutachten (Suche ABE 55255)')
            const docHref = await page.evaluate(() => [...document.querySelectorAll('tbody tr')].find((r) => /55255/.test(r.textContent ?? ''))?.querySelector('a[href^="/admin/gutachten/"]')?.getAttribute('href') ?? null)
            check.evidence.docHref = docHref

            if (docHref) {
                const record = await visit(docHref, 'Gutachten ABE 55255')
                results.roles[role].pages.push(record)
                judge(record)

                const options = await page.locator('#gs-preview-vehicle option').allTextContents().catch(() => [])
                const label = options.find((o) => /X3/.test(o) && /X83/.test(o)) ?? null
                check.evidence.vehicle = label
                check.evidence.optionCount = options.length

                if (label) {
                    current = { href: `${docHref} (Vorschau)`, console: [], requests: [] }
                    await page.selectOption('#gs-preview-vehicle', { label })
                    await page.locator('.gs-preview-pick button[type=submit]').click()
                    await page.waitForFunction((l) => document.querySelector('.gs-preview-for')?.textContent?.includes(l), label, { timeout: 30_000 }).catch(() => {})
                    await settle(page, 600)

                    const verdicts = await page.evaluate(() => [...document.querySelectorAll('.gs-verdict')].map((v) => {
                        const groups = v.querySelector('[data-condition-groups]')
                        const clean = (el) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim()

                        return {
                            wheel: clean(v.querySelector('.gs-verdict__wheel')),
                            status: clean(v.querySelector('.gs-verdict__head .adm-tag, .gs-verdict__ok')),
                            lines: [...v.querySelectorAll(':scope > .gs-verdict__line')].map(clean),
                            heads: [...v.querySelectorAll('.cgroups__head')].map(clean),
                            common: groups ? [...groups.querySelectorAll(':scope > ul.cgroups__list > li')].map(clean) : null,
                            sizes: [...v.querySelectorAll('.cgroups__size')].map((s) => ({ head: clean(s.querySelector('.cgroups__head')), items: [...s.querySelectorAll('li')].map(clean), none: s.querySelector('.cgroups__none') ? clean(s.querySelector('.cgroups__none')) : null })),
                            lists: [...v.querySelectorAll('ul.cgroups__list')].map((ul) => [...ul.querySelectorAll('li')].map(clean)),
                        }
                    }))
                    check.evidence.verdicts = verdicts

                    const grouped = verdicts.filter((v) => v.heads[0] === 'Für jede zulässige Reifengröße' && X3_SIZES.every((size) => v.sizes.some((s) => s.head.startsWith(`Nur bei ${size}`))))
                    const together = verdicts.filter((v) => v.lists.some((list) => list.filter((li) => /Schneekette/i.test(li)).length >= 2))
                    const chainsForAll = verdicts.filter((v) => (v.common ?? []).some((li) => /Schneekette/i.test(li)))
                    const papers = verdicts.map((v) => v.lines.filter((l) => /erforderlich|Berichtigung|§/.test(l)))
                    check.evidence.grouped = grouped.length
                    check.evidence.together = together.map((v) => v.wheel)
                    check.evidence.chainsForAll = chainsForAll.map((v) => v.wheel)
                    check.evidence.papers = papers
                    check.ok = verdicts.length > 0 && grouped.length > 0 && together.length === 0 && chainsForAll.length === 0
                    await page.screenshot({ path: path.join(SHOTS, `${role}-${width}-abe-55255-vorschau-x3.png`), fullPage: true }).catch(() => {})

                    for (const c of [...current.console, ...current.requests]) {
                        finding('S2', role, 'ABE 55255 › Vorschau im Shop', width, c, 'Keine Meldung')
                    }
                }
            }

            results.checks.push(check)

            if (!check.evidence.docHref || !check.evidence.vehicle) {
                check.ok = null
                finding('S2', role, 'Gutachten › ABE 55255', width, check.evidence.docHref ? `BMW X3 X83 nicht in der Auswahl der Vorschau (${check.evidence.optionCount ?? 0} Fahrzeuge)` : 'ABE 55255 nicht in der Liste der Gutachten', 'ABE 55255 freigegeben, mit BMW X3 X83 in der Vorschau')
            } else if (!check.ok) {
                finding('S1', role, 'ABE 55255 › Vorschau im Shop (BMW X3 X83)', width, `Auflagen nicht wie verlangt gruppiert: ${JSON.stringify({ vehicle: check.evidence.vehicle, grouped: check.evidence.grouped, together: check.evidence.together, chainsForAll: check.evidence.chainsForAll })}`, '„Für jede zulässige Reifengröße“, dann „Nur mit 235/45 R19“ / „245/40 R19“ / „255/40 R19“; die zwei Schneeketten-Sätze nie in einer Liste; Papiere je Größe')
            }
        }

        // An order's Prüfnachweis: grouped the same way; the papers line not said twice.
        if (navHrefs.includes('/admin/bestellungen')) {
            const check = { id: 'Prüfnachweis', role, width, ok: false, evidence: { orders: [] } }
            await visit('/admin/bestellungen', 'Bestellungen (Suche Prüfnachweis)')
            const hrefs = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="/admin/bestellungen/"]')].map((a) => a.getAttribute('href')).filter((h) => /^\/admin\/bestellungen\/\d+$/.test(h ?? '')))].slice(0, 6))

            for (const href of hrefs) {
                const record = await visit(href, `Bestellung ${href.split('/').pop()}`)
                results.roles[role].pages.push(record)
                judge(record)
                const proofs = await page.evaluate(() => [...document.querySelectorAll('.bs-proof')].map((p) => {
                    const clean = (el) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim()
                    const groups = p.querySelector('[data-condition-groups]')
                    const items = [...p.querySelectorAll('li')].map(clean)
                    const lines = [...p.querySelectorAll('.bs-proof__line')].map(clean)
                    // Lines that are none of the proof's own (vehicle, document, tyres, papers, tyre sum): Auflagen printed loose.
                    const own = /^(Für |Laut |Reifen: |Mit den Werten|Dieser Prüfnachweis|Eintragung in die Fahrzeugpapiere erforderlich|Abnahme durch einen Prüfer|Keine (Berichtigung|Eintragung|Abnahme))/

                    return {
                        title: clean(p.querySelector('.bs-proof__title')),
                        grouped: Boolean(groups),
                        heads: [...p.querySelectorAll('.cgroups__head')].map(clean),
                        sizes: [...p.querySelectorAll('.cgroups__size .cgroups__head')].map(clean),
                        lists: [...p.querySelectorAll('ul.cgroups__list')].map((ul) => [...ul.querySelectorAll('li')].map(clean)),
                        lines,
                        loose: lines.filter((l) => !own.test(l)),
                        twice: lines.filter((l) => items.includes(l)),
                    }
                }))
                check.evidence.orders.push({ href, proofs })
            }

            const all = check.evidence.orders.flatMap((o) => o.proofs.map((p) => ({ ...p, href: o.href })))
            // Loose lines without the groups are read by a person from the evidence: a tyre sum's basis line is loose too.
            const ungrouped = all.filter((p) => !p.grouped && p.loose.length >= 2)
            const together = all.filter((p) => p.lists.some((list) => list.filter((li) => /Schneekette/i.test(li)).length >= 2))
            const twice = all.filter((p) => p.twice.length > 0)
            const sized = all.filter((p) => p.sizes.length > 0)
            check.evidence.summary = { orders: hrefs.length, proofs: all.length, grouped: all.filter((p) => p.grouped).length, withSizes: sized.map((p) => `${p.href}: ${p.sizes.join(' | ')}`), ungrouped: ungrouped.map((p) => p.href), together: together.map((p) => p.href), twice: twice.map((p) => `${p.href}: ${p.twice.join(' | ')}`) }
            check.ok = all.length === 0 ? null : ungrouped.length === 0 && together.length === 0
            results.checks.push(check)

            if (all.length === 0) {
                finding('S3', role, 'Bestellung › Prüfnachweis', width, `Kein Prüfnachweis in den ersten ${hrefs.length} Bestellungen gefunden – nicht prüfbar`, 'Mindestens eine Bestellung mit Prüfnachweis zum Ansehen')
            } else if (!check.ok) {
                finding('S1', role, 'Bestellung › Prüfnachweis', width, `Auflagen nicht gruppiert oder Schneeketten in einer Liste: ${JSON.stringify(check.evidence.summary)}`, 'Wie die Vorschau: erst für jede Größe, dann je Größe; nie beide Schneeketten-Sätze in einer Liste')
            }

            if (twice.length > 0) {
                finding('S3', role, 'Bestellung › Prüfnachweis', width, `Satz doppelt (Zeile und Auflage): ${check.evidence.summary.twice.join(' ; ')}`, 'Jeder Satz einmal (die Vorschau lässt die Eintragungszeile in der Liste weg)')
            }
        }

        // Protokoll: today's three releases on written instruction.
        if (navHrefs.includes('/admin/protokoll')) {
            const check = { id: 'Protokoll-Freigaben', role, width, ok: false, evidence: {} }
            const day = berlinToday()
            const record = await visit(`/admin/protokoll?bereich=gutachten&von=${day}&bis=${day}`, 'Protokoll (Gutachten, heute)')
            results.roles[role].pages.push(record)
            judge(record)
            const text = await page.evaluate(() => (document.querySelector('main') ?? document.body).innerText)
            const sentences = text.split('\n').filter((l) => /wurde freigegeben/.test(l))
            check.evidence.released = sentences
            check.evidence.matching = sentences.filter((s) => s.includes(RELEASE_PHRASE)).length
            check.ok = check.evidence.matching >= 3
            results.checks.push(check)

            if (!check.ok) {
                finding('S2', role, 'Protokoll', width, `${check.evidence.matching} von ${sentences.length} Freigaben von heute tragen den Satz der Anweisung`, `Drei Einträge mit „${RELEASE_PHRASE} …“`)
            }
        }

        /* ── Forbidden pages: polite, never an error, never open ──────────── */

        if (width === WIDTHS[0] && role !== 'admin') {
            const probes = BUILT.filter((href) => !navHrefs.includes(href) && !(href === '/admin/nachfrage' && navHrefs.includes('/admin/gutachten')))

            for (const [kind, href] of Object.entries(detailPages)) {
                const list = kind === 'katalog/import' ? '/admin/katalog/import' : `/admin/${kind}`

                if (!navHrefs.includes(list)) {
                    probes.push(href)
                }
            }

            for (const href of probes) {
                const record = await visit(href, `verboten ${href}`, { expectStatus: 403 })
                const polite = record.status === 403 && record.title === 'Keine Berechtigung' && !record.text['server-error']
                results.roles[role].forbidden.push({ href, status: record.status, title: record.title, polite, shot: record.shot })

                if (record.status >= 200 && record.status < 300 && record.title !== 'Keine Berechtigung' && !record.sudo) {
                    finding('S1', role, href, width, `öffnet sich (${record.status}, „${record.title}“)`, 'Höfliche Absage „Keine Berechtigung“ (403)')
                } else if (!polite) {
                    finding('S2', role, href, width, `antwortet ${record.status} „${record.title}“`, 'Höfliche Absage „Keine Berechtigung“ (403) im Rahmen des Admins')
                }
            }
        }

        /* ── A click through the rail at the desk: the client's own way around ─ */

        if (!mobile) {
            await visit('/admin', 'Übersicht (Start der Klickrunde)')

            for (const href of navHrefs) {
                const link = page.locator(`#adm-nav a[href="${href}"]`).first()

                if (!(await link.isVisible().catch(() => false))) {
                    continue
                }

                current = { href: `${href} (Klick)`, console: [], requests: [] }
                await link.click()
                await page.waitForFunction((h) => location.pathname.startsWith(h === '/admin/zubehoerpreise' ? '/admin/zubehoerpreise/' : h), href, { timeout: 30_000 }).catch(() => current.console.push('Klick führt nicht zur Seite'))
                await settle(page)

                for (const c of [...current.console, ...current.requests]) {
                    finding(/pageerror/.test(c) ? 'S1' : 'S2', role, `${href} (Klick in der Leiste)`, width, c, 'Keine Meldung')
                }
            }
        }

        /* ── Every link on every page: none dead, none to a refusal ────────── */

        if (CHECK_LINKS && width === WIDTHS[0]) {
            const seen = new Map()

            for (const record of results.roles[role].pages.filter((r) => r.width === width)) {
                for (const link of record.links) {
                    let url

                    try {
                        url = new URL(link.href, BASE)
                    } catch {
                        continue
                    }

                    const rel = url.pathname + url.search

                    if (url.origin !== ORIGIN || SKIP_LINK.some((re) => re.test(rel)) || seen.has(rel)) {
                        if (seen.has(rel)) {
                            seen.get(rel).on.add(record.name)
                        }

                        continue
                    }

                    seen.set(rel, { text: link.text, on: new Set([record.name]) })
                }
            }

            for (const [rel, info] of [...seen.entries()].slice(0, 600)) {
                const res = await context.request.get(BASE + rel, { maxRedirects: 10, timeout: 30_000 }).catch((e) => ({ status: () => 0, url: () => String(e.message) }))
                const status = res.status()
                const final = res.url()
                const entry = { href: rel, text: info.text, status, final: final.startsWith(ORIGIN) ? final.slice(ORIGIN.length) : final, on: [...info.on] }
                results.roles[role].links.push(entry)

                if (status >= 400 || status === 0 || /\/admin\/anmelden/.test(entry.final)) {
                    finding(status === 403 ? 'S2' : status >= 500 || status === 0 ? 'S1' : 'S2', role, [...info.on].slice(0, 3).join(', '), width, `Link „${info.text}“ → ${rel} antwortet ${status}${status === 403 ? ' (Keine Berechtigung)' : ''}`, 'Ein Link führt zu einer Seite, die die Rolle öffnen darf')
                }
            }
        }

        // The rail's own layout save (PATCH /admin/ansicht, a beacon as a page closes) is the reader's preference, not data.
        for (const b of results.roles[role].blocked.filter((x) => x.width === width && x.path !== '/admin/ansicht')) {
            finding('S3', role, b.on, width, `Seite schreibt von selbst: ${b.method} ${b.path} (vom Sweep blockiert)`, 'Ansehen ändert nichts')
        }

        await context.close()
    }
}

await browser.close()

/* ── Output ──────────────────────────────────────────────────────────────── */

// One line per distinct finding: the rail repeats on every page, so its words are counted once per role and width.
const lines = new Map()

for (const f of results.findings) {
    const key = `${f.sev}|${f.role}|${f.width}|${f.what}`

    if (lines.has(key)) {
        lines.get(key).pages.add(f.page)
    } else {
        lines.set(key, { ...f, pages: new Set([f.page]) })
    }
}

const order = { S1: 1, S2: 2, S3: 3, S4: 4 }
const sorted = [...lines.values()].sort((a, b) => order[a.sev] - order[b.sev] || a.role.localeCompare(b.role) || a.width - b.width)
const counts = sorted.reduce((acc, f) => ({ ...acc, [f.sev]: (acc[f.sev] ?? 0) + 1 }), {})

fs.writeFileSync(path.join(OUT, `results-${STAMP}.json`), JSON.stringify(results, (k, v) => (v instanceof Set ? [...v] : v), 2))
fs.writeFileSync(
    path.join(OUT, `auto-findings-${STAMP}.md`),
    [
        `# Admin sweep — automatic findings (${BASE}, ${STAMP})`,
        '',
        'Machine output of scripts/qa/sweep-admin.mjs — to be read and curated into docs/reviews/sweep-admin.md, not filed as is.',
        '',
        `Counts: ${['S1', 'S2', 'S3', 'S4'].map((s) => `${s} ${counts[s] ?? 0}`).join(' · ')}`,
        '',
        'Checks:',
        ...results.checks.map((c) => `- ${c.ok === null ? 'n/a ' : c.ok ? 'OK  ' : 'FAIL'} ${c.id} · ${c.role} · ${c.width}`),
        '',
        ...sorted.map((f) => `${f.sev} · ${f.role} · ${[...f.pages].slice(0, 4).join(', ')}${f.pages.size > 4 ? ` (+${f.pages.size - 4})` : ''} · ${f.width} · ${f.what} · ${f.expected}${f.evidence ? ` · ${f.evidence}` : ''}`),
        '',
    ].join('\n'),
)

console.log(`sweep done: ${['S1', 'S2', 'S3', 'S4'].map((s) => `${s} ${counts[s] ?? 0}`).join(' · ')}`)
console.log(`checks: ${results.checks.map((c) => `${c.id}/${c.role}/${c.width}=${c.ok ? 'ok' : 'FAIL'}`).join(', ')}`)
console.log(`written: docs/qa/sweep-admin/results-${STAMP}.json, docs/qa/sweep-admin/auto-findings-${STAMP}.md, docs/qa/shots/sweep-admin/`)
