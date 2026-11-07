import { expect, test } from '../fixtures'
import { ABNAHME, CARS, PRODUCT, consent, open, pageProps, withCar } from './support'

/*
 * The client's fourth change, in the shop (the operator's brief of 07.11.2026, §5): his mockup's wheel, 8,5 × 18 ET 35 in front and
 * 8,5 × 19 ET 35 behind, on a demo paper for the fourth demo car (`rimify:demo --satz`). The set is one thing to buy, two and two, each
 * version at its own price; neither version is ever four.
 */

test.beforeEach(async ({ context }) => {
    await consent(context, ABNAHME)
})

const FRONT = /Vorne\s2\s×\s8,5\s×\s18\sET\s35/
const REAR = /Hinten\s2\s×\s8,5\s×\s19\sET\s35/

test('the product page offers the set, names both axles, prices it two and two, and has no chip for either version', { tag: '@kunde-20' }, async ({ page }) => {
    await withCar(page, 'f30', PRODUCT)

    const sets = page.locator('[data-wheel-sets]')
    await expect(sets).toBeVisible()

    const chip = sets.locator('button').first()
    await expect(chip).toContainText(FRONT)
    await expect(chip).toContainText(REAR)
    await expect(chip).toContainText('Lochkreis')
    await expect(chip).toContainText('996,00')
    await expect(chip).toHaveAttribute('aria-pressed', 'true')

    // No chip of its own for a version sold only so, and no amount: two and two.
    await expect(page.locator('.pdp__variants .pdp__version')).toHaveCount(0)
    await expect(page.locator('.pdp__amount')).toHaveCount(0)
    await expect(page.locator('.pdp__total')).toContainText('996,00')
    await expect(page.locator('.pdp__each')).toContainText(/2\s×\s229,00\s€\s\+\s2\s×\s269,00\s€/)

    // Both versions spelled out, and the address keeps the choice.
    await expect(page.locator('[data-set-chosen]')).toContainText('Vorne:')
    await expect(page.locator('[data-set-chosen]')).toContainText('Hinten:')

    // Both diameters are the set's, and pressing one leaves it; the details name both versions, each under its axle.
    await expect(page.locator('.pdp__chips .chip[aria-pressed="true"]')).toHaveCount(2)
    await page.locator('.pdp__chips .chip', { hasText: /^19$/ }).click()
    await expect(sets.locator('button').first()).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-spec-axle]')).toHaveCount(2)
    await expect(page.locator('.pdp__specs-for').nth(0)).toContainText('× 18')
    await expect(page.locator('.pdp__specs-for').nth(1)).toContainText('× 19')

    // The tile's price is the set's, for four, and each axle's sizes are named; no printed answer for only one axle of it.
    await expect(page.locator('.bmc-tile').first()).toContainText('für 4 Felgen')
    await expect(page.locator('[data-sizes-axle="front"]')).toContainText('R18')
    await expect(page.locator('[data-sizes-axle="rear"]')).toContainText('R19')
    await expect(page.locator('.fit__issue')).toHaveCount(0)
})

test('a car that may have four of a version still gets it: the set is not offered beside what it does not concern', { tag: '@kunde-20' }, async ({ page }) => {
    await withCar(page, 'e46', PRODUCT)

    await expect(page.locator('[data-wheel-sets]')).toHaveCount(0)
    await expect(page.locator('.pdp__variants .pdp__version').first()).toBeVisible()
    await expect(page.locator('.pdp__amount')).toBeVisible()
})

test('in the basket: one line per axle, two each, each version\'s own price, no stepper, removed together', { tag: '@kunde-20' }, async ({ page }) => {
    await withCar(page, 'f30', PRODUCT)
    const added = page.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/warenkorb')
    await page.locator('.pdp__add').click()
    await added

    await open(page, '/warenkorb')
    const lines = page.locator('.bl__line')
    await expect(lines).toHaveCount(2)
    await expect(lines.nth(0)).toContainText('Felge Vorderachse')
    await expect(lines.nth(0).locator('[data-wheel-set]')).toContainText('× 19')
    await expect(lines.nth(1)).toContainText('Felge Hinterachse')
    await expect(lines.nth(1).locator('[data-wheel-set]')).toContainText('× 18')
    await expect(lines.nth(0).locator('.bl__total')).toContainText('458,00')
    await expect(lines.nth(1).locator('.bl__total')).toContainText('538,00')
    await expect(page.locator('.bl__stepper')).toHaveCount(0)
    await expect(page.locator('[data-fixed]')).toHaveCount(2)

    // The checkout names both axles too, each at its own price.
    await open(page, '/kasse')
    const paying = page.locator('.ko__line')
    await expect(paying).toHaveCount(2)
    await expect(paying.nth(0)).toContainText('Felge Vorderachse')
    await expect(paying.nth(0).locator('.ko__line-price')).toContainText('458,00')
    await expect(paying.nth(1)).toContainText('Felge Hinterachse')
    await expect(paying.nth(1).locator('.ko__line-price')).toContainText('538,00')

    await open(page, '/warenkorb')
    await lines.nth(1).locator('.bl__remove').click()
    await expect(lines).toHaveCount(0)
})

