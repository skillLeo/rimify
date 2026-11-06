import { consentGiven, expectNoHorizontalOverflow } from './support'
import { waitForApp } from './bugs/faq-support'
import { expect, test, type Page } from './fixtures'
import { SHOP } from './shop'

/*
 * The product page's versions (the Gutachten rework §8): one chip per size row of the rim, with its width, ET, bolt pattern and
 * price, chosen whole. Without a car every version of the colour and diameter; with one, those it may have, the others counted in
 * words true for each and brought back on request. In the e2e shop, whose seeded papers give one car all three answers in one
 * diameter.
 */

test.use({ baseURL: SHOP })

const WHEEL = '/felgen/bergsteig-gipfel'
/* In the seed, a car with one 18″ of this wheel sold, one refused and one without an answer. */
const CAR = 5

type Config = { id: number; finishId: number; diameterIn: number; widthIn: number; etMm: number; versionLabel: string; fullLabel: string; price: string; verdict: { status: string; sellable: boolean; rimSellable?: boolean } | null }

function props(page: Page): Promise<{ configs: Config[]; finishes: { id: number }[] }> {
    return page.evaluate(() => (window.history.state as { page: { props: never } }).page.props)
}

async function open(page: Page, path: string): Promise<void> {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    await waitForApp(page)
}

test.beforeEach(async ({ context }) => {
    await consentGiven(context, SHOP)
})

test('without a car: every version of the colour and diameter, chosen whole, and the address keeps the choice', async ({ page }) => {
    await open(page, WHEEL)

    const all = await props(page)
    const first = all.finishes[0]!.id
    const diameters = all.configs.filter((c) => c.finishId === first)
    const several = diameters.find((c) => diameters.filter((d) => d.diameterIn === c.diameterIn).length > 1)

    expect(several, 'precondition: a diameter of this wheel in two versions').toBeDefined()
    await page.locator('#groessen .chip', { hasText: String(several!.diameterIn).replace('.', ',') }).click()

    const block = page.locator('.pdp__variants')
    const chips = block.locator('button.pdp__version')
    const inDiameter = diameters.filter((c) => c.diameterIn === several!.diameterIn)

    await expect(block.locator('.label')).toHaveText('Ausführung')
    await expect(chips).toHaveCount(inDiameter.length)
    await expect(block).toContainText('Wähle dein Fahrzeug, dann zeigen wir nur die Ausführungen, die dafür freigegeben sind.')
    await expect(block.locator('.pdp__version--struck')).toHaveCount(0)

    // Width, ET, bolt pattern and price on one chip: never three selectors that could make a wheel that does not exist.
    await expect(chips.first()).toContainText(/Breite\s[\d,]+J · ET\s-?\d+ · Lochkreis\s\d\s×\s[\d,]+/)
    await expect(chips.first().locator('.pdp__version-price')).toContainText('€')

    const other = chips.nth(1)

    await other.click()
    await expect(other).toHaveAttribute('aria-pressed', 'true')
    await expect(chips.nth(0)).toHaveAttribute('aria-pressed', 'false')

    await expect(block.locator('.pdp__chosen')).toContainText('Gewählt:')
    await expect.poll(() => new URL(page.url()).searchParams.get('groesse')).not.toBeNull()
    expect(new URL(page.url()).searchParams.get('ausfuehrung')).toBe(String(first))

    const label = await other.locator('.pdp__version-spec').textContent()

    await page.reload({ waitUntil: 'domcontentloaded' })
    await waitForApp(page)
    await expect(page.locator('.pdp__variants button.pdp__version[aria-pressed="true"] .pdp__version-spec')).toHaveText(label!)

    await expectNoHorizontalOverflow(page)
})

