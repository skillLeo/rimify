import { mkdirSync, writeFileSync } from 'node:fs'
import { test, type Page } from '../fixtures'
import { REVIEW_PASSWORD } from '../support'
import { ABNAHME, consent } from './support'

/*
 * Human QA Part D (HUMAN-QA-FULL.md §7) on our acceptance shop, as the staff operator: every page of the menu opened from
 * the menu (its title, how long it took, whether it says what to do when empty, anything the console reported); the
 * searches typed the way people type; and each review role's view of the same pages — a page it may not open must say so
 * in German, never blank, never a 500. The findings go to storage/qa-evidence/part-d/ (not in the repository) and from
 * there into the ledger by hand. Run alone: `--grep @adminqa --project=desktop-1440`.
 */

const OUT = 'storage/qa-evidence/part-d'
mkdirSync(OUT, { recursive: true })

async function signIn(page: Page, email: string): Promise<void> {
    await page.goto(`${ABNAHME}/admin/anmelden`, { waitUntil: 'networkidle' })
    await page.fill('#lg-mail', email)
    await page.fill('#lg-pass', REVIEW_PASSWORD)
    await page.locator('button[type=submit]').first().click()
    await page.waitForURL(/\/admin(\?.*)?$/, { timeout: 30_000 })
}

async function menu(page: Page): Promise<{ href: string; label: string }[]> {
    const links = await page.locator('nav a[href^="/admin"]').evaluateAll((as) =>
        as.map((a) => ({ href: (a as HTMLAnchorElement).getAttribute('href') ?? '', label: (a.textContent ?? '').replace(/\s+/g, ' ').trim() })),
    )

    return [...new Map(links.filter((l) => l.href !== '' && !l.href.includes('abmelden')).map((l) => [l.href, l])).values()]
}

test('every page of the menu, opened from the menu: title, time, the empty case said, nothing in the console @adminqa', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1440', 'once, at 1440')
    test.setTimeout(600_000)
    await consent(page.context(), ABNAHME)
    const errors: string[] = []
    page.on('console', (m) => (m.type() === 'error' ? errors.push(m.text()) : undefined))
    page.on('pageerror', (e) => errors.push(`crash: ${e.message}`))

    await signIn(page, 'admin@rimify.test')
    const pages = await menu(page)
    const rows: { href: string; label: string; status: number; ms: number; h1: string; errors: string[]; empty: string }[] = []

    for (const { href, label } of pages) {
        errors.length = 0
        const started = Date.now()
        const response = await page.goto(`${ABNAHME}${href}`, { waitUntil: 'networkidle' })
        const ms = Date.now() - started
        const h1 = ((await page.locator('h1').first().textContent({ timeout: 2_000 }).catch(() => '')) ?? '').trim()
        const empty = ((await page.locator('.adm-state').first().textContent({ timeout: 500 }).catch(() => '')) ?? '').replace(/\s+/g, ' ').trim()
        rows.push({ href, label, status: response?.status() ?? 0, ms, h1, errors: [...errors], empty })
        await page.screenshot({ path: `${OUT}/page-${href.replace(/[^\w]+/g, '_')}.png` })
    }

    writeFileSync(`${OUT}/pages.json`, JSON.stringify(rows, null, 1))
})

test('the searches as people type them: case, umlauts, spaces, partial words, numbers with and without their prefix @adminqa', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1440', 'once, at 1440')
    test.setTimeout(300_000)
    await signIn(page, 'admin@rimify.test')

    const QUERIES: Record<string, string[]> = {
        '/admin/felgen': ['BORBET', 'borbet', ' borbet ', 'DB8', 'db8gt2', 'BORBET DB8GT2', 'Borbet  DB8GT2', 'xyz-nichts'],
        '/admin/fahrzeuge': ['0005', '0005 Z90', '0005/Z90', '0005 z90', '5 Z90', 'BMW 3er', 'bmw', 'X3', 'nichts-da'],
        '/admin/reifen': ['225/45', '22545', '225/45 R18', 'beispiel'],
        '/admin/bestellungen': ['RMF', 'RMF-2026', '2026', 'Testzahlung'],
        '/admin/gutachten': ['55255', '53841', '366-0350', 'TÜV', 'TUEV', 'tüv'],
    }
    const rows: { list: string; q: string; status: number; count: string; kept: boolean; said: string }[] = []

    for (const [list, queries] of Object.entries(QUERIES)) {
        for (const q of queries) {
            const response = await page.goto(`${ABNAHME}${list}?q=${encodeURIComponent(q)}`, { waitUntil: 'networkidle' })
            const kept = (await page.locator('input[type=search]').first().inputValue().catch(() => '')) === q.trim() || (await page.locator('input[type=search]').first().inputValue().catch(() => '')) === q
            const context = ((await page.locator('.adm-page__context').first().textContent({ timeout: 1_000 }).catch(() => '')) ?? '').trim()
            const said = ((await page.locator('.adm-state, .adm-alert').first().textContent({ timeout: 500 }).catch(() => '')) ?? '').replace(/\s+/g, ' ').trim()
            rows.push({ list, q, status: response?.status() ?? 0, count: context, kept, said })
        }
    }

    writeFileSync(`${OUT}/searches.json`, JSON.stringify(rows, null, 1))
})

test('each role sees its pages and is told, in German, where it may not go @adminqa', async ({ browser }, info) => {
    test.skip(info.project.name !== 'desktop-1440', 'once, at 1440')
    test.setTimeout(600_000)

    const admin = await browser.newPage()
    await signIn(admin, 'admin@rimify.test')
    const all = (await menu(admin)).map((l) => l.href)
    await admin.close()

    const rows: { role: string; href: string; status: number; h1: string; text: string }[] = []

    for (const email of ['verkauf@rimify.test', 'lager@rimify.test']) {
        const page = await browser.newPage()
        await signIn(page, email)

        for (const href of all) {
            const response = await page.goto(`${ABNAHME}${href}`, { waitUntil: 'networkidle' })
            const h1 = ((await page.locator('h1').first().textContent({ timeout: 1_000 }).catch(() => '')) ?? '').trim()
            const text = ((await page.locator('main').first().textContent({ timeout: 1_000 }).catch(() => '')) ?? '').replace(/\s+/g, ' ').trim().slice(0, 200)
            rows.push({ role: email, href, status: response?.status() ?? 0, h1, text })
        }

        await page.close()
    }

    writeFileSync(`${OUT}/roles.json`, JSON.stringify(rows, null, 1))
})
