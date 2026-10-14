import { PREVIEW, VISITOR } from './instance'
import { consent, contrast, evidence, expect, open, phone, test } from './fixtures'

/*
 * Batch A — header and hero: the client's #1 to #7, as a visitor, on the instance RIMIFY_URL names.
 *
 * Written after looking: the controls these tests hold on to are the ones the exploration printed (the hero is the
 * region „Felgen, die an dein Auto dürfen.“; its button „Fahrzeug wählen“ carries aria-disabled and aria-describedby;
 * the desktop has three tabs, the phone two and a button to photograph the Fahrzeugschein; the homepage's sections are
 * #h2 hero, #h3 promises, #h4 story, #h6 find, #h7 Komplettrad, #h8 rim code, #h10 guides, #h11 service).
 */

test.use({ storageState: VISITOR })

test.beforeEach(async ({ page }) => {
    await consent(page)
})

const HERO = 'Felgen, die an dein Auto dürfen.'
const STORY = 'Wir lesen das Gutachten. Du bekommst die Antwort.'

test('the hero\'s „Fahrzeug wählen“ waits in pale blue: not disabled, focusable, says why, and leads to the first field', { tag: '@kunde-01' }, async ({ page }, info) => {
    await open(page, '/')

    const hero = page.getByRole('region', { name: HERO })
    const button = hero.getByRole('button', { name: 'Fahrzeug wählen' })

    await expect(button).toBeVisible()
    await expect(button).toHaveAttribute('aria-disabled', 'true')
    await expect(button, 'the button is disabled outright: a keyboard cannot reach it').not.toHaveAttribute('disabled')
    expect(await contrast(button), 'its label is hard to read').toBeGreaterThanOrEqual(4.5)

    // It says why it waits, to a screen reader as to the eye.
    const why = page.locator(`[id="${await button.getAttribute('aria-describedby')}"]`)
    await expect(why).toContainText('Noch kein Fahrzeug gewählt')

    await evidence(button, 1, info)

    // Reachable by keyboard, and a press leads to where the car is chosen: the first field takes the focus.
    await button.focus()
    await expect(button).toBeFocused()
    await button.press('Enter')
    await expect(hero.getByLabel('Marke', { exact: true })).toBeFocused()
})

test('the header is 72 px on a computer and 64 px on a phone, and a jump lands with its heading in view', { tag: '@kunde-02' }, async ({ page }, info) => {
    await open(page, '/')

    const header = page.getByRole('banner')
    // The bar itself: on the preview a ribbon stands above it and is no part of the header's height.
    const bar = header.locator(phone(info) ? '.mbar__row' : '.sh__bar').first()

    expect(Math.round((await bar.boundingBox())?.height ?? 0)).toBe(phone(info) ? 64 : 72)
    await evidence(header, 2, info)

    await open(page, '/#h4')
    await page.waitForTimeout(500)

    const heading = page.getByRole('heading', { name: STORY })
    const headerBottom = await header.evaluate((el) => el.getBoundingClientRect().bottom)
    const headingTop = await heading.evaluate((el) => el.getBoundingClientRect().top)

    expect(headingTop, 'the heading the jump leads to lies under the header').toBeGreaterThanOrEqual(headerBottom - 1)
    await expect(heading).toBeInViewport()
})

test('nothing stands above the header, and what the strip said is still on the page', { tag: '@kunde-03' }, async ({ page }, info) => {
    await open(page, '/')

    const header = page.getByRole('banner')
    const above = await header.evaluate((el) => {
        const top = el.getBoundingClientRect().top
        const over = top <= 0 ? [] : [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().bottom <= top + 1 && e.getBoundingClientRect().height > 0 && e.children.length === 0)

        return { top: Math.round(top), texts: over.map((e) => (e.textContent ?? '').trim()).filter(Boolean) }
    })

    if (PREVIEW) {
        // The preview says that it is one, in a ribbon: the only thing allowed above the header there.
        expect(above.texts.join(' ') || 'Testumgebung', `something other than the preview's ribbon stands above the header: ${above.texts.join(' | ')}`).toMatch(/Testumgebung|Vorschau/)
    } else {
        expect(above.top, `something stands above the header: ${above.texts.join(' | ')}`).toBe(0)
    }

    // What the strip carried: the two promises, and the help line with the hours. (Until D-219 the phone called the
    // section „Was RIMIFY zusagt“; a release from before it still does, so both names are taken.)
    const promises = page.getByRole('region', { name: /^Was (wir zusagen|RIMIFY zusagt)$/ })
    await expect(promises).toContainText('Versand aus Deutschland')
    await expect(promises).toContainText('Gutachten zu jeder Felge')
    await expect(page.getByRole('region', { name: HERO })).toContainText(/Schreib uns\s*·\s*Mo–Fr/)

    await evidence(header, 3, info)
})

test('the hero\'s photograph is no link and names no price; its measurements stay', { tag: '@kunde-04' }, async ({ page }, info) => {
    await open(page, '/')

    const hero = page.getByRole('region', { name: HERO })
    const photo = hero.locator('img').first()

    await expect(photo).toBeVisible()
    await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { message: 'the hero photograph did not load' }).toBe(true)
    expect(await photo.evaluate((img) => img.closest('a') !== null), 'the photograph is a link').toBe(false)
    // The one link the hero carries is the contact line.
    await expect(hero.getByRole('link')).toHaveCount(1)
    await expect(hero.getByRole('link')).toHaveAttribute('href', /\/kontakt$/)
    await expect(hero).not.toContainText('€')
    // The photograph's own measurements: at least one leader, and the line under it.
    await expect(hero.locator('[data-callout]').first()).toBeAttached()
    await expect(page.locator('[data-hero="values"]')).toHaveCount(1)

    await evidence(hero, 4, info)
})

