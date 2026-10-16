import { expect, test, type Page } from './fixtures'
import { signIn, waitForApp } from './bugs/faq-support'
import { cleanUp } from './bugs/sv-support'

/*
 * Verkauf › Bestellungen, Gespeicherte Ansichten and the Spaltenwahl (docs/admin/rest-build-plan.md,
 * step 2.2), as a person uses them: filter the list, keep it as a view, open it again from the bar,
 * change it and save over it, delete it and take the deletion back; tick a column on and find it
 * still there after a reload.
 *
 * Views and the column choice are stored on the account: every test removes the views it made
 * (named „QA-…“) and puts the list's own columns back.
 */

test.skip(({ isMobile }) => isMobile, 'Views are saved at a desk; a phone uses them (the bar scrolls) — covered at 1440.')

const PREFIX = 'QA-'

const bar = (page: Page) => page.getByRole('navigation', { name: 'Ansichten' })

// Everything this spec may leave behind — its „QA-…" views and a changed column choice — taken back by request, before
// and after: cleanup never navigates (e2e/teardown.ts, D-263).
test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await cleanUp(page.context())
})

test.afterEach(async ({ context, isMobile }) => {
    if (!isMobile) {
        await cleanUp(context)
    }
})

async function saveView(page: Page, name: string, withColumns = false): Promise<void> {
    await page.getByRole('button', { name: 'Als Ansicht speichern' }).click()
    const dialog = page.getByRole('dialog', { name: 'Als Ansicht speichern' })

    await dialog.getByLabel('Name').fill(name)
    // Off unless ticked: a view keeps filters, not columns.
    await expect(dialog.getByLabel('Spalten mitspeichern')).not.toBeChecked()

    if (withColumns) {
        await dialog.getByLabel('Spalten mitspeichern').check()
    }

    await dialog.getByRole('button', { name: 'Speichern' }).click()
    await expect(dialog).toBeHidden()
}

test('filters kept as a view open again from the bar, marked as where one is', async ({ page }) => {
    await page.goto('/admin/bestellungen?status=offen', { waitUntil: 'networkidle' })
    await waitForApp(page)

    await saveView(page, `${PREFIX}Zu versenden`)
    // (Laravel writes the query's keys in alphabetical order.)
    await expect(page).toHaveURL(/[?&]status=offen/)
    await expect(page).toHaveURL(/[?&]ansicht=\d+/)
    await expect(bar(page).getByRole('link', { name: `${PREFIX}Zu versenden` })).toHaveAttribute('aria-current', 'page')

    // The whole list, then the view again: its filters come back.
    await bar(page).getByRole('link', { name: 'Alle Bestellungen' }).click()
    await expect(page).toHaveURL(/\/admin\/bestellungen$/)
    await bar(page).getByRole('link', { name: `${PREFIX}Zu versenden` }).click()
    await expect(page.locator('#ob-status')).toHaveValue('offen')
})

test('a changed view is saved over, or set back', async ({ page }) => {
    // ADMIN-GEFUNDEN 508, reproduced under load (17.10.2026: two of fifteen, eight CPU burners, 4×): not the app. The run
    // outgrew its minute, the timeout's afterEach then opened the bare list, and the still-polling check read that page
    // — „Verwerfen“ itself had asked for the view as saved (the trace). Fixed as a class: the cleanup goes by request
    // and never touches the page (D-263); the minute stays — a slow run fails as slow, on its own step.
    await page.goto('/admin/bestellungen?status=offen', { waitUntil: 'networkidle' })
    await saveView(page, `${PREFIX}Ändern`)

    // Another sort: the view is open, and changed.
    await page.locator('.ob-sort', { hasText: 'Summe' }).click()
    await expect(bar(page)).toContainText('geändert')
    await expect(page).toHaveURL(/[?&]sort=summe/)
    await expect(page).toHaveURL(/[?&]ansicht=\d+/)

    await page.getByRole('button', { name: 'Änderungen speichern' }).click()
    await expect(bar(page)).not.toContainText('geändert')
    await expect(page.getByRole('button', { name: 'Änderungen speichern' })).toHaveCount(0)

    // Changed once more, then set back: the view as it was saved.
    await page.locator('.ob-sort', { hasText: 'Datum' }).click()
    await expect(bar(page)).toContainText('geändert')
    await page.getByRole('link', { name: 'Verwerfen' }).click()
    await expect(bar(page)).not.toContainText('geändert')
    await expect(page).toHaveURL(/sort=summe/)
})

