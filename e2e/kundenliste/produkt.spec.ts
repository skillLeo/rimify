import { expect, test, type Locator, type Page } from '../fixtures'
import { ABNAHME, PRODUCT, box, consent, onSize, open, pageProps, shot, shotAround, withCar } from './support'

/*
 * The client's list on the product page, against the acceptance shop (rimify:demo --abnahme): the BORBET DB8GT2 at 18
 * Zoll for 229,00 € and at 19 Zoll for 269,00 €, on its two real Gutachten, for three demo cars —
 *
 * - the BMW X3 (E83): Komplettrad at 19 Zoll with three tyres, one of them (255/40 R19) needing the Abnahme;
 * - the BMW 3er (E46): 19 Zoll with Auflagen and front/rear pairs only (V19), 18 Zoll unanswered (no high-speed table);
 * - the BMW 3er (E90): as the E46, with its own pairs.
 *
 * Without a car the rims are sold without a claim about any car, which is how #14 and #17 are tested.
 */

const NNBSP = ' '
const RIM = 22_900

/** `1.145,00 €` — as the shop writes money (R-10). */
function euro(cents: number): string {
    return `${new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)}${NNBSP}€`
}

test.beforeEach(async ({ context }) => {
    await consent(context, ABNAHME)
})

/** The stepper beside the price, set to `n` from wherever it stands. */
async function amount(page: Page, n: number): Promise<void> {
    const shown = page.locator('.pdp__amount output')
    const now = Number(await shown.textContent())
    const step = page.getByRole('button', { name: n > now ? 'Anzahl erhöhen' : 'Anzahl verringern' })

    for (let i = 0; i < Math.abs(n - now); i++) {
        await step.click()
    }

    await expect(shown).toHaveText(String(n))
}

/** The page's basket button, pressed, and back once the server has answered and the panel is up. */
async function add(page: Page, button: Locator = page.locator('button.pdp__add')): Promise<void> {
    await button.scrollIntoViewIfNeeded()
    await Promise.all([
        page.waitForResponse((r) => new URL(r.url()).pathname === '/warenkorb' && r.request().method() === 'POST'),
        button.click(),
    ])
    await expect(page.locator('.addp')).toBeVisible()
}

async function mode(page: Page, which: 'Nur Felgen' | 'Komplettrad'): Promise<void> {
    await page.locator('.pdp__mode .bmc-tile', { hasText: which }).click()
    await expect(page.locator(`.pdp__mode input[value="${which === 'Nur Felgen' ? 'felgen' : 'komplettrad'}"]`)).toBeChecked()
}

type Answer = { combination: string[]; chosen: string | null; entry: boolean | null }
type Tyre = { id: number; sizeLabel: string; answer?: Answer }
type Pair = { front: string; rear: string; minSentence: string }
type Config = {
    id: number
    verdict: { status: string; papersExempt?: boolean; tyreSizesFront?: string[]; tyreSizesRear?: string[]; detail?: { original?: { text: string }[] } } | null
    komplettrad: { tyres: Tyre[]; refusalCode: string | null }
    mischbereifung: { pairs: Pair[] } | null
}

/** The size on screen, as the page's own props hold it. */
async function onScreen(page: Page): Promise<Config> {
    const props = await pageProps<{ configs: Config[] }>(page)
    const id = Number(new URL(page.url()).searchParams.get('groesse'))
    const config = props.configs.find((c) => c.id === id)

    if (!config) {
        throw new Error(`size ${id} is not on the page`)
    }

    return config
}

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
    await expect(line).toHaveText(`4 × ${euro(RIM)} = ${euro(4 * RIM)}, inkl. MwSt., zzgl. Versand`)

    // Up to eight, the price following every step.
    for (let n = 5; n <= 8; n++) {
        await more.click()
        await expect(total).toHaveText(euro(n * RIM))
        await expect(line).toHaveText(new RegExp(`^${n} × 229,00\\s€ = ${euro(n * RIM).replace('.', '\\.').replace(NNBSP, '\\s')}`))
    }

    await expect(more).toBeDisabled()

    // Down to one.
    for (let n = 7; n >= 1; n--) {
        await less.click()
    }

    await expect(less).toBeDisabled()
    await expect(line).toHaveText(`1 × ${euro(RIM)} = ${euro(RIM)}, inkl. MwSt., zzgl. Versand`)

    await amount(page, 4)
    await shot(page.locator('.pdp__price'), 17, info)
})

