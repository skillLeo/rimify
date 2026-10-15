import { readFileSync } from 'node:fs'
import { expect, test } from '../fixtures'
import { ABNAHME, PRODUCT, addToBasket, box, consent, isPhone, onSize, open, shot, withCar } from './support'

/*
 * The client's list, the shop's frame: the header (#2, #3), the basket in the phone's header (#13), the footer (#10,
 * #29) and the mail links (#26). Against the acceptance shop (`rimify:demo --abnahme`).
 */

test.beforeEach(async ({ context }) => {
    await consent(context, ABNAHME)
})

test('the header is 72 px on a computer and 64 px on a phone, from one token everything under it reads', { tag: '@kunde-02' }, async ({ page }, info) => {
    await open(page, '/')
    const phone = isPhone(info)
    const token = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--header-h').trim())

    expect(token).toBe(phone ? '64px' : '72px')

    const bar = page.locator(phone ? '.mbar__row' : '.sh__bar').first()
    expect(Math.round((await box(bar)).height)).toBe(phone ? 64 : 72)

    // An anchor lands with its heading below the header, not under it.
    await page.evaluate(() => {
        window.location.hash = 'h4'
    })
    await page.waitForTimeout(400)
    const header = page.locator(phone ? 'header.mbar' : 'header.site-header').first()
    const target = await box(page.locator('#h4'))
    const headerBox = await box(header)
    expect(target.y, 'the anchor ends under the header').toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1)

    if (!phone) {
        // The mega menu opens exactly at the header's foot.
        await page.evaluate(() => window.scrollTo(0, 0))
        const trigger = page.locator('.sh__nav').getByRole('button').first()
        await trigger.hover()
        await trigger.click()
        const panel = page.locator('.mega__panel, [data-mega-panel], .mega').first()
        await expect(panel).toBeVisible()
        expect(Math.round((await box(panel)).y)).toBe(Math.round((await box(page.locator('.sh__bar').first())).y + 72))
        await page.keyboard.press('Escape')
    }

    // The listing's filter column starts under the header and the vehicle bar, both tokens (#24 reads the same).
    if (!phone) {
        await withCar(page, 'e90')
        await page.evaluate(() => window.scrollTo(0, 600))
        await page.waitForTimeout(300)
        const sticky = await page.evaluate(() => getComputedStyle(document.querySelector('.plp__side') as Element).top)
        expect(sticky).toBe(`${72 + 40 + 16}px`)
        await page.evaluate(() => window.scrollTo(0, 0))
    }

    await open(page, '/')
    await shot(header, 2, info)
})

