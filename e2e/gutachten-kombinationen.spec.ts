import { signIn } from './bugs/faq-support'
import { expect, test, type Page } from './fixtures'
import { chooseWheelWith, freshNumber, goToStep, lineSaved, newPaper, noSidewaysScroll, openPrinted, searchCars } from './gutachten-erfassung-support'

/*
 * The client's fourth change (the operator's brief of 07.11.2026, §1–§4): a paper may allow different versions of its wheel front and
 * rear. Step 2 builds wheel combinations; step 4 takes one entry per car × combination, with the two wheels in its head and a tyre that
 * does not fit its wheel said at once; step 5 is a matrix of cars and combinations; the read view names front and rear. The happy path
 * through to a release, and the two ways it is held back.
 */

test.setTimeout(180_000)

test.beforeEach(({ browserName: _browser }, info) => {
    test.skip(info.project.name.startsWith('mobile'), 'The entry is a desk job (§7).')
})

/** A wheel with an 18 and a 19 inch version; the front on the 18, and the rear taking it. */
async function twoDiameters(page: Page): Promise<void> {
    await chooseWheelWith(page, async (front) => {
        const eighteen = await front.locator('input[data-version*="× 18"]').count()
        const nineteen = await front.locator('input[data-version*="× 19"]').count()

        return eighteen > 0 && nineteen > 0
    })
}

const version = (page: Page, axle: 0 | 1, inch: number) => page.locator('.ef-axle').nth(axle).locator(`input[data-version*="× ${inch}"]`).first()

async function add(page: Page): Promise<void> {
    const stored = page.waitForResponse((r) => r.url().endsWith('/erfassung/kombinationen') && r.request().method() === 'POST')
    await page.getByRole('button', { name: 'Kombination hinzufügen' }).click()
    await stored
}

test('18 inch in front and 19 behind: a combination, its tyres per car, a matrix, a release, and the read view naming both', async ({ page }) => {
    await signIn(page)
    const url = await newPaper(page, freshNumber('E2E-ACHSEN'))

    await expect(page.getByRole('heading', { name: 'Für welche Felgenkombination gilt das Gutachten?' })).toBeVisible()
    await twoDiameters(page)

    // The front first: the rear takes the same, and the same version is the normal case.
    await version(page, 0, 18).check()
    await expect(version(page, 1, 18)).toBeChecked()
    await expect(page.locator('[data-pick-badge]')).toHaveText('gleich vorne und hinten')
    await add(page)
    await expect(page.locator('.ef-combo')).toHaveCount(1)
    await expect(page.locator('.ef-combo').first()).toContainText('gleich vorne und hinten')

    // The same again is refused before it is sent; a rear of another size is the second combination.
    await version(page, 0, 18).check()
    await expect(page.locator('.ef-pick')).toContainText('Diese Kombination ist schon eingetragen.')
    await expect(page.getByRole('button', { name: 'Kombination hinzufügen' })).toBeDisabled()
    await version(page, 1, 19).check()
    await expect(page.locator('[data-pick-badge]')).toHaveText('vorne und hinten verschieden')
    await page.screenshot({ path: '/Users/apple/rimify/resume/shots-p2/step2-1440.png', fullPage: true })
    await add(page)
    await expect(page.locator('.ef-combo')).toHaveCount(2)

    // Swapped and taken out again: the list says what stands.
    await version(page, 0, 18).check()
    await version(page, 1, 19).check()
    await page.getByRole('button', { name: 'Achsen tauschen' }).click()
    await expect(version(page, 0, 19)).toBeChecked()
    await add(page)
    await expect(page.locator('.ef-combo')).toHaveCount(3)
    await page.locator('.ef-combo').nth(2).getByRole('button', { name: 'Entfernen' }).click()
    await expect(page.locator('.ef-combo')).toHaveCount(2)

    await page.getByRole('button', { name: 'Weiter: Fahrzeuge' }).click()

    // Step 3: a car is once in the selection, however many combinations there are.
    await searchCars(page, 'BMW')
    await page.locator('.ef-hit').nth(0).locator('input').check()
    await expect(page.locator('.ef-chosen__car')).toHaveCount(1)
    await page.getByRole('button', { name: 'Weiter: Reifen' }).click()

    // Step 4: one entry per car × combination, the wheels named in the editor's head.
    await expect(page.getByText('0 von 2 erledigt')).toBeVisible()
    await expect(page.locator('.ef-todo__item')).toHaveCount(2)
    await page.locator('.ef-todo__item').nth(1).click()
    await expect(page.locator('[data-editor-wheel]')).toContainText(/Vorne .*× 18.* · Hinten .*× 19/)

    const front = page.locator('[id^=ef-front-]')
    const rear = page.locator('[id^=ef-rear-]')

    // The wheels differ in diameter: the rear stays empty, and an R18 behind is said at once.
    await page.getByRole('button', { name: 'Kombination', exact: true }).click()
    await front.first().pressSequentially('225/40R18 92Y')
    await expect(rear.first()).toHaveValue('')
    await rear.first().fill('225/40R18 92Y')
    await expect(page.locator('.ef-line .ef-line__error')).toContainText('Dieser Reifen passt nicht: Die Felge hinten hat 19 Zoll, der Reifen R18.')

    const stored = lineSaved(page)
    await rear.first().fill('255/35R19 96Y')
    await stored
    await expect(page.locator('.ef-line .ef-line__error')).toHaveCount(0)

    // „Mehrere einfügen“: a size alone cannot stand on both here; a pair can.
    await page.getByRole('button', { name: 'Mehrere einfügen' }).click()
    const paste = page.getByRole('dialog')
    await paste.locator('#ef-paste').fill('225/40R18 92Y\n235/40R18 95Y + 265/35R19 98Y')
    await expect(paste.locator('.ef-paste__line--bad')).toContainText('Eine Größe allein geht hier nicht')
    await paste.getByRole('button', { name: '1 Zeile übernehmen' }).click()
    await expect(front).toHaveCount(2)
    await page.screenshot({ path: '/Users/apple/rimify/resume/shots-p2/step4-1440.png', fullPage: true })

    // Step 5: the matrix; the combination with no tyres says so, and can be taken out for this car.
    await goToStep(page, 'Freigeben')
    const matrix = page.locator('.ef-matrix')
    await expect(matrix.locator('thead th')).toHaveCount(4)
    await expect(matrix.locator('.ef-cellbtn').nth(0)).toContainText('noch leer')
    await expect(matrix.locator('.ef-cellbtn').nth(1)).toContainText('2 Kombinationen')
    await expect(page.locator('.ef-blockers')).toContainText('Felgenkombination', { timeout: 15_000 })
    await page.screenshot({ path: '/Users/apple/rimify/resume/shots-p2/step5-1440.png', fullPage: true })
    await matrix.getByRole('button', { name: 'Gilt nicht für dieses Fahrzeug' }).click()
    await expect(matrix.getByRole('button', { name: 'Wieder aufnehmen' })).toBeVisible()
    await expect(page.locator('.ef-blockers', { hasText: 'Felgenkombination' })).toHaveCount(0, { timeout: 15_000 })

    await noSidewaysScroll(page)
    expect(url).toContain('/admin/gutachten/')
})

