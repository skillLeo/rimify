import { expect, test, type Page } from '../fixtures'
import { PRODUCT, box, onSize, open, pageProps, throughExtras, toTyres, withCar } from './support'

/*
 * The Komplettrad in its steps (the Gutachten rework §9, the client's change of 05.11.2026): 1 Felge, 2 Reifen, 3 Extras, 4 Warenkorb.
 * The address names the step. Nothing is chosen for the customer, and the basket waits for the answer on the sensors. In the acceptance
 * shop, whose X3 is offered several tyres at 19 Zoll and whose E46 only the pairs the Gutachten lists.
 */

async function komplettrad(page: Page): Promise<void> {
    await page.locator('.pdp__mode .bmc-tile', { hasText: 'Kompletträder' }).click()
    await expect(page.locator('.pdp__mode input[value="komplettrad"]')).toBeChecked()
}

async function noSidewaysScroll(page: Page): Promise<void> {
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 'the page scrolls sideways').toBeLessThanOrEqual(0)
}

test('steps in the address: rim, tyres, extras, basket — Back goes one back, and nothing is chosen for the customer', { tag: ['@kunde-15', '@kunde-18'] }, async ({ page }) => {
    await withCar(page, 'x3', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await komplettrad(page)

    await expect(page.locator('.pdp__next')).toHaveText(/Weiter zum Komplettrad/)
    await expect(page.locator('.pdp__total')).toHaveText(/^ab /)
    await page.locator('.pdp__next').click()

    // 1 Felge: the whole version, and the way back to another.
    await page.waitForURL(/\/komplettraeder\?/)
    await expect(page.locator('#kf-wheel-h')).toBeVisible()
    await expect(page.locator('.kf-wheel__spec').first()).toHaveText(/ET.*mm/)
    await expect(page.locator('.kf-link')).toHaveAttribute('href', /ausfuehrung=\d+&groesse=\d+/)
    await noSidewaysScroll(page)

    // 2 Reifen: no tyre chosen, and the next step waits for one.
    await page.getByRole('button', { name: 'Weiter: Reifen' }).click()
    await expect(page).toHaveURL(/schritt=2/)
    await expect(page.locator('.tc--on')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Weiter: Extras' })).toBeDisabled()
    await noSidewaysScroll(page)

    await page.locator('[data-tyre-card] .tc__pick').first().click()
    await expect(page.locator('.tc--on')).toHaveCount(1)
    await expect(page.locator('.kf-pick')).toContainText('Gewählt:')
    // The step's one action stays in sight, however long the list: on a phone it stood 1.300 px below the tile.
    await expect(page.getByRole('button', { name: 'Weiter: Extras' })).toBeInViewport()

    // 3 Extras: nothing preselected, and the basket waits for the answer on the sensors.
    await page.getByRole('button', { name: 'Weiter: Extras' }).click()
    await expect(page).toHaveURL(/schritt=3/)
    await expect(page.locator('input[name="kf-rdks"]:checked')).toHaveCount(0)
    await expect(page.locator('input[name="kf-weights"]:checked')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Weiter: Warenkorb' })).toBeDisabled()
    await expect(page.locator('#kf-rdks-hint')).toHaveText('Sag uns zuerst, ob du RDKS-Sensoren brauchst.')
    await expect(page.locator('main')).not.toContainText('Noch nicht beantwortet')
    await expect(page.locator('main')).not.toContainText('an der Kasse')
    await noSidewaysScroll(page)

    await page.locator('.kf-opt', { hasText: 'Ohne RDKS-Sensoren' }).click()
    await expect(page.getByRole('button', { name: 'Weiter: Warenkorb' })).toBeEnabled()
    await expect(page.locator('#kf-rdks-hint')).toHaveCount(0)
    await page.getByRole('button', { name: 'Weiter: Warenkorb' }).click()

    // 4 Warenkorb: every line and the sum.
    await expect(page).toHaveURL(/schritt=4/)
    await expect(page.locator('.kf-basket__label').first()).toHaveText('4 Felgen')
    await expect(page.locator('.kf-basket tfoot td')).toHaveText(/\d,\d\d\s€$/)
    await noSidewaysScroll(page)

    // Back: one step back at a time, with what was chosen.
    await page.goBack()
    await expect(page.locator('#kf-extras-h')).toBeVisible()
    await expect(page.locator('input[name="kf-rdks"][value="nein"]')).toBeChecked()
    await page.goBack()
    await expect(page.locator('#kf-tyres-h')).toBeVisible()
    await expect(page.locator('.tc--on')).toHaveCount(1)

    // A reload keeps the step and the choice.
    await page.reload()
    await expect(page.locator('#kf-tyres-h')).toBeVisible()
    await expect(page.locator('.tc--on')).toHaveCount(1)
})

test('„alle Auflagen im Wortlaut“ above the basket leads to the wording on this page, never to nothing', { tag: '@kunde-21' }, async ({ page }) => {
    await withCar(page, 'x3', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await komplettrad(page)
    await toTyres(page)
    await throughExtras(page, page.locator('[data-tyre-card]').first())

    await page.locator('.kf-step .fit__to-detail').click()
    await expect(page.locator('#auflagen')).toBeInViewport()
})

test('front and rear different on a phone: the tyres stand within a few screens, the Auflagen folded behind their count', { tag: '@kunde-20' }, async ({ page }) => {
    await withCar(page, 'e46', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await komplettrad(page)
    await toTyres(page)

    const card = await box(page.locator('[data-tyre-card]').first())
    const step = await box(page.locator('.kf-step'))

    expect(card.y - step.y, 'the first tyre stands far down the page').toBeLessThan(1_400)
    await expect(page.locator('details[data-set-answer] summary')).toHaveText(/Auflagen und Hinweise aus dem Gutachten anzeigen$/)
    expect(await page.locator('details[data-set-answer]').getAttribute('open')).toBeNull()
})

test('a step asked for without what it needs opens the first that can be shown', { tag: '@kunde-18' }, async ({ page }) => {
    await withCar(page, 'x3', PRODUCT)

    const id = await onSize(page, 19, 'Schwarz matt')

    await open(page, `/komplettraeder?groesse=${id}&schritt=4`)
    await expect(page.locator('#kf-tyres-h')).toBeVisible()
    await expect(page.locator('.kf-basket')).toHaveCount(0)
})

/* The acceptance set holds one maker and one season, so it has no filter to press; pressing them is Komplettrad/Index.test.ts, on eight tyres. */
test('the order: by price either way and by brand, and the count says how many fit', { tag: '@kunde-18' }, async ({ page }) => {
    await withCar(page, 'x3', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await komplettrad(page)
    await toTyres(page)

    const cards = page.locator('[data-tyre-card]')
    const total = await cards.count()

    expect(total, 'the X3 at 19 Zoll is offered tyres').toBeGreaterThan(1)
    await expect(page.locator('.kf-count')).toHaveText(`${total} Reifen passen`)

    const prices = async (): Promise<number[]> =>
        (await page.locator('[data-tyre-card] .tc__set').allTextContents()).map((text) => Number(text.replace(/[^\d,]/g, '').replace(',', '.')))
    const brands = async (): Promise<string[]> => (await page.locator('[data-tyre-card] .tc__brand').allTextContents()).map((text) => text.trim())

    await page.locator('.kf-sort__select').selectOption('preis-auf')
    expect(await prices()).toEqual([...(await prices())].sort((a, b) => a - b))
    await page.locator('.kf-sort__select').selectOption('preis-ab')
    expect(await prices()).toEqual([...(await prices())].sort((a, b) => b - a))
    await page.locator('.kf-sort__select').selectOption('marke')
    expect(await brands()).toEqual([...(await brands())].sort((a, b) => a.localeCompare(b, 'de')))
})

test('„Details“ shows all about a tyre without choosing it, and fits a phone: no line cut off, no sideways scroll', { tag: '@kunde-15' }, async ({ page }) => {
    await withCar(page, 'x3', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await komplettrad(page)
    await toTyres(page)

    await page.locator('.tc__details').first().click()

    const dialog = page.getByRole('dialog')

    await expect(dialog).toBeVisible()
    await expect(page.locator('.tc--on')).toHaveCount(0)

    // The operator's note on the sketch: „Y: bis 300 km/h“ and „Beispielwert“ ran off the right edge at 390.
    const clipped = await dialog.evaluate((root) => {
        const edge = root.getBoundingClientRect().right
        const inner = [...root.querySelectorAll<HTMLElement>('*')].filter((el) => el.getBoundingClientRect().right > edge + 0.5)

        return { sideways: root.scrollWidth - root.clientWidth, past: inner.map((el) => el.className).slice(0, 5) }
    })

    expect(clipped.sideways, 'the dialog scrolls sideways').toBeLessThanOrEqual(0)
    expect(clipped.past, 'something stands past the dialog’s edge').toEqual([])
    await noSidewaysScroll(page)

    // Its buttons in sight, however long a real tyre's label makes the dialog.
    await expect(dialog.getByRole('button', { name: 'Auswählen' })).toBeInViewport()

    await dialog.getByRole('button', { name: 'Auswählen' }).click()
    await expect(page.locator('.tc--on')).toHaveCount(1)
})

test('front and rear different: the card shows both sizes and the set’s price, and the basket gets two and two', { tag: '@kunde-20' }, async ({ page }) => {
    await withCar(page, 'e46', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await komplettrad(page)
    await toTyres(page)

    const card = page.locator('[data-tyre-card]').first()

    await expect(card.locator('.tc__size')).toHaveCount(2)
    await expect(card.locator('.tc__sizes')).toContainText('vorne')
    await expect(card.locator('.tc__sizes')).toContainText('hinten')
    await expect(card.locator('.tc__each')).toContainText('für 2 vorne und 2 hinten')
    await noSidewaysScroll(page)

    await throughExtras(page, card)
    await page.locator('.kf-add').click()
    await expect(page.locator('.addp')).toBeVisible()

    // In the basket: two wheels per axle, each with its tyre.
    await open(page, '/warenkorb')
    await expect(page.locator('.bl__line')).toHaveCount(2)
    await expect(page.locator('.bl__line').first()).toContainText('Komplettrad Vorderachse')
    await expect(page.locator('.bl__line').nth(1)).toContainText('Komplettrad Hinterachse')
    await expect(page.locator('.bl__line').first().locator('.bl__part-unit').first()).toHaveText(/^2 × /)
})

test('without a car: the reason and the way to one, which comes back to this rim', { tag: '@kunde-25' }, async ({ page, context }) => {
    await withCar(page, 'x3', PRODUCT)

    const id = await onSize(page, 19, 'Schwarz matt')

    await context.clearCookies()
    await open(page, `/komplettraeder?groesse=${id}`)

    const refusal = page.locator('.kr-refusal')

    await expect(refusal).toContainText('zuerst dein Fahrzeug')
    await expect(page.getByRole('button', { name: 'Weiter: Reifen' })).toBeDisabled()
    await expect(refusal.getByRole('link', { name: 'Fahrzeug wählen' })).toHaveAttribute('href', new RegExp(`^/felgen-suchen\\?zurueck=.*groesse%3D${id}`))
})

test('the steps stay within a phone’s width with the whole page laid out', { tag: '@kunde-18' }, async ({ page }) => {
    await withCar(page, 'x3', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await komplettrad(page)
    await toTyres(page)

    const first = await box(page.locator('[data-tyre-card]').first())

    expect(first.x).toBeGreaterThanOrEqual(0)
    expect(first.x + first.width).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0)
    expect((await pageProps<{ schritt: number | null }>(page)).schritt).toBe(2)
})
