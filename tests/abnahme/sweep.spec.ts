import { Buffer } from 'node:buffer'
import type { Page } from '@playwright/test'
import { BASE, VISITOR } from './instance'
import { consent, evidenceAround, evidencePage, expect, open, phone, test } from './fixtures'
import { PRODUCT, onSize, pageProps, withCar } from './shop'

/*
 * The sweep's last items on the instance RIMIFY_URL names (the operator's brief „RUN THIS TO THE END“ §3): the 500 page,
 * the Fahrzeugschein photograph path and the Gutachten PDF opening at its page — the three EIGENE-FUNDE listed as „not
 * done, and so not claimed“. Tagged `@sweep`, never `@kunde`: they tick nothing on the client's sheet. Nothing here writes:
 * the photographs are drawn in the page and read on the device, and the read figures are not kept.
 */

test.use({ storageState: VISITOR })

test.beforeEach(async ({ page }) => {
    await consent(page)
})

/** A photographed form, drawn in the page itself: white paper, black print, the labels the document prints. */
async function photograph(page: Page, lines: string[]): Promise<{ name: string; mimeType: string; buffer: Buffer }> {
    const data = await page.evaluate((text) => {
        const canvas = document.createElement('canvas')
        canvas.width = 1400
        canvas.height = 200 + text.length * 120
        const g = canvas.getContext('2d') as CanvasRenderingContext2D
        g.fillStyle = '#ffffff'
        g.fillRect(0, 0, canvas.width, canvas.height)
        g.fillStyle = '#000000'
        g.font = 'bold 64px Arial, Helvetica, sans-serif'
        text.forEach((line, i) => g.fillText(line, 80, 140 + i * 120))

        return canvas.toDataURL('image/png')
    }, lines)

    return { name: 'zulassungsbescheinigung.png', mimeType: 'image/png', buffer: Buffer.from(data.split(',')[1] ?? '', 'base64') }
}

test('the 500 page: what a failure shows, inside the shop\'s frame, with three ways on — and the standalone one a failed boot gets', { tag: '@sweep' }, async ({ page, problems }, info) => {
    problems.expected(/^500 .*\/__fehlerseite\/500(\?eigenstaendig=1)?$/, 'the 500 page is opened on purpose (/__fehlerseite/500, D-243)')
    // The browser writes that document's status to the console too, without its address; any other 500 still shows as a response.
    problems.expected(/^console: Failed to load resource: the server responded with a status of 500 \(\)$/, 'the 500 page opened on purpose, as the browser logs it')

    await open(page, '/__fehlerseite/500')
    await expect(page.locator('h1')).toHaveText('Da ist etwas schiefgelaufen.')
    // The frame survives the failure: header and footer, and three ways on (R-09).
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.locator('footer')).toHaveCount(1)
    expect(await page.getByRole('main').locator('a[href], button').count(), 'fewer than three ways on').toBeGreaterThanOrEqual(3)
    expect(await page.locator('a[href^="mailto:"]').count()).toBe(0)
    await evidencePage(page, 0, info, `sweep-500-${phone(info) ? 'webkit' : 'chromium'}`)

    // The page that needs neither the bundle nor the database.
    const standalone = await page.goto('/__fehlerseite/500?eigenstaendig=1', { waitUntil: 'load' })
    expect(standalone?.status()).toBe(500)
    await expect(page.locator('body')).toContainText('Da ist etwas schiefgelaufen.')
    expect(await page.locator('script[src*="/build/"], link[href*="/build/"]').count(), 'the standalone page loads the bundle').toBe(0)
    await evidencePage(page, 0, info, `sweep-500-eigenstaendig-${phone(info) ? 'webkit' : 'chromium'}`)
})

