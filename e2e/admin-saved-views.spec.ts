import { expect, test, type Page } from '@playwright/test'
import { signIn, waitForApp } from './bugs/faq-support'

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

/** Everything this spec may have left behind: its views, and a changed column choice. */
async function cleanUp(page: Page): Promise<void> {
    await page.goto('/admin/bestellungen', { waitUntil: 'networkidle' })
    await page.evaluate(async (prefix) => {
        // Inertia's first page: a JSON script beside the app (or, older, the app's data-page).
        const data = document.querySelector('script[data-page="app"]')?.textContent ?? document.querySelector<HTMLElement>('#app')?.dataset.page
        const views = data ? ((JSON.parse(data) as { props: { views?: { items: { id: number; name: string; mine: boolean }[] } } }).props.views?.items ?? []) : []
        const token = decodeURIComponent(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(document.cookie)?.[1] ?? '')
        const headers = { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': token }

        for (const view of views.filter((v) => v.mine && v.name.startsWith(prefix))) {
            await fetch(`/admin/ansichten/${view.id}`, { method: 'DELETE', credentials: 'same-origin', headers })
        }

        await fetch('/admin/ansicht', {
            method: 'PATCH',
            credentials: 'same-origin',
            headers,
            body: JSON.stringify({ list: 'bestellungen', columns: ['nummer', 'datum', 'kunde', 'summe', 'zahlung', 'versand'] }),
        })
    }, PREFIX)
}

const bar = (page: Page) => page.getByRole('navigation', { name: 'Ansichten' })

test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await cleanUp(page)
})

test.afterEach(async ({ page, isMobile }) => {
    if (!isMobile && !page.isClosed()) {
        await cleanUp(page)
    }
})

async function saveView(page: Page, name: string): Promise<void> {
    await page.getByRole('button', { name: 'Als Ansicht speichern' }).click()
    const dialog = page.getByRole('dialog', { name: 'Als Ansicht speichern' })

    await dialog.getByLabel('Name').fill(name)
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

    await page.getByRole('button', { name: 'Spalten' }).click()
    const saved = page.waitForResponse((r) => r.url().endsWith('/admin/ansicht') && r.request().method() === 'PATCH')
    await page.getByRole('menuitemcheckbox', { name: 'Fahrzeug' }).click()
    await saved
    // The menu stays open for the next tick.
    await expect(page.getByRole('menuitemcheckbox', { name: 'Fahrzeug' })).toBeVisible()
    await page.keyboard.press('Escape')

    await expect.poll(headings).toContain('Fahrzeug')
    await page.reload({ waitUntil: 'networkidle' })
    expect(await headings()).toContain('Fahrzeug')

    await page.getByRole('button', { name: 'Spalten' }).click()
    await page.getByRole('menuitem', { name: 'Standard wiederherstellen' }).click()
    await expect.poll(headings).not.toContain('Fahrzeug')
})
