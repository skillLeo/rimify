import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { signIn } from './bugs/faq-support'

/*
 * The rail's resize handle, as a person uses it: dragged with the mouse (and the width still there
 * after a reload — it is stored on the account), moved from the keyboard, never squeezing the content
 * under 960 px, never making the page scroll sideways while it moves, collapsing below 200 and
 * opening past 120, absent below 1024 px, and a correct separator for assistive technology.
 *
 * The width is stored on the account: every test leaves it as it found it — 260 px, open.
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
    // A skipped test still runs this hook, on a blank page with no cookie to read.
    if (isMobile) {
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
    const room = (await page.evaluate(() => document.querySelector<HTMLElement>('.adm')?.clientWidth ?? 0)) - 960
    expect(await railWidth(page)).toBe(Math.min(400, room))
    expect(Math.round((await page.locator('.adm-work').boundingBox())?.width ?? 0)).toBeGreaterThanOrEqual(960)

    // A window without room even for 232 px beside the content: the rail is collapsed, not squeezed.
    await page.setViewportSize({ width: 1150, height: 900 })
    await expect(page.locator('.adm')).toHaveAttribute('data-rail', 'collapsed')
    expect(Math.round((await page.locator('.adm-work').boundingBox())?.width ?? 0)).toBeGreaterThanOrEqual(960)
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
