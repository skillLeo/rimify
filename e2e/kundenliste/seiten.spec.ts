import { expect, test, type Page } from '../fixtures'
import { REVIEW_PASSWORD } from '../support'
import { ABNAHME, PRODUCT, box, consent, isPhone, open, shot, shotAround, withCar } from './support'

/*
 * The client's list beyond the product page and the listing, against the acceptance shop: the Felgenrechner's drawing
 * (#11, judgement), the contact form (#12), stars typed in the admin beside their sentence (#19, D-344), the level of an
 * Auflage (#23, solved differently, in the admin) and the RIMIFY-Check (#28).
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

    // Sent in the moment the form was handed out: no person writes that fast — said, and the words stay. The send carries
    // a ticket the server sealed a moment before it, taken from the same page (its props, as Inertia asks for them) — so
    // the send is too quick whatever the machine's pace. Waiting for a page to come and fill within 1,5 s could not be
    // done on a loaded machine, and the refusal went unshown (16.10.2026, twice).
    const version = await page.evaluate(() => (window.history.state as { page?: { version?: string } } | null)?.page?.version ?? '')
    await page.route('**/kontakt', async (route) => {
        const body = route.request().postDataJSON() as Record<string, unknown> | null

        if (route.request().method() !== 'POST' || body === null) {
            return route.continue()
        }

        const fresh = await page.request.get('/kontakt', { headers: { 'X-Inertia': 'true', 'X-Inertia-Version': version, Accept: 'text/html, application/xhtml+xml' } })
        const ticket = ((await fresh.json()) as { props: { ticket?: string } }).props.ticket

        return route.continue({ postData: JSON.stringify({ ...body, ticket }) })
    })
    await form.getByRole('button', { name: 'Nachricht senden' }).click()
    await expect(form.getByRole('alert')).toHaveText('Das ging zu schnell. Bitte schick deine Nachricht noch einmal ab.')
    await expect(form.locator('#kon-message')).toHaveValue('Passt die Felge auch mit Winterreifen auf mein Auto?')
    await page.unroute('**/kontakt')

    // A moment later the same form goes through — with the ticket it was handed — and is kept for the team.
    await page.waitForTimeout(3_200)
    await form.getByRole('button', { name: 'Nachricht senden' }).click()
    // Our instances send no mail (the mailer writes to the log): the page says it is kept, never „angekommen“ (D-347).
    await expect(page.locator('.kon__done')).toContainText('deine Nachricht ist bei uns gespeichert.')
})

test('stars typed in the admin show under the rim\'s name on the listing and the product page, with the shop\'s sentence beside them — never as a checked purchase, and gone when taken off', { tag: '@kunde-19' }, async ({ page }, info) => {
    // Before: no stars — never an empty row of them, never a number nobody gave — and what the page can prove instead.
    await withCar(page, 'e46', PRODUCT)
    await expect(page.locator('.pdp__rating')).toHaveCount(0)
    await expect(page.locator('.pdp__proof')).toHaveText(/^\d+ Gutachten · für \d+ Fahrzeugvarianten? freigegeben · Freigabe vor dem Kauf geprüft$/)
    const modelId = await page.evaluate(() => (JSON.parse(document.querySelector('script[data-page="app"]')?.textContent ?? '{}') as { props?: { product?: { modelId?: number } } }).props?.product?.modelId ?? 0)
    expect(modelId, 'the acceptance rim has no id on its page').toBeGreaterThan(0)

    await admin(page)
    await page.goto(`${ABNAHME}/admin/felgen/${modelId}`, { waitUntil: 'networkidle' })
    const card = page.locator('.fe-stars')
    // The sentence agreed on 29.10.2026 (D-345), as the shop stands until someone rewords it.
    const sentence = 'Bewertungen aus anderen Quellen, vom Shop übernommen und nicht auf einen Kauf geprüft.'
    await expect(card.locator('#fe-stars-note')).toHaveValue(sentence)

    try {
        // A rating without its count is refused beside its field, and nothing reaches the shop.
        await card.locator('#fe-stars-rating').fill('4,9')
        await card.getByRole('button', { name: 'Sterne speichern' }).click()
        await expect(card.locator('#fe-stars-count-err')).toHaveText('Trag ein, auf wie vielen Bewertungen die Sterne beruhen.')
        await expect(card.locator('[data-stars-now]')).toHaveText('Im Shop stehen keine Sterne von Hand.')

        await card.locator('#fe-stars-count').fill('13')
        await card.getByRole('button', { name: 'Sterne speichern' }).click()
        await expect(card.locator('.fe-stars__line')).toHaveText(`★ 4,9 (13 Bewertungen) – ${sentence}`)

        // The listing: under the rim's name on its card, the sentence beside the stars.
        await withCar(page, 'e46', '/felgen')
        const tile = page.locator('main .tile', { hasText: 'DB8GT2' }).first()
        await expect(tile.locator('.tile__title + [data-stated-rating]')).toHaveText(`★ 4,9 (13 Bewertungen) – ${sentence}`)

        // The product page: right under the name — no link to reviews that are not there, no „Geprüfter Kauf“, and the
        // proof line steps aside as it does for the buyers' own stars.
        await withCar(page, 'e46', PRODUCT)
        const line = page.locator('.pdp__buy h1 + [data-stated-rating]')
        await expect(line.locator('.tabular')).toHaveText('4,9 (13 Bewertungen)')
        await expect(line.locator('.pdp__rating-origin')).toHaveText(`– ${sentence}`)
        await expect(page.locator('a.pdp__rating')).toHaveCount(0)
        await expect(page.locator('.pdp__proof')).toHaveCount(0)
        await expect(page.getByText('Geprüfter Kauf')).toHaveCount(0)
        // The sentence is never cut: it wraps inside the panel on a phone as on a desk, back to the panel's edge.
        const fits = await line.evaluate((el) => {
            const panel = (el.closest('.pdp__buy') as HTMLElement).getBoundingClientRect()
            const rects = [...(el.querySelector('.pdp__rating-origin') as HTMLElement).getClientRects()]

            return el.scrollWidth <= el.clientWidth + 1 && rects.every((r) => r.right <= panel.right + 1) && (rects.length < 2 || Math.abs((rects[1]?.left ?? 0) - el.getBoundingClientRect().left) <= 1)
        })
        expect(fits, 'the sentence beside the stars runs out of its line, or wraps into a column of its own').toBe(true)

        await shotAround(page, [page.locator('.pdp__buy h1'), line], 19, info)
    } finally {
        // Off again, through the card, so the acceptance shop stands as it did.
        await page.goto(`${ABNAHME}/admin/felgen/${modelId}`, { waitUntil: 'networkidle' })
        const off = page.locator('.fe-stars').getByRole('button', { name: 'Sterne entfernen' })

        if ((await off.count()) > 0) {
            await off.click()
            await expect(page.locator('.fe-stars [data-stars-now]')).toHaveText('Im Shop stehen keine Sterne von Hand.')
        }
    }

    await withCar(page, 'e46', PRODUCT)
    await expect(page.locator('[data-stated-rating]')).toHaveCount(0)
    await expect(page.locator('.pdp__proof')).toBeVisible()
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
    await expect(answer.locator('.chk__nosale')).toContainText('bis sie hinterlegt sind, bieten wir die Felge dafür nicht an')
})
