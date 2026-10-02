import { expect, test, type Page } from '../fixtures'
import { REVIEW_PASSWORD } from '../support'
import { waitForApp } from './faq-support'

/*
 * SWEEP-ADMIN-02 (S2) — the three review accounts are called „Review Verkauf", „Review Lager" and „Review Admin"
 * (docs/qa/BUGS.md, docs/reviews/sweep-admin.md).
 *
 * ReviewAccountsSeeder names them so, and the rail's foot (AdminRailFoot: `.adm-foot__name`, the account menu, on a
 * phone „Mehr") prints the name on every admin page. The English word the rail group lost („Review" → „Abnahme",
 * D-091) is back in front of the client on every screen he reviews, beside a role label that does not match the
 * one he was given either („Review Lager · Katalog", while docs/review/ACCOUNTS.md calls the role „Lager").
 *
 * Expected: a German name for each account, no „Review" anywhere in the frame.
 *
 * Writes nothing but the sign-in.
 */

const ACCOUNTS = ['verkauf@rimify.test', 'lager@rimify.test', 'admin@rimify.test']

function reviewPassword(): string {
    return REVIEW_PASSWORD
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

test.skip(({ isMobile }) => isMobile, 'The rail foot is the desk view; the phone shows the same name in „Mehr".')

for (const email of ACCOUNTS) {
    test(`SWEEP-ADMIN-02 ${email}: the account's name in the frame is German`, async ({ page, context }) => {
        await context.clearCookies()
        await signInAs(page, email)

        const name = page.locator('.adm-foot__name').first()
        await expect(name).toBeVisible({ timeout: 20_000 })
        await page.locator('.adm-foot').first().screenshot({ path: `docs/qa/shots/sweep-admin/sweep-admin-02-${email.split('@')[0]}.png` })

        expect(await name.innerText(), 'the name printed at the foot of the rail on every page').not.toMatch(/\bReview\b/)
    })
}
