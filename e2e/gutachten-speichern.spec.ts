import { signIn, waitForApp } from './bugs/faq-support'
import { expect, test, type Page } from './fixtures'
import type { Route } from '@playwright/test'
import { chooseFirstWheel, freshNumber, goToStep, newPaper, openPrinted, saved, searchCars } from './gutachten-erfassung-support'

/*
 * What the interaction review of 06.11.2026 found in the five steps, in a real browser: slow answers, a lost connection, a reload, and
 * the window's edges. The parts' own logic is pinned in resources/js/Pages/Admin/Gutachten/Erfassung/saving.test.ts.
 */

test.setTimeout(180_000)

test.beforeEach(({ browserName: _browser }, info) => {
    test.skip(info.project.name.startsWith('mobile'), 'The entry is a desk job (§7).')
})

const CAR_PUT = /\/erfassung\/fahrzeuge\/\d+$/

async function draftWithCars(page: Page, tag: string, cars = 2): Promise<string> {
    await signIn(page)

    const url = await newPaper(page, freshNumber(tag))

    await chooseFirstWheel(page)
    await page.getByRole('button', { name: 'Weiter: Fahrzeuge' }).click()
    await searchCars(page, 'BMW')

    for (let n = 0; n < cars; n += 1) {
        await page.locator('.ef-hit input').nth(n).check()
        await expect(page.locator('.ef-chosen__car')).toHaveCount(n + 1)
    }

    await page.getByRole('button', { name: 'Weiter: Reifen' }).click()
    await expect(page.locator('.ef-pdf__frame')).toBeVisible()

    return url
}

/** Holds each PUT of a car until the test lets it go. */
async function holdPuts(page: Page): Promise<{ release: () => void; count: () => number }> {
    let count = 0
    const waiting: Route[] = []
    let open = false

    await page.route(CAR_PUT, async (route) => {
        if (route.request().method() !== 'PUT') {
            return route.fallback()
        }

        count += 1

        if (open) {
            return route.fallback()
        }

        waiting.push(route)
    })

    return {
        count: () => count,
        release: () => {
            open = true
            waiting.splice(0).forEach((route) => void route.fallback())
        },
    }
}

test('one save per change: after typing a size the page goes quiet, and its line says it is stored', async ({ page }) => {
    await draftWithCars(page, 'E2E-RUHE', 1)

    let puts = 0

    page.on('request', (r) => {
        if (r.method() === 'PUT' && CAR_PUT.test(new URL(r.url()).pathname)) {
            puts += 1
        }
    })

    await page.getByRole('button', { name: 'Kombination', exact: true }).click()
    await page.locator('[id^=ef-front-]').first().pressSequentially('225/40 R18 88W')
    await page.locator('[id^=ef-codes-]').first().focus()
    await saved(page)
    await expect.poll(() => puts).toBeGreaterThan(0)

    const settled = puts

    // Ten seconds in the review: 15 saves. Nothing was changed here, and nothing may go out.
    await page.waitForTimeout(3000)

    expect(puts).toBe(settled)
    await expect(page.locator('.adm-page__context')).toContainText('wird beim Tippen gespeichert')
})

test('the end of a size typed while its beginning is being saved reaches the server, picking the next car from the list', async ({ page }) => {
    await draftWithCars(page, 'E2E-ENDE')

    const held = await holdPuts(page)
    const front = page.locator('[id^=ef-front-]').first()

    await page.getByRole('button', { name: 'Kombination', exact: true }).click()
    await front.pressSequentially('235/40R18')
    await expect.poll(() => held.count()).toBe(1)

    await front.pressSequentially(' 95Y')
    await page.locator('.ef-todo__item').nth(1).click()

    // The list does not move on from under what is being saved.
    await expect(page.locator('.ef-todo__item').nth(0)).toHaveAttribute('aria-current', 'true')

    held.release()

    await expect(page.locator('.ef-todo__item').nth(1)).toHaveAttribute('aria-current', 'true', { timeout: 15_000 })
    await expect(page.locator('#ef-editor-h')).toBeFocused()

    await page.locator('.ef-todo__item').nth(0).click()
    await expect(page.locator('[id^=ef-front-]').first()).toHaveValue('235/40 R18 95Y', { timeout: 15_000 })
    await expect(page.locator('[id^=ef-rear-]').first()).toHaveValue('235/40 R18 95Y')
    await expect(page.locator('.ef-step [role="alert"]')).toHaveCount(0)
})

