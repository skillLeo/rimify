/*
 * Gutachten-Eingabe: types a transcribed Gutachten into the admin — through the admin flow, never a seeder.
 *
 *   RIMIFY_ADMIN_EMAIL=… RIMIFY_ADMIN_PASSWORD=… node e2e/tools/gutachten-eingabe.mjs \
 *     --dokument docs/gutachten/abe-55255.json --pdf "C:\…\Borbet DB8GT2_19_ABE_BMW.pdf" [--base http://127.0.0.1:8000]
 *
 * It signs in as that admin and does what a person does on the Gutachten screens: the PDF and the first page's
 * facts through „Neues Gutachten“, then the requests those screens send — the Auflagenverzeichnis, the cars
 * „aus diesem Gutachten“, the Verwendungsbereich rows, the Befestigungsmittel, the Hinweise, the Nacharbeit
 * measures, the table of tyre load at speed. Every one passes the same Form Request and Policy and leaves the
 * same Protokoll entry as a person's.
 *
 * It releases nothing: the document stays a draft for a person to check against the PDF and release
 * („Freigeben“). Run again, it takes what is there — a document, a code, a car, a row that exists is kept.
 *
 * The transcription (docs/gutachten/*.json) holds the rows as the document prints them, block by block, with
 * the cars each block names (docs/gutachten/fahrzeuge.json). Where one car stands in several blocks of one
 * document, the blocks become that car's one row: what all of them print stays on the row, what only one prints
 * goes to that block's sizes — so a size keeps exactly the codes its block gives it.
 */

import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).reduce((out, arg, i, all) => (arg.startsWith('--') ? [...out, [arg.slice(2), all[i + 1]]] : out), []))
const BASE = args.base ?? 'http://127.0.0.1:8000'
const EMAIL = process.env.RIMIFY_ADMIN_EMAIL
const PASSWORD = process.env.RIMIFY_ADMIN_PASSWORD

if (!args.dokument || !args.pdf || !EMAIL || !PASSWORD) {
    console.error('Aufruf: RIMIFY_ADMIN_EMAIL=… RIMIFY_ADMIN_PASSWORD=… node e2e/tools/gutachten-eingabe.mjs --dokument <json> --pdf <pdf> [--base <url>]')
    process.exit(2)
}

const transcription = JSON.parse(fs.readFileSync(args.dokument, 'utf8'))
const cars = JSON.parse(fs.readFileSync(path.join(path.dirname(args.dokument), 'fahrzeuge.json'), 'utf8'))
const carByKey = new Map(cars.map((c) => [c.key, c]))
const doc = transcription.document
const number = doc.kba_number ?? doc.report_number
const docTag = doc.kba_number === '55255' ? '55255' : '366'
const log = (line) => console.log(line)

const browser = await chromium.launch()
const context = await browser.newContext({ baseURL: BASE, locale: 'de-DE' })
const page = await context.newPage()

/* ── Sign in ─────────────────────────────────────────────────────────────────────────── */
await page.goto('/admin/anmelden', { waitUntil: 'domcontentloaded' })
await page.fill('#lg-mail', EMAIL)
await page.fill('#lg-pass', PASSWORD)
await page.locator('button[type=submit]').first().click()
// Signed in once the sign-in page is left — `/admin/anmelden` itself would match a looser pattern.
await page.waitForURL((url) => !url.pathname.startsWith('/admin/anmelden'), { timeout: 30_000 })

async function xsrf() {
    const cookie = (await context.cookies()).find((c) => c.name === 'XSRF-TOKEN')

    return cookie ? decodeURIComponent(cookie.value) : ''
}

/**
 * A request as the entry screens send it; a refusal is said with its sentences and stops the run. The routes'
 * own limits apply as they do to a person (car creation: 30 a minute) — the run waits as long as the server says.
 */
async function send(method, url, data, { allow = [] } = {}) {
    let response

    for (let attempt = 0; ; attempt++) {
        response = await page.request.fetch(url, {
            method,
            data,
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': await xsrf() },
            maxRedirects: 0,
        })

        if (response.status() !== 429 || attempt >= 5) break

        const wait = Number(response.headers()['retry-after'] ?? 30)
        log(`  (Grenze der Route erreicht – ${wait} s warten)`)
        await page.waitForTimeout((wait + 1) * 1000)
    }

    const status = response.status()

    if (status >= 400 && !allow.includes(status)) {
        const body = await response.text()
        throw new Error(`${method} ${url} → ${status}\n${body.slice(0, 1500)}`)
    }

    return { status, json: status === 422 || status === 201 || status === 200 ? await response.json().catch(() => null) : null }
}

