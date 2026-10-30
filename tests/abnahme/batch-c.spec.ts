import { VISITOR } from './instance'
import { consent, evidence, evidenceAround, expect, open, test } from './fixtures'
import { PRODUCT, RIM, add, amount, box, euro, mode, onScreen, onSize, withCar } from './shop'

/*
 * Batch C — the product page and the basket: the client's #14, #15, #16, #17, #18, #20, #21 and #25, as a visitor, on
 * the instance RIMIFY_URL names. Ported from e2e/kundenliste/produkt.spec.ts. The acceptance wheel goes into a basket —
 * a session's, gone with its cookie — and never further: no checkout, no order, nothing that stays.
 */

test.use({ storageState: VISITOR })

test.beforeEach(async ({ page }) => {
    await consent(page)
})

test('beside the price: 1 to 8, four chosen, the price following and read as „4 × 229,00 € = 916,00 €“', { tag: '@kunde-17' }, async ({ page }, info) => {
    await open(page, PRODUCT)
    await onSize(page, 18, 'Schwarz matt')

    const shown = page.locator('.pdp__amount output')
    const total = page.locator('.pdp__total')
    const line = page.locator('.pdp__each')
    const more = page.getByRole('button', { name: 'Anzahl erhöhen' })
    const less = page.getByRole('button', { name: 'Anzahl verringern' })

    // Beside the price, four chosen.
    const price = await box(page.locator('.pdp__price-row > div').first())
    const stepper = await box(page.locator('.pdp__amount'))
    expect(Math.abs(stepper.y + stepper.height / 2 - (price.y + price.height / 2)), 'the amount stands beside the price').toBeLessThan(price.height + stepper.height)
    await expect(shown).toHaveText('4')
    await expect(total).toHaveText(euro(4 * RIM))
    await expect(line).toHaveText(`4 × ${euro(RIM)} = ${euro(4 * RIM)}, inkl. MwSt., zzgl. Versandkosten`)

    // Up to eight, the price following every step.
    for (let n = 5; n <= 8; n++) {
        await more.click()
        await expect(total).toHaveText(euro(n * RIM))
        await expect(line).toHaveText(`${n} × ${euro(RIM)} = ${euro(n * RIM)}, inkl. MwSt., zzgl. Versandkosten`)
    }

    await expect(more).toBeDisabled()

    for (let n = 7; n >= 1; n--) {
        await less.click()
    }

    await expect(less).toBeDisabled()
    await expect(line).toHaveText(`1 × ${euro(RIM)} = ${euro(RIM)}, inkl. MwSt., zzgl. Versandkosten`)

    await amount(page, 4)
    await evidence(page.locator('.pdp__price'), 17, info)
})

test('one rim 229,00 €, the amount\'s total everywhere else: page, panel, basket line and basket total agree at 1 to 5', { tag: '@kunde-14' }, async ({ page }, info) => {
    test.setTimeout(360_000)

    // Four last, so the picture is the client's own example. Each round a new basket: the cookies go, and the session.
    for (const n of [1, 2, 3, 5, 4]) {
        await page.context().clearCookies()
        await consent(page)
        await open(page, PRODUCT)
        await onSize(page, 18, 'Schwarz matt')
        await amount(page, n)

        const sum = euro(n * RIM)
        await expect(page.locator('.pdp__total')).toHaveText(sum)
        await add(page)

        // The brand as the shop holds it: „Borbet“ on the preview (the client's brand), „BORBET“ on our instance.
        await expect(page.locator('.addp__name')).toHaveText(new RegExp(`^${n} × BORBET DB8GT2$`, 'i'))
        await expect(page.locator('.addp__price')).toHaveText(sum)
        await expect(page.locator('.addp__sum-value')).toHaveText(sum)

        await open(page, '/warenkorb')
        const row = page.locator('.bl__line').first()
        await expect(row.locator('.bl__unit')).toHaveText(`${n} × ${euro(RIM)}`)
        await expect(row.locator('.bl__total')).toHaveText(sum)
        await expect(page.locator('.cart__summary .sum__row--total')).toContainText(sum)
    }

    await evidenceAround(page, [page.locator('.bl__line').first(), page.locator('.cart__summary')], 14, info)
})

