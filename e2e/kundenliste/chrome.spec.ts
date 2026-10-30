import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '../fixtures'
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

    // One header at every width since the client's #35 (D-349).
    const bar = page.locator('.sh__bar').first()
    expect(Math.round((await box(bar)).height)).toBe(phone ? 64 : 72)

    // An anchor lands with its heading below the header, not under it.
    await page.evaluate(() => {
        window.location.hash = 'h4'
    })
    await page.waitForTimeout(400)
    const header = page.locator('header.site-header').first()
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
    const header = page.locator('header.site-header').first()

    expect(Math.round((await box(header)).y), 'something stands above the header').toBe(0)
    await expect(page.locator('.utility')).toHaveCount(0)

    // The strip carried: „Versand aus Deutschland“, „Gutachten zu jeder Felge“, the help line with the hours, the
    // Demodaten badge. Each of them is still on the page.
    const promises = page.locator('#h3')
    await expect(promises).toContainText('Versand aus Deutschland')
    await expect(promises).toContainText('Gutachten zu jeder Felge')
    await expect(page.locator('.hero-help, .home-hero__help, .hero__help').first()).toContainText('Mo–Fr')
    await expect(header.getByText('Demodaten').first()).toBeVisible()

    await shot(header, 3, info)
})

test('the basket sits in the phone\'s header left of the menu, with its count, 44 px to tap', { tag: '@kunde-13' }, async ({ page }, info) => {
    await withCar(page, 'e90', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await addToBasket(page)

    if (isPhone(info)) {
        // The one header carries it on every page, the basket included (#35, D-349).
        for (const path of [PRODUCT, '/', '/warenkorb']) {
            await open(page, path)
            const header = page.locator('header.site-header').first()
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

        await shot(page.locator('header.site-header').first(), 13, info)
    } else {
        // On a computer the basket has its words beside the icon; the count is the same.
        const cart = page.locator('header.site-header .sh__cart').first()
        await expect(cart).toBeVisible()
        await expect(cart.locator('.sh__badge')).toHaveText(/^\d+$/)
        await shot(page.locator('header.site-header').first(), 13, info)
    }
})

/*
 * The client's #35 (D-349): the menu, the basket and the wordmark sat a few pixels apart from page to page — the home
 * page and the Felgenrechner had a phone bar of their own, the basket and the checkout a header without the basket.
 * One header now, and every control in it stands where it stands on the home page, on every page he named.
 */
test('one header on every page: at 390 and 360 every control in it stands where it stands on the home page, to the pixel', { tag: '@kunde-35' }, async ({ page }, info) => {
    test.skip(!isPhone(info), 'the phone header; the computer header is the same component (#2)')
    test.setTimeout(240_000)

    // A car and a basket: the checkout opens rather than sending back to the basket, and every header carries the same.
    await withCar(page, 'e90', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await addToBasket(page)

    await open(page, '/blog')
    const post = await page.getByRole('main').getByRole('heading', { level: 2 }).getByRole('link').first().getAttribute('href')
    expect(post, 'the Blog lists no article to measure').toBeTruthy()

    const pages = ['/', '/felgen', PRODUCT, '/warenkorb', '/kasse', '/blog', post ?? '', '/kontakt', '/felgenrechner', '/rimify-check', '/impressum', '/gibt-es-nicht']

    for (const width of [390, 360]) {
        await page.setViewportSize({ width, height: 844 })
        const rows = new Map<string, string[]>()

        for (const path of pages) {
            await open(page, path)
            expect(new URL(page.url()).pathname, `${path} sent elsewhere`).toBe(new URL(path, ABNAHME).pathname)
            // The title the phone bar carried is the page's one h1 where a page asks for it, and never a second one.
            await expect(page.locator('h1'), `${path} has not exactly one h1`).toHaveCount(1)

            // Every control in the header's row that shows, by what it is and where: x, y, width and height in whole pixels.
            rows.set(
                path,
                await page.evaluate(() => {
                    const kinds = ['RIMIFY', 'Demodaten', 'Suche', 'Fahrzeug', 'Warenkorb', 'Menü']

                    return [...document.querySelectorAll('header.site-header .sh__bar :is(a, button, .demo-badge)')]
                        .map((el) => ({ el, r: el.getBoundingClientRect() }))
                        .filter(({ el, r }) => r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden')
                        .map(({ el, r }) => {
                            const name = el.getAttribute('aria-label') ?? el.textContent ?? ''
                            const kind = kinds.find((k) => name.includes(k)) ?? name.trim()

                            return `${kind} ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}×${Math.round(r.height)}`
                        })
                })
            )
            // The same on every page is not yet on the screen: with the Demodaten badge the menu stood at 353–397 px (D-366).
            expect(await controlsPastTheEdge(page), `${path} at ${width}: controls past the header's edge, or icons under 44 px`).toEqual([])
        }

        const home = rows.get('/') ?? []
        // The acceptance shop carries the badge — the row this measures is the widest one there is.
        expect(home.map((row) => row.split(' ')[0]), `the home page's header at ${width}`).toEqual(expect.arrayContaining(['RIMIFY', 'Demodaten', 'Suche', 'Fahrzeug', 'Warenkorb', 'Menü']))

        for (const path of pages.slice(1)) {
            expect(rows.get(path), `${path} at ${width} px against the home page`).toEqual(home)
        }
    }

    // The narrowest phone the shop is laid out for keeps every control on its screen too.
    await page.setViewportSize({ width: 320, height: 640 })
    await open(page, '/')
    expect(await controlsPastTheEdge(page), "the home page at 320: controls past the header's edge, or icons under 44 px").toEqual([])

    await page.setViewportSize({ width: 390, height: 844 })
    await open(page, '/felgenrechner')
    await shot(page.locator('header.site-header').first(), 35, info)
})

/**
 * The header's controls that leave its content box — past the page's side margin, or past the screen — and its icons
 * that gave up their 44 px to fit, each with its edges and size in pixels.
 */
async function controlsPastTheEdge(page: Page): Promise<string[]> {
    return page.evaluate(() => {
        const bar = document.querySelector('header.site-header .sh__bar')
        if (bar === null) return ['no header bar']
        const box = bar.getBoundingClientRect()
        const style = getComputedStyle(bar)
        const left = box.left + parseFloat(style.paddingLeft) - 0.5
        const right = box.right - parseFloat(style.paddingRight) + 0.5

        return [...bar.querySelectorAll(':is(a, button, .demo-badge)')]
            .map((el) => ({ el, r: el.getBoundingClientRect() }))
            .filter(({ el, r }) => r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden')
            .filter(({ el, r }) => r.left < left || r.right > right || (el.matches('.icon-btn, .icon-btn *') && (r.width < 43.5 || r.height < 43.5)))
            .map(({ el, r }) => `${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim()} ${Math.round(r.left)}–${Math.round(r.right)} ${Math.round(r.width)}×${Math.round(r.height)}`)
    })
}

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