/** A read the entry screens make (the searches), waiting out the route's own limit like send(). */
async function getJson(url) {
    for (let attempt = 0; ; attempt++) {
        const response = await page.request.get(url, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })

        if (response.status() === 429 && attempt < 5) {
            const wait = Number(response.headers()['retry-after'] ?? 30)
            log(`  (Grenze der Suche erreicht – ${wait} s warten)`)
            await page.waitForTimeout((wait + 1) * 1000)

            continue
        }

        if (!response.ok()) {
            throw new Error(`GET ${url} → ${response.status()}`)
        }

        return response.json()
    }
}

/** The Inertia page the browser received: its JSON script (Inertia v2), else the #app attribute. */
async function pageData() {
    const script = page.locator('script[data-page="app"]')

    if ((await script.count()) > 0) {
        return JSON.parse((await script.first().textContent()) ?? '{}')
    }

    return JSON.parse((await page.locator('#app').getAttribute('data-page')) ?? '{}')
}

/** The props the Gutachten page is rendered with, read as the browser receives them. */
async function props(id) {
    await page.goto(`/admin/gutachten/${id}`, { waitUntil: 'domcontentloaded' })

    return (await pageData()).props
}

/* ── The document: found by its number, or created through „Neues Gutachten“ ─────────────── */
let id = null

await page.goto('/admin/gutachten', { waitUntil: 'domcontentloaded' })
const listed = (await pageData()).props.documents ?? []
const existing = listed.find((d) => d.reportNumber === number)

if (existing) {
    if (existing.status !== 'draft') {
        throw new Error(`${number} ist schon ${existing.status} – eingegeben wird nur in einen Entwurf.`)
    }

    id = existing.id
    log(`Gutachten ${number}: Entwurf #${id} gefunden.`)
} else {
    await page.goto('/admin/gutachten/neu', { waitUntil: 'networkidle' })
    await page.locator('#gn-pdf').setInputFiles(args.pdf)
    await page.locator('#gn-kind').selectOption(doc.kind)
    await page.locator('#gn-number').fill(number)
    await page.locator('#gn-issuer').fill(doc.issuer)
    await page.locator('#gn-pages').fill(String(doc.page_count))

    if (doc.kind === 'NACHTRAG') {
        await page.locator('[id$="base-number"]').fill(doc.supplement_to_number)
    }

    await page.getByRole('button', { name: 'Gutachten anlegen' }).click()

    try {
        await page.waitForURL(/\/admin\/gutachten\/\d+$/, { timeout: 60_000 })
    } catch {
        const said = await page.locator('.form-field__error, .adm-alert').evaluateAll((els) => els.map((e) => e.textContent?.trim()).filter(Boolean))
        throw new Error(`„Gutachten anlegen“ wurde nicht angenommen: ${said.join(' · ') || '(kein Satz auf der Seite)'}`)
    }
    id = Number(/(\d+)$/.exec(page.url())[1])
    log(`Gutachten ${number}: als Entwurf #${id} angelegt, mit dem PDF.`)
}

/* ── The first page's facts ─────────────────────────────────────────────────────────── */
await send('PUT', `/admin/gutachten/${id}`, {
    kind: doc.kind,
    kba_number: doc.kba_number ?? '',
    report_number: doc.report_number ?? '',
    approval_mark: '',
    issuer: doc.issuer,
    issued_on: doc.issued_on ?? '',
    page_count: doc.page_count,
    supersedes_id: null,
    supplement_to_id: null,
    supplement_to_number: doc.supplement_to_number ?? '',
    annex: doc.annex ?? '',
    test_report_number: doc.test_report_number ?? '',
    copy_number: doc.copy_number ?? '',
    designation_number: doc.designation_number ?? '',
    test_site: doc.test_site ?? '',
    test_date: doc.test_date ?? '',
    revision_date: doc.revision_date ?? '',
    valid_from_production: doc.valid_from_production ?? '',
})
log('  Angaben der ersten Seite gespeichert.')

/* ── The Auflagenverzeichnis ────────────────────────────────────────────────────────── */
let current = await props(id)
const have = new Set(current.conditions.map((c) => c.code))
const missing = transcription.conditions.filter((c) => !have.has(c.code))

for (let i = 0; i < missing.length; i += 100) {
    await send('POST', `/admin/gutachten/${id}/auflagen/stapel`, { entries: missing.slice(i, i + 100) })
}

