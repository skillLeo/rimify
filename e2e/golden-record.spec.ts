import { execFileSync } from 'node:child_process'
import { expect, test, type Page } from './fixtures'
import { signIn, waitForApp } from './bugs/faq-support'

/*
 * The golden record (the admin review release §1): one Felge carried through the whole product,
 * against a stand-in that says on every page what it is — a placeholder, never a real product or a
 * real Gutachten. The screenshot of each step goes to docs/review/golden-record/ and is explained in
 * docs/review/GOLDEN-RECORD.md.
 *
 *   1  Katalog › Import: a supplier file with one size → Probelauf → Importieren
 *   2  Katalog › Felgen: the imported Felge → Veröffentlichen
 *   3  Gutachten › Neues Gutachten: the PDF, Art, KBA-Nummer, pages
 *   4  Verwendungsbereich: vehicle × size, tyre size, an Auflage from the Katalog, the page
 *  4b  Its table of tyre load at speed: the example one, marked as the demo seed's (demo:placeholder-tables)
 *   5  Vorschau: what the shop will answer, by the shop's own check
 *   6  Freigeben
 *   7  Shop: the car by HSN/TSN
 *   8  Shop: the Felge with its verdict, its Auflage and the PDF at the row's page
 *   9  Warenkorb → Kasse → Testzahlung (no money moves)
 *  10  Bestellbestätigung
 *  11  Verkauf › Bestellung: the verdict frozen at the moment of purchase
 *
 * It runs once, on the desk (1440). Run again, it takes what is already there: the import is then
 * unchanged, the Gutachten already freigegeben, and only the order is new. No fixture id, brand, image
 * path or count is assumed — the vehicle is the first the Gutachten search offers with complete data.
 */

const DIR = 'docs/review/golden-record'
const SKU = 'RIMIFY-PROBELAUF-01'
const MODEL = 'Probelauf'
const KBA = 'PLATZHALTER-GR-1'
const PAGE = 2

test.setTimeout(240_000)

