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

    await expect(page.locator('article.tile .tile__sizes', { hasText: 'Ausführungen' }).first()).toContainText(/\d+\sAusführungen/)
    await expectNoHorizontalOverflow(page)
})

/* The interaction review of Phase 3: what Back, a colour and a car did to the version chosen. */

const COLOURS = '/felgen/nordfelge-fjord'

async function chooseLastVersion(page: Page): Promise<string> {
    const versions = page.locator('button.pdp__version')

    await versions.last().click()
    await expect(versions.last()).toHaveAttribute('aria-pressed', 'true')
    // The address follows through Inertia, a moment later.
    await page.waitForURL(/groesse=/)

    return (await page.locator('.pdp__chosen').textContent()) ?? ''
}

test('Back finds the colour, the version and its price as they were left', async ({ page }) => {
    await open(page, COLOURS)
    await page.locator('.pdp__swatch').nth(1).click()

    const colour = (await page.locator('.pdp__swatch--on').textContent())?.trim() ?? ''
    const version = await chooseLastVersion(page)
    const price = await page.locator('.pdp__total').textContent()

    await page.locator('.pdp__crumbs a', { hasText: 'Felgen' }).click()
    await page.waitForURL(/\/felgen(\?|$)/)
    await page.goBack()

    await expect(page.locator('.pdp__chosen')).toHaveText(version)
    await expect(page.locator('.pdp__total')).toHaveText(price ?? '')
    await expect(page.locator('.pdp__swatch--on')).toContainText(colour)
})

test('a link with a fragment opens the size it names', async ({ page }) => {
    await open(page, COLOURS)

    const { configs } = await props(page)
    const named = configs.at(-1)!

    await open(page, `${COLOURS}?groesse=${named.id}#groessen`)
    await expect(page.locator('.pdp__chosen')).toContainText(named.fullLabel.split(' · ')[0]!)
})

test('a press on the colour already on changes nothing: the bolt pattern chosen stays', async ({ page }) => {
    await open(page, WHEEL)

    const other = page.locator('button.pdp__version', { hasText: '5 × 108' }).first()

    await other.click()
    await expect(other).toHaveAttribute('aria-pressed', 'true')
    await page.waitForURL(/groesse=/)

    const address = page.url()

    await page.locator('.pdp__swatch--on').click()

    await expect(other).toHaveAttribute('aria-pressed', 'true')
    expect(page.url()).toBe(address)
})

test('the car chosen from the product page comes back to the wheel and the version', async ({ page }) => {
    await open(page, COLOURS)

    const version = await chooseLastVersion(page)
    const address = new URL(page.url())

    await page.locator('.pdp__fit-cta').click()
    await page.waitForURL(/\/felgen-suchen\?zurueck=/)
    await waitForApp(page)

    await page.locator('[id="hsn-/felgen-suchen"]').fill('0603')
    await page.locator('[id="tsn-/felgen-suchen"]').fill('BGU')
    await page.locator('form:has([id="hsn-/felgen-suchen"]) button[type="submit"]').click()

    await page.waitForURL(/\/felgen\/nordfelge-fjord\?.*fahrzeug=/)
    expect(new URL(page.url()).searchParams.get('groesse')).toBe(address.searchParams.get('groesse'))
    await expect(page.locator('.pdp__chosen')).toHaveText(version)

    // Back past the selector to the page left without a car: it follows the car on screen, never „Noch kein Fahrzeug gewählt“.
    await page.goBack()
    await page.goBack()
    await page.waitForURL(/\/felgen\/nordfelge-fjord/)
    await expect(page.locator('.pdp__fit')).not.toContainText('Noch kein Fahrzeug gewählt')
    await expect(page.locator('.pdp__fit-cta')).toHaveCount(0)
})

test('the cart leads back to the version in it, not to what the page opens on', async ({ page }) => {
    await open(page, COLOURS)
    await page.locator('.pdp__swatch').nth(1).click()

    const version = await chooseLastVersion(page)

    await page.locator('button.pdp__add').click()
    await expect(page.locator('.addp')).toBeVisible()

    await open(page, '/warenkorb')
    await page.locator('.bl__link').first().click()
    await page.waitForURL(/\/felgen\/nordfelge-fjord/)
    await expect(page.locator('.pdp__chosen')).toHaveText(version)
})

test('a long wheel name wraps inside the column at 320: no sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await open(page, COLOURS)
    await page.evaluate(() => {
        document.querySelector('.pdp__buy h1')!.textContent = 'Kraftfahrzeug-Zulassungsbescheinigungsfelge'
    })
    await expectNoHorizontalOverflow(page)
})