test('held back: a tyre on the wrong wheel and an empty side are named, and the release waits until they are dealt with', async ({ page }) => {
    await signIn(page)
    await newPaper(page, freshNumber('E2E-ACHSEN2'))
    await twoDiameters(page)
    await version(page, 0, 18).check()
    await version(page, 1, 19).check()
    await add(page)
    await page.getByRole('button', { name: 'Weiter: Fahrzeuge' }).click()
    await searchCars(page, 'BMW')
    await page.locator('.ef-hit').nth(0).locator('input').check()
    await expect(page.locator('.ef-chosen__car')).toHaveCount(1)
    await page.getByRole('button', { name: 'Weiter: Reifen' }).click()

    await page.getByRole('button', { name: 'Kombination', exact: true }).click()
    const stored = lineSaved(page)
    await page.locator('[id^=ef-front-]').first().fill('225/40R19 92Y')
    await stored

    await goToStep(page, 'Freigeben')
    await expect(page.locator('.ef-blockers')).toContainText('Dieser Reifen passt nicht', { timeout: 15_000 })
    await expect(page.locator('.ef-blockers')).toContainText('fehlt noch die Größe')
})

test('warned, never held back: a version the paper does not print, and two bolt patterns', async ({ page }) => {
    await signIn(page)
    await newPaper(page, freshNumber('E2E-ACHSEN3'))
    await twoDiameters(page)

    const saved = page.waitForResponse((r) => r.url().endsWith('/erfassung/felge') && r.request().method() === 'PUT')
    await openPrinted(page)
    await page.locator('#ef-printed-size-0').fill('8 1/2 J X 21 H2')
    await saved

    await version(page, 0, 18).check()
    await add(page)
    await expect(page.locator('.ef-combo .ef-warn')).toContainText('Durchmesser: im Gutachten 21 Zoll')
    await expect(page.getByRole('button', { name: 'Weiter: Fahrzeuge' })).toBeEnabled()
    await page.screenshot({ path: '/Users/apple/rimify/resume/shots-p2/step2-warn-1440.png', fullPage: true })
})

