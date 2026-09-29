import { expect, test } from '../fixtures'
import { SHOTS, cleanUp, open, start } from './sv-support'

/*
 * SV-06 (S2) — browser Back undoes the column choice on screen, and the next tick then stores the old
 * set (docs/qa/BUGS.md).
 *
 * The Spaltenwahl is saved with a plain background request (composables/admin/preferences.ts) and
 * never reaches the page object Inertia keeps in the history entry. Back restores that entry without
 * asking the server (@inertiajs/core 3.7.1 `handlePopstateEvent` → `page.setQuietly(data)`), so
 * `columns.shown` is the choice from before, and Index.vue draws it (`shown` is taken from the props).
 * A further tick in „Spalten" builds on that stale set and saves it: the column ticked before is gone
 * for good. The same history copy shows the bar of views as it was — a view just saved is missing
 * („Als Ansicht speichern" offered again, then „Eine Ansicht mit diesem Namen hast du schon"), a view
 * just deleted is back as a tab.
 *
 * Expected: after Back the columns are the ones chosen (the page takes them from the account, not from
 * the history copy).
 */

test.skip(({ isMobile }) => isMobile, 'The Spaltenwahl is at a desk (hidden below 768 px).')

test.beforeEach(async ({ page }) => {
    await start(page, 1440)
})

test.afterEach(async ({ page }) => {
    if (!page.isClosed()) {
        await cleanUp(page)
    }
})

test('SV-06 after Back the list keeps the column just ticked on', async ({ page }) => {
    await open(page, '/admin/bestellungen')
    const headings = () => page.locator('.ob-table thead th').allInnerTexts()

    expect(await headings(), 'rig: the list has orders and starts with the default columns').not.toContain('Fahrzeug')

    await page.getByRole('button', { name: 'Spalten' }).click()
    const saved = page.waitForResponse((r) => r.url().endsWith('/admin/ansicht') && r.request().method() === 'PATCH')
    await page.getByRole('menuitemcheckbox', { name: 'Fahrzeug' }).click()
    expect((await saved).status(), 'rig: the choice is stored').toBe(204)
    await page.keyboard.press('Escape')
    await expect.poll(headings).toContain('Fahrzeug')

    // Any visit, then Back: here a re-sort by Summe.
    await page.locator('.ob-sort', { hasText: 'Summe' }).click()
    await expect(page).toHaveURL(/[?&]sort=summe/)
    await expect.poll(headings, { message: 'rig: the server draws the stored choice' }).toContain('Fahrzeug')

    await page.goBack()
    await expect(page).not.toHaveURL(/sort=/)
    await page.screenshot({ path: `${SHOTS}/sv-06-columns-after-back.png` })

    await expect.poll(headings, { message: 'after Back the column ticked on is gone again', timeout: 3000 }).toContain('Fahrzeug')
})
