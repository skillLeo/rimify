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

    async function removeBrand(): Promise<void> {
        await row.getByRole('button', { name: `Aktionen für ${name}` }).click()
        await page.getByRole('menuitem', { name: 'Entfernen', exact: true }).click()
        await page.getByRole('dialog').getByRole('button', { name: 'Entfernen' }).click()
        await expect(row).toHaveCount(0)
    }

    // A run that stopped half-way left its brand: it goes first, so this run starts clean.
    if ((await row.count()) > 0) {
        await removeBrand()
    }

    await page.fill('#mk-name', name)
    await page.getByRole('button', { name: 'Marke anlegen' }).click()
    await expect(row).toBeVisible()

    await row.locator('input[type="file"]').setInputFiles({ name: 'logo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(LOGO) })
    await expect(row.getByRole('img', { name: `Logo ${name}` })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Marke anlegen' })).toBeEnabled()
    await row.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${DIR}/marken-${width}.png`, fullPage: true })

    // The row's menu from the keyboard: focus on its trigger, Enter opens it.
    await row.getByRole('button', { name: `Aktionen für ${name}` }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menuitem', { name: 'Logo ersetzen' })).toBeVisible()
    await page.screenshot({ path: `${DIR}/marken-${width}-menu.png` })
    await page.keyboard.press('Escape')

    await removeBrand()

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

    // The arrows step aside below 768 px; the menu always has the same move. Both from the keyboard.
    if (width >= 768) {
        await photos.getByRole('button', { name: 'Foto 1 nach unten' }).focus()
        await page.screenshot({ path: `${DIR}/fotos-${width}-focus.png` })
        await page.keyboard.press('Enter')
        // The keyboard stays on the photo it moved: now its „nach oben“, the only way it can go.
        await expect(photos.getByRole('button', { name: 'Foto 2 nach oben' })).toBeFocused()
    } else {
        await photos.getByRole('button', { name: 'Aktionen für Foto 1' }).focus()
        await page.keyboard.press('Enter')
        await expect(page.getByRole('menuitem', { name: 'Nach unten' })).toBeVisible()
        await page.screenshot({ path: `${DIR}/fotos-${width}-menu.png` })
        await page.getByRole('menuitem', { name: 'Nach unten' }).click()
    }

    await expect(items.first()).toContainText('E2E-Foto, schräg von der Seite')
    await expect(items.first()).toContainText('Titelbild')
    await expect(photos.getByText('Die Reihenfolge änderst du im Menü eines Fotos.')).toBeVisible({ visible: width < 768 })
    await page.screenshot({ path: `${DIR}/fotos-${width}-reordered.png` })

    // Taken off again, so the development catalogue is as it was.
    for (let left = 2; left > 0; left--) {
        await photos.getByRole('button', { name: 'Aktionen für Foto 1' }).click()
        await page.getByRole('menuitem', { name: 'Entfernen', exact: true }).click()
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

    await expect(page.getByText('Erkannt an den Spaltennamen. Mit dem Import wird diese Zuordnung für „E2E Lieferant“ gespeichert.')).toBeVisible()
    await page.screenshot({ path: `${DIR}/import-lauf-${width}.png`, fullPage: true })

    // A file with one line the importer refuses: the run offers the refused lines as a CSV.
    const csv = ['SKU;Marke;Modell;Ausführung;Durchmesser;Breite;ET;Lochkreis;Mittenloch;Preis', 'E2E-18-80-35;E2E-Marke;E2E-Modell;Silber;18;acht;35;5x112;66,6;189,00'].join('\r\n')
    await page.goto('/admin/katalog/import', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await page.setInputFiles('#im-file', { name: 'e2e-abgelehnt.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
    await page.getByRole('button', { name: 'Probelauf starten' }).click()
    await page.waitForURL(/\/admin\/katalog\/import\/\d+$/)
    await waitForApp(page)

    const link = page.getByRole('link', { name: 'Abgelehnte Zeilen als CSV' })
    await expect(link).toBeVisible()
    const refused = await page.request.get((await link.getAttribute('href')) ?? '')
    expect(await refused.text()).toContain('Die Breite können wir nicht lesen')
    await link.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${DIR}/import-abgelehnt-${width}.png` })

    expect(errors).toEqual([])
})