test('the shelf is „Meistgekaufte Felgen“ or, before a sale, „Neu im Shop“ — and absent below four wheels', { tag: '@kunde-05' }, async ({ page }, info) => {
    // How many wheel models the shop sells, from the shop itself: the listing without a car, its product addresses.
    await open(page, '/felgen')
    const models = new Set(
        await page.getByRole('main').getByRole('link').evaluateAll((links) =>
            links.map((a) => new URL((a as HTMLAnchorElement).href).pathname).filter((p) => /^\/felgen\/[^/]+$/.test(p)),
        ),
    )

    await open(page, '/')

    const shelf = page.getByRole('heading', { name: /^(Meistgekaufte Felgen|Neu im Shop)$/ })

    if (models.size < 4) {
        await expect(shelf, `a shelf with ${models.size} wheel model(s) in the shop`).toHaveCount(0)
        await expect(page.getByText(/Felgen mit den meisten Freigaben/)).toHaveCount(0)
        info.annotations.push({ type: 'gezeigt', description: `${models.size} Felgenmodell(e) im Shop: die Reihe fehlt, wie verlangt – ihre Überschrift ist hier nicht zu sehen` })
        // The place it would stand: between the Gutachten story and „Nach Zollgröße“.
        await evidence(page.getByRole('region', { name: 'Nach Zollgröße' }), 5, info)
    } else {
        await expect(shelf).toHaveCount(1)
        await shelf.scrollIntoViewIfNeeded()
        await evidence(shelf.locator('xpath=ancestor::section[1]'), 5, info)
    }
})

test('the highlight lies on its row of the Gutachten at every window size, the short ones included', { tag: '@kunde-06' }, async ({ page }, info) => {
    test.setTimeout(300_000)

    const sizes = phone(info)
        ? [{ width: 390, height: 844 }, { width: 360, height: 640 }]
        : [{ width: 1440, height: 900 }, { width: 1440, height: 720 }, { width: 1280, height: 620 }, { width: 1024, height: 768 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 2560, height: 1080 }]

    for (const size of sizes) {
        await page.setViewportSize(size)
        await open(page, '/')

        const story = page.getByRole('region', { name: STORY })
        // Past the steps, so every stroke is drawn.
        await story.evaluate((el: HTMLElement) => window.scrollTo(0, el.offsetTop + el.offsetHeight - window.innerHeight))
        await page.waitForTimeout(700)

        // One document on the desktop, marking its target row; three crops of it on the phone, each marking its middle row.
        const pairs = phone(info)
            ? (await story.locator('.doc--crop').all()).map((crop) => [crop.locator('tbody tr').nth(1), crop.locator('.marker')] as const)
            : [[story.locator('.doc__row--target').first(), story.locator('.marker').first()] as const]

        expect(pairs.length, `no marked row at ${size.width} × ${size.height}`).toBeGreaterThan(0)

        for (const [row, marker] of pairs) {
            await row.scrollIntoViewIfNeeded()
            await page.waitForTimeout(250)
            const [r, m] = [await row.boundingBox(), await marker.boundingBox()]
            const at = `${size.width} × ${size.height}`

            expect(r && m, `the row or its highlight is not drawn at ${at}`).toBeTruthy()
            expect(Math.abs((m?.y ?? 0) - (r?.y ?? 0)), `the highlight is off its row at ${at}`).toBeLessThanOrEqual(1.5)
            expect(Math.abs((m?.height ?? 0) - (r?.height ?? 0)), `the highlight is not the row's height at ${at}`).toBeLessThanOrEqual(1.5)
        }
    }

    await page.setViewportSize(phone(info) ? { width: 390, height: 844 } : { width: 1440, height: 900 })
    await open(page, '/')
    const doc = page.getByRole('region', { name: STORY }).locator('.doc').first()
    await doc.scrollIntoViewIfNeeded()
    await doc.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 120))
    await page.waitForTimeout(1_000)
    // On the phone the picture is the window: WebKit drew nothing into a picture of the element alone (the section is
    // laid out only while it is on screen), and a blank picture proves nothing.
    await evidence(phone(info) ? page : doc, 6, info)
})

test('switching between the ways to name a car moves nothing — measured on the press, not on the load', { tag: '@kunde-07' }, async ({ page }, info) => {
    await open(page, '/')

    const hero = page.getByRole('region', { name: HERO })
    const tabs = hero.getByRole('tab')
    const count = await tabs.count()
    const button = hero.getByRole('button', { name: 'Fahrzeug wählen' })

    expect(count, 'fewer than two ways to name a car').toBeGreaterThanOrEqual(2)

    const before = await button.boundingBox()

    await page.evaluate(() => {
        const w = window as unknown as { __shift: number }
        w.__shift = 0
        // WebKit has no layout-shift entries: there the button's own position, read after every press, is the measure.
        if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    w.__shift += (entry as unknown as { value: number }).value
                }
            }).observe({ type: 'layout-shift', buffered: false })
        }
    })

    for (let round = 0; round < 2; round++) {
        for (let i = 0; i < count; i++) {
            await tabs.nth(i).click()
            await page.waitForTimeout(300)
            expect(Math.round((await button.boundingBox())?.y ?? -1), `the button moved on „${await tabs.nth(i).innerText()}“`).toBe(Math.round(before?.y ?? -2))
        }
    }

    expect(await page.evaluate(() => (window as unknown as { __shift: number }).__shift), 'layout shift while switching').toBe(0)

    await tabs.nth(1).click()
    await page.waitForTimeout(300)
    await evidence(hero.locator(':scope').first(), 7, info)
})
