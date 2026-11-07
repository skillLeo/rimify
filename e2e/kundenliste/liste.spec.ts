import { expect, test, type Locator, type Page } from '../fixtures'
import { SHOP } from '../shop'
import { ABNAHME, CARS, box, consent, isPhone, newVisitor, onSize, open, shot, shotAround, withCar } from './support'

/*
 * The client's list on the listing: the car in the address (#8, with #27's filters), the compare control beside the
 * badge on a phone (#22), the filter column's scrolling (#24), filters without a car (#30) and the phone's filter sheet
 * (#31). Against the acceptance shop; #24 needs a column long enough to scroll, which the e2e shop's full catalogue has.
 */

test.beforeEach(async ({ context }) => {
    await consent(context, ABNAHME)
    await consent(context, SHOP)
})

/** The cards and their verdict badges as a visitor reads them. */
async function answers(page: Page): Promise<string[]> {
    return page.locator('main .tile').evaluateAll((tiles) =>
        tiles.map((t) => `${t.querySelector('.tile__name, h3, h2')?.textContent?.trim() ?? ''} | ${t.querySelector('.verdict')?.textContent?.replace(/\s+/g, ' ').trim() ?? ''}`),
    )
}

test('the car is in the address: a clean window, no JavaScript and back/forward all show the same answer', { tag: '@kunde-08' }, async ({ page, browser }, info) => {
    await withCar(page, 'e46')
    await expect(page).toHaveURL(new RegExp(`fahrzeug=${CARS.e46.key}`))
    const mine = await answers(page)
    expect(mine.length).toBeGreaterThan(0)
    expect(mine.join(' ')).toContain('Auflagen')

    // The canonical link names the same address.
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/felgen\\?fahrzeug=${CARS.e46.key}$`))

    // 1 · The link in a clean private window: no cookie, the same wheels and the same answers.
    const clean = await browser.newContext({ viewport: page.viewportSize() ?? undefined, userAgent: await page.evaluate(() => navigator.userAgent) })
    await consent(clean, ABNAHME)
    const other = await clean.newPage()
    await open(other, page.url())
    expect(await answers(other)).toEqual(mine)
    await clean.close()

    // 2 · Without JavaScript: the server's own frame carries the cards and their answers.
    const plain = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize() ?? undefined, userAgent: await page.evaluate(() => navigator.userAgent) })
    const noJs = await plain.newPage()
    await noJs.goto(page.url(), { waitUntil: 'load' })
    expect(await answers(noJs)).toEqual(mine)
    await plain.close()

    // 3 · Back and forward move between cars, and the next click stays with the car on screen.
    await withCar(page, 'e90')
    const e90 = await answers(page)
    await page.goBack({ waitUntil: 'networkidle' })
    await expect(page).toHaveURL(new RegExp(`fahrzeug=${CARS.e46.key}`))
    expect(await answers(page)).toEqual(mine)
    await expect(page.locator('h1')).toContainText('3er (E46)')
    await page.goForward({ waitUntil: 'networkidle' })
    await expect(page).toHaveURL(new RegExp(`fahrzeug=${CARS.e90.key}`))
    expect(await answers(page)).toEqual(e90)
    await page.goBack({ waitUntil: 'networkidle' })
    await page.locator('main .tile a').first().click()
    await page.waitForURL(/\/felgen\/borbet-db8gt2/)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toContainText('320i Limousine (Demo)')
    await expect(page).toHaveURL(new RegExp(`fahrzeug=${CARS.e46.key}`))

    // The picture: the E46's listing as its address opens it — the car named in the bar, its answers on the cards.
    await withCar(page, 'e46')
    await shot(page, 8, info)
})

test('a card stays a card with a real Gutachten\'s wording: its Auflagen are counted, their text one press away, never cut', { tag: '@kunde-22' }, async ({ page }) => {
    // The E46 at 19 Zoll carries paragraphs — one of them the whole table of 27 tyre pairings. Printed on the card, a
    // card stood 2.500 px tall (found in this suite's own picture of #8, 13.10.2026).
    await withCar(page, 'e46')

    const view = page.viewportSize() ?? { width: 0, height: 0 }

    for (const tile of await page.locator('main .tile').all()) {
        await expect(tile.locator('.verdict').first()).toContainText('Mit Auflagen')
        await expect(tile.locator('[data-conditions="counted"]')).toHaveText(/^\d+ Auflagen und Hinweise aus dem Gutachten – im Wortlaut auf der Produktseite\.$/)
        // No sentence cut short, and none of the long ones on the card.
        await expect(tile).not.toContainText('Reifenkombinationen')
        expect((await box(tile)).height, 'the card is taller than the window').toBeLessThanOrEqual(view.height)
    }

    // One press away: the product page prints every one of them, for the size they belong to.
    await page.locator('main .tile a').first().click()
    await page.waitForURL(/\/felgen\/borbet-db8gt2/)
    await page.waitForLoadState('networkidle')
    await onSize(page, 19, 'Schwarz matt')
    await expect(page.locator('#auflagen')).toContainText('Reifenkombinationen')
})

test('a size or a brand chosen first stays chosen when the car is chosen after it', { tag: '@kunde-27' }, async ({ page, context }, info) => {
    await context.clearCookies()
    await consent(context, ABNAHME)

    for (const [filter, expected] of [['zoll=19', /zoll=19/], ['marke=borbet', /marke=BORBET|marke=borbet/i]] as const) {
        await open(page, `/felgen?${filter}`)
        await open(page, `/felgen-suchen?marke=BMW&modell=${encodeURIComponent(CARS.e90.model)}`)
        await page.getByRole('button', { name: new RegExp(CARS.e90.label.replace(/[()]/g, '\\$&')) }).first().click()
        await page.waitForURL(/\/felgen\?/)
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveURL(expected)
        await expect(page).toHaveURL(new RegExp(`fahrzeug=${CARS.e90.key}`))
        await newVisitor(page, context)
    }

    await withCar(page, 'e90', '/felgen?zoll=19')
    await shot(page.locator(isPhone(info) ? '.plp__bar' : '.plp__side').first(), 27, info)
})

test('without a car every filter works, no tile carries a verdict, and one sentence says why', { tag: '@kunde-30' }, async ({ page, context }, info) => {
    await context.clearCookies()
    await consent(context, ABNAHME)
    await open(page, '/felgen')

    await expect(page.locator('main .verdict')).toHaveCount(0)
    await expect(page.locator('.plp__notice')).toContainText('Wähle dein Fahrzeug, um nur Felgen zu sehen, die dafür freigegeben sind.')
    // The acceptance set is sold with the test payment: the listing says so, as its product page does — never „noch nicht“.
    await expect(page.locator('main')).toContainText('bestellen geht hier nur mit der Testzahlung')
    await expect(page.locator('main')).not.toContainText('bestellen kannst du noch nicht')

    const before = await page.locator('main .tile').count()
    await open(page, '/felgen?zoll=18')
    const after = await page.locator('main .tile').count()
    expect(after).toBeGreaterThan(0)
    expect(after).toBeLessThanOrEqual(before)
    await expect(page.locator('main .verdict')).toHaveCount(0)

    // The whole of it in one picture: the sentence that says why, the filter chosen, and the tiles it leaves — no verdict.
    await shotAround(page, [page.locator('.plp__notice'), isPhone(info) ? page.locator('main .tile').first() : page.locator('.plp__layout')], 30, info)
})

/** Every filter group with its options and counts, as the panel shows them: `Durchmesser (Zoll) · 19 · 30`. */
async function filterOptions(panel: Locator): Promise<string[]> {
    return panel.locator('.fpanel').first().evaluate((el) =>
        [...el.querySelectorAll('.fpanel__group, .fpanel__opt--entry')].flatMap((group) => {
            const legend = group.querySelector('.fpanel__legend')?.textContent?.trim() ?? ''
            const options = group.matches('label') ? [group] : [...group.querySelectorAll('.fpanel__opt')]

            return options.map((o) => `${legend} · ${o.querySelector('.fpanel__label')?.textContent?.trim() ?? ''} · ${o.querySelector('.fpanel__count')?.textContent?.trim() ?? ''}`)
        }),
    )
}

test('the phone\'s filter is a sheet from below with the desktop\'s options and counts', { tag: '@kunde-31' }, async ({ page, browser }, info) => {
    const url = `${SHOP}/felgen`

    // The desktop's column, read once.
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await consent(desktop, SHOP)
    const wide = await desktop.newPage()
    await open(wide, url)
    const column = await filterOptions(wide.locator('.plp__side'))
    await desktop.close()

    expect(column.length).toBeGreaterThan(10)

    if (!isPhone(info)) {
        await open(page, url)
        await shot(page.locator('.plp__side').first(), 31, info)
        return
    }

    await open(page, url)
    await page.locator('.plp__bar-btn').click()
    const sheet = page.locator('.plp__sheet')
    await expect(sheet).toBeVisible()

    // From below: its bottom edge on the window's.
    const s = await box(sheet)
    expect(Math.round(s.y + s.height)).toBeGreaterThanOrEqual((page.viewportSize()?.height ?? 0) - 1)

    // The same groups, the same options in the same order, the same counts.
    expect(await filterOptions(sheet)).toEqual(column)

    await shot(sheet, 31, info)
})

test('the phone\'s menu opens „Felgen“ on the desktop\'s groups (his „still not done“, D-413)', { tag: '@kunde-31' }, async ({ page }, info) => {
    if (!isPhone(info)) {
        await open(page, `${SHOP}/`)
        await page.locator('.nav__trigger').click()
        await expect(page.locator('.mega')).toBeVisible()
        return
    }

    await open(page, `${SHOP}/`)
    await page.getByRole('button', { name: /^Menü/ }).click()
    const menu = page.locator('.mainmenu')
    await menu.getByRole('menuitem', { name: 'Felgen', exact: true }).click()
    await expect(menu.getByText('Nach Marke', { exact: true })).toBeVisible()
    await expect(menu.getByText('Nach Größe', { exact: true })).toBeVisible()
    await expect(menu.getByRole('menuitem', { name: /Alle Felgen ansehen/ })).toHaveAttribute('href', '/felgen')
    await shot(menu, 31, info)
})

test('on a phone the compare control never covers the badge, and neither is cut, at 320, 360, 390 and 414', { tag: '@kunde-22' }, async ({ page }, info) => {
    const widths = isPhone(info) ? [320, 360, 390, 414] : [1440]

    for (const width of widths) {
        await page.setViewportSize({ width, height: 844 })
        await withCar(page, 'e46')

        for (const tile of await page.locator('main .tile').all()) {
            const badge = tile.locator('.verdict').first()
            const compare = tile.locator('.tile__compare, label:has(.tile__compare-input)').first()
            if ((await badge.count()) === 0 || (await compare.count()) === 0) continue

            const b = await box(badge)
            const c = await box(compare)
            const t = await box(tile)
            const overlap = !(c.x + c.width <= b.x || b.x + b.width <= c.x || c.y + c.height <= b.y || b.y + b.height <= c.y)
            expect(overlap, `the compare control covers the badge at ${width}`).toBe(false)
            for (const [name, r] of [['badge', b], ['compare', c]] as const) {
                expect(r.x, `the ${name} is cut at ${width}`).toBeGreaterThanOrEqual(t.x - 1)
                expect(r.x + r.width, `the ${name} is cut at ${width}`).toBeLessThanOrEqual(t.x + t.width + 1)
            }
            const clipped = await badge.evaluate((el) => el.scrollWidth > el.clientWidth + 1)
            expect(clipped, `the badge's words are cut at ${width}`).toBe(false)
        }
    }

    await page.setViewportSize(isPhone(info) ? { width: 390, height: 844 } : { width: 1440, height: 900 })
    await withCar(page, 'e46')
    await shot(page.locator('main .tile').first(), 22, info)
})