test('the Fahrzeugschein photograph: read on the device — the key numbers in the hero, 8.1, 8.2 and T on the product page', { tag: '@sweep' }, async ({ page }, info) => {
    test.setTimeout(240_000)

    // 1 · The homepage's scan — the desktop hero's third tab, the phone panel's camera button. Closed where the key
    // numbers are (no vehicle data opens them yet): then it says so, and the reading is shown on the product page below,
    // where the same engine reads the same photograph.
    await open(page, '/')
    const keys = await photograph(page, ['Zulassungsbescheinigung Teil I', '2.1   0005', '2.2   582AAB12345'])

    if (phone(info)) {
        const panel = page.locator('.vpanel').first()

        if ((await panel.getByRole('button', { name: 'Fahrzeugschein scannen' }).count()) > 0) {
            await panel.locator('input[type="file"]').setInputFiles(keys)
            await expect(panel.getByLabel('HSN (Feld 2.1)')).toHaveValue('0005', { timeout: 90_000 })
            await expect(panel.getByLabel('TSN (Feld 2.2)')).toHaveValue('582')
            info.annotations.push({ type: 'hero', description: 'HSN 0005 und TSN 582 aus dem Foto gelesen; nicht übernommen (keine Suche, nichts gespeichert).' })
            await evidenceAround(page, [panel], 0, info, 16, 'sweep-foto-hero-webkit')
        } else {
            // The camera waits with the key numbers; the HSN/TSN tab says why.
            await panel.getByRole('tab', { name: 'HSN/TSN' }).click()
            await expect(panel.locator('.vpanel__closed')).toBeVisible()
            info.annotations.push({ type: 'hero', description: `Scan geschlossen: „${(await panel.locator('.vpanel__closed p').textContent())?.trim()}“` })
        }
    } else {
        const hero = page.getByRole('region', { name: 'Felgen, die an dein Auto dürfen.' })
        await hero.getByRole('tab', { name: 'Fahrzeugschein scannen' }).click()
        const scan = hero.getByLabel('Foto der Zulassungsbescheinigung Teil I')

        if ((await scan.count()) > 0) {
            await scan.setInputFiles(keys)
            await expect(hero.getByText('Stimmt das?')).toBeVisible({ timeout: 90_000 })
            await expect(hero.getByLabel('HSN (Feld 2.1)')).toHaveValue('0005')
            await expect(hero.getByLabel('TSN (Feld 2.2)')).toHaveValue('582')
            info.annotations.push({ type: 'hero', description: 'HSN 0005 und TSN 582 aus dem Foto gelesen; nicht übernommen (keine Suche, nichts gespeichert).' })
            await evidencePage(page, 0, info, 'sweep-foto-hero-chromium')
        } else {
            // The scan tab's own notice; the HSN/TSN tab carries one of its own, hidden while its tab is not chosen.
            const closed = hero.locator('.sel__closed:visible')
            await expect(closed).toBeVisible()
            info.annotations.push({ type: 'hero', description: `Scan geschlossen: „${(await closed.locator('p').first().textContent())?.trim()}“` })
        }
    }

    // 2 · The product page's papers: 8.1, 8.2 and T from the same kind of photograph, into the fields — kept only on
    // „Werte übernehmen“, which is not pressed.
    await withCar(page, 'x3', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await page.locator('#pp-open, #pp-change').first().click()
    await page.locator('#pp-photo').setInputFiles(await photograph(page, ['Zulassungsbescheinigung Teil I', '8.1   1120', '8.2   1180', 'T   250']))
    await expect(page.locator('.pp__help[role="status"]')).toHaveText('Aus dem Foto gelesen. Prüf die Werte, bevor du sie übernimmst.', { timeout: 90_000 })
    await expect(page.locator('#pp-axle_front_kg')).toHaveValue('1120')
    await expect(page.locator('#pp-axle_rear_kg')).toHaveValue('1180')
    await expect(page.locator('#pp-top_speed_kmh')).toHaveValue('250')

    await evidenceAround(page, [page.locator('.pp').first()], 0, info, 16, `sweep-foto-${phone(info) ? 'webkit' : 'chromium'}`)
})

test('the Gutachten PDF opens at its page: the link names the page, the file is a PDF that has it', { tag: '@sweep' }, async ({ page, request }, info) => {
    test.skip(phone(info), 'once, in Chromium: WebKit hands a PDF to the system rather than showing it')

    await withCar(page, 'x3', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')

    const props = await pageProps<{ configs: { id: number; verdict: { document?: { pdf?: { page?: number | null } } } | null }[] }>(page)
    const shown = props.configs.find((c) => c.id === Number(new URL(page.url()).searchParams.get('groesse')))
    const expected = shown?.verdict?.document?.pdf?.page ?? null
    let link = (await page.locator('.fit__pdf a').first().getAttribute('href')) ?? ''

    expect(link, 'no „Gutachten öffnen“ on the product page').not.toBe('')

    // An example document opens through the page that marks it first (D-239), and from there the file.
    if (/\/gutachten\/\d+\/beispiel/.test(link)) {
        await open(page, link)
        await expect(page.locator('h1')).toContainText('nur als Beispiel hinterlegt')
        await evidencePage(page, 0, info, 'sweep-pdf-beispielseite-chromium')
        link = (await page.getByRole('link', { name: /Das Dokument öffnen/ }).getAttribute('href')) ?? ''
    }

    expect(link).toMatch(/#page=\d+$/)
    const pageNo = Number(/#page=(\d+)$/.exec(link)?.[1])

    if (expected !== null) {
        expect(pageNo, 'the link opens another page than the one the answer names').toBe(expected)
    }

    const response = await request.get(new URL(link.replace(/#.*$/, ''), BASE).toString())
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/pdf')
    const body = await response.body()
    expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-')

    // Its page count, where the file states it in the open: the page the link names must exist.
    const counts = [...body.toString('latin1').matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/g)].map((m) => Number(m[1]))
    const pages = counts.length > 0 ? Math.max(...counts) : null

    if (pages !== null) {
        expect(pageNo, `the link names page ${pageNo} of a ${pages}-page PDF`).toBeLessThanOrEqual(pages)
    }

    info.annotations.push({ type: 'pdf', description: `Seite ${pageNo}${pages === null ? ' (Seitenzahl der Datei nicht offen lesbar)' : ` von ${pages}`}, ${body.length} Bytes, ${link}` })
})
