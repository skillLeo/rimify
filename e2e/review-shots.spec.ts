import { expect, test } from '@playwright/test'
import { signIn, waitForApp } from './bugs/faq-support'

/*
 * The review kit, driven: the board, `R` for a point with its screenshot, the point sent and found
 * in the list (docs/qa/shots/m-review/). The point it leaves on the dev database is taken away by the
 * spec's caller.
 */

const DIR = 'docs/qa/shots/m-review'

test('the board, a point with its screenshot, and the list', async ({ page }, info) => {
    const width = info.project.name.includes('390') ? 390 : 1440
    const errors: string[] = []

    page.on('pageerror', (error) => errors.push(error.message))

    await signIn(page)
    await page.goto('/admin/review', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Stand der Seiten')
    await page.screenshot({ path: `${DIR}/board-${width}.png`, fullPage: true })

    await page.goto('/admin/felgen', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await page.keyboard.press('r')

    const dialog = page.getByRole('dialog', { name: 'Rückmeldung geben' })
    await expect(dialog).toBeVisible({ timeout: 15000 })
    await expect(dialog.locator('img.fb-shot')).toBeVisible()
    await dialog.getByLabel('Was ist dir aufgefallen?').fill('Prüfpunkt aus dem automatischen Test – bitte ignorieren.')
    await page.screenshot({ path: `${DIR}/dialog-${width}.png` })
    await dialog.getByRole('button', { name: 'Senden' }).click()
    await expect(dialog).toBeHidden()

    await page.goto('/admin/review/rueckmeldungen', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await expect(page.locator('.rf-item').first()).toContainText('Prüfpunkt aus dem automatischen Test')
    await expect(page.locator('.rf-item').first()).toContainText('Felgen')
    await page.screenshot({ path: `${DIR}/liste-${width}.png`, fullPage: true })

    expect(errors).toEqual([])
})
