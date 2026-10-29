import { readFileSync } from 'node:fs'
import { BASE, MAY_WRITE, VISITOR } from './instance'
import { consent, evidence, expect, open, phone, test } from './fixtures'
import { CARS, PRODUCT, add, box, onSize, withCar } from './shop'

/*
 * Batch D — the frame and the pages beside the shop: the client's #10, #12, #13, #26, #28 and #29, as a visitor, on the
 * instance RIMIFY_URL names. Ported from e2e/kundenliste/chrome.spec.ts and seiten.spec.ts. The contact form is filled
 * and stopped at its save point on the preview — a message sent there would stand in the client's admin for good.
 */

test.use({ storageState: VISITOR })

test.beforeEach(async ({ page }) => {
    await consent(page)
})

test('the footer links the Felgenrechner and the Blog; both open, and the Blog leads to its articles', { tag: '@kunde-10' }, async ({ page, request }, info) => {
    await open(page, '/')
    const footer = page.locator('footer').last()
    const rechner = footer.getByRole('link', { name: 'Felgenrechner' })
    const blog = footer.getByRole('link', { name: 'Blog', exact: true })

    await expect(rechner).toHaveCount(1)
    expect((await request.get(new URL((await rechner.getAttribute('href')) ?? '', BASE).toString())).status()).toBe(200)

    await expect(blog).toHaveCount(1)
    await evidence(footer, 10, info)
    await blog.click()
    await expect(page).toHaveURL(/\/blog$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible()

    // Two guides and nothing else (your answer of 15.10.2026 §2): every article listed opens.
    const articles = page.getByRole('main').getByRole('heading', { level: 2 }).getByRole('link')
    expect(await articles.count()).toBeGreaterThan(0)

    for (const link of await articles.all()) {
        const article = await link.getAttribute('href')
        expect((await request.get(new URL(article ?? '', BASE).toString())).status(), `${article} does not open`).toBe(200)
    }
})

test('a contact form: name, e-mail, subject, message, the car ticked, a privacy line — no captcha', { tag: '@kunde-12' }, async ({ page }, info) => {
    // The car the visitor chose comes along, ticked.
    await withCar(page, 'e46')
    await open(page, '/kontakt')

    const form = page.locator('.kon__form')
    await expect(form.locator('#kon-name')).toBeVisible()
    await expect(form.locator('#kon-email')).toBeVisible()
    await expect(form.locator('#kon-subject')).toBeVisible()
    await expect(form.locator('#kon-message')).toBeVisible()
    await expect(form.locator('.kon__vehicle input')).toBeChecked()
    await expect(form.locator('.kon__vehicle')).toContainText(CARS.e46.label)
    await expect(form.locator('.kon__privacy a')).toHaveAttribute('href', '/rechtliches/datenschutz')
    // The honeypot is out of reach; no third party's captcha anywhere on the page.
    await expect(form.locator('#kon-leer')).toHaveAttribute('tabindex', '-1')
    expect(await page.locator('iframe, script[src*="captcha"], script[src*="turnstile"]').count()).toBe(0)

    await form.locator('#kon-name').fill('Jana Beispiel')
    await form.locator('#kon-email').fill('jana@example.com')
    await form.locator('#kon-subject').fill('Frage zur DB8GT2')
    await form.locator('#kon-message').fill('Passt die Felge auch mit Winterreifen auf mein Auto?')
    await expect(form.getByRole('button', { name: 'Nachricht senden' })).toBeEnabled()

    await evidence(form, 12, info)

    // The save point. On an instance of ours the message goes through and is kept for the team; on the client's preview
    // it is not sent — his admin keeps what his customers write, not what a test wrote.
    if (MAY_WRITE) {
        await page.waitForTimeout(3_200)
        await form.getByRole('button', { name: 'Nachricht senden' }).click()
        await expect(page.locator('.kon__done')).toContainText('deine Nachricht ist angekommen')
    } else {
        info.annotations.push({ type: 'gestoppt', description: 'Formular ausgefüllt und nicht gesendet: auf der Vorschau wird nichts gespeichert, was bleibt.' })
    }
})

test('the basket sits in the phone\'s header left of the menu, with its count, 44 px to tap', { tag: '@kunde-13' }, async ({ page }, info) => {
    await withCar(page, 'e90', PRODUCT)
    await onSize(page, 19, 'Schwarz matt')
    await add(page)

    if (phone(info)) {
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

        await evidence(page.locator('header.site-header').first(), 13, info)
    } else {
        const cart = page.locator('header.site-header .sh__cart').first()
        await expect(cart).toBeVisible()
        await expect(cart.locator('.sh__badge')).toHaveText(/^\d+$/)
        await evidence(page.locator('header.site-header').first(), 13, info)
    }
})

test('no button opens a mail program: every „Schreib uns“ leads to the form, and the Impressum gives the address as text', { tag: '@kunde-26' }, async ({ page, problems }, info) => {
    // Fifteen pages, each opened whole: more than the default minute on the preview from here, at the pace a person watches.
    test.setTimeout(240_000)
    problems.expected(/^404 .*\/gibt-es-nicht$/, 'the 404 page is opened on purpose, to see that it has no mail link either')
    // Chromium also writes the 404 document to the console, without its address; any other 404 still shows as a response.
    // HTTP/2 (the preview) sends no reason phrase, HTTP/1.1 (our own instance) does: „404 ()“ or „404 (Not Found)“.
    problems.expected(/^console: Failed to load resource: the server responded with a status of 404 \((Not Found)?\)$/, 'the 404 page opened on purpose, as Chromium logs it')

    // The shop's pages and every legal page the footer links.
    await open(page, '/')
    const legal = await page
        .locator('footer')
        .last()
        .getByRole('link')
        .evaluateAll((links) => links.map((a) => new URL((a as HTMLAnchorElement).href).pathname).filter((p) => p.startsWith('/rechtliches/')))

    expect(legal.length, 'the footer links no legal page').toBeGreaterThan(0)

    for (const path of ['/', '/felgen', PRODUCT, '/warenkorb', '/kontakt', '/faq', '/felgenrechner', '/rimify-check', ...new Set(legal), '/gibt-es-nicht']) {
        // Each page whole before the next — its component imported and mounted, not just loaded: `load` comes before the
        // page's own chunks, and a page left then has WebKit cancel them and report „Importing a module script failed“
        // from the page being left (reproduced on the preview, 16.10.2026).
        await open(page, path)
        expect(await page.locator('a[href^="mailto:"], [formaction^="mailto:"]').count(), `${path} has a mail link`).toBe(0)
    }

    // The address as text, where the seller's details are on record; the preview has none yet (a go-live item, EIGENE-FUNDE
    // 126), and its Impressum says so — „noch nicht angegeben“ for the test environment's operator, the marker „[E-MAIL]“
    // for the seller (D-319) — then that is recorded, never passed off as an address.
    await open(page, '/rechtliches/impressum')
    const impressum = await page.locator('main').innerText()

    if (/E-Mail\s*(noch nicht angegeben|\[E-MAIL\])/.test(impressum)) {
        info.annotations.push({ type: 'offen', description: 'Impressum: E-Mail-Adresse noch nicht angegeben – die Verkäuferdaten fehlen hier noch (Go-live, EIGENE-FUNDE 126).' })
    } else {
        expect(impressum, 'the Impressum gives no e-mail address (§ 5 DDG)').toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/)
    }

    await open(page, '/kontakt')
    const write = page.locator('main').getByRole('link', { name: /Schreib uns/ })

    if ((await write.count()) > 0) {
        await expect(write.first()).toHaveAttribute('href', /\/kontakt/)
    }

    await open(page, '/')
    await evidence(page.locator('.hero-help, .home-hero__help, .hero__help').first(), 26, info)
})

