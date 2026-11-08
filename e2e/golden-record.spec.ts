import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, type Page } from './fixtures'
import { signIn, waitForApp } from './bugs/faq-support'
import { placeholderPdf, searchCars } from './gutachten-erfassung-support'

/*
 * The golden record (the admin review release §1): one Felge carried through the whole product,
 * against a stand-in that says on every page what it is — a placeholder, never a real product or a
 * real Gutachten. The screenshot of each step goes to docs/review/golden-record/ and is explained in
 * docs/review/GOLDEN-RECORD.md.
 *
 *   1  Katalog › Import: a supplier file with one size → Probelauf → Importieren
 *   2  Katalog › Felgen: the imported Felge → Veröffentlichen
 *   3  Gutachten › Neues Gutachten: the PDF, Art, KBA-Nummer, pages
 *   4  The five steps: the wheel's size, a car, a tyre, an Auflage described on the way, the page
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

/** The supplier file: one size, every value plainly a stand-in (price 1,00 €, brand „Platzhalter“). */
const CSV = [
    // The Radtypenbezeichnung: no Felge is published without it (D-298).
    'sku;marke;modell;radtyp;ausfuehrung;durchmesser;breite;et;lochkreis;mittenloch;preis;bestand',
    `${SKU};Platzhalter;${MODEL};PR 18;Silber;18;8;35;5x112;66,6;1,00;8`,
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

    // A shop seeded before the rule has the stand-in without its Radtypenbezeichnung, and no Felge is published without it (D-298).
    const designation = page.locator('#fe-type')

    if ((await designation.count()) > 0 && (await designation.inputValue()) === '') {
        await designation.fill('PR 18')
        await page.getByRole('button', { name: 'Speichern', exact: true }).click()
        await expect(page.getByRole('button', { name: 'Speichern', exact: true })).toBeDisabled({ timeout: 20_000 })
        await page.reload({ waitUntil: 'networkidle' })
        await waitForApp(page)
    }

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
    // By its number: the list comes in pages (F-31), and a run's own document need not stand on the first.
    await page.goto(`/admin/gutachten?q=${encodeURIComponent(KBA)}`, { waitUntil: 'networkidle' })
    await waitForApp(page)
    const existing = page.locator('tbody tr', { hasText: KBA }).locator('.gd-link')

    if ((await existing.count()) === 0) {
        await page.goto('/admin/gutachten/neu', { waitUntil: 'networkidle' })
        await waitForApp(page)
        await page.locator('#gn-pdf').setInputFiles({ name: 'platzhalter-gutachten.pdf', mimeType: 'application/pdf', buffer: placeholderPdf(4) })
        await page.locator('#gn-kind').selectOption('ABE')
        await page.locator('#gn-number').fill(KBA)
        await page.locator('#gn-issuer').fill('Platzhalter – kein echtes Gutachten')
        await page.locator('.gn-more__summary').click()
        await page.locator('#gn-pages').fill('4')
        // How it gives its tyres' index, asked before release (D-277): a placeholder prints nothing, so the answer that
        // asks the most of a car — the papers.
        await page.locator('input[name="gn-index"][value="papers"]').check()
        await shot(page, '03-gutachten-neu')
        await page.getByRole('button', { name: 'Gutachten anlegen' }).click()
        await page.waitForURL(/\/admin\/gutachten\/\d+/, { timeout: 30_000 })
        await waitForApp(page)
    } else {
        // The placeholder another checkout typed: the checkouts share the admin's database, not its disk. Its own PDF —
        // the same bytes, by their SHA-256 — goes back where it is expected, where this disk lacks it (29.10.2026: the
        // shop gave no link to the Gutachten on the worktree).
        const file = join(tmpdir(), 'rimify-platzhalter-gutachten.pdf')
        writeFileSync(file, placeholderPdf(4))
        execFileSync('php', ['artisan', 'demo:placeholder-tables', `--pdf=${file}`], { stdio: 'pipe' })
        await existing.first().click()
        await page.waitForURL(/\/admin\/gutachten\/\d+/)
    }

    await waitForApp(page)
    const documentUrl = page.url().replace(/\?.*$/, '')

    // ── 4 · The five steps ──────────────────────────────────────────────────────
    const stepBar = page.getByRole('navigation', { name: 'Schritte zum Gutachten' })

    if (await stepBar.isVisible()) {
        // Step 2: the Felge's wheel combination, its one version front and rear; colour plays no part.
        await stepBar.getByRole('button', { name: /Felge/ }).click()
        const searched = page.waitForResponse((r) => new URL(r.url()).pathname.endsWith('/suche/felgen') && new URL(r.url()).searchParams.get('q') === MODEL)
        await page.locator('#ef-wheel-q').fill(MODEL)
        await searched
        const loaded = page.waitForResponse((r) => new URL(r.url()).searchParams.has('modell'))
        await page.locator('.ef-model').first().click()
        await loaded
        await page.locator('.ef-axle').first().locator('.ef-size input').first().check()
        const stored = page.waitForResponse((r) => r.url().endsWith('/erfassung/kombinationen') && r.request().method() === 'POST')
        await page.getByRole('button', { name: 'Kombination hinzufügen' }).click()
        await stored
        await shot(page, '04-felge')
        await page.getByRole('button', { name: 'Weiter: Fahrzeuge' }).click()

        // Step 3: the first car the search offers whose legal data is complete (R-03).
        await searchCars(page, 'BMW')
        await page.locator('.ef-hit', { hasNotText: 'Angaben für die Prüfung fehlen' }).first().locator('input').check()
        await expect(page.locator('.ef-chosen__car')).toHaveCount(1)
        await page.getByRole('button', { name: 'Weiter: Reifen' }).click()

        // Step 4: a tyre, an Auflage described on the way, the page.
        await page.getByRole('button', { name: 'Kombination', exact: true }).click()
        await page.locator('[id^=ef-front-]').first().fill('225/40 R18')
        await page.locator('[id^=ef-front-]').first().blur()
        const codes = page.locator('input[id^=ef-codes-]').first()
        await codes.fill('P1')
        await codes.press('Enter')
        await page.getByRole('button', { name: 'beschreiben' }).first().click()
        await page.locator('textarea[id*="-def-P1-text"]').fill('Platzhalter: Radschrauben nach 50 km nachziehen.')
        await page.locator('select[id*="-def-P1-kind"]').selectOption('hinweis')
        await page.locator('.ef-popover').getByRole('button', { name: 'Speichern' }).click()
        await expect(page.locator('.ef-code--open', { hasText: 'P1' })).toHaveCount(0, { timeout: 15_000 })
        const lineStored = page.waitForResponse((r) => /\/erfassung\/fahrzeuge\/\d+$/.test(new URL(r.url()).pathname) && r.request().method() === 'PUT')
        await page.locator('#ef-page').fill(String(PAGE))
        await lineStored
        await shot(page, '04-zeilen-anlegen')
        await stepBar.getByRole('button', { name: /Freigeben/ }).click()

        const unproven = page.getByRole('button', { name: 'Daten geprüft' })

        for (let left = await unproven.count(); left > 0; left -= 1) {
            await unproven.first().click()
            await expect(unproven).toHaveCount(left - 1, { timeout: 15_000 })
        }
    }

    // The vehicle the rows name, with its key numbers, for the shop.
    const title = (await page.locator('.gs-car__name, td[data-label="Fahrzeug"]').first().textContent()) ?? ''
    const match = /^(.*?) · .*HSN (\d{4}) · TSN ([A-Z0-9]{3})/.exec(title.trim())
    expect(match, `the rows name a vehicle with its keys: ${title}`).not.toBeNull()
    const keys = { name: match![1]!, hsn: match![2]!, tsn: match![3]! }
    await shot(page, '04-verwendungsbereich')

    // ── 4b · Its table of tyre load at speed ──────────────────────────────────────────────────
    // A document carries its own table, or the shop cannot confirm tyres above 210 km/h (the C9 reviews).
    // A placeholder has none to type: it gets ABE 55255's example table, marked as the demo seed's so nobody
    // reads it as this document's content (the operator's decision of 29.09.2026) — the step ApprovalSeeder
    // runs too.
    // Only a draft takes it; a released placeholder already has its table.
    if (await stepBar.isVisible()) {
        execFileSync('php', ['artisan', 'demo:placeholder-tables'], { stdio: 'pipe' })
        await page.reload({ waitUntil: 'networkidle' })
        await waitForApp(page)
        await stepBar.getByRole('button', { name: /Freigeben/ }).click()
    }

    await shot(page, '04b-tragfaehigkeitstabelle')

    // ── 5 · Vorschau ────────────────────────────────────────────
    await page.getByRole('button', { name: 'Vorschau zeigen' }).click()
    await expect(page.locator('.gs-verdict').first()).toBeVisible({ timeout: 20_000 })
    await shot(page, '05-vorschau')

    // ── 6 · Freigeben ─────────────────────────────────────────────────────────────────────
    const release = page.locator('.ef-actions').getByRole('button', { name: 'Freigeben', exact: true })

    if (await release.isVisible()) {
        await expect(release).toBeEnabled({ timeout: 20_000 })
        await release.click()
        const dialog = page.getByRole('dialog')
        await dialog.locator('#rd-c-complete').check()
        await dialog.locator('input[name="rd-a"][value="none"]').check()
        await dialog.locator('button[type="submit"]').click()
        await expect(page.locator('.adm-page__context')).toContainText('Freigegeben', { timeout: 20_000 })
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
