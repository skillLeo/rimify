import { expect, test, type Page } from '../fixtures'
import { SHOP } from '../shop'
import { ABNAHME, box, consent, isPhone, open, shot } from './support'

/*
 * The client's list on the homepage: the hero's button (#1), the hero itself (#4), the shelf (#5), the Gutachten
 * highlight (#6), the selector's tabs (#7), the turning wheel (#9), and the two judgement items (#32, #33) whose pictures
 * the operator puts in front of him. Against the acceptance shop; #5's shelf needs four wheels and more, so the e2e
 * shop's full catalogue shows it there.
 */

test.beforeEach(async ({ context }) => {
    await consent(context, ABNAHME)
    await consent(context, SHOP)
})

/** WCAG's contrast of two CSS colours. */
async function contrast(page: Page, selector: string): Promise<number> {
    return page.evaluate((sel) => {
        const el = document.querySelector(sel) as HTMLElement
        const parse = (c: string): number[] => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
        const linear = (v: number): number => {
            const s = v / 255
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
        }
        const lum = ([r = 0, g = 0, b = 0]: number[]): number => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
        const style = getComputedStyle(el)
        const [a, b] = [lum(parse(style.color)), lum(parse(style.backgroundColor))]
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    }, selector)
}

test('without a car the hero\'s button waits in pale blue, focusable, says why, and leads to the first field', { tag: '@kunde-01' }, async ({ page }, info) => {
    await open(page, '/')
    const phone = isPhone(info)
    const button = page.locator(phone ? '.vpanel__go' : '.sel__go').first()

    await expect(button).toHaveText('Fahrzeug wählen')
    await expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(await button.getAttribute('disabled'), 'disabled, not aria-disabled').toBeNull()
    await expect(button).toHaveAccessibleDescription(/Noch kein Fahrzeug gewählt/)

    // The pale blue token, and its label legible on it.
    const tint = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--c-blue-tint').trim())
    const background = await button.evaluate((el) => getComputedStyle(el).backgroundColor)
    const probe = await page.evaluate((c) => {
        const d = document.createElement('div')
        d.style.color = c
        document.body.append(d)
        const rgb = getComputedStyle(d).color
        d.remove()
        return rgb
    }, tint)
    expect(background).toBe(probe)
    expect(await contrast(page, phone ? '.vpanel__go' : '.sel__go')).toBeGreaterThanOrEqual(4.5)

    // Reached with the keyboard like any button.
    await button.focus()
    await expect(button).toBeFocused()

    await shot(page.locator(phone ? '.vpanel' : '.sel').first(), 1, info)

    // A press — Enter on the focused button, as a keyboard user does it — scrolls to the picker and puts the cursor in
    // its first field. (A pointer's click does the same; Playwright's own click refuses an aria-disabled control, so
    // that press is dispatched.)
    // The field itself — the tab's own trigger ends in „-marke“ too.
    const first = page.locator(`${phone ? '.vpanel' : '.sel'} :is(input, select)[id$="-marke"]`).first()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await button.focus()
    await page.keyboard.press('Enter')
    await expect(first).toBeFocused()
    const field = await box(first)
    expect(field.y).toBeGreaterThanOrEqual(0)
    expect(field.y + field.height).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0)

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await button.dispatchEvent('click')
    await expect(first).toBeFocused()
})

test('the hero is no link, has no price, keeps its measurements — and stands whole with the shop empty', { tag: '@kunde-04' }, async ({ page }, info) => {
    const phone = isPhone(info)

    for (const base of [ABNAHME, 'http://127.0.0.1:8012']) {
        await open(page, `${base}/`)
        const hero = page.locator(phone ? '.hero-mobile' : '#h2 .hero__stage').first()

        await expect(page.locator('[data-hero="values"]')).toHaveCount(1)
        await expect(hero.locator('img').first()).toBeVisible()
        await expect(hero.locator('a')).toHaveCount(0)
        expect(await hero.innerText()).not.toContain('€')
        await expect(hero.locator(phone ? '.hero-mobile__spec' : '.hero__spec')).toContainText('ET')
        await expect(hero.locator('[data-callout]').first()).toBeAttached()
    }

    await open(page, '/')
    await shot(page.locator(phone ? '.hero-mobile' : '#h2').first(), 4, info)
})