test('RIMIFY-Check: one car, one wheel, one answer with its Auflagen, document and page — „Jetzt kaufen“ with the tyres beside it, and nothing to buy where it does not fit', { tag: '@kunde-28' }, async ({ page }, info) => {
    /** The wheel chosen on the check page as a visitor does it: each list in turn, each answered by the server. */
    async function wheel(inch: 18 | 19): Promise<void> {
        // The brand as the shop spells it: „Borbet“ on the preview (the client's brand), „BORBET“ on our instance.
        for (const [select, label] of [['#chk-brand', 'BORBET'], ['#chk-wheel', 'DB8GT2'], ['#chk-finish', 'Schwarz matt']] as const) {
            const field = page.locator(select)

            // The list fills after the choice before it: wait for the option, as selectOption({ label }) would.
            const option = field.locator('option', { hasText: new RegExp(`^\\s*${label}\\s*$`, 'i') }).first()
            await expect(option, `no „${label}“ in ${select}`).toBeAttached()
            const value = (await option.getAttribute('value')) ?? ''

            if ((await field.inputValue()) !== value) {
                await field.selectOption(value)
                await page.waitForLoadState('networkidle')
            }
        }

        const size = page.locator('#chk-size option', { hasText: new RegExp(`\\b${inch}\\b`) }).first()
        await page.locator('#chk-size').selectOption((await size.getAttribute('value')) ?? '')
        await page.waitForLoadState('networkidle')
        await expect(page.locator('#antwort')).toBeVisible()
        await expect(page.locator('#antwort .chk__size')).toContainText(String(inch))
    }

    // The X3 and the 19-inch rim: an answer that sells, with the Komplettrad beside the button.
    await withCar(page, 'x3', '/rimify-check')
    await wheel(19)

    const answer = page.locator('#antwort')
    await expect(answer.locator('.rcheck-panel__vehicle')).toHaveText(/^Mit Auflagen freigegeben für /)
    await expect(answer.locator('.fit__overview')).toContainText('Das verlangt das Gutachten')
    await expect(answer.locator('.fit__doc')).toBeVisible()
    await expect(answer.locator('.fit__pdf a').first()).toHaveText(/^\s*Gutachten öffnen \((Beispiel, )?PDF(, Seite \d+)?\)\s*$/)
    await expect(answer.locator('.chk__go')).toHaveText('Jetzt kaufen')
    await expect(answer.locator('.chk__go')).toBeEnabled()
    await expect(answer.locator('.chk__buy .bmc-tile', { hasText: 'Kompletträder' })).toBeVisible()

    await evidence(answer, 28, info)

    // The E46 and the 18-inch rim: no answer we can stand behind, so nothing to buy — the refusal is the product.
    await withCar(page, 'e46', '/rimify-check')
    await wheel(18)
    await expect(answer.locator('.chk__go')).toHaveCount(0)
    await expect(answer.locator('.chk__nosale')).toContainText('bis sie hinterlegt sind, bieten wir die Felge dafür nicht an')
})