test('what was picked and not added is asked about before leaving the step; a double press removes once', async ({ page }) => {
    await signIn(page)
    await newPaper(page, freshNumber('E2E-ACHSEN-ASK'))
    await twoDiameters(page)
    await version(page, 0, 18).check()
    await add(page)

    const weiter = page.getByRole('button', { name: 'Weiter: Fahrzeuge' })

    // A rear of another size, not added: the step does not move on in silence.
    await version(page, 0, 18).check()
    await version(page, 1, 19).check()
    await weiter.click()
    const question = page.getByRole('alertdialog').or(page.getByRole('dialog')).filter({ hasText: 'noch nicht eingetragen' })
    await expect(question).toBeVisible()
    await expect(page.locator('.ef-combo')).toHaveCount(1)

    // Added and on: both are there, and the step is the next.
    const stored = page.waitForResponse((r) => r.url().endsWith('/erfassung/kombinationen') && r.request().method() === 'POST')
    await question.getByRole('button', { name: 'Hinzufügen und weiter' }).click()
    await stored
    await expect(page.locator('#ef-cars-q')).toBeVisible()

    // Back on step 2: two presses on „Entfernen“ send one request, and no false alarm.
    await goToStep(page, 'Felge')
    await expect(page.locator('.ef-combo')).toHaveCount(2)
    const deletes: string[] = []
    page.on('request', (r) => {
        if (r.method() === 'DELETE') {
            deletes.push(r.url())
        }
    })
    await page.locator('.ef-combo').nth(1).getByRole('button', { name: 'Entfernen' }).dblclick()
    await expect(page.locator('.ef-combo')).toHaveCount(1)
    await expect(page.locator('.ef-pick .adm-alert, .ef-step .adm-alert')).toHaveCount(0)
    expect(deletes).toHaveLength(1)
})

test('a combination with tyres is not changed without a question: exchanged axles take the tyres with them', async ({ page }) => {
    await signIn(page)
    await newPaper(page, freshNumber('E2E-ACHSEN-TAUSCH'))
    await twoDiameters(page)
    await version(page, 0, 18).check()
    await version(page, 1, 19).check()
    await add(page)
    await page.getByRole('button', { name: 'Weiter: Fahrzeuge' }).click()
    await searchCars(page, 'BMW')
    await page.locator('.ef-hit', { hasNotText: 'Angaben für die Prüfung fehlen' }).first().locator('input').check()
    await expect(page.locator('.ef-chosen__car')).toHaveCount(1)
    await page.getByRole('button', { name: 'Weiter: Reifen' }).click()
    await page.getByRole('button', { name: 'Kombination', exact: true }).click()
    await page.locator('[id^=ef-front-]').first().fill('225/40 R18')
    const saved = lineSaved(page)
    await page.locator('[id^=ef-rear-]').first().fill('255/35 R19')
    await page.locator('[id^=ef-rear-]').first().blur()
    await saved

    await goToStep(page, 'Felge')
    await page.locator('.ef-combo').first().getByRole('button', { name: 'Bearbeiten' }).click()
    await page.getByRole('button', { name: 'Achsen tauschen' }).click()
    await page.getByRole('button', { name: 'Änderung speichern' }).click()
    const question = page.getByRole('alertdialog').or(page.getByRole('dialog')).filter({ hasText: 'Reifen tauschen mit' })
    await expect(question).toBeVisible()
    await question.getByRole('button', { name: 'Achsen tauschen' }).click()
    await expect(page.locator('.ef-combo').first()).toContainText(/Vorne 8,5 × 19/)

    await goToStep(page, 'Reifen')
    await expect(page.locator('[id^=ef-front-]').first()).toHaveValue(/255\/35 ?R ?19/)
    await expect(page.locator('[id^=ef-rear-]').first()).toHaveValue(/225\/40 ?R ?18/)
    await expect(page.locator('.ef-line [role="alert"], .form-field__error:not(:empty)')).toHaveCount(0)
})

test('step 5 asks before „Gilt nicht“ deletes what was typed, and says when the car leaves', async ({ page }) => {
    await signIn(page)
    await newPaper(page, freshNumber('E2E-ACHSEN-ZELLE'))
    await twoDiameters(page)
    await version(page, 0, 18).check()
    await add(page)
    await version(page, 0, 19).check()
    await add(page)
    await page.getByRole('button', { name: 'Weiter: Fahrzeuge' }).click()
    await searchCars(page, 'BMW')
    await page.locator('.ef-hit', { hasNotText: 'Angaben für die Prüfung fehlen' }).first().locator('input').check()
    await expect(page.locator('.ef-chosen__car')).toHaveCount(1)
    await page.getByRole('button', { name: 'Weiter: Reifen' }).click()

    // A tyre that does not fit: the cell is not done, and has something typed in it.
    await page.getByRole('button', { name: 'Kombination', exact: true }).click()
    const saved = lineSaved(page)
    await page.locator('[id^=ef-front-]').first().fill('225/40 R17')
    await page.locator('[id^=ef-front-]').first().blur()
    await saved

    await goToStep(page, 'Freigeben')
    const drop = page.getByRole('button', { name: /Gilt nicht/ }).first()
    await expect(page.locator('.ef-cellbtn--empty').first()).toBeVisible()
    let deleted = 0
    page.on('request', (r) => {
        deleted += r.method() === 'DELETE' ? 1 : 0
    })
    await drop.click()
    const question = page.getByRole('alertdialog').or(page.getByRole('dialog')).filter({ hasText: 'gelöscht' })
    await expect(question).toBeVisible()
    expect(deleted).toBe(0)
    await question.getByRole('button', { name: 'Abbrechen' }).click()
    await expect(question).toBeHidden()
    expect(deleted).toBe(0)
})