test('a save lost on the way is not dropped: „Speichern und weiter“ stays on the car, says so, and goes on once it is stored', async ({ page }) => {
    await draftWithCars(page, 'E2E-NETZ')

    let lost = true

    await page.route(CAR_PUT, async (route) => {
        if (route.request().method() === 'PUT' && lost) {
            return route.abort('internetdisconnected')
        }

        return route.fallback()
    })

    await page.getByRole('button', { name: 'Kombination', exact: true }).click()
    await page.locator('[id^=ef-front-]').first().fill('225/40 R18 88W')
    await page.getByRole('button', { name: /Speichern und weiter/ }).click()

    const problem = page.locator('.ef-actions__problem')

    await expect(problem).toContainText('nicht gespeichert')
    await expect(page.locator('.ef-todo__item').nth(0)).toHaveAttribute('aria-current', 'true')
    await expect(problem).toBeInViewport()

    lost = false
    await page.getByRole('button', { name: 'Noch einmal versuchen' }).click()
    await expect(problem).toHaveCount(0, { timeout: 15_000 })

    await page.getByRole('button', { name: /Speichern und weiter/ }).click()
    await expect(page.locator('.ef-todo__item').nth(1)).toHaveAttribute('aria-current', 'true', { timeout: 15_000 })

    await page.locator('.ef-todo__item').nth(0).click()
    await expect(page.locator('[id^=ef-front-]').first()).toHaveValue('225/40 R18 88W', { timeout: 15_000 })
})