/** A PDF of `pages` pages that says on each one that it is a placeholder and no Gutachten. */
function placeholderPdf(pages: number): Buffer {
    const escape = (text: string): string => text.replace(/[\\()]/g, (c) => `\\${c}`)
    const bodies: string[] = []
    const kids: number[] = []
    let next = 4

    for (let n = 1; n <= pages; n += 1) {
        const page = next++
        const content = next++
        kids.push(page)
        const lines = ['PLATZHALTER - kein echtes Gutachten', 'RIMIFY Probelauf der Vorschau', `Seite ${n} von ${pages}`, 'Dieses Dokument sagt nichts ueber ein Fahrzeug.']
        const stream = `BT /F1 20 Tf 60 760 Td ${lines.map((line, i) => `${i ? '0 -32 Td ' : ''}(${escape(line)}) Tj`).join(' ')} ET`
        bodies[content] = `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`
        bodies[page] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${content} 0 R >>`
    }

    bodies[1] = '<< /Type /Catalog /Pages 2 0 R >>'
    bodies[2] = `<< /Type /Pages /Kids [${kids.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages} >>`
    bodies[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'

    let out = '%PDF-1.4\n'
    const offsets: number[] = []

    for (let id = 1; id < next; id += 1) {
        offsets[id] = Buffer.byteLength(out, 'latin1')
        out += `${id} 0 obj\n${bodies[id]}\nendobj\n`
    }

    const xref = Buffer.byteLength(out, 'latin1')
    out += `xref\n0 ${next}\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`
    out += `trailer\n<< /Size ${next} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`

    return Buffer.from(out, 'latin1')
}

/** The supplier file: one size, every value plainly a stand-in (price 1,00 €, brand „Platzhalter“). */
const CSV = [
    'sku;marke;modell;ausfuehrung;durchmesser;breite;et;lochkreis;mittenloch;preis;bestand',
    `${SKU};Platzhalter;${MODEL};Silber;18;8;35;5x112;66,6;1,00;8`,
].join('\n')

/* The whole page, from its top: a full-page picture taken while scrolled draws the sticky rail and bar mid-page. */
async function shot(page: Page, name: string): Promise<void> {
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(150)
    await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true })
}

async function confirm(page: Page, label: string): Promise<void> {
    await page.getByRole('alertdialog').or(page.getByRole('dialog')).getByRole('button', { name: label, exact: true }).click()
}

test('the golden record, from the supplier file to the frozen proof in Verkauf', async ({ page }, info) => {
    test.skip(info.project.name.includes('390'), 'the golden record is recorded once, on the desk')

    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))

    await signIn(page)

    // ── 1 · Katalog › Import ──────────────────────────────────────────────────────────────
    await page.goto(`/admin/felgen?q=${encodeURIComponent(MODEL)}`, { waitUntil: 'networkidle' })
    await waitForApp(page)

    if ((await page.locator('.fg-name', { hasText: MODEL }).count()) === 0) {
        await page.goto('/admin/katalog/import', { waitUntil: 'networkidle' })
        await waitForApp(page)
        await page.locator('#im-file').setInputFiles({ name: 'platzhalter-lieferant.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV, 'utf8') })
        await page.getByRole('button', { name: 'Probelauf starten' }).click()
        await page.waitForURL(/\/admin\/katalog\/import\/\d+$/)
        await waitForApp(page)
        await shot(page, '01-import-probelauf')
        await page.getByRole('button', { name: 'Importieren', exact: true }).click()
        await confirm(page, 'Importieren')
        await expect(page.getByRole('button', { name: 'Import zurücknehmen' })).toBeVisible({ timeout: 30_000 })
        await shot(page, '01-import-fertig')
        await page.goto(`/admin/felgen?q=${encodeURIComponent(MODEL)}`, { waitUntil: 'networkidle' })
        await waitForApp(page)
    }

    // ── 2 · Katalog › Felgen: publish ─────────────────────────────────────────────────────
    await page.locator('.fg-name', { hasText: MODEL }).first().click()
    await page.waitForURL(/\/admin\/felgen\/\d+$/)
    await waitForApp(page)

    // The stand-in's size must be available to be bought — available or not, never counted (D-299).
    const available = page.getByLabel('Verfügbarkeit, Zeile 1')

    if ((await available.count()) > 0 && (await available.evaluate((select: HTMLSelectElement) => select.options[select.selectedIndex]?.text ?? '')) !== 'Verfügbar') {
        await available.selectOption({ label: 'Verfügbar' })
        await page.getByRole('button', { name: 'Speichern', exact: true }).click()
        await expect(page.getByRole('button', { name: 'Speichern', exact: true })).toBeDisabled({ timeout: 20_000 })
    }

    const publish = page.getByRole('button', { name: 'Veröffentlichen' })

    if (await publish.isVisible()) {
        await publish.click()
        await confirm(page, 'Veröffentlichen')
        await expect(page.getByText('Im Shop', { exact: true }).first()).toBeVisible({ timeout: 20_000 })
    }

    await shot(page, '02-felge-veroeffentlicht')

    // ── 3 · Gutachten › Neues Gutachten ───────────────────────────────────────────────────
    await page.goto('/admin/gutachten', { waitUntil: 'networkidle' })
    await waitForApp(page)
    const existing = page.locator('tbody tr', { hasText: KBA }).locator('.gd-link')

    if ((await existing.count()) === 0) {
        await page.goto('/admin/gutachten/neu', { waitUntil: 'networkidle' })
        await waitForApp(page)
        await page.locator('#gn-pdf').setInputFiles({ name: 'platzhalter-gutachten.pdf', mimeType: 'application/pdf', buffer: placeholderPdf(4) })
        await page.locator('#gn-kind').selectOption('ABE')
        await page.locator('#gn-number').fill(KBA)
        await page.locator('#gn-issuer').fill('Platzhalter – kein echtes Gutachten')
        await page.locator('#gn-pages').fill('4')
        // How it gives its tyres' index, asked before release (D-277): a placeholder prints nothing, so the answer that
        // asks the most of a car — the papers.
        await page.locator('input[name="gn-index"][value="papers"]').check()
        await shot(page, '03-gutachten-neu')
        await page.getByRole('button', { name: 'Gutachten anlegen' }).click()
        await page.waitForURL(/\/admin\/gutachten\/\d+$/, { timeout: 30_000 })
        await waitForApp(page)

        // ── 3b · Zählung — before the first row, from the PDF, each figure with its page (ADMIN-GEFUNDEN 511): the row
        // entered below carries one Auflage of the Katalog and one tyre size, and no Abnahme.
        await page.locator('#zl-codes').fill('1')
        await page.locator('#zl-codes-page').fill('2')
        await page.locator('#zl-sizes').fill('1')
        await page.locator('#zl-sizes-page').fill('2')
        await page.locator('input[name="zl-abnahme"][value="none"]').check()
        await page.getByRole('button', { name: 'Zählung speichern' }).click()
        await expect(page.locator('#zl-edit')).toBeVisible({ timeout: 20_000 })
        await shot(page, '03b-zaehlung')
    } else {
        await existing.first().click()
        await page.waitForURL(/\/admin\/gutachten\/\d+$/)
    }

    await waitForApp(page)
    const documentUrl = page.url()

    // ── 4 · Verwendungsbereich ────────────────────────────────────────────────────────────
    const draft = await page.getByRole('heading', { name: 'Zeilen hinzufügen' }).isVisible()

    if (draft && (await page.locator('.gs-group').count()) === 0) {
        // The first vehicle the search offers whose legal data is complete (R-03) — in the vehicles' own column: the
        // sizes are `.rc-hits` too, and the size list can answer first (GUTACHTEN-54's flake, 03.10.2026).
        const vehicles = page.locator('section[aria-labelledby="rc-h-vehicles"]')
        const hit = vehicles.locator('.rc-hits li', { hasNotText: 'Angaben für die Prüfung fehlen' }).first()
        await expect(hit).toBeVisible({ timeout: 20_000 })
        await hit.locator('input[type="checkbox"]').check()
        await expect(vehicles.locator('.rc-chips li'), 'the car was not chosen').toHaveCount(1)

        // The search's own list, not the first one shown before anything was typed.
        const searched = page.waitForResponse((r) => new URL(r.url()).pathname.endsWith('/suche/felgen') && new URL(r.url()).searchParams.get('q') === MODEL)
        await page.locator('#rc-wheel-q').fill(MODEL)
        await searched
        const model = page.locator('.rc-group', { hasText: MODEL }).first()
        await expect(model).toBeVisible({ timeout: 20_000 })
        await model.locator('.rc-hit--model input').check()

        await page.locator('#rc-size-0').fill('225/40 R18')
        await page.locator('#rc-page').fill(String(PAGE))
        // An Auflage of the Katalog — one that is not about the Eintragung, which the row's own box says.
        await page.locator('.rf-cond', { hasNotText: 'Eintragung' }).first().locator('input[type="checkbox"]').check()
        await shot(page, '04-zeilen-anlegen')
        await page.locator('.rc-foot .btn--primary').click()
        await expect(page.locator('.gs-group').first()).toBeVisible({ timeout: 20_000 })
    }

    // The vehicle the rows name, with its key numbers, for the shop.
    const title = (await page.locator('.gs-group__title').first().textContent()) ?? ''
    const match = /^(.*?) · .*HSN (\d{4}) · TSN ([A-Z0-9]{3})/.exec(title.trim())
    expect(match, `the rows name a vehicle with its keys: ${title}`).not.toBeNull()
    const keys = { name: match![1]!, hsn: match![2]!, tsn: match![3]! }
    await shot(page, '04-verwendungsbereich')

    // ── 4b · Its table of tyre load at speed ──────────────────────────────────────────────────
    // A document carries its own table, or the shop cannot confirm tyres above 210 km/h (the C9 reviews).
    // A placeholder has none to type: it gets ABE 55255's example table, marked as the demo seed's so nobody
    // reads it as this document's content (the operator's decision of 29.09.2026) — the step ApprovalSeeder
    // runs too.
    // The button exists only on a draft; a released placeholder already has its table.
    const tableButton = page.locator('#dt-edit')

    if ((await tableButton.count()) > 0 && (await tableButton.textContent())?.includes('Tabelle eintragen')) {
        execFileSync('php', ['artisan', 'demo:placeholder-tables'], { stdio: 'pipe' })
        await page.reload({ waitUntil: 'networkidle' })
        await waitForApp(page)
    }

    await expect(page.locator('.dt-table'), 'the placeholder has no table of tyre load at speed').toBeVisible()
    await expect(page.locator('#gs-derating-h + .adm-tag')).toHaveText('Demodaten')
    await shot(page, '04b-tragfaehigkeitstabelle')

    // ── 5 · Vorschau ──────────────────────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Vorschau zeigen' }).click()
    await expect(page.locator('.gs-verdict').first()).toBeVisible({ timeout: 20_000 })
    await shot(page, '05-vorschau')

    // ── 6 · Freigeben ─────────────────────────────────────────────────────────────────────
    const release = page.getByRole('button', { name: 'Freigeben', exact: true })

    if (await release.isVisible()) {
        await release.click()
        await confirm(page, 'Freigeben')
        await expect(page.locator('#gs-state-h')).toContainText('Freigegeben', { timeout: 20_000 })
    }

    await page.goto(documentUrl, { waitUntil: 'networkidle' })
    await waitForApp(page)
    // Said here rather than as a disabled button in the shop: a released Gutachten without its table cannot
    // confirm tyres above 210 km/h, and a released one can no longer be given a table.
    await expect(page.locator('.dt-table'), 'the Gutachten was released without a table of tyre load at speed').toBeVisible()
    await shot(page, '06-freigegeben')

    // ── 7 · Shop: the car by HSN/TSN ──────────────────────────────────────────────────────
    await page.goto('/', { waitUntil: 'networkidle' })
    await waitForApp(page)

    // The cookie notice, answered once, so it covers nothing in the pictures.
    const cookies = page.getByRole('button', { name: 'Verstanden' })

    if (await cookies.isVisible().catch(() => false)) {
        await cookies.click()
    }

    await page.getByRole('tab', { name: 'HSN/TSN' }).click()
    await page.getByLabel('HSN (Feld 2.1)').fill(keys.hsn)
    await page.getByLabel('TSN (Feld 2.2)').fill(keys.tsn)
    await shot(page, '07-shop-hsn-tsn')
    await page.locator('.sel__go').click()

    // Several cars behind one pair of numbers: the chooser, never a guess (R-01).
    const chooser = page.locator('.sel__candidate', { hasText: keys.name.split(' ').slice(1).join(' ') })

    if (await chooser.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await chooser.first().locator('input').check()
        await page.getByRole('button', { name: 'Dieses Fahrzeug wählen' }).click()
    }

    await page.waitForURL(/\/felgen/, { timeout: 20_000 })
    await waitForApp(page)

    // ── 8 · The Felge, its verdict, its Auflage, the PDF at the row's page ───────────────
    await page.goto('/felgen', { waitUntil: 'networkidle' })
    await waitForApp(page)
    const card = page.locator('article.tile', { hasText: MODEL }).first().locator('a.tile__cta')
    await expect(card).toBeVisible({ timeout: 20_000 })
    await shot(page, '08-shop-liste')
    await card.click()
    await page.waitForURL(/\/felgen\/[^/?]+/)
    await waitForApp(page)

    const panel = page.locator('.rcheck-panel').first()
    await expect(panel).toContainText(/freigegeben/i)
    // The Auflage as a sentence — or, where it only repeats it, the entry line the panel says once.
    await expect(panel.locator('.fit__conditions li, .fit__entry').first()).toBeVisible()

    const pdf = panel.locator('.fit__pdf a')
    await expect(pdf).toHaveAttribute('href', new RegExp(`#page=${PAGE}$`))
    const file = await page.request.get(((await pdf.getAttribute('href')) ?? '').replace(/#.*$/, ''))
    expect(file.ok()).toBe(true)
    expect((await file.body()).subarray(0, 5).toString('latin1')).toBe('%PDF-')
    await shot(page, '08-shop-felge-urteil')

    // ── 9 · Warenkorb → Kasse → Testzahlung ──────────────────────────────────────────────
    await page.getByRole('button', { name: 'In den Warenkorb' }).first().click()
    await expect(page.getByText('Zum Warenkorb hinzugefügt.').first()).toBeVisible({ timeout: 20_000 })
    await page.goto('/kasse', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await page.locator('#ko-mail').fill('probelauf@example.com')
    await page.locator('#ko-name').fill('Probelauf Platzhalter')
    await page.locator('#ko-street').fill('Beispielstraße')
    await page.locator('#ko-nr').fill('1')
    await page.locator('#ko-zip').fill('10115')
    await page.locator('#ko-city').fill('Berlin')
    await page.getByRole('button', { name: 'Weiter zu Optionen & Versand' }).click()
    await page.getByRole('button', { name: 'Weiter zur Zahlung' }).click()
    await expect(page.locator('#ko-sandbox')).toBeVisible()
    await shot(page, '09-kasse-testbestellung')
    await page.getByRole('button', { name: 'Zahlungspflichtig bestellen' }).click()
    await page.waitForURL(/\/kasse\/testzahlung\//, { timeout: 30_000 })
    await waitForApp(page)
    await shot(page, '09-testzahlung')
    await page.getByRole('button', { name: 'Zahlung erfolgreich' }).click()

    // ── 10 · Bestellbestätigung ───────────────────────────────────────────────────────────
    await page.waitForURL(/\/bestellung\/[0-9a-f]{8}-[0-9a-f]{4}-4/, { timeout: 30_000 })
    await waitForApp(page)
    // The address carries the order's public id (D-354); its number stands on the page.
    const number = (await page.locator('.ord__number').first().innerText()).trim()
    await shot(page, '10-bestellbestaetigung')

    // ── 11 · Verkauf › Bestellung: the verdict frozen at the moment of purchase ─────────
    await page.goto(`/admin/bestellungen?q=${encodeURIComponent(number)}`, { waitUntil: 'networkidle' })
    await waitForApp(page)
    await page.locator('.ob-number', { hasText: number }).first().click()
    await page.waitForURL(/\/admin\/bestellungen\/\d+$/)
    await waitForApp(page)
    await expect(page.getByText('Testzahlung').first()).toBeVisible()
    await shot(page, '11-verkauf-bestellung')

    expect(errors).toEqual([])
})