test('a deleted view comes back with „Rückgängig“', async ({ page }) => {
    await page.goto('/admin/bestellungen?status=offen', { waitUntil: 'networkidle' })
    await saveView(page, `${PREFIX}Weg und zurück`)

    await page.getByRole('button', { name: /Aktionen für die Ansicht/ }).click()
    await page.getByRole('menuitem', { name: 'Löschen' }).click()
    await expect(bar(page).getByRole('link', { name: `${PREFIX}Weg und zurück` })).toHaveCount(0)
    // The focus did not fall to the page: it is on the whole list.
    await expect(bar(page).getByRole('link', { name: 'Alle Bestellungen' })).toBeFocused()

    await page.getByRole('button', { name: 'Rückgängig' }).click()
    await expect(bar(page).getByRole('link', { name: `${PREFIX}Weg und zurück` })).toBeVisible()
})

test('a column ticked on is there after a reload, and „Standard“ takes it away again', async ({ page }) => {
    await page.goto('/admin/bestellungen', { waitUntil: 'networkidle' })
    const headings = () => page.locator('.ob-table thead th').allInnerTexts()

    expect(await headings()).not.toContain('Fahrzeug')

    await page.getByRole('button', { name: 'Spalten', exact: true }).click()
    const saved = page.waitForResponse((r) => r.url().endsWith('/admin/ansicht') && r.request().method() === 'PATCH')
    await page.getByRole('menuitemcheckbox', { name: 'Fahrzeug' }).click()
    await saved
    // The menu stays open for the next tick.
    await expect(page.getByRole('menuitemcheckbox', { name: 'Fahrzeug' })).toBeVisible()
    await page.keyboard.press('Escape')

    await expect.poll(headings).toContain('Fahrzeug')
    await page.reload({ waitUntil: 'networkidle' })
    expect(await headings()).toContain('Fahrzeug')

    await page.getByRole('button', { name: 'Spalten', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Standard wiederherstellen' }).click()
    await expect.poll(headings).not.toContain('Fahrzeug')
})

test('a view saved with its columns shows them, is changed and saved over, and gives one\'s own back', async ({ page }) => {
    await page.goto('/admin/bestellungen?richtung=ab&sort=summe', { waitUntil: 'networkidle' })
    await waitForApp(page)
    const headings = () => page.locator('.ob-table thead th').allInnerTexts()
    const accountSaves: string[] = []
    page.on('request', (r) => {
        if (r.url().endsWith('/admin/ansicht') && r.method() === 'PATCH') {
            accountSaves.push(r.postData() ?? '')
        }
    })

    // The person's own set gets the car; the view is saved with it.
    await page.getByRole('button', { name: 'Spalten', exact: true }).click()
    await page.getByRole('menuitemcheckbox', { name: 'Fahrzeug' }).click()
    await page.keyboard.press('Escape')
    await expect.poll(headings).toContain('Fahrzeug')
    await saveView(page, `${PREFIX}Mit Spalten`, true)
    await expect(bar(page)).toContainText('Spalten aus dieser Ansicht')
    const beforeView = accountSaves.length

    // In the view, the menu changes the view's columns — not the account's — and the view reads changed.
    await page.getByRole('button', { name: 'Spalten', exact: true }).click()
    await expect(page.getByText('Spalten dieser Ansicht')).toBeVisible()
    await page.getByRole('menuitemcheckbox', { name: 'Kundin oder Kunde' }).click()
    await page.keyboard.press('Escape')
    await expect.poll(headings).not.toContain('Kundin oder Kunde')
    await expect(bar(page)).toContainText('geändert')
    expect(accountSaves.length).toBe(beforeView)

    await page.getByRole('button', { name: 'Änderungen speichern' }).click()
    await expect(bar(page)).not.toContainText('geändert')
    expect(await headings()).not.toContain('Kundin oder Kunde')

    // One's own columns back, the view still open.
    await page.getByRole('button', { name: 'Meine Spalten wiederherstellen' }).click()
    await expect.poll(headings).toContain('Kundin oder Kunde')
    await expect(bar(page)).not.toContainText('Spalten aus dieser Ansicht')
    await expect(bar(page).getByRole('link', { name: `${PREFIX}Mit Spalten` })).toHaveAttribute('aria-current', 'page')

    // Opened again: the view's own columns, from the first frame.
    await page.reload({ waitUntil: 'networkidle' })
    expect(await headings()).not.toContain('Kundin oder Kunde')
    await expect(bar(page)).toContainText('Spalten aus dieser Ansicht')
})
