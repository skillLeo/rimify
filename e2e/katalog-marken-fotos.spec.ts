import sharp from 'sharp'
import { expect, test } from './fixtures'
import { signIn, waitForApp } from './bugs/faq-support'

/*
 * The three Katalog pieces of the corrections memo (§7): Katalog › Marken with a logo upload, several
 * photos per colour in an order a person sets (COMPLIANCE row 23), and the importer's supplier (row 25).
 * Each test cleans up what it wrote on the development database: the brand is removed again, the photos
 * are taken off. Shots go to docs/qa/shots/katalog-2/ for the review.
 */

const DIR = 'docs/qa/shots/katalog-2'

const LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50"><path d="M0 0h40v50H0zM60 0h40v50H60zM120 0h80v50h-80z"/></svg>'

/** A plain studio-grey square with a darker disc: a stand-in photograph, never a real product. */
async function photo(shade: number): Promise<Buffer> {
    const disc = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="900" height="900" fill="#e9ebee"/><circle cx="450" cy="450" r="${300 + shade}" fill="rgb(${60 + shade},${64 + shade},${70 + shade})"/></svg>`

    return sharp(Buffer.from(disc)).jpeg({ quality: 80 }).toBuffer()
}

function collectErrors(page: import('@playwright/test').Page): string[] {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
        if (message.type() === 'error') {
            errors.push(message.text())
        }
    })

    return errors
}

test('Marken: a brand is created, gets an SVG logo drawn on the page, and is removed again', async ({ page }, info) => {
    const width = info.project.name.includes('390') ? 390 : 1440
    const name = `E2E Marke ${width}`
    const errors = collectErrors(page)

    await signIn(page)
    await page.goto('/admin/marken', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Marken')

    const row = page.locator('tr', { hasText: name })

    // A run that stopped half-way left its brand: it goes first, so this run starts clean.
    if ((await row.count()) > 0) {
        await row.getByRole('button', { name: /^Entfernen\s*:/ }).click()
        await page.getByRole('dialog').getByRole('button', { name: 'Entfernen' }).click()
        await expect(row).toHaveCount(0)
    }

    await page.fill('#mk-name', name)
    await page.getByRole('button', { name: 'Marke anlegen' }).click()
    await expect(row).toBeVisible()

    await row.locator('input[type="file"]').setInputFiles({ name: 'logo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(LOGO) })
    await expect(row.getByRole('img', { name: `Logo ${name}` })).toBeVisible()
    await row.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${DIR}/marken-${width}.png`, fullPage: true })

    await row.getByRole('button', { name: /^Entfernen\s*:/ }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Entfernen' }).click()
    await expect(row).toHaveCount(0)

    expect(errors).toEqual([])
})

test('Fotos: two photos on a colour, reordered by the arrows, the new first one is the cover — then taken off', async ({ page }, info) => {
    const width = info.project.name.includes('390') ? 390 : 1440
    const errors = collectErrors(page)

    await signIn(page)
    await page.goto('/admin/felgen?status=draft', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await page.locator('.fg-name').first().click()
    await page.waitForURL(/\/admin\/felgen\/\d+$/)
    await waitForApp(page)

    const photos = page.locator('.fe-photos').first()
    await photos.scrollIntoViewIfNeeded()

    for (const [i, alt] of ['E2E-Foto, Ansicht von vorn', 'E2E-Foto, schräg von der Seite'].entries()) {
        await photos.getByRole('button', { name: 'Foto hinzufügen' }).click()
        await photos.locator('input[type="file"]').setInputFiles({ name: `foto-${i}.jpg`, mimeType: 'image/jpeg', buffer: await photo(i * 40) })
        await photos.getByLabel('Was zeigt das Foto?').fill(alt)
        await photos.getByRole('button', { name: 'Hochladen' }).click()
        await expect(photos.getByText(alt)).toBeVisible()
    }

    const items = photos.locator('.fe-photos__item')
    await expect(items).toHaveCount(2)
    await expect(items.first()).toContainText('Titelbild')
    await page.screenshot({ path: `${DIR}/fotos-${width}.png` })

    // The arrows step aside below 768 px; the menu always has the same move.
    if (width >= 768) {
        await photos.getByRole('button', { name: 'Foto 1 nach unten' }).click()
    } else {
        await photos.getByRole('button', { name: 'Aktionen für Foto 1' }).click()
        await page.getByRole('menuitem', { name: 'Nach unten' }).click()
    }

    await expect(items.first()).toContainText('E2E-Foto, schräg von der Seite')
    await expect(items.first()).toContainText('Titelbild')
    await page.screenshot({ path: `${DIR}/fotos-${width}-reordered.png` })

    // Taken off again, so the development catalogue is as it was.
    for (let left = 2; left > 0; left--) {
        await photos.getByRole('button', { name: 'Aktionen für Foto 1' }).click()
        await page.getByRole('menuitem', { name: 'Entfernen' }).click()
        await page.getByRole('dialog').getByRole('button', { name: 'Entfernen' }).click()
        await expect(items).toHaveCount(left - 1)
    }

    expect(errors).toEqual([])
})

test('Import: the supplier field, and the run names the supplier and where its mapping came from', async ({ page }, info) => {
    const width = info.project.name.includes('390') ? 390 : 1440
    const errors = collectErrors(page)

    await signIn(page)
    await page.goto('/admin/katalog/import', { waitUntil: 'networkidle' })
    await waitForApp(page)

    const sample = await page.request.get('/admin/katalog/import/beispiel.csv')
    await page.setInputFiles('#im-file', { name: 'beispiel.csv', mimeType: 'text/csv', buffer: await sample.body() })
    await page.fill('#im-supplier', 'E2E Lieferant')
    await page.screenshot({ path: `${DIR}/import-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: 'Probelauf starten' }).click()
    await page.waitForURL(/\/admin\/katalog\/import\/\d+$/)
    await waitForApp(page)

    await expect(page.getByText('Erkannt an den Spaltennamen. Nach dem Importieren merkt sich der Import diese Zuordnung für E2E Lieferant.')).toBeVisible()
    await page.screenshot({ path: `${DIR}/import-lauf-${width}.png`, fullPage: true })

    expect(errors).toEqual([])
})