test('the shelf reads „Meistgekaufte Felgen“ or, before a sale, „Neu im Shop“ — and is absent below four wheels', { tag: '@kunde-05' }, async ({ page }, info) => {
    // The acceptance shop holds one wheel model: no shelf at all, not an empty one.
    await open(page, '/')
    await expect(page.locator('#h5-heading, #h5-title')).toHaveCount(0)

    // A shop with the whole catalogue: the shelf under its one heading, no tabs.
    await open(page, `${SHOP}/`)
    const shelf = page.locator('#h5').first()
    await expect(shelf.locator('h2').first()).toHaveText(/^(Meistgekaufte Felgen|Neu im Shop)$/)
    await expect(shelf.getByRole('tab')).toHaveCount(0)
    expect(await shelf.locator('.tile').count()).toBeGreaterThanOrEqual(4)

    await shelf.scrollIntoViewIfNeeded()
    await shot(shelf, 5, info)
})

const STORY_SIZES = [
    { width: 1440, height: 900 },
    { width: 1440, height: 720 },
    { width: 1280, height: 620 },
    { width: 1024, height: 768 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
    { width: 2560, height: 1080 },
]

test('the highlight lies on the BMW row at every width and height of the matrix', { tag: '@kunde-06' }, async ({ page }, info) => {
    // Seven windows, each a page of its own.
    test.setTimeout(420_000)

    const sizes = isPhone(info) ? [{ width: 390, height: 844 }, { width: 360, height: 640 }] : STORY_SIZES

    for (const size of sizes) {
        await page.setViewportSize(size)
        await open(page, '/')
        const story = page.locator('#h4')
        await story.scrollIntoViewIfNeeded()
        // Past the steps: every stroke drawn.
        await page.evaluate(() => {
            const el = document.querySelector('#h4') as HTMLElement
            window.scrollTo(0, el.offsetTop + el.offsetHeight - window.innerHeight)
        })
        await page.waitForTimeout(600)

        // The desktop's one document marks its BMW row; the phone shows three crops of it, each marking its middle row.
        const pairs = isPhone(info)
            ? await Promise.all((await story.locator('.doc--crop').all()).map(async (crop) => [crop.locator('tbody tr').nth(1), crop.locator('.marker')] as const))
            : [[story.locator('.doc__row--target').first(), story.locator('.marker').first()] as const]
        const at = `${size.width} × ${size.height}`

        expect(pairs.length).toBeGreaterThan(0)

        for (const [rowLocator, markerLocator] of pairs) {
            await rowLocator.scrollIntoViewIfNeeded()
            await page.waitForTimeout(200)
            const row = await box(rowLocator)
            const marker = await box(markerLocator)

            expect(Math.abs(marker.y - row.y), `the highlight is off the row at ${at}`).toBeLessThanOrEqual(1)
            expect(Math.abs(marker.height - row.height), `the highlight is not the row's height at ${at}`).toBeLessThanOrEqual(1)
            expect(marker.x, `the highlight starts left of the row at ${at}`).toBeGreaterThanOrEqual(row.x - 1)
            expect(marker.x + marker.width, `the highlight runs past the row at ${at}`).toBeLessThanOrEqual(row.x + row.width + 1)
        }
    }

    await page.setViewportSize(isPhone(info) ? { width: 390, height: 844 } : { width: 1440, height: 900 })
    await open(page, '/')
    const doc = page.locator('#h4 .doc').first()
    await doc.scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)
    await shot(doc, 6, info)
})