test('one rim 229,00 €, the amount\'s total everywhere else: page, panel, basket line and basket total agree at 1 to 5', { tag: '@kunde-14' }, async ({ page, context }, info) => {
    // Five adds and five baskets: more than one page's worth of time.
    test.setTimeout(360_000)

    // Four last, so the picture is the client's own example.
    for (const n of [1, 2, 3, 5, 4]) {
        await context.clearCookies()
        await consent(context, ABNAHME)
        await open(page, PRODUCT)
        await onSize(page, 18, 'Schwarz matt')
        await amount(page, n)

        const sum = euro(n * RIM)
        await expect(page.locator('.pdp__total')).toHaveText(sum)
        await add(page)

        // The panel: the line at the amount added, and the basket's total.
        await expect(page.locator('.addp__name')).toHaveText(`${n} × BORBET DB8GT2`)
        await expect(page.locator('.addp__price')).toHaveText(sum)
        await expect(page.locator('.addp__sum-value')).toHaveText(sum)

        // The basket: one rim's price, the amount, the line and the order's total.
        await open(page, '/warenkorb')
        const row = page.locator('.bl__line').first()
        await expect(row.locator('.bl__unit')).toHaveText(`${n} × ${euro(RIM)}`)
        await expect(row.locator('.bl__total')).toHaveText(sum)
        await expect(page.locator('.cart__summary .sum__row--total')).toContainText(sum)
    }

    await shotAround(page, [page.locator('.bl__line').first(), page.locator('.cart__summary')], 14, info)
})

test('after the add: the line and the total, „Weiter einkaufen“ and „Zum Warenkorb“ — the focus in it, kept there, given back; never the whole phone', { tag: '@kunde-16' }, async ({ page }, info) => {
    await open(page, PRODUCT)
    await onSize(page, 18, 'Schwarz matt')

    const button = page.locator('button.pdp__add')
    const panel = page.locator('.addp')
    const inside = (): Promise<boolean> => panel.evaluate((el) => el.contains(document.activeElement))

    // The keyboard's add: Enter on the button.
    await button.focus()
    await Promise.all([
        page.waitForResponse((r) => new URL(r.url()).pathname === '/warenkorb' && r.request().method() === 'POST'),
        page.keyboard.press('Enter'),
    ])
    await expect(panel).toBeVisible()
    await expect(panel).toBeFocused()
    await expect(panel.locator('.addp__name')).toHaveText('4 × BORBET DB8GT2')
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

    await shot(panel, 16, info)

    // Escape: closed, the focus back on the button.
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(button).toBeFocused()

    // „Weiter einkaufen“ does the same.
    await Promise.all([
        page.waitForResponse((r) => new URL(r.url()).pathname === '/warenkorb' && r.request().method() === 'POST'),
        page.keyboard.press('Enter'),
    ])
    await expect(panel).toBeFocused()
    await panel.getByRole('button', { name: 'Weiter einkaufen' }).focus()
    await page.keyboard.press('Enter')
    await expect(panel).toHaveCount(0)
    await expect(button).toBeFocused()
})

