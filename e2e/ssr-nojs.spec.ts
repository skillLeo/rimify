import { expect, test } from '@playwright/test'

/*
 * Server rendering, proven the only way that counts (the launch release §3): a browser with
 * JavaScript switched off — as a search engine's first look — gets the homepage and a product page
 * with the product's name and price in the HTML. A page the browser would have to draw is empty here.
 *
 * The product is the first one the Felgen list offers; nothing is assumed about the catalogue.
 */

test.use({ javaScriptEnabled: false })

test('the homepage and a product page are complete without JavaScript', async ({ page }) => {
    const home = await page.goto('/', { waitUntil: 'domcontentloaded' })
    expect(home?.status()).toBe(200)
    await expect(page.locator('#app[data-server-rendered="true"]')).toHaveCount(1)
    await expect(page.locator('h1').first()).toBeVisible()

    const list = await page.goto('/felgen', { waitUntil: 'domcontentloaded' })
    expect(list?.status()).toBe(200)

    const tile = page.locator('article.tile').first()
    await expect(tile, 'the Felgen list shows no product without JavaScript').toBeVisible()
    const name = ((await tile.locator('.tile__name, h3, h2').first().textContent()) ?? '').trim()
    const href = await tile.locator('a.tile__cta').getAttribute('href')
    expect(href).toBeTruthy()

    const product = await page.goto(href!, { waitUntil: 'domcontentloaded' })
    expect(product?.status()).toBe(200)
    await expect(page.locator('#app[data-server-rendered="true"]')).toHaveCount(1)
    await expect(page.locator('h1')).toContainText(name)
    // A price: digits, a decimal comma, two cents and the euro sign, in the rendered page.
    await expect(page.locator('.pdp__price .price').first()).toHaveText(/\d+,\d{2}\s€/)
})