test('with a car: those it may have, the others counted in true words and brought back struck through, never as a choice', async ({ page }) => {
    await open(page, `${WHEEL}?fahrzeug=${CAR}`)

    const { configs } = await props(page)
    const mixed = configs.find((c) => {
        const row = configs.filter((d) => d.finishId === c.finishId && d.diameterIn === c.diameterIn)

        return row.some((d) => d.verdict?.status === 'NOT_PERMITTED') && row.some((d) => d.verdict?.sellable === true) && row.some((d) => d.verdict?.status === 'UNKNOWN')
    })

    expect(mixed, `precondition: a diameter with all three answers for car ${CAR}`).toBeDefined()

    const row = configs.filter((c) => c.finishId === mixed!.finishId && c.diameterIn === mixed!.diameterIn)
    const sold = row.filter((c) => c.verdict?.sellable === true)
    const others = row.length - sold.length

    await open(page, `${WHEEL}?fahrzeug=${CAR}&ausfuehrung=${mixed!.finishId}&groesse=${sold[0]!.id}`)

    const block = page.locator('.pdp__variants')

    await expect(block.locator('button.pdp__version')).toHaveCount(sold.length)
    await expect(block.locator('.pdp__version-hint')).toContainText('für dein Fahrzeug nicht freigegeben')
    await expect(block.locator('.pdp__version--struck')).toHaveCount(0)

    await block.getByRole('button', { name: 'Anzeigen' }).click()
    await expect(block.locator('.pdp__version--struck')).toHaveCount(others)
    await expect(block.locator('.pdp__version--struck').first()).toContainText(/nicht freigegeben|keine Freigabe vorliegend|noch nicht bestätigt/)
    await expect(block.locator('button.pdp__version')).toHaveCount(sold.length)

    await block.getByRole('button', { name: 'Ausblenden' }).click()
    await expect(block.locator('.pdp__version--struck')).toHaveCount(0)

    // The car stays in the address beside the version, under its own key.
    await block.locator('button.pdp__version').first().click()
    await expect.poll(() => new URL(page.url()).searchParams.get('groesse')).not.toBeNull()
    expect(new URL(page.url()).searchParams.get('fahrzeug')).not.toBeNull()
    await expectNoHorizontalOverflow(page)
})

test('a link to a version the car may not have says so where it is, and never swaps it for another', async ({ page }) => {
    await open(page, `${WHEEL}?fahrzeug=${CAR}`)

    const { configs } = await props(page)
    const refused = configs.find((c) => c.verdict?.status === 'NOT_PERMITTED' && configs.some((d) => d.finishId === c.finishId && d.diameterIn === c.diameterIn && d.verdict?.sellable))

    expect(refused, 'precondition: a refused version beside a sold one').toBeDefined()

    await open(page, `${WHEEL}?fahrzeug=${CAR}&ausfuehrung=${refused!.finishId}&groesse=${refused!.id}`)

    const block = page.locator('.pdp__variants')

    await expect(block.locator('.pdp__version--struck.pdp__version--on .pdp__version-why')).toHaveText('nicht freigegeben')
    await expect(block.getByRole('button', { name: 'Anzeigen' })).toHaveCount(0)
    await expect(page.locator('button.pdp__add')).toBeDisabled()
    await expect(page.locator('.pdp__fit')).toContainText(/Nicht freigegeben/)
})

test('the cart and the checkout name the whole version', async ({ page }) => {
    await open(page, `${WHEEL}?fahrzeug=${CAR}`)

    const { configs } = await props(page)
    const sold = configs.find((c) => c.verdict?.sellable === true)!

    await open(page, `${WHEEL}?fahrzeug=${CAR}&ausfuehrung=${sold.finishId}&groesse=${sold.id}`)
    await page.locator('button.pdp__add').click()
    await expect(page.locator('.addp')).toBeVisible()

    await open(page, '/warenkorb')
    await expect(page.locator('.bl__size').first()).toHaveText(sold.fullLabel)
    await expect(page.locator('.bl__size').first()).toContainText(/\d\s×\s[\d,]+ · [\d,]+\smm/)
    await expectNoHorizontalOverflow(page)
})

test('a card says how many versions stand behind its price', async ({ page }) => {
    await open(page, '/felgen')

    await expect(page.locator('article.tile .tile__sizes', { hasText: 'Ausführungen' }).first()).toContainText(/\d+ Ausführungen/)
    await expectNoHorizontalOverflow(page)
})