test('Nur Felgen or Komplettrad: switching keeps the rest, the tyre is picked right there, and its size\'s answer is the one shown', { tag: '@kunde-18' }, async ({ page }, info) => {
    await withCar(page, 'x3', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')

    // Two clear choices; switching keeps the amount of rims.
    await expect(page.locator('.pdp__mode .bmc-tile')).toHaveText([/^Nur Felgen/, /^Komplettrad/])
    await amount(page, 2)
    await mode(page, 'Komplettrad')

    const config = await onScreen(page)
    const tyres = config.komplettrad.tyres
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
    const strict = tyres.findIndex((t) => t.answer?.entry === true)
    await page.locator('.kc-row').nth(strict).click()
    await shot(page.locator('.pdp__buy'), 18, info)

    // A combination the Gutachten does not answer cannot be bought: the E46 at 18 Zoll (no table above 210 km/h).
    await withCar(page, 'e46', PRODUCT)
    await onSize(page, 18, 'Schwarz matt')
    expect((await onScreen(page)).verdict?.status).toBe('UNKNOWN')
    await expect(page.locator('button.pdp__add')).toBeDisabled()
    await mode(page, 'Komplettrad')
    await expect(page.locator('button.pdp__add')).toBeDisabled()
    await expect(page.locator('button.pdp__add')).toHaveText('Komplettrad gerade nicht möglich')
})

test('Komplettrad: Wuchtgewichte and RDKS sensors as lines of their own with their prices, one per wheel — with Nur Felgen none of them', { tag: '@kunde-15' }, async ({ page, context }, info) => {
    await withCar(page, 'x3', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await mode(page, 'Komplettrad')
    await page.locator('.kc-row').first().click()
    await page.locator('.kc-opt', { hasText: 'Mit RDKS-Sensoren' }).click()
    await add(page)

    await open(page, '/warenkorb')
    const line = page.locator('.bl__line').first()
    await expect(line.locator('.bl__part-label')).toHaveText(['Felge', 'Reifen', 'Montage und Auswuchten', 'Wuchtgewichte (Silber)'])
    for (const unit of await line.locator('.bl__part-unit').all()) {
        await expect(unit).toHaveText(/^4 × /)
    }

    const summary = page.locator('.cart__summary')
    await expect(summary).toContainText(/RDKS-Sensoren \(4 × 49,00\s€\)/)
    await expect(summary).toContainText(/196,00\s€/)
    await expect(summary).toContainText('MwSt')

    // The picture: the Komplettrad's own lines and the order's sensor line, without the Auflagen between them.
    await shotAround(page, [line.locator('.bl__parts'), summary], 15, info)

    // The rims alone: no Reifen, no Wuchtgewichte, no sensors.
    await context.clearCookies()
    await consent(context, ABNAHME)
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

    // Each pair: front and rear on their own axle load, the axle that asks more named, the table's number and page.
    for (const [i, pair] of pairs.entries()) {
        await mix.locator('.mix__pairs .chip').nth(i).click()
        await expect(mix.locator('.mix__pair')).toContainText(`vorne ${pair.front}`)
        await expect(mix.locator('.mix__min')).toHaveText(/vorne \(880\skg\) mindestens Tragfähigkeitsindex \d+ .* hinten \(1\.020\skg\) mindestens Tragfähigkeitsindex \d+/)
        await expect(mix.locator('.mix__min')).toHaveText(/(Mehr verlangt die (Vorderachse|Hinterachse)|Beide Achsen verlangen denselben Tragfähigkeitsindex)\.$/)
        await expect(mix.locator('.mix__source')).toContainText(/Kombination Nr\.\s\d+/)
    }

    await shot(mix, 20, info)
})

test('„Eintragung“ once, in the verdict — and the Gutachten\'s own wording behind „Originaltext anzeigen“', { tag: '@kunde-21' }, async ({ page }, info) => {
    await withCar(page, 'e46', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')

    // The papers' sentence once, in the verdict, under its headline — whatever it says, nowhere else on the page.
    const papers = page.locator('.pdp__fit .fit__entry--verdict')
    await expect(papers).toBeVisible()
    const sentence = (await papers.textContent())?.trim() ?? ''
    const visible = await page.locator('main').innerText()

    expect(visible.split(sentence).length - 1, `„${sentence}“ stands more than once`).toBe(1)
    expect((visible.match(/Eintragung/g) ?? []).length, '„Eintragung“ stands more than once').toBeLessThanOrEqual(1)

    // The wording as printed, closed until asked for, every sentence of the answer with its page.
    const original = page.locator('details[data-original]')
    await expect(original).toHaveCount(1)
    expect(await original.getAttribute('open')).toBeNull()
    await original.locator('summary').click()
    await expect(original.locator('summary')).toHaveText('Originaltext anzeigen')
    await expect(original.locator('li')).toHaveCount((await onScreen(page)).verdict?.detail?.original?.length ?? -1)
    await expect(original).toContainText('(Seite')

    await shot(page.locator('.pdp__fit'), 21, info)
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

    await shotAround(page, [page.locator('.pdp__mode'), refusal], 25, info)

    // The one sensible action: „Nur Felgen“, which buys.
    await mode(page, 'Nur Felgen')
    await expect(page.locator('button.pdp__add')).toBeEnabled()
    await expect(page.locator('button.pdp__add')).toHaveText('In den Warenkorb')
})

test('Rückfrage: „Product Detail Page needs …“ ends there — the product page as it stands, for him to finish the sentence', { tag: '@kunde-34' }, async ({ page }, info) => {
    await withCar(page, 'e46', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await expect(page.locator('h1')).toHaveText('BORBET DB8GT2')
    await page.evaluate(() => window.scrollTo(0, 0))

    await shot(page, 34, info)
})
