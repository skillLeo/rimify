import { expect, test } from './fixtures'
import { signIn, waitForApp } from './bugs/faq-support'
import { busiestDocument } from './bugs/gutachten-support'

/*
 * Proof shots of Gutachten, Fahrzeuge and one order (docs/qa/shots/m-gutachten/): the documents, the
 * form for a new one, one released document with its rows and preview, the Auflagen-Katalog, the
 * vehicles and one of them, and an order with its frozen proof. Nothing is saved: pages are opened,
 * and the preview is only read.
 */

const DIR = 'docs/qa/shots/m-gutachten'

test('Gutachten, Auflagen, Fahrzeuge and one order', async ({ page }, info) => {
    const width = info.project.name.includes('390') ? 390 : 1440
    const errors: string[] = []

    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
        if (message.type() === 'error') {
            errors.push(message.text())
        }
    })

    await signIn(page)

    await page.goto('/admin/gutachten', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await page.screenshot({ path: `${DIR}/dokumente-${width}.png`, fullPage: true })

    await page.goto('/admin/gutachten/neu', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Neues Gutachten')
    await page.screenshot({ path: `${DIR}/neu-${width}.png`, fullPage: true })

    // A released document (the preview needs its rows in the shop), the smallest one: not whichever the
    // list happens to show first.
    const released = await busiestDocument(page)
    await page.locator(`a.gd-link[href$="/admin/gutachten/${released}"]`).first().click()
    await page.waitForURL(/\/admin\/gutachten\/\d+$/)
    await waitForApp(page)
    await expect(page.getByRole('heading', { name: 'Verwendungsbereich' })).toBeVisible()
    await page.getByRole('button', { name: 'Vorschau zeigen' }).click()
    await expect(page.locator('.gs-verdict').first()).toBeVisible()
    await page.screenshot({ path: `${DIR}/dokument-${width}.png`, fullPage: true })

    // A draft, where the rows are entered: the composer below the Verwendungsbereich.
    await page.goto('/admin/gutachten', { waitUntil: 'networkidle' })
    const draft = page.locator('tbody tr', { hasText: 'Entwurf' }).locator('.gd-link').first()

    if ((await draft.count()) > 0) {
        await draft.click()
        await page.waitForURL(/\/admin\/gutachten\/\d+$/)
        await waitForApp(page)
        await expect(page.getByRole('heading', { name: 'Zeilen hinzufügen' })).toBeVisible()
        await page.screenshot({ path: `${DIR}/entwurf-${width}.png`, fullPage: true })
    }

    await page.goto('/admin/auflagen', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await page.screenshot({ path: `${DIR}/auflagen-${width}.png`, fullPage: true })

    await page.goto('/admin/fahrzeuge', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await page.screenshot({ path: `${DIR}/fahrzeuge-${width}.png`, fullPage: true })
    await page.locator('.fz-name').first().click()
    await page.waitForURL(/\/admin\/fahrzeuge\/\d+$/)
    await waitForApp(page)
    await page.screenshot({ path: `${DIR}/fahrzeug-${width}.png`, fullPage: true })

    await page.goto('/admin/bestellungen', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await page.locator('.ob-number').first().click()
    await page.waitForURL(/\/admin\/bestellungen\/\d+$/)
    await waitForApp(page)
    await page.screenshot({ path: `${DIR}/bestellung-${width}.png`, fullPage: true })

    expect(errors).toEqual([])
})
