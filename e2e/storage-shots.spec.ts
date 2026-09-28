import { expect, test } from './fixtures'
import { SUPER_ADMIN, signIn, waitForApp } from './bugs/faq-support'

/*
 * Proof shots of Einstellungen › Medien und Speicher (docs/qa/shots/m-storage/): the password asked
 * once more, then the screen itself. Nothing is saved and no connection test is started — the page
 * is only opened, so no request reaches a bucket from here.
 */

const DIR = 'docs/qa/shots/m-storage'

test('Medien und Speicher: the password step, then the screen', async ({ page }, info) => {
    const width = info.project.name.includes('390') ? 390 : 1440

    await signIn(page)
    await page.goto('/admin/einstellungen/speicher', { waitUntil: 'networkidle' })
    // The way back rides along in the address (EnsureSudo), so a parallel request cannot lose it.
    await expect(page).toHaveURL(/\/admin\/bestaetigen\?weiter=%2Fadmin%2Feinstellungen%2Fspeicher$/)
    await waitForApp(page)
    await page.screenshot({ path: `${DIR}/bestaetigen-${width}.png`, fullPage: true })

    await page.fill('#sudo-password', SUPER_ADMIN.password)
    await page.getByRole('button', { name: 'Bestätigen', exact: true }).click()
    await page.waitForURL(/\/admin\/einstellungen\/speicher$/)
    await waitForApp(page)

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Medien und Speicher')
    // Never more of a key than its last four characters.
    await expect(page.locator('body')).not.toContainText(/[A-Z0-9]{16,}/)
    await page.screenshot({ path: `${DIR}/speicher-${width}.png`, fullPage: true })
})
