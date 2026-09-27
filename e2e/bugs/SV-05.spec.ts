import { expect, test } from '@playwright/test'
import { SHOTS, bar, cleanUp, createViews, focusInBar, open, start } from './sv-support'

/*
 * SV-05 (S2) — keyboard: after „Speichern" in „Als Ansicht speichern", after „Änderungen speichern" and
 * after „Rückgängig" the focus falls to `<body>` (docs/qa/BUGS.md).
 *
 * Each control that was used disappears with the answer: the saved view is open and unchanged, so
 * `offerSave` / `offerSaveOver` (ListViews.vue) drop „Als Ansicht speichern" and „Änderungen speichern";
 * the toast removes its „Rückgängig". Ui/Dialog.vue hands the focus back to its opener only
 * `if (opener?.isConnected)`, and reka has no DialogTrigger to fall back on; saveOver() and the
 * toast's action set no focus at all. Only the delete moves it on purpose (to „Alle Bestellungen").
 * The next Tab starts at „Zum Inhalt springen" and walks rail and top bar again.
 *
 * Expected: the focus stays in the bar — on the view that was saved or brought back.
 */

test.skip(({ isMobile }) => isMobile, 'Keyboard at a desk.')

test.beforeEach(async ({ page }) => {
    await start(page, 1440)
})

test.afterEach(async ({ page }) => {
    if (!page.isClosed()) {
        await cleanUp(page)
    }
})

test('SV-05a after saving a new view from the keyboard the focus is in the bar', async ({ page }) => {
    await open(page, '/admin/bestellungen?status=offen')

    await page.getByRole('button', { name: 'Als Ansicht speichern' }).focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog', { name: 'Als Ansicht speichern' })
    await dialog.getByLabel('Name').fill('QA-SV-05 Offen')
    await dialog.getByRole('button', { name: 'Speichern' }).focus()
    await page.keyboard.press('Enter')

    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/[?&]ansicht=\d+/)
    await expect(bar(page).getByRole('link', { name: 'QA-SV-05 Offen' })).toHaveAttribute('aria-current', 'page')
    await page.screenshot({ path: `${SHOTS}/sv-05a-focus-after-save.png` })

    const focus = await focusInBar(page)
    expect(focus.inBar, `after „Speichern" the focus is on ${focus.on}`).toBe(true)
})

test('SV-05b after „Änderungen speichern" from the keyboard the focus is in the bar', async ({ page }) => {
    const [view] = await createViews(page, [{ name: 'QA-SV-05 Ändern', query: { status: 'offen' } }])

    await open(page, `${view!.href}&sort=summe&richtung=ab`)
    await expect(bar(page)).toContainText('geändert')

    await page.getByRole('button', { name: 'Änderungen speichern' }).focus()
    await page.keyboard.press('Enter')

    await expect(bar(page)).not.toContainText('geändert')
    await page.screenshot({ path: `${SHOTS}/sv-05b-focus-after-save-over.png` })

    const focus = await focusInBar(page)
    expect(focus.inBar, `after „Änderungen speichern" the focus is on ${focus.on}`).toBe(true)
})

test('SV-05c after „Rückgängig" from the keyboard the focus is in the bar', async ({ page }) => {
    const [view] = await createViews(page, [{ name: 'QA-SV-05 Zurück', query: { status: 'offen' } }])

    await open(page, view!.href)
    await page.getByRole('button', { name: `Aktionen für die Ansicht „${view!.name}“` }).focus()
    await page.keyboard.press('Enter')
    await page.getByRole('menuitem', { name: 'Löschen' }).focus()
    await page.keyboard.press('Enter')

    const undo = page.getByRole('button', { name: 'Rückgängig' })
    await expect(undo).toBeVisible()
    // F8 moves the focus to the toast's action (Toast.vue).
    await page.keyboard.press('F8')
    await expect(undo).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(bar(page).getByRole('link', { name: view!.name })).toBeVisible()
    await page.screenshot({ path: `${SHOTS}/sv-05c-focus-after-undo.png` })

    const focus = await focusInBar(page)
    expect(focus.inBar, `after „Rückgängig" the focus is on ${focus.on}`).toBe(true)
})
