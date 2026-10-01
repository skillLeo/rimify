import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '../fixtures'
import { waitForApp } from './faq-support'

/*
 * SWEEP-ADMIN-01 (S2) — Abnahme › Stand der Seiten links Verkauf and Lager to pages their role may not open
 * (docs/qa/BUGS.md, docs/reviews/sweep-admin.md).
 *
 * ReviewBoard::areas() is the same list for every role, and Board.vue draws every screen with an href as a link.
 * The rail's own rule (AdminNavigation: "never a dead link, never a 403 after a click") is not applied: signed in
 * as Verkauf, „Dokumente", „Auflagen", „Abdeckung", „Konflikte", „Fahrzeuge", „Import", „Rollen & Rechte",
 * „Benutzer", „Protokoll", „Zustand", „Zahlung" … open „Keine Berechtigung"; as Lager, „Bestellungen",
 * „Rückbuchungen", „Protokoll", „Zustand", „Zahlung" … do the same. The client reviews the admin in these roles,
 * so the page meant to guide the review sends them into refusals.
 *
 * Expected: a screen the reader's role may not open is drawn without a link (as „Noch nicht gebaut" screens are),
 * or not drawn; every link on the board opens.
 *
 * Writes nothing but what a look writes: the sign-in, and one `permission.denied` Protokoll entry per refused
 * link (EnsureAdminMay records every refusal) — on the local e2e database only.
 */

const ACCOUNTS = [
    { role: 'verkauf', email: 'verkauf@rimify.test' },
    { role: 'lager', email: 'lager@rimify.test' },
]

/** The review accounts' password, as docs/review/ACCOUNTS.md documents it — not repeated here. */
function reviewPassword(): string {
    if (process.env.REVIEW_PASSWORD) {
        return process.env.REVIEW_PASSWORD
    }

    const line = readFileSync('docs/review/ACCOUNTS.md', 'utf8').split('\n').find((l) => l.includes('`verkauf@rimify.test`')) ?? ''
    const ticks = [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1])

    return ticks[1] ?? ''
}

async function signInAs(page: Page, email: string): Promise<void> {
    await page.goto('/admin/anmelden', { waitUntil: 'domcontentloaded' })
    await waitForApp(page)
    await page.fill('#lg-mail', email)
    await page.fill('#lg-pass', reviewPassword())
    await page.locator('button[type=submit]').first().click()
    await page.waitForURL(/\/admin$/, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await waitForApp(page)
}

test.skip(({ isMobile }) => isMobile, 'The board draws the same links at every width; one width is enough.')

for (const account of ACCOUNTS) {
    test(`SWEEP-ADMIN-01 ${account.role}: Stand der Seiten links only to pages the role may open`, async ({ page, context }) => {
        await context.clearCookies()
        await signInAs(page, account.email)

        await page.goto('/admin/review', { waitUntil: 'domcontentloaded' })
        await waitForApp(page)
        await expect(page.locator('h1')).toHaveText('Stand der Seiten')

        const links = await page.locator('.rb-list a.rb-label').evaluateAll((as) =>
            as.map((a) => ({ href: a.getAttribute('href') ?? '', label: (a.textContent ?? '').trim() })),
        )
        expect(links.length, 'the board shows links at all').toBeGreaterThan(0)

        const refused: string[] = []

        for (const link of links) {
            // No redirects followed: a password question (302 to /admin/bestaetigen) is a page that opens.
            const response = await page.request.get(link.href, { maxRedirects: 0 })

            if (response.status() === 403) {
                refused.push(`${link.label} (${link.href})`)
            }
        }

        await page.screenshot({ path: `docs/qa/shots/sweep-admin/sweep-admin-01-${account.role}.png`, fullPage: true })

        expect(refused, `As ${account.role}, these links on „Stand der Seiten“ answer „Keine Berechtigung“`).toEqual([])
    })
}
