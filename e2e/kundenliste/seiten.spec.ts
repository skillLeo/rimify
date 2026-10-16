import { expect, test, type Page } from '../fixtures'
import { REVIEW_PASSWORD } from '../support'
import { ABNAHME, PRODUCT, box, consent, isPhone, open, shot, shotAround, withCar } from './support'

/*
 * The client's list beyond the product page and the listing, against the acceptance shop: the Felgenrechner's drawing
 * (#11, judgement), the contact form (#12), reviews (#19, solved differently), the level of an Auflage (#23, solved
 * differently, in the admin) and the RIMIFY-Check (#28).
 */

test.beforeEach(async ({ context }) => {
    await consent(context, ABNAHME)
})

test('judgement: our own cross-section — ET, Felgenbreite and Lochkreis — and the wheel moves in the arch when the ET changes', { tag: '@kunde-11' }, async ({ page }, info) => {
    await open(page, '/felgenrechner')

    const drawing = page.locator('.calc-drawing').first()
    await expect(drawing.locator('[data-measure="et"]')).toBeAttached()
    await expect(drawing.locator('[data-measure="width"]')).toBeAttached()
    await expect(drawing).toContainText('Felgenbreite')
    await expect(drawing).toContainText('Lochkreis')
    await expect(drawing).toContainText('Einpresstiefe (ET)')

    // The new wheel moves sideways in the arch when its ET changes, by the drawing's own scale.
    const wheel = drawing.locator('[data-wheel="next"]')
    const before = await box(wheel)

    if (isPhone(info)) {
        await page.getByRole('tab', { name: 'Neu' }).click()
    }

    const et = page.locator('input[id$="-next-etMm"]')
    const value = Number(await et.inputValue())
    await et.fill(String(value - 20))
    await et.press('Enter')
    await expect.poll(async () => Math.abs((await box(wheel)).x - before.x), { timeout: 5_000 }).toBeGreaterThan(2)

    await shot(drawing, 11, info)
})

test('a contact form: name, e-mail, subject, message, the car ticked, a privacy line — no captcha, and too quick a send is said', { tag: '@kunde-12' }, async ({ page }, info) => {
    // The car the visitor chose comes along, ticked.
    await withCar(page, 'e46')
    await open(page, '/kontakt')

    const form = page.locator('.kon__form')
    await expect(form.locator('#kon-name')).toBeVisible()
    await expect(form.locator('#kon-email')).toBeVisible()
    await expect(form.locator('#kon-subject')).toBeVisible()
    await expect(form.locator('#kon-message')).toBeVisible()
    await expect(form.locator('.kon__vehicle input')).toBeChecked()
    await expect(form.locator('.kon__vehicle')).toContainText('320i Limousine (Demo)')
    await expect(form.locator('.kon__privacy a')).toHaveAttribute('href', '/rechtliches/datenschutz')
    // The honeypot is out of reach; no third party's captcha anywhere on the page.
    await expect(form.locator('#kon-leer')).toHaveAttribute('tabindex', '-1')
    expect(await page.locator('iframe, script[src*="captcha"], script[src*="turnstile"]').count()).toBe(0)

    const write = async (): Promise<void> => {
        await form.locator('#kon-name').fill('Jana Beispiel')
        await form.locator('#kon-email').fill('jana@example.com')
        await form.locator('#kon-subject').fill('Frage zur DB8GT2')
        await form.locator('#kon-message').fill('Passt die Felge auch mit Winterreifen auf mein Auto?')
    }

    await write()
    await shot(form, 12, info)

    // Sent in the moment after the page came: no person writes that fast — said, and the words stay. The page is asked
    // for anew, so its ticket is fresh, and the send follows at once. The browser's clock starts before the server hands
    // the form out, so it never reads less than the ticket's age: under 1,5 s here leaves the send as long again to
    // arrive. A page that came slower is asked for once more — never passed over, or the refusal would go unshown.
    let refused = false

    for (let attempt = 0; attempt < 3 && !refused; attempt++) {
        await page.reload({ waitUntil: 'domcontentloaded' })
        await page.waitForFunction(() => (document.querySelector('#app') as (Element & { __vue_app__?: unknown }) | null)?.__vue_app__ !== undefined)
        await write()

        if ((await page.evaluate(() => performance.now())) > 1_500) {
            continue
        }

        await form.getByRole('button', { name: 'Nachricht senden' }).click()
        await expect(form.getByRole('alert')).toHaveText('Das ging zu schnell. Bitte schick deine Nachricht noch einmal ab.')
        await expect(form.locator('#kon-message')).toHaveValue('Passt die Felge auch mit Winterreifen auf mein Auto?')
        refused = true
    }

    expect(refused, 'the form never came within 1,5 s in three tries — the refusal of a quick send could not be shown').toBe(true)

    // A moment later the same form goes through, and is kept for the team.
    await page.waitForTimeout(3_200)
    await form.getByRole('button', { name: 'Nachricht senden' }).click()
    await expect(page.locator('.kon__done')).toContainText('deine Nachricht ist angekommen')
})

