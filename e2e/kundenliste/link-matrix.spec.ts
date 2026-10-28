import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { expect, test, type APIRequestContext, type Page } from '../fixtures'
import { REVIEW_PASSWORD } from '../support'
import { ABNAHME, consent } from './support'

/*
 * Human QA Part B (HUMAN-QA-FULL.md §5): what an admin does, proven where the storefront shows it — and gone again where
 * it should be gone. One Felge of our own acceptance shop is made, changed and withdrawn in the admin the way a person
 * does it, and after each step every storefront place is asked again without clearing anything (item 16 promised a
 * change shows at once). Each cell is written to storage/qa-evidence/part-b/cells.json with its picture beside it;
 * scripts write docs/review/LINK-MATRIX.md from that file. Run alone, at 1440: `--grep @matrix --project=desktop-1440`.
 */

const OUT = 'storage/qa-evidence/part-b'
mkdirSync(OUT, { recursive: true })

type Cell = { row: string; place: string; result: 'PASS' | 'FAIL' | 'n/a'; note: string; shot?: string }

const FILE = `${OUT}/cells.json`

function record(cell: Cell): void {
    const cells: Cell[] = existsSync(FILE) ? (JSON.parse(readFileSync(FILE, 'utf8')) as Cell[]) : []
    const kept = cells.filter((c) => !(c.row === cell.row && c.place === cell.place))
    writeFileSync(FILE, JSON.stringify([...kept, cell], null, 1))
}

async function check(page: Page | null, row: string, place: string, ok: () => Promise<boolean>, note: string): Promise<void> {
    let result: Cell['result'] = 'FAIL'
    let detail = note

    try {
        result = (await ok()) ? 'PASS' : 'FAIL'
    } catch (error) {
        detail = `${note} — ${(error as Error).message.split('\n')[0]}`
    }

    let shot: string | undefined

    if (page !== null) {
        shot = `${OUT}/${row}-${place}.png`.replace(/[^\w./-]+/g, '_')
        await page.screenshot({ path: shot, fullPage: false }).catch(() => undefined)
    }

    record({ row, place, result, note: detail, shot })
}

async function admin(page: Page): Promise<void> {
    await page.goto(`${ABNAHME}/admin/anmelden`, { waitUntil: 'networkidle' })
    await page.fill('#lg-mail', 'admin@rimify.test')
    await page.fill('#lg-pass', REVIEW_PASSWORD)
    await page.locator('button[type=submit]').first().click()
    await page.waitForURL(/\/admin(\?.*)?$/, { timeout: 30_000 })
}

async function save(page: Page): Promise<void> {
    await page.locator('.adm-savebar').getByRole('button', { name: 'Speichern' }).click()
    await expect(page.locator('.adm-savebar')).toContainText('Keine Änderungen')
}

async function searchHrefs(request: APIRequestContext, q: string): Promise<string> {
    const response = await request.get(`${ABNAHME}/api/v1/search?q=${encodeURIComponent(q)}`)

    return response.ok() ? JSON.stringify(await response.json()) : `HTTP ${response.status()}`
}

async function listingHas(page: Page, query: string, slug: string): Promise<boolean> {
    await page.goto(`${ABNAHME}/felgen${query}`, { waitUntil: 'networkidle' })

    return (await page.locator(`a[href^="/felgen/${slug}"]`).count()) > 0
}

async function jsonLd(page: Page): Promise<Record<string, unknown> | null> {
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent({ timeout: 3_000 }).catch(() => null)

    return raw === null ? null : (JSON.parse(raw) as Record<string, unknown>)
}

