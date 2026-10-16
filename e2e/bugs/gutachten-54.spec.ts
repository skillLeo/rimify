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

    // A draft without rows is counted before its rows' form appears (ADMIN-GEFUNDEN 511): counted once here and kept —
    // the row below carries no code and one tyre size.
    if (await page.locator('#zl-codes').isVisible()) {
        await page.locator('#zl-codes').fill('0')
        await page.locator('#zl-codes-page').fill('1')
        await page.locator('#zl-sizes').fill('1')
        await page.locator('#zl-sizes-page').fill('1')
        await page.locator('input[name="zl-abnahme"][value="none"]').check()
        await page.getByRole('button', { name: 'Zählung speichern' }).click()
        await expect(page.locator('#zl-edit')).toBeVisible({ timeout: 20_000 })
    }

    // In the vehicles' own column: the sizes are `.rc-hits` too, and in a full run the size list could answer first —
    // the spec then ticked a size for a car and the button stayed disabled (the suite run of 03.10.2026).
    const vehicles = page.locator('section[aria-labelledby="rc-h-vehicles"]')
    const hit = vehicles.locator('.rc-hits li', { hasNotText: 'Angaben für die Prüfung fehlen' }).first()
    await hit.locator('input').check()
    await expect(vehicles.locator('.rc-chips li'), 'the car was not chosen').toHaveCount(1)

    // The search's own list, not the first one shown before anything was typed.
    const searched = page.waitForResponse((r) => new URL(r.url()).pathname.endsWith('/suche/felgen') && new URL(r.url()).searchParams.get('q') === 'Probelauf')
    await page.locator('#rc-wheel-q').fill('Probelauf')
    await searched
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