test('a version chosen for another car and now only for a set: the refusal alone, no green answer beside it, and the way to the set', { tag: '@kunde-20' }, async ({ page }) => {
    await withCar(page, 'e46', PRODUCT)
    const added = page.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/warenkorb')
    await page.locator('.pdp__add').click()
    await added

    await withCar(page, 'f30')
    await open(page, '/warenkorb')
    const line = page.locator('.bl__line').first()
    await expect(line.locator('.bl__reason')).toContainText('nur zusammen mit einer anderen')
    await expect(line.locator('.bl__flags .tag', { hasText: 'Freigegeben' })).toHaveCount(0)

    await line.locator('[data-go-set]').click()
    await page.waitForURL(/satz=/)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-wheel-sets] button').first()).toHaveAttribute('aria-pressed', 'true')
})

test('the listing says the wheel comes only as a set, and its card opens on the set', { tag: '@kunde-20' }, async ({ page }) => {
    await withCar(page, 'f30')

    const tile = page.locator('main .tile', { hasText: 'DB8GT2' }).first()
    await expect(tile.locator('[data-only-set]')).toContainText('Nur als Satz')
    await expect(tile.locator('.tile__price')).toContainText('für 4 Felgen')
    await expect(tile.locator('.tile__price')).toContainText('996,00')
    await tile.locator('a').first().click()
    await page.waitForURL(/\/felgen\/borbet-db8gt2/)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-wheel-sets] button').first()).toHaveAttribute('aria-pressed', 'true')
})

test('the RIMIFY-Check answers for one version and offers the way to the set, never four of it', { tag: '@kunde-20' }, async ({ page }) => {
    await withCar(page, 'f30', PRODUCT)
    const props = await pageProps<{ configs: { id: number; finishId: number }[] }>(page)
    const first = props.configs[0]!

    await open(page, `/rimify-check?hersteller=borbet&felge=borbet-db8gt2&ausfuehrung=${first.finishId}&groesse=${first.id}&fahrzeug=${CARS.f30.key}`)

    await expect(page.locator('.chk__nosale-text')).toContainText('nur zusammen mit einer anderen')
    await expect(page.locator('.chk__go')).toHaveCount(0)
    await expect(page.locator('.fit__issue')).toHaveCount(0)
    await page.locator('[data-go-set]').click()
    await page.waitForURL(/satz=/)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-wheel-sets] button').first()).toHaveAttribute('aria-pressed', 'true')
})

test('a Komplettrad on the set: both tyres named per axle, RDKS asked, nothing preselected, one line per axle in the basket', { tag: '@kunde-20' }, async ({ page }) => {
    await withCar(page, 'f30', PRODUCT)

    await page.locator('.pdp__mode .bmc-tile', { hasText: 'Kompletträder' }).click()
    await expect(page.locator('.pdp__next')).toHaveText(/Weiter zum Komplettrad/)
    await page.locator('.pdp__next').click()
    await page.waitForURL(/hinten=\d+/)
    await expect(page.locator('#kf-wheel-h')).toHaveText('Deine Felgen')
    await expect(page.locator('.kf-wheel__spec').first()).toContainText(FRONT)
    await expect(page.locator('.kf-wheel__spec').nth(1)).toContainText(REAR)
    await expect(page.locator('[data-sizes-axle="rear"]').first()).toContainText('R19')

    await page.getByRole('button', { name: 'Weiter: Reifen' }).click()
    const tyreStep = (await page.locator('.kf-step .kf-measure').first().innerText()).trim()
    const card = page.locator('[data-tyre-card]').first()
    await expect(card.locator('.tc__size')).toHaveCount(2)
    await expect(card.locator('.tc__sizes')).toContainText('R18')
    await expect(card.locator('.tc__sizes')).toContainText('R19')
    await card.locator('.tc__pick').click()

    await page.getByRole('button', { name: 'Weiter: Extras' }).click()
    await expect(page.locator('input[name="kf-rdks"]:checked')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Weiter: Warenkorb' })).toBeDisabled()
    await page.locator('.kf-swatch').first().click()
    await page.locator('.kf-opt', { hasText: 'Ohne RDKS-Sensoren' }).click()
    await page.getByRole('button', { name: 'Weiter: Warenkorb' }).click()

    // The last step says what the tyre step said, for this pair on these two wheels.
    await expect(page.locator('.kf-panel .fit__tyre-summary')).toHaveText(tyreStep)
    await expect(page.locator('.kf-basket__label').first()).toHaveText('4 Felgen')
    await page.locator('.kf-add').click()
    await expect(page.locator('.addp')).toBeVisible()

    await open(page, '/warenkorb')
    const lines = page.locator('.bl__line')
    await expect(lines).toHaveCount(2)
    await expect(lines.nth(0)).toContainText('Komplettrad Vorderachse')
    await expect(lines.nth(0).locator('.bl__size')).toContainText('× 18')
    await expect(lines.nth(1)).toContainText('Komplettrad Hinterachse')
    await expect(lines.nth(1).locator('.bl__size')).toContainText('× 19')

    await open(page, '/kasse')
    const paying = page.locator('.ko__line')
    await expect(paying).toHaveCount(2)
    await expect(paying.nth(0)).toContainText('Komplettrad Vorderachse')
    await expect(paying.nth(1)).toContainText('Komplettrad Hinterachse')
})