test('a car that fails to load is not an empty car: nothing to type in, the stored line untouched', async ({ page }) => {
    await draftWithCars(page, 'E2E-LADEN')

    await page.getByRole('button', { name: 'Kombination', exact: true }).click()
    await page.locator('[id^=ef-front-]').first().fill('205/55 R16 91V')
    await page.getByRole('button', { name: /Speichern und weiter/ }).click()
    await expect(page.locator('.ef-todo__item').nth(1)).toHaveAttribute('aria-current', 'true', { timeout: 15_000 })

    let failing = true

    await page.route(CAR_PUT, async (route) => {
        if (route.request().method() === 'GET' && failing) {
            return route.fulfill({ status: 500, body: '{}' })
        }

        return route.fallback()
    })

    await page.locator('.ef-todo__item').nth(0).click()
    await expect(page.locator('.ef-editor [role="alert"]')).toContainText('nicht geladen')
    await expect(page.locator('[id^=ef-front-]')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Kombination', exact: true })).toHaveCount(0)

    failing = false
    await page.getByRole('button', { name: 'Noch einmal laden' }).click()
    await expect(page.locator('[id^=ef-front-]').first()).toHaveValue('205/55 R16 91V', { timeout: 15_000 })
})

test('the page control moves the paper: a new frame on the page asked for, and that page is what gets taken over', async ({ page }) => {
    await draftWithCars(page, 'E2E-SEITE', 1)

    const frame = page.locator('.ef-pdf__frame')

    await expect(frame).toHaveAttribute('src', /\/pdf\?v=[0-9a-f]+#page=1&/)
    await page.getByRole('button', { name: 'Nächste Seite' }).click()
    await page.getByRole('button', { name: 'Nächste Seite' }).click()
    await expect(frame).toHaveAttribute('src', /#page=3&/)
    await page.locator('#ef-pdf-page').fill('2')
    await page.locator('#ef-pdf-page').blur()
    await expect(frame).toHaveAttribute('src', /#page=2&/)

    await page.getByRole('button', { name: 'PDF-Seite 2 übernehmen' }).click()
    await expect(page.locator('#ef-page')).toHaveValue('2')
})

test('step 1: one save at a time, nothing typed is lost, and the step is only left once the server holds it', async ({ page }) => {
    await signIn(page)
    await newPaper(page, freshNumber('E2E-EINS'))
    await goToStep(page, 'Gutachten')

    let held = true
    const waiting: Route[] = []
    let puts = 0

    await page.route(/\/admin\/gutachten\/\d+$/, async (route) => {
        if (route.request().method() !== 'PUT') {
            return route.fallback()
        }

        puts += 1

        if (held) {
            waiting.push(route)

            return
        }

        return route.fallback()
    })

    const issuer = page.locator('#ef-issuer')

    await issuer.fill('TÜV')
    await expect.poll(() => puts).toBe(1)

    // Typed while the first is out: goes after its answer, with that answer's stamp, and no tab is blamed.
    await issuer.fill('TÜV SÜD')
    await page.getByRole('button', { name: 'Weiter: Felge' }).click()
    await expect(page.locator('#ef-issuer')).toBeVisible()

    held = false
    waiting.splice(0).forEach((route) => void route.fallback())

    await expect(page.locator('#ef-wheel-q')).toBeVisible({ timeout: 15_000 })
    await expect.poll(() => puts).toBe(2)
    expect(new URL(page.url()).searchParams.get('schritt')).toBe('2')

    await goToStep(page, 'Gutachten')
    await expect(page.locator('#ef-issuer')).toHaveValue('TÜV SÜD')
    await expect(page.locator('.ef-step [role="alert"]')).toHaveCount(0)

    // A date that is none: said, and the step stays.
    await page.locator('#ef-date').fill('32.13.2024')
    await page.getByRole('button', { name: 'Weiter: Felge' }).click()
    await expect(page.locator('#ef-date-err')).not.toBeEmpty({ timeout: 15_000 })
    await expect(page.locator('#ef-date')).toBeVisible()

    await page.locator('#ef-date').fill('')
    await saved(page)
    await page.getByRole('button', { name: 'Weiter: Felge' }).click()
    await expect(page.locator('#ef-wheel-q')).toBeVisible({ timeout: 15_000 })
})

test('Back brings what was saved, not the page as it opened, so the next change cannot write the old value over it', async ({ page }) => {
    await signIn(page)
    await newPaper(page, freshNumber('E2E-ZURUECK'))
    await chooseFirstWheel(page)

    const stored = page.waitForResponse((r) => r.url().endsWith('/erfassung/felge') && r.request().method() === 'PUT')

    await openPrinted(page)
    await page.locator('#ef-printed-type-0').fill('RC200 neu')
    await stored
    await saved(page)

    await page.getByRole('link', { name: 'Übersicht' }).first().click()
    await page.waitForURL((url) => !/\/admin\/gutachten\/\d+/.test(url.pathname))
    await waitForApp(page)
    await page.goBack()

    await expect(page.locator('#ef-printed-type-0')).toHaveValue('RC200 neu', { timeout: 15_000 })
})

test('a reload with something typed and not yet stored asks first; a link away waits for it', async ({ page }) => {
    await draftWithCars(page, 'E2E-LADEN2', 1)

    let asked = 0

    page.on('dialog', async (dialog) => {
        asked += dialog.type() === 'beforeunload' ? 1 : 0
        await dialog.dismiss()
    })

    const held = await holdPuts(page)
    const front = page.locator('[id^=ef-front-]').first()

    await page.getByRole('button', { name: 'Kombination', exact: true }).click()
    await front.fill('225/40 R18 88W')
    await page.reload({ timeout: 3000 }).catch(() => undefined)

    expect(asked).toBe(1)

    // A link away: held until the save is answered, and no text is lost.
    await front.fill('225/40 R18 89W')
    await expect.poll(() => held.count()).toBeGreaterThan(0)
    await page.getByRole('link', { name: 'Übersicht' }).first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('.ef-editor')).toBeVisible()

    held.release()
    await page.waitForURL((url) => !/\/admin\/gutachten\/\d+/.test(url.pathname), { timeout: 15_000 })
})

test.describe('the window’s edges', () => {
    test('„beschreiben“ stays inside the window, with its „Speichern“ in reach, and what was typed is kept when it closes', async ({ page }) => {
        await draftWithCars(page, 'E2E-RAND', 1)

        await page.getByRole('button', { name: 'Kombination', exact: true }).click()
        await page.locator('[id^=ef-front-]').first().fill('225/40 R18 88W')
        const codes = page.locator('.ef-line .ef-tags__input').first()

        await codes.fill('68B')
        await codes.press('Enter')

        const open = page.getByRole('button', { name: 'beschreiben' })

        await open.click()

        const form = page.locator('.ef-popover')
        const box = await form.boundingBox()
        const view = page.viewportSize()!

        expect(box!.y).toBeGreaterThanOrEqual(0)
        expect(box!.y + box!.height).toBeLessThanOrEqual(view.height)

        await page.locator('.ef-popover textarea').fill('Nur mit Abnahme.')
        await page.locator('.ef-popover').getByRole('button', { name: 'Speichern' }).scrollIntoViewIfNeeded()
        await expect(page.locator('.ef-popover').getByRole('button', { name: 'Speichern' })).toBeInViewport()

        await page.keyboard.press('Escape')
        await expect(form).toHaveCount(0)
        await open.click()
        await expect(page.locator('.ef-popover textarea')).toHaveValue('Nur mit Abnahme.')
    })

    test('the field the keyboard is in never stands under the bar that stays in sight', async ({ page }) => {
        await draftWithCars(page, 'E2E-LEISTE', 1)

        await page.getByRole('button', { name: 'Kombination', exact: true }).click()

        for (let n = 0; n < 8; n += 1) {
            await page.locator('[id^=ef-front-]').last().fill(`225/${40 + n} R18`)
            await page.keyboard.press('Enter')
        }

        const field = page.locator('[id^=ef-front-]').last()

        await expect(field).toBeFocused()

        const box = await field.boundingBox()
        const bar = await page.locator('.ef-editor .ef-actions').boundingBox()

        expect(box!.y + box!.height).toBeLessThanOrEqual(bar!.y)
    })

    test('the whole list of codes fits the dialog that shows it', async ({ page }) => {
        await draftWithCars(page, 'E2E-LEGENDE', 1)

        await page.getByRole('tab', { name: 'Auflagen' }).click()
        await page.getByRole('button', { name: 'Code hinzufügen' }).click()
        await page.locator('#ef-new-code-code').fill('A01')
        await page.locator('#ef-new-code-text').fill('Abnahme erforderlich.')
        await page.locator('#ef-new-code-kind').selectOption({ index: 1 })
        await page.locator('.ef-codespanel form .btn--primary').click()
        await expect(page.locator('.ef-codeitem')).toHaveCount(1, { timeout: 15_000 })

        await page.getByRole('button', { name: 'Ganze Legende einfügen' }).click()

        const dialog = page.locator('.dialog.ef-legend')

        await expect(dialog.locator('.adm-table')).toBeVisible()

        const room = await dialog.locator('.adm-panel').evaluate((el) => el.clientWidth)
        const table = await dialog.locator('.adm-table').evaluate((el) => el.scrollWidth)

        expect(table).toBeLessThanOrEqual(room)

        // A legend pasted, then a click beside the dialog: it is still there.
        await dialog.getByRole('button', { name: 'Legende einfügen' }).click()
        await page.locator('#av-paste').fill('68B Nur mit Abnahme.')
        await page.keyboard.press('Escape')
        await expect(dialog).toHaveCount(0)
        await page.getByRole('button', { name: 'Ganze Legende einfügen' }).click()
        await expect(page.locator('#av-paste')).toHaveValue('68B Nur mit Abnahme.')
    })
})
