import { expect, type Locator, type Page, type Response } from '@playwright/test'
import { waitForApp } from './bugs/faq-support'

/*
 * The five steps of a Gutachten as a person walks them: a real draft, written through the page. A paper made here stays a draft unless
 * a test releases it, under a number of its own, and names no car the shop's specs read.
 */

/** A PDF of `pages` pages that says on each one that it is a placeholder and no Gutachten. */
export function placeholderPdf(pages: number, tag = ''): Buffer {
    const escape = (text: string): string => text.replace(/[\\()]/g, (c) => `\\${c}`)
    const bodies: string[] = []
    const kids: number[] = []
    let next = 4

    for (let n = 1; n <= pages; n += 1) {
        const page = next++
        const content = next++
        kids.push(page)
        const lines = ['PLATZHALTER - kein echtes Gutachten', 'RIMIFY Probelauf der Vorschau', `Seite ${n} von ${pages}`, 'Dieses Dokument sagt nichts ueber ein Fahrzeug.', tag]
        const stream = `BT /F1 20 Tf 60 760 Td ${lines.map((line, i) => `${i ? '0 -32 Td ' : ''}(${escape(line)}) Tj`).join(' ')} ET`
        bodies[content] = `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`
        bodies[page] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${content} 0 R >>`
    }

    bodies[1] = '<< /Type /Catalog /Pages 2 0 R >>'
    bodies[2] = `<< /Type /Pages /Kids [${kids.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages} >>`
    bodies[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'

    let body = '%PDF-1.4\n'
    const offsets: number[] = []

    for (let id = 1; id < bodies.length; id += 1) {
        offsets[id] = Buffer.byteLength(body, 'latin1')
        body += `${id} 0 obj\n${bodies[id]}\nendobj\n`
    }

    const xref = Buffer.byteLength(body, 'latin1')
    body += `xref\n0 ${bodies.length}\n0000000000 65535 f \n`

    for (let id = 1; id < bodies.length; id += 1) {
        body += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
    }

    body += `trailer\n<< /Size ${bodies.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`

    return Buffer.from(body, 'latin1')
}

/** A number no other paper has: a file and a number of its own per run. */
export function freshNumber(prefix: string): string {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

/** Step 1: the PDF, Art and Nummer, nothing else. Lands on step 2 of the new draft. */
export async function newPaper(page: Page, number: string): Promise<string> {
    await page.goto('/admin/gutachten/neu', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await page.locator('#gn-pdf').setInputFiles({ name: `${number}.pdf`, mimeType: 'application/pdf', buffer: placeholderPdf(4, number) })
    await page.locator('#gn-kind').selectOption('ABE')
    await page.locator('#gn-number').fill(number)
    await page.getByRole('button', { name: 'Gutachten anlegen' }).click()
    await page.waitForURL(/\/admin\/gutachten\/\d+/, { timeout: 30_000 })
    await waitForApp(page)

    return page.url().replace(/\?.*$/, '')
}

/** Step 2: the first size the search finds. */
export async function chooseFirstWheel(page: Page): Promise<void> {
    await chooseWheelWith(page, async (front) => {
        const eighteen = front.locator('input[data-version*="× 18"]').first()

        if ((await eighteen.count()) === 0) {
            return false
        }

        await eighteen.check()

        return true
    })
    const stored = page.waitForResponse((r) => r.url().endsWith('/erfassung/kombinationen') && r.request().method() === 'POST')
    await page.getByRole('button', { name: 'Kombination hinzufügen' }).click()
    await stored
}

/**
 * Step 2: the first wheel the search offers that passes `fits`, shown on the two axles. `fits` looks at the front axle's versions
 * and may pick one there.
 */
export async function chooseWheelWith(page: Page, fits: (front: Locator) => Promise<boolean>): Promise<void> {
    const asked = (r: Response, q: string): boolean => new URL(r.url()).pathname.endsWith('/suche/felgen') && new URL(r.url()).searchParams.get('q') === q
    const searched = page.waitForResponse((r) => asked(r, 'a'))
    await page.locator('#ef-wheel-q').fill('a')
    await searched
    await expect(page.locator('.ef-model').first()).toBeVisible()
    const models = await page.locator('.ef-model').count()

    for (let i = 0; i < models; i++) {
        const loaded = page.waitForResponse((r) => new URL(r.url()).searchParams.has('modell'))
        await page.locator('.ef-model').nth(i).click()
        await loaded
        const front = page.locator('.ef-axle').first()
        await expect(front.locator('.ef-size').first()).toBeVisible()

        if (await fits(front)) {
            return
        }

        await page.getByRole('button', { name: 'Andere Felge' }).click()
        const again = page.waitForResponse((r) => asked(r, 'a'))
        await page.locator('#ef-wheel-q').fill('a')
        await again
        await expect(page.locator('.ef-model').nth(i)).toBeVisible()
    }

    throw new Error('No wheel in this shop passes the test\'s condition.')
}

/** Step 3: the search answered, for what it says it found. */
export async function searchCars(page: Page, term: string): Promise<void> {
    const searched = page.waitForResponse((r) => new URL(r.url()).pathname.endsWith('/suche/fahrzeuge') && new URL(r.url()).searchParams.get('q') === term)
    await page.locator('#ef-cars-q').fill(term)
    await searched
}

/** A save the page would send, with the admin's XSRF header: a fact a test only needs to be there. */
export async function postAdmin(page: Page, url: string, data: Record<string, unknown>): Promise<void> {
    const cookie = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')
    const response = await page.request.post(url, {
        headers: { Accept: 'text/html', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': decodeURIComponent(cookie?.value ?? ''), Referer: url },
        data,
        maxRedirects: 0,
    })

    expect(response.status(), `${url} refused: ${await response.text().catch(() => '')}`).toBeLessThan(400)
}

/** A step of the bar. */
export async function goToStep(page: Page, name: string): Promise<void> {
    await page.getByRole('navigation', { name: 'Schritte zum Gutachten' }).getByRole('button', { name: new RegExp(name) }).click()
}

/** A car's lines stored: set this up before what changes them. */
export function lineSaved(page: Page): Promise<unknown> {
    return page.waitForResponse((r) => /\/erfassung\/fahrzeuge\/\d+$/.test(new URL(r.url()).pathname) && r.request().method() === 'PUT' && r.ok(), { timeout: 15_000 })
}

/** Waits for what was typed to be stored. */
export async function saved(page: Page): Promise<void> {
    await expect(page.locator('.adm-page__context')).toContainText('wird beim Tippen gespeichert', { timeout: 15_000 })
}

/** Nothing on the page reaches past its width. */
export async function noSidewaysScroll(page: Page): Promise<void> {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

    expect(overflow, 'the page scrolls sideways').toBeLessThanOrEqual(0)
}