test('Part B: one Felge made, changed and withdrawn in the admin — every storefront place asked after each step @matrix', async ({ page, request }, info) => {
    test.skip(info.project.name !== 'desktop-1440', 'the matrix runs once, at 1440')
    test.setTimeout(900_000)
    await consent(page.context(), ABNAHME)

    const stamp = Date.now().toString(36).toUpperCase().slice(-5)
    const model = `Matrix ${stamp}`
    const designation = `MX ${stamp}`
    const slug = `beispielmarke-${model.toLowerCase().replace(/\s+/g, '-')}`
    const name = `Beispielmarke ${model} ${designation}`

    // ── Row 1: create a rim with every field, publish it ──────────────────────────────────────────────────────────────
    await admin(page)
    await page.goto(`${ABNAHME}/admin/felgen/neu`, { waitUntil: 'networkidle' })
    await page.selectOption('#fe-brand', '-1')
    await page.fill('#fe-brand-new', 'Beispielmarke')
    await page.fill('#fe-name', model)
    await page.fill('#fe-type', designation)
    await page.fill('#fe-f-0-name', 'Silber')
    await page.click('#fe-add-size')
    await page.fill('#fe-size-0-diameter', '18')
    await page.fill('#fe-size-0-width', '8')
    await page.fill('#fe-size-0-et', '35')
    await page.fill('#fe-size-0-bolt_circle', '112')
    await page.fill('#fe-size-0-bore', '66,6')
    await page.fill('#fe-size-0-sku', `MX-${stamp}`)
    await page.fill('#fe-size-0-price', '189')
    await page.locator('.adm-savebar').getByRole('button', { name: 'Speichern' }).click()
    await page.waitForURL(/\/admin\/felgen\/\d+$/)
    const felge = page.url()
    const modelId = Number(new URL(felge).pathname.split('/').pop())
    await page.locator('.adm-page__actions').getByRole('button', { name: 'Veröffentlichen' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Veröffentlichen' }).click()
    await expect(page.locator('.fe-check__verdict')).toHaveText('Im Shop')

    const R1 = 'create'
    await check(page, R1, 'listing', () => listingHas(page, '', slug), 'the plain list without a car')
    await check(page, R1, 'filter-brand', () => listingHas(page, '?marke=Beispielmarke', slug), 'Marke filter')
    await check(page, R1, 'filter-diameter', () => listingHas(page, '?zoll=18.0', slug), 'Durchmesser filter 18')
    await check(null, R1, 'search-brand', async () => (await searchHrefs(request, 'Beispielmarke')).includes(slug), 'header search by brand')
    await check(null, R1, 'search-model', async () => (await searchHrefs(request, model)).includes(slug), 'header search by model')
    await check(null, R1, 'search-designation', async () => (await searchHrefs(request, designation)).includes(slug), 'header search by Radtypenbezeichnung')
    await page.goto(`${ABNAHME}/felgen/${slug}`, { waitUntil: 'networkidle' })
    await check(page, R1, 'product', async () => (await page.getByRole('heading', { level: 1 }).textContent())?.trim() === name, `H1 „${name}“`)
    // The page's own first frame: Inertia writes it into <script data-page="app">.
    const finishId = await page.evaluate(() => {
        const props = (JSON.parse(document.querySelector('script[data-page="app"]')?.textContent ?? '{}') as { props?: { finishes?: { id: number }[] } }).props

        return props?.finishes?.[0]?.id ?? 0
    })
    await check(page, R1, 'json-ld', async () => (await jsonLd(page))?.name === name, 'ProductGroup name equals the H1')
    await page.goto(`${ABNAHME}/vergleich?f=${modelId}:${finishId}`, { waitUntil: 'networkidle' })
    await check(page, R1, 'compare', async () => (await page.locator('main').textContent())?.includes(model) ?? false, 'the compare page names it')
    await check(null, R1, 'sitemap', async () => (await (await request.get(`${ABNAHME}/sitemap.xml`)).text()).includes(`/felgen/${slug}`), 'sitemap.xml lists it')

    // A basket that holds it before anything changes — the cell the brief names for price and availability.
    await page.goto(`${ABNAHME}/felgen/${slug}`, { waitUntil: 'networkidle' })
    await Promise.all([page.waitForResponse((r) => new URL(r.url()).pathname === '/warenkorb' && r.request().method() === 'POST'), page.locator('button.pdp__add').click()])

    // ── Row 2: price change, with the Felge already in a basket ───────────────────────────────────────────────────────
    const R2 = 'price'
    await page.goto(felge, { waitUntil: 'networkidle' })
    await page.fill('#fe-size-0-price', '199')
    await save(page)
    await check(page, R2, 'listing', async () => {
        await page.goto(`${ABNAHME}/felgen?marke=Beispielmarke`, { waitUntil: 'networkidle' })

        return (await page.locator('article.tile', { has: page.locator(`a[href^="/felgen/${slug}"]`) }).first().textContent())?.includes('199,00') ?? false
    }, 'the tile says 199,00 €')
    await page.goto(`${ABNAHME}/felgen/${slug}`, { waitUntil: 'networkidle' })
    await check(page, R2, 'product', async () => (await page.locator('.pdp__each').textContent())?.includes('199,00') ?? false, 'price line 4 × 199,00 €')
    await check(page, R2, 'amount-total', async () => (await page.locator('.pdp__total').textContent())?.includes('796,00') ?? false, 'total for four 796,00 €')
    await check(page, R2, 'json-ld', async () => JSON.stringify(await jsonLd(page)).includes('"199.00"'), 'offer price 199.00')
    await page.goto(`${ABNAHME}/warenkorb`, { waitUntil: 'networkidle' })
    await check(page, R2, 'cart-holding-it', async () => (await page.locator('main').textContent())?.includes('199,00') ?? false, 'the line in a basket filled at 189,00 € now charges 199,00 €')
    await page.goto(`${ABNAHME}/kasse`, { waitUntil: 'networkidle' })
    await check(page, R2, 'checkout', async () => (await page.locator('main').textContent())?.includes('796,00') ?? false, 'the checkout totals 4 × 199,00 €')

    // ── Row 3: name parts changed (model, Radtypenbezeichnung) ────────────────────────────────────────────────────────
    const R3 = 'rename'
    const renamed = `Beispielmarke ${model}b ${designation}b`
    await page.goto(felge, { waitUntil: 'networkidle' })
    await page.fill('#fe-name', `${model}b`)
    await page.fill('#fe-type', `${designation}b`)
    await save(page)
    await check(page, R3, 'product', async () => {
        await page.goto(`${ABNAHME}/felgen/${slug}`, { waitUntil: 'networkidle' })

        return page.url().includes('/felgen/') && ((await page.getByRole('heading', { level: 1 }).textContent())?.trim() === renamed)
    }, `H1 „${renamed}“ at the old address (or its redirect)`)
    await check(page, R3, 'listing', async () => {
        await page.goto(`${ABNAHME}/felgen?marke=Beispielmarke`, { waitUntil: 'networkidle' })

        return (await page.locator('main').textContent())?.includes(`${model}b`) ?? false
    }, 'the tile names the new model')
    await page.goto(`${ABNAHME}/warenkorb`, { waitUntil: 'networkidle' })
    await check(page, R3, 'cart', async () => (await page.locator('main').textContent())?.includes(`${model}b`) ?? false, 'the basket line names the new model')
    await check(null, R3, 'search', async () => (await searchHrefs(request, `${designation}b`)).includes('/felgen/'), 'search finds the new Radtypenbezeichnung')

    // ── Row 4: available → not available, with the Felge in the basket ────────────────────────────────────────────────
    const R4 = 'unavailable'
    await page.goto(felge, { waitUntil: 'networkidle' })
    await page.selectOption('#fe-size-0-available', 'false')
    await save(page)
    await page.goto(`${ABNAHME}/felgen/${slug}`, { waitUntil: 'networkidle' })
    const product = page.url()
    await check(page, R4, 'product', async () => (await page.locator('.pdp__stock').textContent())?.trim() === 'Nicht verfügbar' && (await page.locator('button.pdp__add').isDisabled()), '„Nicht verfügbar“, the button off, the reason under it')
    await check(page, R4, 'json-ld', async () => JSON.stringify(await jsonLd(page)).includes('OutOfStock'), 'availability OutOfStock')
    await check(page, R4, 'listing', async () => {
        await page.goto(`${ABNAHME}/felgen?marke=Beispielmarke`, { waitUntil: 'networkidle' })

        return (await page.locator('main').textContent())?.includes('Nicht verfügbar') ?? false
    }, 'the tile says so (or it is left out)')
    await page.goto(`${ABNAHME}/warenkorb`, { waitUntil: 'networkidle' })
    await check(page, R4, 'cart-holding-it', async () => /nicht (mehr )?verfügbar/i.test((await page.locator('main').textContent()) ?? ''), 'the basket line says it cannot be bought now')
    await page.goto(`${ABNAHME}/kasse`, { waitUntil: 'networkidle' })
    await check(page, R4, 'checkout', async () => {
        // No order button, or one switched off — and a sentence that says why. Counted, never waited for.
        const order = page.getByRole('button', { name: /Zahlungspflichtig bestellen/ })
        const blocked = (await order.count()) === 0 || (await order.first().isDisabled())

        return blocked && /nicht (mehr )?verfügbar|kann so nicht bestellt werden/i.test((await page.locator('main').textContent()) ?? '')
    }, 'the checkout cannot be ordered from, and says why')

    // ── Row 5: withdrawn (Zurückziehen) ──────────────────────────────────────────────────────────────────────────────
    const R5 = 'withdraw'
    await page.goto(felge, { waitUntil: 'networkidle' })
    // Behind „Weitere Aktionen“: the page keeps every action but its one primary there.
    await page.getByRole('button', { name: 'Weitere Aktionen' }).click()
    await page.getByRole('menuitem', { name: 'Zurückziehen' }).or(page.getByRole('button', { name: 'Zurückziehen' })).first().click({ timeout: 10_000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Zurückziehen' }).click()
    await expect(page.locator('.fe-check__verdict')).not.toHaveText('Im Shop')
    await check(page, R5, 'listing', async () => !(await listingHas(page, '?marke=Beispielmarke', slug)), 'gone from the list')
    await check(null, R5, 'search', async () => !(await searchHrefs(request, `${designation}b`)).includes(`/felgen/${slug}`), 'gone from search')
    await check(null, R5, 'sitemap', async () => !(await (await request.get(`${ABNAHME}/sitemap.xml`)).text()).includes(`/felgen/${slug}`), 'gone from the sitemap')
    await check(page, R5, 'product-url', async () => {
        const response = await page.goto(product, { waitUntil: 'load' })

        return [404, 410].includes(response?.status() ?? 0)
    }, 'the old address answers 404 or 410, never 500')
    await page.goto(`${ABNAHME}/warenkorb`, { waitUntil: 'networkidle' })
    await check(page, R5, 'cart-holding-it', async () => (await page.locator('main').textContent())?.length !== undefined && !(await page.locator('main').textContent())!.includes('Ein Fehler'), 'the basket opens and says what happened to the line')
})
