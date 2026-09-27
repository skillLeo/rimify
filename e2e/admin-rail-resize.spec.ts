import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { maxFit } from '../resources/js/composables/admin/railResize'
import { signIn } from './bugs/faq-support'
import { openUebersicht, patchCharts } from './bugs/ueb-support'

/*
 * The rail's resize handle, as a person uses it: dragged with the mouse (and the width still there
 * after a reload — it is stored on the account), moved from the keyboard, never squeezing the content
 * under 960 px, never making the page scroll sideways while it moves, collapsing below 200 and
 * opening past 120, absent below 1024 px, and a correct separator for assistive technology.
 *
 * The width is stored on the account: every test leaves it as it found it — 260 px, open.
 *
 * Classic scrollbars: a headless browser draws none, so the fit beside a real 17 px Windows scrollbar
 * is tested on the rule itself (railResize.test.ts, „fits the rail to the page without the
 * scrollbar“). The check by hand, in Chrome on Windows with classic scrollbars (Settings › Accessibility
 * › Visual effects › Always show scrollbars) and the rail at 260 px: at a 1237 px window the rail stays
 * 260 px open; at 1236 px it gives way to 259; at 1208 px it is the icon rail, its toggle saying
 * „Fenster zu schmal für die Seitenleiste“ — and the content never below 960 px on the way.
 */

test.skip(({ isMobile }) => isMobile, 'The rail is resized from 1024 px up.')

const handle = (page: Page) => page.getByRole('separator', { name: 'Seitenleistenbreite' })

async function railWidth(page: Page): Promise<number> {
    return Math.round((await page.locator('.adm-rail').boundingBox())?.width ?? 0)
}

/** The account back to the default rail, through the same endpoint the handle uses. */
async function resetRail(page: Page): Promise<void> {
    await page.evaluate(async () => {
        const token = decodeURIComponent(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(document.cookie)?.[1] ?? '')

        await fetch('/admin/ansicht', {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': token },
            body: JSON.stringify({ rail: 'open', width: 260 }),
        })
    })
}

/** Drags the handle to `x` px from the window's left edge, in steps, returning the widest page overflow seen. */
async function dragTo(page: Page, x: number, steps = 12): Promise<number> {
    const box = await handle(page).boundingBox()

    if (!box) {
        throw new Error('no handle')
    }

    const startX = box.x + box.width / 2
    const y = box.y + box.height / 2
    let overflow = 0

    await page.mouse.move(startX, y)
    await page.mouse.down()

    for (let i = 1; i <= steps; i++) {
        await page.mouse.move(startX + ((x - startX) * i) / steps, y)
        await page.waitForTimeout(16)
        overflow = Math.max(overflow, await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    }

    await page.mouse.up()

    return overflow
}

test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/admin', { waitUntil: 'networkidle' })
    await resetRail(page)
    await page.reload({ waitUntil: 'networkidle' })
})

test.afterEach(async ({ page, isMobile }) => {
    // A skipped test still runs this hook, on a blank page with no cookie to read; a test that closed
    // its page resets through the page it opened instead.
    if (isMobile || page.isClosed()) {
        return
    }

    await resetRail(page)
})

test('a drag snaps to 320, and the width is still there after a reload', async ({ page }) => {
    const saved = page.waitForRequest((request) => request.url().endsWith('/admin/ansicht') && request.method() === 'PATCH' && (request.postData() ?? '').includes('"width":320'))

    await dragTo(page, 324)
    await saved

    await expect(handle(page)).toHaveAttribute('aria-valuenow', '320')
    expect(await railWidth(page)).toBe(320)

    await page.reload({ waitUntil: 'networkidle' })
    expect(await railWidth(page)).toBe(320)
    await expect(page.locator('.adm')).toHaveAttribute('style', /--rail-w:\s*320px/)
})

test('the keyboard moves it by 16 and 48 px, Home and End, and says where it ended', async ({ page }) => {
    await handle(page).focus()

    await page.keyboard.press('ArrowRight')
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '276')

    await page.keyboard.press('Shift+ArrowRight')
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '324')

    await page.keyboard.press('End')
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '400')
    await expect.poll(() => railWidth(page)).toBe(400)

    await page.keyboard.press('Home')
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '260')
    await expect(page.locator('.adm [role="status"]').filter({ hasText: 'Seitenleiste' })).toHaveText('Seitenleiste 260 Pixel breit')

    await page.keyboard.press('Enter')
    await expect(page.locator('.adm')).toHaveAttribute('data-rail', 'collapsed')
    await page.keyboard.press('Enter')
    await expect(page.locator('.adm')).toHaveAttribute('data-rail', 'open')
})

test('at 1280 px the content never drops below 960, and the page never scrolls sideways during a drag', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.reload({ waitUntil: 'networkidle' })

    const overflow = await dragTo(page, 520, 16)

    expect(overflow, 'the page scrolled sideways during the drag').toBeLessThanOrEqual(0)
    // As wide as the page leaves room for beside 960 px of content (its scrollbar not counted).
    expect(await railWidth(page)).toBe(maxFit(await page.evaluate(() => document.querySelector<HTMLElement>('.adm')?.clientWidth ?? 0)))
    expect(Math.round((await page.locator('.adm-work').boundingBox())?.width ?? 0)).toBeGreaterThanOrEqual(960)

    // A window without room even for 232 px beside the content: the rail is collapsed, not squeezed.
    await page.setViewportSize({ width: 1150, height: 900 })
    await expect(page.locator('.adm')).toHaveAttribute('data-rail', 'collapsed')
    expect(Math.round((await page.locator('.adm-work').boundingBox())?.width ?? 0)).toBeGreaterThanOrEqual(960)
    // Nothing to pull at: no handle, from the first frame of a fresh load as well.
    await expect(handle(page)).toBeHidden()
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.locator('.adm')).toHaveAttribute('data-rail-forced', '')
    await expect(handle(page)).toBeHidden()
})

