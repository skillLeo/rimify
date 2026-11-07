import { signIn, waitForApp } from './bugs/faq-support'
import { expect, test, type Page } from './fixtures'
import { chooseFirstWheel, freshNumber, goToStep, lineSaved, newPaper, noSidewaysScroll, openPrinted, saved, searchCars } from './gutachten-erfassung-support'

/*
 * The five steps of a Gutachten (the Gutachten rework, Phase 2, §10.3, with the client's changes of 05.11.2026): the happy path, from a
 * PDF to a released paper; the two ways it is held back; and the small things a person meets on the way, each of which once went
 * wrong on the row form these steps replace (GUTACHTEN-05, -06, -08, -09, -11, -54, B-01, C-03).
 */

test.setTimeout(180_000)

test.beforeEach(({ browserName: _browser }, info) => {
    test.skip(info.project.name.startsWith('mobile'), 'The entry is a desk job (§7): the phone has a check of its own below.')
})

test('from the PDF to a released paper: five steps, the rear prefilled, a pair, a code described on the way, copied to a second car, released', async ({ page }) => {
    await signIn(page)
    const number = freshNumber('E2E-WEG')
    const url = await newPaper(page, number)

    // Step 2: a wheel combination; what the paper prints is compared, and a difference warns and never blocks.
    await expect(page.getByRole('navigation', { name: 'Schritte zum Gutachten' })).toBeVisible()
    await chooseFirstWheel(page)
    await openPrinted(page)
    await page.locator('#ef-printed-et-0').fill('77')
    await page.locator('#ef-printed-et-0').blur()
    await expect(page.locator('.ef-combo .ef-warn')).toContainText('Einpresstiefe: im Gutachten', { timeout: 15_000 })
    await page.getByRole('button', { name: 'Weiter: Fahrzeuge' }).click()

    // Step 3: single cars from one search field; the selection lists cars.
    await searchCars(page, 'BMW')
    const hits = page.locator('.ef-hit')
    await expect(hits.first()).toBeVisible()
    await expect(hits.first().locator('.ef-hit__facts')).toContainText('HSN')
    await expect(hits.first().locator('.ef-hit__facts')).toContainText('Feld K')
    await hits.nth(0).locator('input').check()
    await expect(page.locator('.ef-chosen__car')).toHaveCount(1)
    await hits.nth(1).locator('input').check()
    await expect(page.locator('.ef-chosen__car')).toHaveCount(2)
    await page.getByRole('button', { name: 'Weiter: Reifen' }).click()

    // Step 4: one entry per car, one button, the PDF beside it.
    await expect(page.locator('.ef-pdf__frame')).toBeVisible()
    await expect(page.getByText('0 von 2 erledigt')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Kombination', exact: true })).toHaveCount(1)
    await page.getByRole('button', { name: 'Kombination', exact: true }).click()

    const front = page.locator('[id^=ef-front-]')
    const rear = page.locator('[id^=ef-rear-]')

    // Typed in front: the rear takes the same, in the shop's own writing.
    await front.nth(0).pressSequentially('225/40R18 88W')
    await expect(rear.nth(0)).toHaveValue('225/40R18 88W')
    await page.keyboard.press('Enter')
    // Enter: the next line, the cursor in it.
    await expect(front.nth(1)).toBeFocused()
    await expect(front.nth(0)).toHaveValue('225/40 R18 88W')
    await front.nth(1).pressSequentially('225/40R18')
    // Tab to the rear, and what is typed replaces the prefilled size, never adds to it.
    await page.keyboard.press('Tab')
    await expect(rear.nth(1)).toBeFocused()
    await page.keyboard.type('255/35R18')
    await expect(rear.nth(1)).toHaveValue('255/35R18')
    await page.keyboard.press('Tab')
    await expect(rear.nth(1)).toHaveValue('255/35 R18')

    // A code not described yet: typed, tagged, described on the spot.
    const codes = page.locator('input[id^=ef-codes-]')
    await codes.nth(1).fill('68B')
    await codes.nth(1).press('Enter')
    await expect(page.locator('.ef-code--open', { hasText: '68B' })).toBeVisible()
    await page.getByRole('button', { name: 'beschreiben' }).first().click()
    await page.locator('textarea[id*="-def-68B-text"]').fill('Nur in der Kombination vorne 225/40 R18 mit hinten 255/35 R18.')
    await page.locator('select[id*="-def-68B-kind"]').selectOption('hinweis')
    await page.locator('.ef-popover').getByRole('button', { name: 'Speichern' }).click()
    await expect(page.locator('.ef-code--open', { hasText: '68B' })).toHaveCount(0, { timeout: 15_000 })
    await expect(page.locator('.ef-line .ef-code', { hasText: '68B' })).toHaveAttribute('title', /Nur in der Kombination/)

    // „Aktuelle PDF-Seite übernehmen“: our page control's number.
    await page.getByRole('button', { name: 'Nächste Seite' }).click()
    await page.getByRole('button', { name: 'PDF-Seite 2 übernehmen' }).click()
    await expect(page.locator('#ef-page')).toHaveValue('2')
    await saved(page)
    await expect(page.getByText('1 von 2 erledigt')).toBeVisible({ timeout: 15_000 })

    // „Kopieren nach …“: other cars, with what it would do said first.
    await page.getByRole('button', { name: /Kopieren nach/ }).click()
    const copy = page.getByRole('dialog')
    await copy.locator('input[type="checkbox"]').first().check()
    await expect(copy.locator('.ef-count')).toContainText('1 Fahrzeug', { timeout: 15_000 })
    await copy.getByRole('button', { name: 'Kopieren', exact: true }).click()
    await expect(page.getByText('2 von 2 erledigt')).toBeVisible({ timeout: 15_000 })

    // Step 5: every car at a glance, the copy said, the question asked with its suggestion.
    await page.getByRole('button', { name: /weiter zur Freigabe/ }).click()
    await expect(page.locator('.ef-cellbtn', { hasText: 'kopiert von' })).toBeVisible()
    // What the door would hold back: not every size has both figures, so „bei jeder Reifengröße“ is not what these lines say.
    await page.locator('input[name="ef-li-release"][value="document"]').check()
    await expect(page.locator('.ef-blockers')).toContainText('Lastindex', { timeout: 15_000 })
    await page.locator('input[name="ef-li-release"][value="papers"]').check()
    await expect(page.locator('.ef-blockers', { hasText: 'Lastindex' })).toHaveCount(0, { timeout: 15_000 })

    const unproven = page.getByRole('button', { name: 'Daten geprüft' })

    for (let left = await unproven.count(); left > 0; left -= 1) {
        await unproven.first().click()
        await expect(unproven).toHaveCount(left - 1, { timeout: 15_000 })
    }

    await expect(page.locator('.ef-actions').getByRole('button', { name: 'Freigeben', exact: true })).toBeEnabled({ timeout: 20_000 })
    await page.locator('.ef-actions').getByRole('button', { name: 'Freigeben', exact: true }).click()

    const dialog = page.getByRole('dialog')
    await dialog.locator('#rd-c-complete').check()
    await dialog.locator('#rd-codes').fill('1')
    await dialog.locator('#rd-codes-page').fill('2')
    await dialog.locator('#rd-sizes').fill('2')
    await dialog.locator('#rd-sizes-page').fill('2')
    await dialog.locator('input[name="rd-a"][value="none"]').check()
    await dialog.locator('button[type="submit"]').click()

    // Released: a compact read view, the code a tag with its text on hover, and the way back.
    await page.waitForLoadState('networkidle')
    await waitForApp(page)
    await expect(page.locator('.adm-page__context')).toContainText('Freigegeben', { timeout: 30_000 })
    await expect(page.getByRole('navigation', { name: 'Schritte zum Gutachten' })).toHaveCount(0)
    await expect(page.locator('.gs-car')).toHaveCount(2)
    await expect(page.locator('.gs-tag', { hasText: '68B' }).first()).toHaveAttribute('title', /Nur in der Kombination/)
    await expect(page.getByRole('button', { name: /Neue Fassung anlegen/ })).toBeVisible()
    await expect(page.locator('.gs-readline').first()).toContainText('225/40 R18 88W')

    // The list says so; „Neue Fassung anlegen“ opens the five steps, prefilled, and the list then says that too.
    await page.getByRole('button', { name: /Neue Fassung anlegen/ }).click()
    await page.getByRole('dialog').getByRole('button', { name: /anlegen/ }).click()
    await page.waitForURL((address) => address.pathname !== new URL(url).pathname, { timeout: 30_000 })
    await waitForApp(page)
    await expect(page.getByRole('navigation', { name: 'Schritte zum Gutachten' })).toBeVisible()
    await goToStep(page, 'Reifen')
    await expect(front.first()).toHaveValue('225/40 R18 88W')

    await page.goto(`/admin/gutachten?q=${number}`, { waitUntil: 'networkidle' })
    await expect(page.locator('tbody tr', { hasText: 'Neue Fassung in Arbeit' })).toHaveCount(1)
    await expect(page.locator('tbody tr', { hasText: '2 von 2 Fahrzeugen' })).toHaveCount(1)
})

/** A draft up to step 4 with one car, its tyres not typed yet. */
async function draftAtTyres(page: Page, prefix: string): Promise<void> {
    await signIn(page)
    await newPaper(page, freshNumber(prefix))
    await chooseFirstWheel(page)
    await page.getByRole('button', { name: 'Weiter: Fahrzeuge' }).click()
    await searchCars(page, 'BMW')
    await page.locator('.ef-hit input').first().check()
    await expect(page.locator('.ef-chosen__car')).toHaveCount(1)
    await page.getByRole('button', { name: 'Weiter: Reifen' }).click()
    await page.getByRole('button', { name: 'Kombination', exact: true }).click()
}

test('held back: a line that does not read and a code nobody described are named, and the release waits until they are dealt with', async ({ page }) => {
    await draftAtTyres(page, 'E2E-LESEN')
    const front = page.locator('[id^=ef-front-]').first()

    // Kept as typed, said why, saved all the same: nothing typed is lost.
    await front.pressSequentially('225/40')
    await front.blur()
    await expect(page.locator('.ef-line__error').first()).toContainText('Nicht lesbar')
    const codes = page.locator('input[id^=ef-codes-]').first()
    await codes.fill('Z9')
    const stored = lineSaved(page)
    await codes.press('Enter')
    await stored

    await goToStep(page, 'Freigeben')
    await expect(page.locator('.ef-check', { hasText: 'Nicht lesbare Reifen' })).toContainText('225/40')
    await expect(page.locator('.ef-check', { hasText: 'Codes ohne Beschreibung' })).toContainText('Z9')
    await expect(page.locator('.ef-blockers')).toContainText('nicht lesbar')
    await expect(page.locator('.ef-actions').getByRole('button', { name: 'Freigeben', exact: true })).toBeDisabled()

    // „Jetzt beschreiben“ in place, without leaving the step.
    await page.getByRole('button', { name: 'Z9 beschreiben' }).click()
    await page.locator('textarea[id*="ef-release-Z9-text"]').fill('Radschrauben nach 50 km nachziehen.')
    await page.locator('select[id*="ef-release-Z9-kind"]').selectOption('hinweis')
    await page.locator('.ef-check__form').getByRole('button', { name: 'Speichern' }).click()
    await expect(page.locator('.ef-check', { hasText: 'Codes ohne Beschreibung' })).toHaveCount(0, { timeout: 15_000 })

    // The other one: back to the car from here, and the line corrected.
    await page.locator('.ef-check', { hasText: 'Nicht lesbare Reifen' }).getByRole('button', { name: 'Zum Fahrzeug' }).click()
    await expect(front).toHaveValue('225/40')
    const corrected = lineSaved(page)
    await front.fill('225/40 R18')
    await front.blur()
    await corrected
    await goToStep(page, 'Freigeben')
    await expect(page.locator('.ef-check', { hasText: 'Nicht lesbare Reifen' })).toHaveCount(0, { timeout: 15_000 })
    await expect(page.locator('.ef-blockers', { hasText: 'nicht lesbar' })).toHaveCount(0)
})

test('held back: two cars of one field K, a pair on one of them — the door names the pair and both cars, and „Zum Fahrzeug“ goes there', async ({ page }) => {
    await signIn(page)
    await newPaper(page, freshNumber('E2E-FELDK'))
    await chooseFirstWheel(page)
    await page.getByRole('button', { name: 'Weiter: Fahrzeuge' }).click()

    // „Fahrzeug anlegen“ in the flow: a car from this paper, twice with one approval number, each ticked at once.
    const k = `e1*2007/46*${String(Date.now()).slice(-4)}*01`

    for (const name of ['Eins', 'Zwei']) {
        await page.locator('#vfd-open').click()
        await expect(page.locator('#vfd-make')).toBeFocused()
        await page.locator('#vfd-make').fill('Prüfwagen')
        await page.locator('#vfd-model').fill(name)
        await page.locator('#vfd-type-designation').fill('PW')
        await page.locator('#vfd-eg-number').fill(k)
        await page.locator('#vfd-source-page').fill('1')
        await page.locator('#vfd-save').click()
        await expect(page.locator('.ef-chosen__car', { hasText: name })).toBeVisible({ timeout: 15_000 })
        // The keyboard stays in the step (C-03).
        await expect(page.locator('#vfd-open')).toBeFocused()
    }

    await page.getByRole('button', { name: 'Weiter: Reifen' }).click()

    const front = page.locator('[id^=ef-front-]')
    const rear = page.locator('[id^=ef-rear-]')
    const add = page.getByRole('button', { name: 'Kombination', exact: true })
    const entered = async (lines: [string, string?][]): Promise<void> => {
        for (const [i, [f, r]] of lines.entries()) {
            await add.click()
            await front.nth(i).fill(f)

            if (r) {
                await rear.nth(i).fill(r)
            }

            await rear.nth(i).blur()
        }

        const stored = lineSaved(page)
        await front.first().focus()
        await front.first().blur()
        await page.keyboard.press('Tab')
        await stored.catch(() => undefined)
    }

    // The first car: both sizes on their own lines, and the pair.
    await entered([['225/40 R18'], ['255/35 R18'], ['225/40 R18', '255/35 R18']])
    await page.getByRole('button', { name: /Speichern und weiter/ }).click()
    await expect(page.locator('.ef-editor__title')).toContainText('Zwei')

    // The second: both sizes, not the pair. The engine would give it the pair all the same.
    await entered([['225/40 R18'], ['255/35 R18']])
    await goToStep(page, 'Freigeben')

    await expect(page.locator('.ef-check', { hasText: 'Gleiche Betriebserlaubnis' })).toContainText('225/40 R18', { timeout: 15_000 })
    await expect(page.locator('.ef-blockers')).toContainText('Trag sie bei allen betroffenen Fahrzeugen ein oder bei keinem.')
    await expect(page.locator('.ef-actions').getByRole('button', { name: 'Freigeben', exact: true })).toBeDisabled()

    await page.locator('.ef-check', { hasText: 'Gleiche Betriebserlaubnis' }).getByRole('button', { name: 'Zum Fahrzeug' }).click()
    await expect(page.locator('.ef-editor__title')).toContainText('Zwei')
    await expect(page.getByText('teilt seine Betriebserlaubnis')).toBeVisible()
})

test('„Mehrere einfügen“: a preview first, what does not read left out, one size vorne = hinten, a pair a pair', async ({ page }) => {
    await draftAtTyres(page, 'E2E-MEHRERE')
    await page.getByRole('button', { name: 'Mehrere einfügen' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('#ef-paste').fill('Nr. 1: 245/35R18 – 265/35R18\n235/40R18 92Y\nFolgende Kombinationen:')
    await expect(dialog.locator('.ef-paste__line')).toHaveCount(3)
    await expect(dialog.locator('.ef-paste__line--bad')).toHaveCount(1)
    await dialog.getByRole('button', { name: '2 Zeilen übernehmen' }).click()

    const front = page.locator('[id^=ef-front-]')
    const rear = page.locator('[id^=ef-rear-]')
    // The empty line that was open, and the two taken over.
    await expect(front.nth(1)).toHaveValue('245/35 R18')
    await expect(rear.nth(1)).toHaveValue('265/35 R18')
    await expect(front.nth(2)).toHaveValue('235/40 R18 92Y')
    await expect(rear.nth(2)).toHaveValue('235/40 R18 92Y')
})

test('step 3: Enter in the search sends nothing, and a late answer to an older search does not replace the newer one (GUTACHTEN-05, -06)', async ({ page }) => {
    await signIn(page)
    await newPaper(page, freshNumber('E2E-SUCHE'))
    await chooseFirstWheel(page)
    await page.getByRole('button', { name: 'Weiter: Fahrzeuge' }).click()

    let written = 0
    page.on('request', (r) => {
        if (r.url().includes('/erfassung/fahrzeuge') && r.method() !== 'GET') {
            written += 1
        }
    })

    // The older search's answer is held back until the newer one has arrived.
    let release: () => void = () => undefined
    const held = new Promise<void>((resolve) => {
        release = resolve
    })
    await page.route('**/suche/fahrzeuge?q=BMW', async (route) => {
        await held
        await route.continue()
    })

    await page.locator('#ef-cars-q').fill('BMW')
    await page.waitForTimeout(400)
    await searchCars(page, 'Audi')
    await expect(page.locator('.ef-hit').first()).toContainText('Audi')
    const older = page.waitForResponse((r) => new URL(r.url()).searchParams.get('q') === 'BMW')
    release()
    await older
    await page.waitForTimeout(200)
    await expect(page.locator('.ef-hit').first()).toContainText('Audi')

    await page.locator('#ef-cars-q').press('Enter')
    await page.waitForTimeout(300)
    expect(written).toBe(0)
})

test('step 3: a double click takes a car off with one request, and a car with tyres asks first and the question closes (GUTACHTEN-09, -54)', async ({ page }) => {
    await draftAtTyres(page, 'E2E-WEG2')
    const front = page.locator('[id^=ef-front-]').first()
    const stored = lineSaved(page)
    await front.fill('225/40 R18')
    await front.blur()
    await stored
    await goToStep(page, 'Fahrzeuge')

    await page.locator('.ef-chosen__car button').click()
    const confirm = page.getByRole('alertdialog').or(page.getByRole('dialog'))
    await expect(confirm).toContainText('mit seinen eingetragenen Reifen')
    await confirm.getByRole('button', { name: 'Entfernen' }).click()
    await expect(confirm).toHaveCount(0)
    await expect(page.locator('.ef-chosen__car')).toHaveCount(0, { timeout: 15_000 })

    await searchCars(page, 'BMW')
    await page.locator('.ef-hit input').first().check()
    await expect(page.locator('.ef-chosen__car')).toHaveCount(1)

    let deletes = 0
    page.on('request', (r) => {
        if (r.method() === 'DELETE') {
            deletes += 1
        }
    })
    await page.locator('.ef-chosen__car button').dblclick()
    await expect(page.locator('.ef-chosen__car')).toHaveCount(0, { timeout: 15_000 })
    expect(deletes).toBe(1)
})

test('step 4: taking a line out keeps the keyboard in the lines, and a line typed twice is said (GUTACHTEN-08, -11)', async ({ page }) => {
    await draftAtTyres(page, 'E2E-TASTATUR')
    const front = page.locator('[id^=ef-front-]')
    await front.first().pressSequentially('225/40 R18')
    await page.keyboard.press('Enter')
    await front.nth(1).pressSequentially('225/40R18')
    await front.nth(1).blur()
    await expect(page.getByText('Diese Zeile steht schon einmal da.')).toBeVisible()

    await page.locator('.ef-line').nth(1).getByRole('button', { name: /Weitere Angaben/ }).click()
    await page.getByRole('button', { name: 'Zeile entfernen' }).focus()
    await page.keyboard.press('Enter')
    await expect(front).toHaveCount(1)
    await expect(page.getByText('Diese Zeile steht schon einmal da.')).toHaveCount(0)
    await expect(page.locator('.ef-editor__adds .btn').first()).toBeFocused()
})

test('„Weitere Angaben“ stays open when a field in it is emptied again (B-01)', async ({ page }) => {
    await draftAtTyres(page, 'E2E-OFFEN')
    await page.locator('.ef-more__summary').first().click()
    const filled = lineSaved(page)
    await page.locator('#ef-col-note').fill('Nur mit Abnahme')
    await filled
    const emptied = lineSaved(page)
    await page.locator('#ef-col-note').fill('')
    await emptied
    await expect(page.locator('#ef-col-note')).toBeVisible()
})

test('the preview: choosing another car does not leave the last car\'s verdicts standing as its own (GUTACHTEN-04)', async ({ page }) => {
    await signIn(page)
    await newPaper(page, freshNumber('E2E-VORSCHAU'))
    await chooseFirstWheel(page)
    await page.getByRole('button', { name: 'Weiter: Fahrzeuge' }).click()
    await searchCars(page, 'BMW')
    await page.locator('.ef-hit input').nth(0).check()
    await expect(page.locator('.ef-chosen__car')).toHaveCount(1)
    await page.locator('.ef-hit input').nth(1).check()
    await expect(page.locator('.ef-chosen__car')).toHaveCount(2)
    await goToStep(page, 'Freigeben')

    const select = page.locator('#gs-preview-vehicle')
    await expect(select).toBeVisible()
    await page.getByRole('button', { name: 'Vorschau zeigen' }).click()
    await expect(page.locator('.gs-verdicts')).toBeVisible({ timeout: 20_000 })
    const first = ((await select.locator('option').nth(0).textContent()) ?? '').trim()
    const second = ((await select.locator('option').nth(1).textContent()) ?? '').trim()

    await expect(page.locator('.gs-preview-for')).toContainText(first)
    await select.selectOption({ index: 1 })
    // The verdicts on screen always say whose they are.
    await expect(page.locator('.gs-preview-for')).toContainText(second, { timeout: 20_000 })
})

test('after the release the keyboard stays on the page, and taking a code out of the whole list keeps it in the list (GUTACHTEN-08)', async ({ page }) => {
    await draftAtTyres(page, 'E2E-FOKUS')
    const stored = lineSaved(page)
    await page.locator('[id^=ef-front-]').first().fill('225/40 R18')
    await page.locator('[id^=ef-front-]').first().blur()
    await stored

    // A code nothing carries: it can go.
    await page.getByRole('tab', { name: /Auflagen/ }).click()
    await page.getByRole('button', { name: 'Code hinzufügen' }).click()
    await page.locator('#ef-new-code-code').fill('WEG1')
    await page.locator('#ef-new-code-text').fill('Ein Code, den nichts trägt.')
    await page.locator('#ef-new-code-kind').selectOption('hinweis')
    await page.locator('.ef-define').getByRole('button', { name: 'Speichern' }).click()
    await expect(page.locator('.ef-codeitem', { hasText: 'WEG1' })).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: 'Ganze Legende einfügen' }).click()
    const list = page.getByRole('dialog')
    await list.locator('[data-focus^="av-more-"]').first().focus()
    await page.keyboard.press('Enter')
    await page.getByRole('menuitem', { name: 'Entfernen' }).focus()
    await page.keyboard.press('Enter')
    const asked = page.getByRole('alertdialog').or(page.getByRole('dialog').filter({ hasText: 'WEG1 entfernen' }))
    await asked.getByRole('button', { name: 'Entfernen', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.ef-codeitem', { hasText: 'WEG1' })).toHaveCount(0, { timeout: 15_000 })
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => document.activeElement?.tagName), 'the keyboard fell to the page after „Entfernen“').not.toBe('BODY')
    await page.keyboard.press('Escape')

    await goToStep(page, 'Freigeben')
    await page.locator('input[name="ef-li-release"][value="papers"]').check()

    const unproven = page.getByRole('button', { name: 'Daten geprüft' })

    for (let left = await unproven.count(); left > 0; left -= 1) {
        await unproven.first().click()
        await expect(unproven).toHaveCount(left - 1, { timeout: 15_000 })
    }

    const release = page.locator('.ef-actions').getByRole('button', { name: 'Freigeben', exact: true })
    await expect(release).toBeEnabled({ timeout: 20_000 })
    await release.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog')
    await dialog.locator('#rd-c-complete').check()
    await dialog.locator('#rd-codes').fill('0')
    await dialog.locator('#rd-codes-page').fill('1')
    await dialog.locator('#rd-sizes').fill('1')
    await dialog.locator('#rd-sizes-page').fill('1')
    await dialog.locator('input[name="rd-a"][value="none"]').check()
    await dialog.locator('button[type="submit"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.adm-page__context')).toContainText('Freigegeben', { timeout: 30_000 })
    await page.waitForTimeout(400)

    expect(await page.evaluate(() => document.activeElement?.tagName), 'the keyboard fell to the page after „Freigeben“').not.toBe('BODY')
})