test('one footer exists, the same on every page and width, right at 390 × 844 and 360 × 640', { tag: '@kunde-29' }, async ({ page }, info) => {
    // The duplicate is deleted, not hidden: one footer component in the code that runs there.
    for (const layout of ['resources/js/Layouts/AppLayout.vue', 'resources/js/Layouts/MobileLayout.vue'].map((f) => readFileSync(f, 'utf8'))) {
        expect(layout).toContain("import SiteFooter from '../Components/Chrome/SiteFooter.vue'")
    }

    const sizes = phone(info) ? [{ width: 390, height: 844 }, { width: 360, height: 640 }] : [{ width: 1440, height: 900 }]

    for (const size of sizes) {
        await page.setViewportSize(size)

        for (const path of ['/', '/felgen', '/kontakt']) {
            await open(page, path)
            await expect(page.locator('footer')).toHaveCount(1)
            await expect(page.locator('footer').first().locator('.footer__col').first()).toBeVisible()
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
            expect(overflow, `${path} overflows at ${size.width}`).toBeLessThanOrEqual(0)
        }
    }

    await page.setViewportSize(phone(info) ? { width: 390, height: 844 } : { width: 1440, height: 900 })
    await open(page, '/')
    await evidence(page.locator('footer').first(), 29, info)
})
