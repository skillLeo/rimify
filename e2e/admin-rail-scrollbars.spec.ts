import { expect, test, type Page } from './fixtures'
import { maxFit } from '../resources/js/composables/admin/railResize'
import { signIn } from './bugs/faq-support'
import { resetRail } from './bugs/rail-support'

/*
 * The rail with classic scrollbars — the ones Windows draws, which take width. Playwright hides every
 * scrollbar in a headless browser (`--hide-scrollbars`); without that flag Chromium draws them as it
 * does on this system, so the fit beside a real scrollbar and a navigation that starts to scroll are
 * checked here as they are seen. (The check by hand in other browsers is in admin-rail-resize.spec.ts
 * and docs/qa/BUGS.md.)
 *
 * The width is stored on the account; a test that moves the rail puts back the default, 260 px, open.
 */

test.skip(({ isMobile }) => isMobile, 'The rail is resized from 1024 px up.')
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } })

async function edge(page: Page, selector: string): Promise<number> {
    const box = await page.locator(selector).first().boundingBox()

    return box ? Math.round(box.x + box.width) : 0
}

test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 })
    await signIn(page)
})

// The default back for the next test — by request, and after a red test too (e2e/teardown.ts: cleanup never navigates).
test.afterEach(async ({ context, isMobile }) => {
    if (!isMobile) {
        await resetRail(context)
    }
})

test('nothing in the rail moves when the navigation starts to scroll', async ({ page }) => {
    // Tall enough for the whole navigation (it has grown past 1100 px since the rig was first written, past 1600 px
    // with Einstellungen › Verkäufer & Versand on 01.10.2026, and past 1900 px with Katalog › Reifen on 19.10.2026).
    await page.setViewportSize({ width: 1440, height: 2400 })
    await page.goto('/admin', { waitUntil: 'networkidle' })
    const tall = { item: await edge(page, '.adm-rail__item'), count: await edge(page, '.adm-rail__count') }
    expect(await page.evaluate(() => document.querySelector<HTMLElement>('.adm-rail__nav')!.scrollHeight > document.querySelector<HTMLElement>('.adm-rail__nav')!.clientHeight), 'rig: at 2400 px high the navigation fits').toBe(false)

    await page.setViewportSize({ width: 1440, height: 600 })
    await page.goto('/admin', { waitUntil: 'networkidle' })
    expect(await page.evaluate(() => document.querySelector<HTMLElement>('.adm-rail__nav')!.scrollHeight > document.querySelector<HTMLElement>('.adm-rail__nav')!.clientHeight), 'rig: at 600 px high it scrolls').toBe(true)

    expect({ item: await edge(page, '.adm-rail__item'), count: await edge(page, '.adm-rail__count') }).toEqual(tall)
})

test('the shell the layout measures never changes width with the rail — no loop between them', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'networkidle' })
    const shell = () => page.evaluate(() => document.querySelector<HTMLElement>('.adm')!.clientWidth)
    const before = await shell()
    const seen = new Set<number>([before])
    const handle = page.getByRole('separator', { name: 'Seitenleistenbreite' })
    const box = (await handle.boundingBox())!

    // A drag to the widest and back, then collapsed and open again: the rail and the content change,
    // the page's height and its scrollbar with them — the shell's width does not (the root's gutter).
    await page.mouse.move(box.x + 4, 400)
    await page.mouse.down()

    for (const x of [320, 400, 300, 150, 240]) {
        await page.mouse.move(x, 400, { steps: 4 })
        seen.add(await shell())
    }

    await page.mouse.up()
    await page.locator('.adm-rail__toggle').click()
    seen.add(await shell())
    await page.locator('.adm-rail__toggle').click()
    seen.add(await shell())

    expect([...seen]).toEqual([before])
})

test('beside a page scrollbar the content keeps 960 px, and the rail gives way before it', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'networkidle' })
    const scrollbar = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth)
    expect(scrollbar, 'rig: a classic scrollbar takes width').toBeGreaterThan(0)

    // The narrowest window with room for 260 px of rail beside 960 px of content and the scrollbar.
    const fits = 960 + 260 + scrollbar

    for (const [width, rail] of [
        [fits, 260],
        [fits - 1, 259],
        [960 + 232 + scrollbar, 232],
    ] as const) {
        await page.setViewportSize({ width, height: 900 })
        await page.reload({ waitUntil: 'networkidle' })
        const shell = await page.evaluate(() => document.querySelector<HTMLElement>('.adm')!.clientWidth)

        // The app's rule on the shell it measured, and the number worked out from the scrollbar: the same.
        expect(maxFit(shell), `rule at ${width} px`).toBeGreaterThanOrEqual(rail)
        expect(Math.round((await page.locator('.adm-rail').boundingBox())?.width ?? 0), `at ${width} px`).toBe(rail)
        expect(Math.round((await page.locator('.adm-work').boundingBox())?.width ?? 0), `the content at ${width} px`).toBeGreaterThanOrEqual(960)
    }

    // One pixel less: no room for 232 — the icon rail, and its toggle says why.
    await page.setViewportSize({ width: 960 + 232 + scrollbar - 1, height: 900 })
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.locator('.adm')).toHaveAttribute('data-rail', 'collapsed')
    await expect(page.locator('.adm-rail__toggle')).toHaveAttribute('aria-disabled', 'true')
    expect(Math.round((await page.locator('.adm-work').boundingBox())?.width ?? 0)).toBeGreaterThanOrEqual(960)
})
