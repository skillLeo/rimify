import { expect, test, type Page } from './fixtures'
import { waitForApp } from './bugs/faq-support'
import { DEV, REVIEW_PASSWORD, consentGiven } from './support'

/*
 * D-142: the review's feedback button on the shop's own pages, where the client spends his review — for a signed-in
 * admin only, bottom right, above a page's price bar, sending the point with the shop page it was made on. A visitor's
 * page carries no trace of it. Writes one review point per run, on the development database only.
 */

const BASE = DEV

async function signIn(page: Page): Promise<void> {
    await page.goto('/admin/anmelden', { waitUntil: 'domcontentloaded' })
    await waitForApp(page)
    await page.fill('#lg-mail', 'verkauf@rimify.test')
    await page.fill('#lg-pass', REVIEW_PASSWORD)
    await page.locator('button[type=submit]').first().click()
    await page.waitForURL(/\/admin(\?.*)?$/, { waitUntil: 'domcontentloaded', timeout: 30_000 })
}

test.beforeEach(async ({ context, baseURL }) => {
    await consentGiven(context, baseURL ?? BASE)
})

test('a visitor’s page carries no feedback button and no trace of it', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await waitForApp(page)

    await expect(page.locator('.shop-fb')).toHaveCount(0)
    expect(await page.content(), 'the page data names a reviewer for a visitor').not.toContain('reviewer')
})

test('a signed-in admin sends a point from a shop page, and it arrives with that page', async ({ page }, info) => {
    const sentence = `E2E ${info.project.name}: Die Zeichnung im Felgenrechner ist gut lesbar.`

    await signIn(page)
    await page.goto('/felgenrechner', { waitUntil: 'networkidle' })
    await waitForApp(page)

    const button = page.locator('.shop-fb')
    await expect(button, 'no feedback button on the shop for a signed-in admin').toBeVisible()

    // Bottom right, wholly inside the window.
    const box = (await button.boundingBox())!
    const view = page.viewportSize()!
    expect(box.x + box.width).toBeLessThanOrEqual(view.width - 12)
    expect(box.x + box.width).toBeGreaterThan(view.width - 40)
    expect(box.y + box.height).toBeLessThanOrEqual(view.height - 12)
    expect(box.y + box.height).toBeGreaterThan(view.height - 60)
    expect(box.height).toBeGreaterThanOrEqual(44)

    await button.click()
    const dialog = page.getByRole('dialog', { name: 'Rückmeldung geben' })
    await expect(dialog).toBeVisible({ timeout: 20_000 })
    await expect(dialog).toContainText('diese Seite (/felgenrechner)')

    await dialog.locator('#fb-sentence').fill(sentence)
    await dialog.getByRole('button', { name: 'Senden' }).click()
    await expect(page.getByText('Danke – deine Rückmeldung ist angekommen.').first()).toBeVisible({ timeout: 20_000 })
    expect(new URL(page.url()).pathname).toBe('/felgenrechner')

    await page.goto('/admin/review/rueckmeldungen?status=alle', { waitUntil: 'networkidle' })
    const row = page.locator('tr, li, article').filter({ hasText: sentence }).first()
    await expect(row, 'the point is not in Review › Rückmeldungen').toBeVisible()
    await expect(row).toContainText('Shop · Felgenrechner')
})

test('it rides above a product page’s price bar', async ({ page }) => {
    await signIn(page)
    await page.goto('/felgen', { waitUntil: 'networkidle' })
    await waitForApp(page)

    const product = page.locator('main a[href^="/felgen/"]').first()
    await expect(product, 'no product on the list to open').toBeVisible()
    await product.click()
    await page.waitForURL(/\/felgen\/[^/?]+/, { waitUntil: 'networkidle' })
    await waitForApp(page)

    // Past the buy box: the price bar takes the bottom edge.
    await page.mouse.wheel(0, 4000)
    await page.waitForTimeout(600)

    const bar = page.locator('.stickybar')
    await expect(bar, 'the product page shows no price bar once its buy box is out of view').toBeVisible()

    const barBox = (await bar.boundingBox())!
    const buttonBox = (await page.locator('.shop-fb').boundingBox())!
    expect(buttonBox.y + buttonBox.height, 'the feedback button covers the price bar').toBeLessThanOrEqual(barBox.y)
})