// A code that stands, but not as the transcription reads it now, is corrected the way a person corrects it:
// on its own entry (the document is a draft, so its codes may change).
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
let corrected = 0

for (const entry of transcription.conditions) {
    const there = current.conditions.find((c) => c.code === entry.code)

    if (!there) continue

    const differs = there.text !== entry.text_de || there.kind !== entry.kind || there.page !== entry.source_page
        || !same(there.bodyForms?.length ? there.bodyForms : null, entry.body_forms ?? null) || !same(there.drive, entry.drive ?? null)
        || (there.maxAxleLoadKg ?? null) !== (entry.max_axle_load_kg ?? null) || (there.axle ?? null) !== (entry.axle ?? null)

    if (differs) {
        await send('PUT', `/admin/gutachten/${id}/auflagen/${there.id}`, entry)
        corrected++
    }
}

log(`  Auflagenverzeichnis: ${missing.length} Codes eingetragen, ${have.size} standen schon${corrected ? `, ${corrected} berichtigt` : ''}.`)

/* ── Befestigungsmittel, Hinweise, the table ────────────────────────────────────────── */
// A Befestigungsmittel that stands but reads otherwise is taken out and entered again — the screen has no edit.
for (const f of transcription.fasteners) {
    const there = current.fasteners.find((x) => x.number === f.number)
    const differs = there && (there.thread !== f.thread || there.seat !== f.seat || there.torqueNm !== f.torque_nm || there.shaftLengthMm !== f.shaft_length_mm
        || (there.articleNumber ?? null) !== (f.article_number ?? null) || (there.vehicleTypes ?? null) !== (f.vehicle_types ?? null) || there.page !== f.source_page)

    if (there && !differs) continue

    if (there) {
        await send('DELETE', `/admin/gutachten/${id}/befestigungsmittel/${there.id}`)
    }

    await send('POST', `/admin/gutachten/${id}/befestigungsmittel`, f)
}

const noticesThere = new Set(current.notices.map((n) => n.text))
const noticesWanted = new Set(transcription.notices.map((n) => n.text_de))

for (const n of transcription.notices.filter((x) => !noticesThere.has(x.text_de))) {
    await send('POST', `/admin/gutachten/${id}/hinweise`, n)
}

// A Hinweis the transcription no longer carries (the page-24 Hinweisblatt, D-03) is taken out of the draft.
for (const n of current.notices.filter((x) => !noticesWanted.has(x.text))) {
    await send('DELETE', `/admin/gutachten/${id}/hinweise/${n.id}`)
    log(`  Hinweis entfernt (Seite ${n.page}): ${n.text.slice(0, 60)} …`)
}

if (transcription.derating) {
    await send('PUT', `/admin/gutachten/${id}/tragfaehigkeitstabelle`, transcription.derating)
}

log(`  Befestigungsmittel ${transcription.fasteners.length}, Hinweise ${transcription.notices.length}${transcription.derating ? ', Tabelle der Tragfähigkeit' : ''}.`)

/* ── Nacharbeit mit Maßen ────────────────────────────────────────────────────────────── */
current = await props(id)
const conditionId = new Map(current.conditions.map((c) => [c.code, c.id]))
const reworksThere = new Set(current.reworks.map((r) => `${r.code}|${r.vehicleType}|${r.axle}`))
let reworks = 0

for (const r of transcription.reworks) {
    if (reworksThere.has(`${r.code}|${r.vehicle_type}|${r.axle}`)) continue
    const { code, ...rest } = r
    await send('POST', `/admin/gutachten/${id}/nacharbeit`, { document_condition_id: conditionId.get(code), ...rest })
    reworks++
}

if (transcription.reworks.length) log(`  Nacharbeit: ${reworks} Maße eingetragen.`)

/* ── The sizes of the catalogue the rows are for ────────────────────────────────────── */
const wheels = await getJson('/admin/gutachten/suche/felgen?q=DB8GT2')
const configIds = wheels.groups.flatMap((g) => g.sizes).filter((s) => transcription.configs.includes(s.sku)).map((s) => s.id)

if (configIds.length !== transcription.configs.length) {
    throw new Error(`Felgengrößen ${transcription.configs.join(', ')} nicht alle im Katalog (gefunden: ${configIds.length}).`)
}

/* ── The cars: found, or created from the document that names them ───────────────────── */
const carIds = new Map()
const needed = [...new Set(transcription.groups.flatMap((g) => g.cars))]
const otherDocs = new Map()