test('switching the selector\'s tabs moves nothing — measured on the interaction — and the room is reserved before any script', { tag: '@kunde-07' }, async ({ page, browser }, info) => {
    const phone = isPhone(info)
    await open(page, '/')
    const panel = page.locator(phone ? '.vpanel' : '.sel').first()
    const tabs = panel.getByRole('tab')
    const count = await tabs.count()
    expect(count).toBeGreaterThanOrEqual(2)

    const before = await box(panel)
    const button = page.locator(phone ? '.vpanel__go' : '.sel__go').first()
    const buttonBefore = await box(button)

    await page.evaluate(() => {
        const w = window as unknown as { __shift: number }
        w.__shift = 0
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                w.__shift += (entry as unknown as { value: number }).value
            }
        }).observe({ type: 'layout-shift', buffered: false })
    })

    for (let round = 0; round < 2; round++) {
        for (let i = 0; i < count; i++) {
            await tabs.nth(i).click()
            await page.waitForTimeout(250)
            const now = await box(panel)
            expect(Math.round(now.height), `the panel changed height on tab ${i + 1}`).toBe(Math.round(before.height))
            expect(Math.round((await box(button)).y), `the button moved on tab ${i + 1}`).toBe(Math.round(buttonBefore.y))
        }
    }

    expect(await page.evaluate(() => (window as unknown as { __shift: number }).__shift), 'layout shift during the tab switches').toBe(0)

    // The same height without JavaScript: the server's frame already reserves the tallest panel.
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize() ?? undefined, userAgent: await page.evaluate(() => navigator.userAgent) })
    const plain = await context.newPage()
    await plain.goto(`${ABNAHME}/`, { waitUntil: 'load' })
    expect(Math.round((await box(plain.locator(phone ? '.vpanel' : '.sel').first())).height)).toBe(Math.round(before.height))
    await context.close()

    await tabs.nth(1).click()
    await page.waitForTimeout(250)
    await shot(panel, 7, info)
})

test('the turning wheel is a published product from the client\'s photographs, and its caption opens it', { tag: '@kunde-09' }, async ({ page, request }, info) => {
    await open(page, '/')
    const band = page.locator('#h7').first()
    await band.scrollIntoViewIfNeeded()

    await expect(band).toBeVisible()
    const caption = band.locator('figcaption a').first()
    await expect(caption).toHaveText(/^Felge im Bild: BORBET DB8GT2/)
    const href = await caption.getAttribute('href')
    expect(href).toBe('/felgen/borbet-db8gt2')
    expect((await request.get(new URL(href ?? '', ABNAHME).toString())).status()).toBe(200)

    // The client's own cut-out, never a picture from anywhere else.
    const src = await band.locator('img').first().getAttribute('src')
    expect(src).toContain('borbet-db8gt2')

    await shot(band.locator('figure').first(), 9, info)
})