test('after the add: the line and the total, „Weiter einkaufen“ and „Zum Warenkorb“ — the focus in it, kept there, given back; never the whole phone', { tag: '@kunde-16' }, async ({ page }, info) => {
    await open(page, PRODUCT)
    await onSize(page, 18, 'Schwarz matt')

    const button = page.locator('button.pdp__add')
    const panel = page.locator('.addp')
    const inside = (): Promise<boolean> => panel.evaluate((el) => el.contains(document.activeElement))

    // The keyboard's add: Enter on the button.
    await button.focus()
    await Promise.all([page.waitForResponse((r) => new URL(r.url()).pathname === '/warenkorb' && r.request().method() === 'POST'), page.keyboard.press('Enter')])
    await expect(panel).toBeVisible()
    await expect(panel).toBeFocused()
    await expect(panel.locator('.addp__name')).toHaveText(/^4 × BORBET DB8GT2$/i)
    await expect(panel.locator('.addp__price')).toHaveText(euro(4 * RIM))
    await expect(panel.locator('.addp__sum-value')).toHaveText(euro(4 * RIM))
    await expect(panel.getByRole('button', { name: 'Weiter einkaufen' })).toBeVisible()
    await expect(panel.getByRole('link', { name: 'Zum Warenkorb' })).toBeVisible()

    // Tab and Shift+Tab stay inside.
    for (const key of ['Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
        await page.keyboard.press(key)
        expect(await inside(), `${key} left the panel`).toBe(true)
    }

    // A card, not the screen.
    const card = await box(panel)
    const view = page.viewportSize() ?? { width: 0, height: 0 }
    expect(card.height).toBeLessThan(view.height * 0.6)
    expect(card.width).toBeLessThanOrEqual(view.width)

    await evidence(panel, 16, info)

    // Escape: closed, the focus back on the button.
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(button).toBeFocused()

    // „Weiter einkaufen“ does the same.
    await Promise.all([page.waitForResponse((r) => new URL(r.url()).pathname === '/warenkorb' && r.request().method() === 'POST'), page.keyboard.press('Enter')])
    await expect(panel).toBeFocused()
    await panel.getByRole('button', { name: 'Weiter einkaufen' }).focus()
    await page.keyboard.press('Enter')
    await expect(panel).toHaveCount(0)
    await expect(button).toBeFocused()
})

test('Nur Felgen or Komplettrad: switching keeps the rest, the tyre is picked right there, and its size\'s answer is the one shown', { tag: '@kunde-18' }, async ({ page }, info) => {
    await withCar(page, 'x3', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')

    // „Kompletträder“ since the copy review (EIGENE-FUNDE 128).
    await expect(page.locator('.pdp__mode .bmc-tile')).toHaveText([/^Nur Felgen/, /^Komplettr(ad|äder)\b/])
    await amount(page, 2)
    await mode(page, 'Komplettrad')

    const tyres = (await onScreen(page)).komplettrad.tyres
    expect(tyres.length, 'the X3 at 19 Zoll is offered tyres').toBeGreaterThan(1)
    await expect(page.locator('.kc-row')).toHaveCount(tyres.length)

    // Each tyre: the panel says what its size asks — the Eintragung or none — and names the size.
    const entries = new Set<boolean>()

    for (const [i, tyre] of tyres.entries()) {
        await page.locator('.kc-row').nth(i).click()
        const answer = tyre.answer

        expect(answer?.chosen, `tyre ${tyre.sizeLabel} came without its size's answer`).toBeTruthy()
        await expect(page.locator('.pdp__fit .fit__overview-h')).toContainText(`mit ${answer?.chosen}`)

        const papers = page.locator('.pdp__fit .fit__entry--verdict')

        if (answer?.entry) {
            await expect(papers).not.toHaveText(/^Keine/)
        } else {
            await expect(papers).toHaveText(/^Keine (Eintragung|Abnahme)/)
        }

        entries.add(answer?.entry === true)
    }

    // ABE 55255 asks the X3 for the Abnahme with one of its sizes and not the others: the answer changes with the tyre.
    expect(entries.size, 'every tyre gave the same answer about the papers').toBe(2)

    // Back to the rims: the amount kept.
    await mode(page, 'Nur Felgen')
    await expect(page.locator('.pdp__amount output')).toHaveText('2')

    // The picture: the Komplettrad with the tyre that needs the Abnahme.
    await mode(page, 'Komplettrad')
    await page.locator('.kc-row').nth(tyres.findIndex((t) => t.answer?.entry === true)).click()
    await evidence(page.locator('.pdp__buy'), 18, info)

    // A combination the Gutachten does not answer cannot be bought: the E46 at 18 Zoll (no table above 210 km/h).
    await withCar(page, 'e46', PRODUCT)
    await onSize(page, 18, 'Schwarz matt')
    expect((await onScreen(page)).verdict?.status).toBe('UNKNOWN')
    await expect(page.locator('button.pdp__add')).toBeDisabled()
    await mode(page, 'Komplettrad')
    await expect(page.locator('button.pdp__add')).toBeDisabled()
    await expect(page.locator('button.pdp__add')).toHaveText('Komplettrad gerade nicht möglich')
})

test('Komplettrad: Wuchtgewichte and RDKS sensors as lines of their own with their prices, one per wheel — with Nur Felgen none of them', { tag: '@kunde-15' }, async ({ page }, info) => {
    await withCar(page, 'x3', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await mode(page, 'Komplettrad')
    await page.locator('.kc-row').first().click()
    // The weights' colour, chosen as a person chooses it where the shop asks: on the preview both of the client's colours
    // cost extra, so none is preselected (#15); on our instance the free one stands chosen.
    if ((await page.locator('input[name="kc-weights"]:checked').count()) === 0) {
        await page.locator('.kc-swatch').first().click()
    }
    await page.locator('.kc-opt', { hasText: 'Mit RDKS-Sensoren' }).click()
    await add(page)

    await open(page, '/warenkorb')
    const line = page.locator('.bl__line').first()
    // The weights' colour as the shop names it — „Silver“ on the preview (the client's entry), „Silber“ on our instance.
    await expect(line.locator('.bl__part-label')).toHaveText(['Felge', 'Reifen', 'Montage und Auswuchten', /^Wuchtgewichte \(.+\)$/])

    for (const unit of await line.locator('.bl__part-unit').all()) {
        await expect(unit).toHaveText(/^4 × /)
    }

    // Four sensors at the shop's price — 49,00 € on our instance, the client's own on the preview — and their line adds up.
    const summary = page.locator('.cart__summary')
    const sensors = /RDKS-Sensoren \(4 × (\d{1,3}(?:\.\d{3})*,\d{2})\s€\)\s*(\d{1,3}(?:\.\d{3})*,\d{2})\s€/.exec((await summary.innerText()).replace(/\n/g, ' '))
    expect(sensors, 'no line „RDKS-Sensoren (4 × …)“ in the summary').not.toBeNull()
    const cents = (money: string): number => Number(money.replace(/\./g, '').replace(',', ''))
    expect(cents(sensors?.[2] ?? '0'), 'the sensors\' line is not four times their price').toBe(4 * cents(sensors?.[1] ?? '0'))
    await expect(summary).toContainText('MwSt')

    // The Gutachten's paragraphs are folded behind one line (D-197); „Zur Kasse“ stays within reach.
    const auflagen = line.locator('details[data-auflagen]')
    await expect(auflagen.locator('summary')).toHaveText(/^\s*\d+ Auflagen und Hinweise aus dem Gutachten anzeigen\s*$/)
    expect(await auflagen.getAttribute('open')).toBeNull()
    await expect(line.locator('.bl__entry').first()).toBeVisible()
    expect((await box(page.locator('.cart'))).height, 'the basket runs far past the window').toBeLessThan((page.viewportSize()?.height ?? 0) * 3)
    await auflagen.locator('summary').click()
    await expect(auflagen.locator('li').first()).toBeVisible()
    await auflagen.locator('summary').click()

    await evidence(page.locator('.cart'), 15, info)

    // The rims alone: no Reifen, no Wuchtgewichte, no sensors.
    await page.context().clearCookies()
    await consent(page)
    await withCar(page, 'x3', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await expect(page.locator('.kc')).toHaveCount(0)
    await add(page)
    await open(page, '/warenkorb')
    await expect(page.locator('.bl__line')).toHaveCount(1)
    await expect(page.locator('.bl__parts')).toHaveCount(0)
    await expect(page.locator('.cart')).not.toContainText('RDKS')
    await expect(page.locator('.cart')).not.toContainText('Wuchtgewichte')
})

test('front and rear only in the pairs the Gutachten lists, each axle on its own load and the axle that asks more named', { tag: '@kunde-20' }, async ({ page }, info) => {
    await withCar(page, 'e46', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await mode(page, 'Komplettrad')

    const config = await onScreen(page)
    const pairs = config.mischbereifung?.pairs ?? []
    const front = config.verdict?.tyreSizesFront ?? []
    const rear = config.verdict?.tyreSizesRear ?? []
    const every = front.flatMap((f) => rear.filter((r) => r !== f).map((r) => `${f}/${r}`))

    // Only the table's pairs — fewer than the sizes would make — never every combination.
    expect(pairs.length).toBeGreaterThan(1)
    expect(pairs.length).toBeLessThan(every.length)

    const mix = page.locator('section.mix')
    await expect(mix).toBeVisible()
    await expect(mix.locator('.mix__pairs .chip')).toHaveText(pairs.map((p) => `vorne ${p.front} · hinten ${p.rear}`))

    for (const [i, pair] of pairs.entries()) {
        await mix.locator('.mix__pairs .chip').nth(i).click()
        await expect(mix.locator('.mix__pair')).toContainText(`vorne ${pair.front}`)
        await expect(mix.locator('.mix__min')).toHaveText(/vorne \(880\skg\) mindestens Tragfähigkeitsindex \d+ .* hinten \(1\.020\skg\) mindestens Tragfähigkeitsindex \d+/)
        await expect(mix.locator('.mix__min')).toHaveText(/(Mehr verlangt die (Vorderachse|Hinterachse)|Beide Achsen verlangen denselben Tragfähigkeitsindex)\.$/)
        await expect(mix.locator('.mix__source')).toContainText(/Kombination Nr\.\s\d+/)
    }

    await evidence(mix, 20, info)
})

test('„Eintragung“ once, in the verdict — and the Gutachten\'s own wording behind „Originaltext anzeigen“', { tag: '@kunde-21' }, async ({ page }, info) => {
    await withCar(page, 'e46', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')

    const papers = page.locator('.pdp__fit .fit__entry--verdict')
    await expect(papers).toBeVisible()
    const sentence = (await papers.textContent())?.trim() ?? ''
    const visible = await page.locator('main').innerText()

    expect(visible.split(sentence).length - 1, `„${sentence}“ stands more than once`).toBe(1)
    expect((visible.match(/Eintragung/g) ?? []).length, '„Eintragung“ stands more than once').toBeLessThanOrEqual(1)

    const original = page.locator('details[data-original]')
    await expect(original).toHaveCount(1)
    expect(await original.getAttribute('open')).toBeNull()
    await original.locator('summary').click()
    await expect(original.locator('summary')).toHaveText('Originaltext anzeigen')
    await expect(original.locator('li')).toHaveCount((await onScreen(page)).verdict?.detail?.original?.length ?? -1)
    await expect(original).toContainText('(Seite')

    await evidence(page.locator('.pdp__fit'), 21, info)
})

test('the wording as printed keeps each tyre size\'s sentences under that size: fine-link chains and no chains never in one list', { tag: '@kunde-21' }, async ({ page }) => {
    await withCar(page, 'x3', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')

    const original = page.locator('details[data-original]')
    await original.locator('summary').click()

    const lists = await original.locator('ul').evaluateAll((uls) =>
        uls.map((ul) => {
            const before = ul.previousElementSibling
            const plain = (text: string | null | undefined): string => (text ?? '').replace(/\s+/g, ' ').trim()

            return { label: before?.classList.contains('fdt__for') ? plain(before.textContent) : null, text: plain(ul.textContent) }
        }),
    )

    expect(lists.filter((l) => l.text.includes('feingliedrige')).map((l) => l.label)).toEqual(['Nur bei 235/45 R19 und 245/40 R19'])
    expect(lists.filter((l) => l.text.includes('Die Verwendung von Schneeketten ist nicht zulässig')).map((l) => l.label)).toEqual(['Nur bei 255/40 R19'])
    await expect(original.locator('.fdt__original-lede')).toContainText('Gilt ein Satz nur für bestimmte Reifengrößen, stehen diese Größen direkt darüber.')
})

test('no dead „Nur die Felgen bestellen“: where no Komplettrad can be offered, one sentence, a way on, and „Nur Felgen“ right above', { tag: '@kunde-25' }, async ({ page }, info) => {
    // The E46 at 19 Zoll: front and rear sizes differ, so there are no four equal tyres to offer.
    await withCar(page, 'e46', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await mode(page, 'Komplettrad')

    const refusal = page.locator('.kc .kc__refusal')
    await expect(refusal).toBeVisible()
    await expect(refusal).toContainText('Die Felge allein kannst du sofort bestellen.')
    await expect(refusal.getByRole('link', { name: 'Schreib uns' })).toHaveAttribute('href', /^\/kontakt\?/)
    await expect(page.locator('main')).not.toContainText('Nur die Felgen bestellen')

    await evidenceAround(page, [page.locator('.pdp__mode'), refusal], 25, info)

    // The one sensible action: „Nur Felgen“, which buys.
    await mode(page, 'Nur Felgen')
    await expect(page.locator('button.pdp__add')).toBeEnabled()
    await expect(page.locator('button.pdp__add')).toHaveText('In den Warenkorb')
})
