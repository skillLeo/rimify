import { expect, test, type Page } from './fixtures'
import { waitForApp } from './bugs/faq-support'

/*
 * The three review accounts, shown (the launch release §2, docs/review/ACCOUNTS.md): each signs in and
 * lands on its own admin — another sidebar, another Übersicht. The pictures go to docs/review/roles/, the
 * proof that the permission work is visible and not only tested. ReviewKitTest holds the same as data.
 */

const ACCOUNTS = [
    { role: 'verkauf', email: 'verkauf@rimify.test' },
    { role: 'lager', email: 'lager@rimify.test' },
    { role: 'admin', email: 'admin@rimify.test' },
]

// The review accounts' documented password (docs/review/ACCOUNTS.md): they exist only where the review is on.
const PASSWORD = 'rimify-review-2026'

async function signInAs(page: Page, email: string): Promise<void> {
    await page.goto('/admin/anmelden', { waitUntil: 'domcontentloaded' })
    await waitForApp(page)
    await page.fill('#lg-mail', email)
    await page.fill('#lg-pass', PASSWORD)
    await page.locator('button[type=submit]').first().click()
    await page.waitForURL(/\/admin$/, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await waitForApp(page)
}

test.skip(({ isMobile }) => isMobile, 'The three admins side by side are compared at a desk.')

test('three accounts, three different admins', async ({ page, context }) => {
    const seen: Record<string, { rail: string[]; tiles: string[] }> = {}

    for (const account of ACCOUNTS) {
        await context.clearCookies()
        await signInAs(page, account.email)
        await expect(page.locator('#adm-nav')).toBeVisible({ timeout: 20_000 })
        await page.waitForLoadState('networkidle')

        seen[account.role] = {
            rail: await page.locator('#adm-nav .adm-rail__text').allInnerTexts(),
            tiles: await page.locator('.kpi__label').allInnerTexts(),
        }

        await page.screenshot({ path: `docs/review/roles/${account.role}.png`, fullPage: false })
    }

    // Visibly different: the sidebar and the Übersicht are not the same page three times.
    expect(seen.verkauf!.rail).not.toEqual(seen.lager!.rail)
    expect(seen.lager!.rail).not.toEqual(seen.admin!.rail)
    expect(seen.verkauf!.rail).not.toEqual(seen.admin!.rail)
    expect(seen.verkauf!.tiles).not.toEqual(seen.lager!.tiles)
})