test('judgement: the bands alternate a pale surface with white, not every section tinted (pictures for the client, before and after)', { tag: '@kunde-32' }, async ({ page }, info) => {
    await open(page, '/')
    const tones = await page.evaluate(() => {
        const toRgb = (value: string): string => {
            const d = document.createElement('div')
            d.style.color = value
            document.body.append(d)
            const rgb = getComputedStyle(d).color
            d.remove()

            return rgb
        }
        const root = getComputedStyle(document.documentElement)

        return {
            band: toRgb(root.getPropertyValue('--c-band-blue').trim()),
            white: toRgb(root.getPropertyValue('--c-surface').trim()),
            sections: [...document.querySelectorAll('main [data-section]')].map((s) => getComputedStyle(s).backgroundColor),
        }
    })

    // The one pale token and white, alternating: some bands tinted, some white — never every section. A white band paints
    // nothing of its own: it shows the page's white ground through a transparent background.
    const tinted = tones.sections.filter((c) => c === tones.band).length
    const white = tones.sections.filter((c) => c === tones.white || c === 'rgba(0, 0, 0, 0)').length
    expect(tinted, 'no band carries the pale surface').toBeGreaterThan(0)
    expect(tinted, 'every section is tinted').toBeLessThan(tones.sections.length)
    expect(white, 'no white section between the bands').toBeGreaterThan(0)

    // The whole page as a visitor who has scrolled through it sees it. A full-page capture of a page that was never
    // scrolled leaves the sections below the fold blank (they render when they come near, `content-visibility: auto`) —
    // the first pair of phone pictures showed white where the bands are. `cv-off` is the page's own switch for that.
    await page.evaluate(async () => {
        document.documentElement.classList.add('cv-off')

        for (let y = 0; y < document.documentElement.scrollHeight; y += Math.round(window.innerHeight * 0.8)) {
            window.scrollTo(0, y)
            await new Promise((done) => setTimeout(done, 120))
        }

        window.scrollTo(0, 0)
        await new Promise((done) => setTimeout(done, 300))
    })

    // After: the page as it is.
    await shot(page, 32, info, { fullPage: true })

    // Before: the same page with the bands in the neutral grey they had until D-115 — the client's „bit boring“.
    await page.evaluate(() => document.documentElement.style.setProperty('--c-band-blue', '#f3f4f6'))
    await page.screenshot({ path: `docs/qa/shots/kundenliste/32-vorher-${isPhone(info) ? '390' : '1440'}.png`, fullPage: true, animations: 'disabled' })
})

test('judgement: blue marks what is chosen and what can be pressed — counted in the first screen', { tag: '@kunde-33' }, async ({ page }, info) => {
    await open(page, '/')
    const found = await page.evaluate(() => {
        const brand = getComputedStyle(document.documentElement).getPropertyValue('--c-blue').trim()
        const d = document.createElement('div')
        d.style.color = brand
        document.body.append(d)
        const rgb = getComputedStyle(d).color
        d.remove()

        // A blue unit: the outermost element painted in the brand's blue (an icon counts once, not per path).
        const units: Element[] = []
        for (const el of document.querySelectorAll<Element>('body *')) {
            const r = el.getBoundingClientRect()
            if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > window.innerHeight) continue
            const s = getComputedStyle(el)
            const own = el instanceof SVGElement ? s.color === rgb || s.stroke === rgb || s.fill === rgb : s.color === rgb || s.backgroundColor === rgb
            if (!own || units.some((u) => u.contains(el))) continue
            units.push(el)
        }

        // What each unit is: an icon, something to press, the chosen tab or chip, or none of these.
        return units.map((el) => {
            const action = el.closest('a, button, [role="tab"], label, summary')
            // An icon, or a wrapper that holds nothing but its icon.
            const icon = el instanceof SVGElement || el.closest('svg') !== null || (el.querySelector('svg') !== null && (el.textContent ?? '').trim() === '')
            const kind = icon
                ? 'icon'
                : el.closest('[role="tab"][aria-selected="true"], [aria-pressed="true"], [data-state="active"]') !== null
                    ? 'chosen'
                    : action !== null
                        ? 'action'
                        : 'other'
            return { kind, text: (el.textContent ?? '').trim().slice(0, 40), tag: el.tagName.toLowerCase(), cls: el.getAttribute('class') ?? '' }
        })
    })

    // Blue stays the colour of action (the client's #33): icons, the chosen tab and chips, what can be pressed — never
    // a tinted surface that reads as a button, and only a handful in the first screen.
    expect(found.filter((u) => u.kind === 'other'), 'blue on something that is neither an icon nor an action').toEqual([])
    expect(found.length).toBeGreaterThan(0)
    expect(found.length, JSON.stringify(found)).toBeLessThanOrEqual(12)
    await info.attach('blue-units', { body: JSON.stringify(found, null, 2), contentType: 'application/json' })

    await shot(page, 33, info)
})