test('the wheel over the filter column reaches its end and, from the page\'s end, its start, at 1440 and 1920, with a steady gutter, under the header token', { tag: '@kunde-24' }, async ({ page }, info) => {
    if (isPhone(info)) {
        // Below 1200 px the filters live in the sheet (#31); the bar under the header follows the same token.
        await open(page, `${SHOP}/felgen`)
        const bar = page.locator('.plp__bar').first()
        await page.evaluate(() => window.scrollTo(0, 500))
        await page.waitForTimeout(300)
        const top = await bar.evaluate((el) => getComputedStyle(el).top)
        expect(top).toBe('64px')
        await shot(bar, 24, info)
        return
    }

    // By hand, as a person does: scripted `scrollTop` could never see what he reported, the wheel over a column at its own 0 (D-412).
    for (const width of [1440, 1920]) {
        await page.setViewportSize({ width, height: 900 })
        await open(page, `${SHOP}/felgen`)
        const column = page.locator('.plp__side').first()

        expect(await column.evaluate((el) => getComputedStyle(el).scrollbarGutter)).toBe('stable')
        expect(await column.evaluate((el) => getComputedStyle(el).top)).toBe(`${72 + 16}px`)

        await page.mouse.move(width - 300, 450)
        await expect.poll(async () => {
            for (let i = 0; i < 10; i++) await page.mouse.wheel(0, 400)
            await page.waitForTimeout(300)
            return page.evaluate(() => window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 1)
        }, { timeout: 30_000 }).toBe(true)

        // The state he describes, or this proves nothing: the column's start above the window, at its own 0.
        const atEnd = await page.evaluate(() => window.scrollY)
        const pushed = await box(column)
        expect(pushed.y, `the column is not pushed up at the page's end at ${width}`).toBeLessThan(72)

        await page.mouse.move(pushed.x + pushed.width / 2, Math.max(pushed.y, 120) + 60)
        for (let i = 0; i < 20; i++) await page.mouse.wheel(0, -100)
        await page.waitForTimeout(400)

        expect(await page.evaluate(() => window.scrollY), `the wheel over the column moved nothing at ${width}`).toBeLessThan(atEnd)
        const c = await box(column)
        expect(c.y, `the column's start is out of reach at ${width}`).toBeGreaterThanOrEqual(72)
        expect(c.y + c.height, `the column runs past the window at ${width}`).toBeLessThanOrEqual(900)

        // Down inside it again, to its last filter, where it is longer than the window.
        const over = await column.evaluate((el) => el.scrollHeight - el.clientHeight)
        await page.mouse.move(c.x + c.width / 2, c.y + 60)
        for (let i = 0; i < Math.ceil(over / 100) + 2; i++) await page.mouse.wheel(0, 100)
        await page.waitForTimeout(400)
        const end = await box(column)
        const l = await box(column.locator('label, button').last())
        expect(l.y + l.height, `the last option is not reachable at ${width}`).toBeLessThanOrEqual(end.y + end.height + 1)
    }

    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, `${SHOP}/felgen`)
    const column = page.locator('.plp__side').first()
    await column.evaluate((el) => {
        el.scrollTop = el.scrollHeight
    })
    await shot(column, 24, info)
})