test('reviews come only from buyers: none is written in the admin, and until there are any the page says what it can prove', { tag: '@kunde-19' }, async ({ page }, info) => {
    await withCar(page, 'e46', PRODUCT)

    // No stars without reviews — never an empty row of them, never a number nobody gave.
    await expect(page.locator('.pdp__rating')).toHaveCount(0)
    await expect(page.locator('#bewertungen')).toHaveCount(0)
    await expect(page.locator('.pdp__proof')).toHaveText(/^\d+ Gutachten · für \d+ Fahrzeugvarianten? freigegeben · Freigabe vor dem Kauf geprüft$/)

    await shotAround(page, [page.locator('.pdp__buy h1'), page.locator('.pdp__proof')], 19, info)
})

/** The admin of the acceptance shop, as its full-rights review account (ReviewAccountsSeeder, development password). */
async function admin(page: Page): Promise<void> {
    await page.goto(`${ABNAHME}/admin/anmelden`, { waitUntil: 'networkidle' })
    await page.fill('#lg-mail', 'admin@rimify.test')
    await page.fill('#lg-pass', REVIEW_PASSWORD)
    await page.locator('button[type=submit]').first().click()
    await page.waitForURL(/\/admin(\?.*)?$/, { timeout: 30_000 })
}

test('the level of an Auflage is set per Gutachten and code — and an Abnahme can never be made a mere Hinweis, the form says why', { tag: '@kunde-23' }, async ({ page }, info) => {
    await admin(page)
    await page.goto(`${ABNAHME}/admin/gutachten`, { waitUntil: 'networkidle' })
    await page.locator('a', { hasText: '55255' }).first().click()
    await page.waitForLoadState('networkidle')

    const table = page.locator('.av__table')
    await expect(table).toBeVisible()

    // A01, the Abnahme: an Auflage, and „Hinweis“ cannot be chosen.
    const abnahme = table.locator('tbody tr', { has: page.locator('.av__code', { hasText: /^A01$/ }) })
    await expect(abnahme).toHaveCount(1)
    const level = abnahme.locator('select.av__level-select')
    await expect(level).toHaveValue('auflage')
    await expect(level.locator('option[value="hinweis"]')).toBeDisabled()
    await expect(level.locator('option[value="nicht_zulaessig"]')).toBeEnabled()

    // Why, in one sentence on the form.
    await expect(page.locator('.av__levels-note')).toContainText('Eine Abnahme oder Arbeit an der Karosserie ist immer eine Auflage')

    await shotAround(page, [table.locator('thead tr'), abnahme], 23, info)
})

test('RIMIFY-Check: one car, one wheel, one answer with its Auflagen, document and page — „Jetzt kaufen“ with the tyres beside it, and nothing to buy where it does not fit', { tag: '@kunde-28' }, async ({ page }, info) => {
    /** The wheel chosen on the check page as a visitor does it: each list in turn, each answered by the server. */
    async function wheel(inch: 18 | 19): Promise<void> {
        for (const [select, label] of [['#chk-brand', 'BORBET'], ['#chk-wheel', 'DB8GT2'], ['#chk-finish', 'Schwarz matt']] as const) {
            const field = page.locator(select)

            if ((await field.locator('option:checked').textContent())?.trim() !== label) {
                await field.selectOption({ label })
                await page.waitForLoadState('networkidle')
            }
        }

        const size = page.locator('#chk-size option', { hasText: new RegExp(`\\b${inch}\\b`) }).first()
        await page.locator('#chk-size').selectOption(await size.getAttribute('value') ?? '')
        await page.waitForLoadState('networkidle')
        await expect(page.locator('#antwort')).toBeVisible()
        await expect(page.locator('#antwort .chk__size')).toContainText(String(inch))
    }

    // The X3 and the 19-inch rim: an answer that sells, with the Komplettrad beside the button.
    await withCar(page, 'x3', '/rimify-check')
    await wheel(19)

    const answer = page.locator('#antwort')
    await expect(answer.locator('.rcheck-panel__vehicle')).toHaveText(/^Mit Auflagen freigegeben für /)
    await expect(answer.locator('.fit__overview')).toContainText('Das verlangt das Gutachten')
    await expect(answer.locator('.fit__doc')).toBeVisible()
    // The acceptance set's documents are examples: the link says so (D-239).
    await expect(answer.locator('.fit__pdf a').first()).toHaveText(/^\s*Gutachten öffnen \(Beispiel, PDF(, Seite \d+)?\)\s*$/)
    await expect(answer.locator('.chk__go')).toHaveText('Jetzt kaufen')
    await expect(answer.locator('.chk__go')).toBeEnabled()
    await expect(answer.locator('.chk__buy .bmc-tile', { hasText: 'Kompletträder' })).toBeVisible()

    await shot(answer, 28, info)

    // The E46 and the 18-inch rim: no answer we can stand behind, so nothing to buy — the refusal is the product.
    await withCar(page, 'e46', '/rimify-check')
    await wheel(18)
    await expect(answer.locator('.chk__go')).toHaveCount(0)
    await expect(answer.locator('.chk__nosale')).toContainText('deshalb bieten wir sie dafür nicht an')
})