// Playwright asks for a destructured first argument even where no fixture is used.
// eslint-disable-next-line no-empty-pattern
test('no stylesheet types a header height: the old phone token is gone, and no rule writes the number', { tag: '@kunde-02' }, async ({}, info) => {
    test.skip(isPhone(info), 'a check of the source, once')

    const tokens = readFileSync('resources/css/tokens.css', 'utf8')

    expect(tokens).toMatch(/--header-h:\s*64px;/)
    expect(tokens).toMatch(/@media \(min-width: 1024px\)\s*\{\s*:root\s*\{\s*--header-h:\s*72px;/)
    expect(tokens).not.toContain('--header-h-m')
})

test('nothing stands above the header any more, and what the strip said is still on the page', { tag: '@kunde-03' }, async ({ page }, info) => {
    await open(page, '/')
    const phone = isPhone(info)
    const header = page.locator(phone ? 'header.mbar' : 'header.site-header').first()

    expect(Math.round((await box(header)).y), 'something stands above the header').toBe(0)
    await expect(page.locator('.utility')).toHaveCount(0)

    // The strip carried: „Versand aus Deutschland“, „Gutachten zu jeder Felge“, the help line with the hours, the
    // Demodaten badge. Each of them is still on the page.
    const promises = page.locator('#h3')
    await expect(promises).toContainText('Versand aus Deutschland')
    await expect(promises).toContainText('Gutachten zu jeder Felge')
    await expect(page.locator('.hero-help, .home-hero__help, .hero__help').first()).toContainText('Mo–Fr')
    await expect(header.getByText('Demodaten').first()).toBeVisible()

    await shot(page.locator(phone ? 'header.mbar' : 'header.site-header').first(), 3, info)
})

test('the basket sits in the phone\'s header left of the menu, with its count, 44 px to tap', { tag: '@kunde-13' }, async ({ page }, info) => {
    await withCar(page, 'e90', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await addToBasket(page)

    if (isPhone(info)) {
        // Both phone headers carry it: the app bar of the phone documents and the shop's own header below 1024 px.
        for (const path of [PRODUCT, '/']) {
            await open(page, path)
            const header = page.locator('header.mbar, header.site-header').first()
            const cart = header.locator('.cart-btn').first()
            const menu = header.getByRole('button', { name: /^Menü/ }).first()

            await expect(cart, `the basket is not in the phone header on ${path}`).toBeVisible()
            await expect(cart).toHaveAccessibleName(/^Warenkorb, \d+ Artikel$/)
            await expect(cart.locator('.cart-btn__n')).toHaveText(/^\d+$/)

            const c = await box(cart)
            const m = await box(menu)
            expect(c.x + c.width, 'the basket is not left of the menu').toBeLessThanOrEqual(m.x + 1)
            expect(c.width).toBeGreaterThanOrEqual(44)
            expect(c.height).toBeGreaterThanOrEqual(44)
        }

        await shot(page.locator('header.mbar, header.site-header').first(), 13, info)
    } else {
        // On a computer the basket has its words beside the icon; the count is the same.
        const cart = page.locator('header.site-header .sh__cart').first()
        await expect(cart).toBeVisible()
        await expect(cart.locator('.sh__badge')).toHaveText(/^\d+$/)
        await shot(page.locator('header.site-header').first(), 13, info)
    }
})

test('the footer links the Felgenrechner and the Blog; both open, and the Blog leads to its articles', { tag: '@kunde-10' }, async ({ page, request }, info) => {
    await open(page, '/')
    const footer = page.locator('footer').last()
    const rechner = footer.getByRole('link', { name: 'Felgenrechner' })
    const blog = footer.getByRole('link', { name: 'Blog', exact: true })

    await expect(rechner).toHaveCount(1)
    const href = await rechner.getAttribute('href')
    expect((await request.get(new URL(href ?? '', ABNAHME).toString())).status()).toBe(200)

    // The Blog exists (D-230): the link leads to its index, and every article listed there opens.
    await expect(blog).toHaveCount(1)
    await shot(footer, 10, info)
    await blog.click()
    await expect(page).toHaveURL(/\/blog$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible()

    const articles = page.getByRole('main').getByRole('heading', { level: 2 }).getByRole('link')
    expect(await articles.count()).toBeGreaterThan(0)

    for (const link of await articles.all()) {
        const article = await link.getAttribute('href')
        expect((await request.get(new URL(article ?? '', ABNAHME).toString())).status(), `${article} does not open`).toBe(200)
    }
})

test('one footer exists, the same on every page and width, right at 390 × 844 and 360 × 640', { tag: '@kunde-29' }, async ({ page }, info) => {
    // The duplicate is deleted, not hidden: one footer component in the code.
    const layouts = ['resources/js/Layouts/AppLayout.vue', 'resources/js/Layouts/MobileLayout.vue'].map((f) => readFileSync(f, 'utf8'))
    for (const layout of layouts) {
        expect(layout).toContain("import SiteFooter from '../Components/Chrome/SiteFooter.vue'")
    }

    const sizes = isPhone(info) ? [{ width: 390, height: 844 }, { width: 360, height: 640 }] : [{ width: 1440, height: 900 }]

    for (const size of sizes) {
        await page.setViewportSize(size)
        for (const path of ['/', '/felgen', '/kontakt']) {
            await open(page, path)
            await expect(page.locator('footer')).toHaveCount(1)
            const footer = page.locator('footer').first()
            await expect(footer.locator('.footer__col').first()).toBeVisible()
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
            expect(overflow, `${path} overflows at ${size.width}`).toBeLessThanOrEqual(0)
        }
    }

    await page.setViewportSize(isPhone(info) ? { width: 390, height: 844 } : { width: 1440, height: 900 })
    await open(page, '/')
    await shot(page.locator('footer').first(), 29, info)
})

test('no button opens a mail program: every „Schreib uns“ leads to the form, and the Impressum gives the address as text', { tag: '@kunde-26' }, async ({ page, request }, info) => {
    for (const path of ['/', '/felgen', PRODUCT, '/warenkorb', '/kontakt', '/faq', '/felgenrechner', '/rimify-check', '/impressum', '/datenschutz', '/agb', '/gibt-es-nicht']) {
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        expect(await page.locator('a[href^="mailto:"], [formaction^="mailto:"]').count(), `${path} has a mail link`).toBe(0)
    }

    // The maintenance page, frozen by `artisan down`, too (its view rendered by the server as a 503 would be).
    const maintenance = readFileSync('resources/views/errors/_standalone.blade.php', 'utf8')
    expect(maintenance).not.toContain('mailto:')

    await open(page, '/impressum')
    const body = await page.locator('main').innerText()
    expect(body, 'the Impressum gives no e-mail address (§ 5 DDG)').toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/)

    await open(page, '/kontakt')
    expect((await request.get(new URL('/kontakt', ABNAHME).toString())).status()).toBe(200)
    const write = page.locator('main').getByRole('link', { name: /Schreib uns/ })
    if ((await write.count()) > 0) {
        await expect(write.first()).toHaveAttribute('href', /\/kontakt/)
    }

    await open(page, '/')
    await shot(page.locator('.hero-help, .home-hero__help, .hero__help').first(), 26, info)
})
