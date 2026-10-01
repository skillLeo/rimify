import { expect, test } from './fixtures'
import { signIn, waitForApp } from './bugs/faq-support'

/*
 * Proof shots of Katalog › Felgen and Katalog › Import (docs/qa/shots/m-katalog/): the list, one
 * Felge's form, the empty form for a new one, and the importer's first step. Nothing is saved: the
 * pages are only opened.
 */

const DIR = 'docs/qa/shots/m-katalog'

test('Katalog: the list, a Felge, a new Felge, the importer', async ({ page }, info) => {
    const width = info.project.name.includes('390') ? 390 : 1440
    const errors: string[] = []

    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
        if (message.type() === 'error') {
            errors.push(message.text())
        }
    })

    await signIn(page)

    await page.goto('/admin/felgen', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Felgen')
    await page.screenshot({ path: `${DIR}/felgen-${width}.png`, fullPage: true })
    await page.screenshot({ path: `${DIR}/felgen-${width}-top.png` })

    const first = page.locator('.fg-name').first()
    await first.click()
    await page.waitForURL(/\/admin\/felgen\/\d+$/)
    await waitForApp(page)
    await expect(page.getByRole('heading', { name: /Vor dem Veröffentlichen/ })).toBeVisible()
    await page.screenshot({ path: `${DIR}/felge-${width}.png`, fullPage: true })
    await page.locator('#fe-h-sizes').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${DIR}/felge-${width}-sizes.png` })

    await page.goto('/admin/felgen/neu', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Neue Felge')
    await page.screenshot({ path: `${DIR}/felge-neu-${width}.png`, fullPage: true })

    await page.goto('/admin/katalog/import', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Katalog-Import')
    await page.screenshot({ path: `${DIR}/import-${width}.png`, fullPage: true })

    // A Probelauf of the importer's own example file: read and compared, nothing written to the
    // catalogue. The run it leaves is taken away again by the spec's caller (the dev database).
    const sample = await page.request.get('/admin/katalog/import/beispiel.csv')
    await page.setInputFiles('#im-file', { name: 'beispiel.csv', mimeType: 'text/csv', buffer: await sample.body() })
    await page.getByRole('button', { name: 'Probelauf starten' }).click()
    await page.waitForURL(/\/admin\/katalog\/import\/\d+$/)
    await waitForApp(page)
    await expect(page.getByRole('heading', { name: 'Probelauf' })).toBeVisible()
    await page.screenshot({ path: `${DIR}/import-probelauf-${width}.png`, fullPage: true })

    expect(errors).toEqual([])
})