test('a page that says what the paper prints and the size chosen at 1280: nothing runs past the page in any step', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await draftAtTyres(page, 'E2E-1280')
    await page.locator('[id^=ef-front-]').first().fill('HL 255/35 R20 100')
    await page.locator('[id^=ef-rear-]').first().fill('XL 275/45 R20 110')
    await page.locator('[id^=ef-rear-]').first().blur()

    // The longest sizes the papers print fit their fields, unscrolled.
    const fits = await page.locator('[id^=ef-rear-]').first().evaluate((el: HTMLInputElement) => el.scrollWidth <= el.clientWidth)
    expect(fits, 'a size is cut off in its field').toBe(true)
    await noSidewaysScroll(page)

    for (const step of ['Gutachten', 'Felge', 'Fahrzeuge', 'Freigeben']) {
        await goToStep(page, step)
        await noSidewaysScroll(page)
    }
})

test.describe('on a phone', () => {
    test.beforeEach(({ browserName: _browser }, info) => {
        test.skip(!info.project.name.startsWith('mobile'), 'The phone’s own check.')
    })

    test('it does not break: every step opens, nothing scrolls sideways', async ({ page }) => {
        await signIn(page)
        await newPaper(page, freshNumber('E2E-HANDY'))
        await noSidewaysScroll(page)
        await chooseFirstWheel(page)
        await noSidewaysScroll(page)
        await page.getByRole('button', { name: 'Weiter: Fahrzeuge' }).click()
        await searchCars(page, 'BMW')
        await page.locator('.ef-hit input').first().check()
        await noSidewaysScroll(page)
        await page.getByRole('button', { name: 'Weiter: Reifen' }).click()
        await expect(page.getByRole('button', { name: 'Kombination', exact: true })).toBeVisible()
        await noSidewaysScroll(page)
        await goToStep(page, 'Freigeben')
        await noSidewaysScroll(page)
    })
})
