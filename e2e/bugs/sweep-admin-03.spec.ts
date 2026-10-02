import { expect, test, type Page } from '../fixtures'
import { REVIEW_PASSWORD } from '../support'
import { waitForApp } from './faq-support'

/*
 * SWEEP-ADMIN-03 (S2) — an order's Prüfnachweis links Verkauf to the Gutachten, which Verkauf may not open
 * (docs/qa/BUGS.md, docs/reviews/sweep-admin.md).
 *
 * OrderDetail::snapshot() sets `documentHref` to /admin/gutachten/{id} for every reader, and Bestellungen/Show.vue
 * draws „Laut <ABE …>" as a link. The order-manager role (the review account „Verkauf") has no Gutachten right, so
 * the one role that works with orders gets „Keine Berechtigung" from every Prüfnachweis it opens — the rail's rule
 * „never a 403 after a click" does not reach this link.
 *
 * Expected: for a reader without the Gutachten right the document is named without a link (or the link opens).
 *
 * Writes nothing but what a look writes: the sign-in, and one `permission.denied` Protokoll entry for the refused
 * request (EnsureAdminMay / the Form Request record every refusal) — on the local e2e database only.
 */

function reviewPassword(): string {
    return REVIEW_PASSWORD
}

async function signInAsVerkauf(page: Page): Promise<void> {
    await page.goto('/admin/anmelden', { waitUntil: 'domcontentloaded' })
    await waitForApp(page)
    await page.fill('#lg-mail', 'verkauf@rimify.test')
    await page.fill('#lg-pass', reviewPassword())
    await page.locator('button[type=submit]').first().click()
    await page.waitForURL(/\/admin$/, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await waitForApp(page)
}

test.skip(({ isMobile }) => isMobile, 'The link is the same at every width; one width is enough.')

test('SWEEP-ADMIN-03 Verkauf: the Prüfnachweis does not link to a Gutachten the role cannot open', async ({ page, context }) => {
    await context.clearCookies()
    await signInAsVerkauf(page)

    await page.goto('/admin/bestellungen', { waitUntil: 'domcontentloaded' })
    await waitForApp(page)

    const orders = await page.locator('a[href^="/admin/bestellungen/"]').evaluateAll((as) =>
        [...new Set(as.map((a) => a.getAttribute('href') ?? '').filter((h) => /^\/admin\/bestellungen\/\d+$/.test(h)))].slice(0, 10),
    )

    // An order whose Prüfnachweis names its Gutachten („Laut …"), linked or not.
    let proof: { order: string; line: string; hrefs: string[] } | null = null

    for (const order of orders) {
        await page.goto(order, { waitUntil: 'domcontentloaded' })
        await waitForApp(page)

        const named = page.locator('.bs-proof .bs-proof__line', { hasText: /^\s*Laut / }).first()

        if (await named.count()) {
            proof = {
                order,
                line: (await named.innerText()).trim(),
                hrefs: await page.locator('.bs-proof a[href^="/admin/gutachten/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? '')),
            }
            await page.locator('.bs-proof').first().screenshot({ path: 'docs/qa/shots/sweep-admin/sweep-admin-03-proof.png' })
            break
        }
    }

    expect(proof, 'an order with a Prüfnachweis that names its Gutachten, among the first ten of the list').not.toBeNull()

    // Named, not linked — or every link it shows opens (D-096).
    for (const href of proof!.hrefs) {
        const response = await page.request.get(href, { maxRedirects: 0 })

        expect(response.status(), `„${proof!.line}" on ${proof!.order} → ${href}`).not.toBe(403)
    }
})