test('where the stored width does not fit, the toggle says so and opens at the widest that does', async ({ page }) => {
    await page.evaluate(async () => {
        const token = decodeURIComponent(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(document.cookie)?.[1] ?? '')

        await fetch('/admin/ansicht', {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': token },
            body: JSON.stringify({ rail: 'collapsed', width: 400 }),
        })
    })
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.reload({ waitUntil: 'networkidle' })

    const fit = maxFit(await page.evaluate(() => document.querySelector<HTMLElement>('.adm')?.clientWidth ?? 0))
    const toggle = page.locator('.adm-rail__toggle')

    await toggle.hover()
    // (reka repeats the sentence for assistive technology inside the tooltip, so: contains.)
    await expect(page.locator('.adm-tooltip')).toContainText(`Fenster zu schmal für 400 px, öffnet mit ${fit} px`)

    await toggle.click()
    await expect(page.locator('.adm')).toHaveAttribute('data-rail', 'open')
    await expect.poll(() => railWidth(page)).toBe(fit)

    // The stored width is still the person's: a wide window shows all 400 px of it.
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.reload({ waitUntil: 'networkidle' })
    expect(await railWidth(page)).toBe(400)
})

test('the last width survives the tab closing within the second', async ({ page, context }) => {
    await handle(page).focus()
    await page.keyboard.press('ArrowRight') // 276, sent at once
    await page.keyboard.press('ArrowRight') // 292, still waiting for its second
    await page.close({ runBeforeUnload: true })

    const next = await context.newPage()

    await next.setViewportSize({ width: 1440, height: 900 })
    await expect.poll(async () => {
        await next.goto('/admin', { waitUntil: 'networkidle' })

        return railWidth(next)
    }).toBe(292)

    await resetRail(next)
})

test('below 200 px it collapses; pulled out past 120 px it opens at the width it had', async ({ page }) => {
    await dragTo(page, 330)
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '330')

    await dragTo(page, 150)
    await expect(page.locator('.adm')).toHaveAttribute('data-rail', 'collapsed')
    expect(await railWidth(page)).toBe(64)

    await dragTo(page, 170)
    await expect(page.locator('.adm')).toHaveAttribute('data-rail', 'open')
    expect(await railWidth(page)).toBe(330)
})

test('while it is dragged, no chart reaches past its card', async ({ page }) => {
    // The charts' answer is the server's own with a month of revenue and four weeks of verdicts put
    // in (an empty shop draws no chart); nothing is written.
    await patchCharts(page, (charts) => {
        charts.revenue = {
            points: Array.from({ length: 30 }, (_, i) => ({ key: `d${i}`, label: `${String(i + 1).padStart(2, '0')}.09.2026`, value: 10_000 + i * 900, text: `${100 + i * 9},00 €` })),
            previous: null,
            total: '4.215,00 €',
        }
        charts.verdicts = {
            series: [
                { key: 'PERMITTED', label: 'Zulässig' },
                { key: 'UNKNOWN', label: 'Unbekannt' },
            ],
            weeks: Array.from({ length: 4 }, (_, i) => ({ key: `w${i}`, label: `KW ${36 + i}`, range: '', values: { PERMITTED: 20 + i, UNKNOWN: 4 }, total: 24 + i })),
            since: '01.09.2026',
        }
    })
    await openUebersicht(page)
    await expect(page.locator('.lc__svg').first()).toBeVisible()

    const box = await handle(page).boundingBox()

    if (!box) {
        throw new Error('no handle')
    }

    const y = box.y + box.height / 2

    await page.mouse.move(box.x + box.width / 2, y)
    await page.mouse.down()
    await page.mouse.move(400, y, { steps: 8 })

    // Mid-drag: the charts have not measured again; each drawing must stay inside its card.
    const spill = await page.evaluate(() =>
        [...document.querySelectorAll<SVGElement>('.lc__svg, .sb__svg')].map((svg) => {
            const card = svg.closest('section')?.getBoundingClientRect()

            return card ? Math.round(svg.getBoundingClientRect().right - card.right) : 0
        })
    )

    await page.mouse.up()
    expect(spill.length, 'rig: the Übersicht draws at least one chart').toBeGreaterThan(0)
    expect(Math.max(0, ...spill), 'a chart reached past its card during the drag').toBe(0)
})

test('a double-click puts it back at 260', async ({ page }) => {
    await dragTo(page, 372)
    await handle(page).dblclick()

    await expect(handle(page)).toHaveAttribute('aria-valuenow', '260')
    await expect.poll(() => railWidth(page)).toBe(260)
})

test('there is no handle below 1024 px', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 })
    await page.reload({ waitUntil: 'networkidle' })

    await expect(handle(page)).toBeHidden()
})

test('the handle is a correct separator for assistive technology', async ({ page }) => {
    const results = await new AxeBuilder({ page }).include('.adm-handle').analyze()

    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
    await expect(handle(page)).toHaveAttribute('aria-orientation', 'vertical')
    await expect(handle(page)).toHaveAttribute('aria-valuemin', '232')
    await expect(handle(page)).toHaveAttribute('aria-valuemax', '400')
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '260')
})
