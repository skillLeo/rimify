import { expect, test } from '../fixtures'
import { signIn, waitForApp } from './faq-support'

/*
 * Found while fixing GUTACHTEN-08: removing the LAST row of a draft left the confirm on screen — it was
 * still closing when the page beneath it changed shape. The confirm now closes first and the request
 * follows. Needs the QA draft „QA-ENTWURF“ and the golden record's Felge „Probelauf“ on the dev DB; the
 * row it adds is removed again, so it leaves the draft as it found it.
 */

test('GUTACHTEN-54 removing the last row of a draft closes the confirm', async ({ page }) => {
    await signIn(page)
    await page.goto('/admin/gutachten', { waitUntil: 'networkidle' })

    const draft = page.locator('tbody tr', { hasText: 'QA-ENTWURF' }).locator('.gd-link')
    expect(await draft.count(), 'precondition: the draft „QA-ENTWURF“ exists on the dev DB').toBeGreaterThan(0)

    await draft.first().click()
    await page.waitForURL(/\/admin\/gutachten\/\d+$/)
    await waitForApp(page)

    const hit = page.locator('.rc-hits li', { hasNotText: 'Angaben für die Prüfung fehlen' }).first()
    await hit.locator('input').check()
    await page.locator('#rc-wheel-q').fill('Probelauf')
    await page.locator('.rc-group', { hasText: 'Probelauf' }).first().locator('.rc-hit--model input').check()
    await page.locator('#rc-size-0').fill('225/40 R18')
    await page.locator('.rc-foot .btn--primary').click()
    await expect(page.locator('.gs-group')).toHaveCount(1)

    await page.locator('.gs-table button[aria-label$=" entfernen"]').first().click()
    await page.getByRole('dialog', { name: 'Zeile entfernen?' }).getByRole('button', { name: 'Entfernen', exact: true }).click()

    await expect(page.getByRole('dialog', { name: 'Zeile entfernen?' })).toBeHidden()
    // The phone waits longer for the answer on this machine; the removal itself is what is checked.
    await expect(page.locator('.gs-group')).toHaveCount(0, { timeout: 20_000 })
})