async function documentIdFor(tag) {
    if (tag === docTag) return id
    if (otherDocs.has(tag)) return otherDocs.get(tag)
    await page.goto('/admin/gutachten', { waitUntil: 'domcontentloaded' })
    const docs = (await pageData()).props.documents ?? []
    const other = docs.find((d) => d.reportNumber === (tag === '55255' ? '55255' : '366-0350-21-WIRD/N1'))
    otherDocs.set(tag, other && other.status === 'draft' ? other.id : null)

    return otherDocs.get(tag)
}

/** The car's name as the admin labels it (VehicleName): the model once — `BMW X3`, never `BMW X3 X3`. */
function nameOf(car) {
    const variant = car.variant ?? car.type

    return `${car.make} ${variant.startsWith(car.model) ? variant : `${car.model} ${variant}`}`
}

async function findCar(car) {
    const items = (await getJson(`/admin/gutachten/suche/fahrzeuge?q=${encodeURIComponent(car.eg)}`)).items ?? []

    return items.find((v) => v.label.startsWith(`${nameOf(car)} ·`) || v.label === nameOf(car))?.id ?? null
}

let createdCars = 0
const waiting = []

for (const key of needed) {
    const car = carByKey.get(key)
    let carId = await findCar(car)

    if (carId === null) {
        const from = await documentIdFor(car.doc)

        // Named by the other document, which is not entered yet: its row follows on the next run.
        if (from === null) {
            waiting.push(`${nameOf(car)} (${car.eg})`)

            continue
        }

        const made = await send('POST', `/admin/gutachten/${from}/fahrzeuge`, {
            make: car.make, model: car.model, variant: car.variant ?? '', type_designation: car.type, eg_number: car.eg,
            body_form: car.body ?? '', drive_axle: car.drive ?? '', source_page: car.page,
        })
        carId = made.json.id
        createdCars++
    }

    carIds.set(key, carId)
}

log(`  Fahrzeuge: ${needed.length} gebraucht, ${createdCars} aus dem Gutachten angelegt.`)

/* ── The rows: one per car, its blocks read together ────────────────────────────────── */
const entryKey = (s) => [s.width_mm, s.aspect, s.diameter, s.axle, s.kw_min ?? '', s.kw_max ?? '', s.min_load_index ?? '', s.min_speed_symbol ?? ''].join('|')

function rowFor(blocks) {
    const common = blocks.map((b) => new Set(b.codes)).reduce((a, b) => new Set([...a].filter((c) => b.has(c))))
    const sizes = new Map()

    for (const block of blocks) {
        const own = block.codes.filter((c) => !common.has(c))

        for (const size of block.sizes) {
            const codes = [...new Set([...size.codes, ...own])]
            const key = entryKey(size)
            const seen = sizes.get(key)
            // The same size at the same band and index in two blocks: one entry with what both print.
            sizes.set(key, seen ? { ...seen, codes: [...new Set([...seen.codes, ...codes])] } : { ...size, codes })
        }
    }

    return {
        codes: blocks[0].codes.filter((c) => common.has(c)),
        sizes: [...sizes.values()],
        page: Math.min(...blocks.map((b) => b.page)),
    }
}

for (const key of needed.filter((k) => carIds.has(k))) {
    const row = rowFor(transcription.groups.filter((g) => g.cars.includes(key)))
    await send('POST', `/admin/gutachten/${id}/zeilen`, {
        vehicle_ids: [carIds.get(key)],
        config_ids: configIds,
        axle: 'ALL',
        entry_override: null,
        entry_override_reason: null,
        entry_note: '',
        source_page: row.page,
        build_from: null,
        build_to: null,
        width_min: '',
        width_max: '',
        et_min: '',
        et_max: '',
        centre_bore: '',
        tyre_sizes: row.sizes.map(({ codes, ...s }) => ({ ...s, min_speed_symbol: s.min_speed_symbol ?? '', codes })),
        conditions: row.codes.map((code) => ({ code, note: '' })),
    })
}

log(`  Verwendungsbereich: ${carIds.size} Fahrzeuge × ${configIds.length} Felgengrößen gesendet.`)

if (waiting.length) {
    log(`  Warten auf das andere Gutachten (dort benannt, noch nicht eingegeben) – nach dessen Eingabe noch einmal ausführen: ${waiting.join('; ')}`)
}

/* ── What stands between the draft and its release ──────────────────────────────────── */
current = await props(id)
log(`  Zeilen im Entwurf: ${current.rows.length}.`)
log(current.blockers.length === 0 ? '  Freigabe möglich – durch eine Person, nach dem Abgleich mit dem PDF.' : `  Vor der Freigabe offen: ${current.blockers.join(' ')}`)

await browser.close()
