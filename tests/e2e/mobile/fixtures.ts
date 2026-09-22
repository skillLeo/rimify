import { test as base, expect, type Page, type TestInfo } from '@playwright/test'

/**
 * Shared ground for the device lab: the cookie choice already made, a page opener that waits
 * for the phone shell to be up, the vehicle helper, and the measurements every screen is held to.
 */

export const CONSENT_COOKIE = {
    name: 'rmf_consent',
    value: encodeURIComponent(JSON.stringify({ necessary: true, statistics: false, decidedAt: '2026-01-01T00:00:00.000Z' })),
}

export const test = base.extend<{ consent: void }>({
    consent: [
        async ({ context, baseURL }, use) => {
            await context.addCookies([{ ...CONSENT_COOKIE, url: baseURL ?? 'http://127.0.0.1:8000' }])
            await use()
        },
        { auto: true },
    ],
})

export { expect }

/** Open a route and wait until the phone shell has mounted. */
export async function open(page: Page, route = '/'): Promise<void> {
    await page.goto(route, { waitUntil: 'networkidle' })
    await page.locator('.mshell').first().waitFor({ state: 'attached' })
    await page.evaluate(() => document.fonts.ready)
}

export function deviceName(info: TestInfo): string {
    return info.project.name
}

export function isLandscape(page: Page): boolean {
    const vp = page.viewportSize()

    return vp !== null && vp.width > vp.height
}

/**
 * Choose the seeded BMW 330i G20 (5 × 112, well covered by the demo documents) from the homepage's
 * HSN/TSN fields; lands on /felgen.
 */
export async function chooseVehicleFromHome(page: Page, hsn = '0005', tsn = 'CKT'): Promise<void> {
    await open(page, '/')
    await page.getByRole('tab', { name: 'HSN/TSN' }).click()
    await page.getByLabel('HSN (Feld 2.1)').fill(hsn)
    await page.getByLabel('TSN (Feld 2.2)').fill(tsn)
    const button = page.locator('[data-primary]')
    await expect(button).toBeEnabled()
    await button.click()
    await page.waitForURL('**/felgen', { timeout: 30_000 })
    await page.waitForLoadState('networkidle')
}

/** Horizontal overflow, small targets, tiny text and hidden-under-bar items, in one probe. */
export async function screenChecks(page: Page): Promise<{ overflow: number; smallTargets: string[]; tinyText: string[] }> {
    return page.evaluate(() => {
        const vw = document.documentElement.clientWidth
        const overflow = document.documentElement.scrollWidth - vw

        const describe = (el: Element): string => {
            const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean)[0] : ''

            return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '')
        }

        const targetOf = (el: Element): Element => {
            if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
                return el.closest('label') ?? el
            }

            const after = getComputedStyle(el, '::after')

            if (el instanceof HTMLAnchorElement && after.position === 'absolute' && after.content !== 'none' && el.offsetParent) {
                return el.offsetParent
            }

            return el
        }

        const controls = [...document.querySelectorAll('main a, main button, main input, main select, header a, header button, nav a, nav button')]
        const smallTargets = controls
            .filter((el) => {
                const b = targetOf(el).getBoundingClientRect()
                const cs = getComputedStyle(el)

                return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && (b.height < 43.5 || b.width < 43.5) && !el.closest('.visually-hidden')
            })
            .map((el) => {
                const b = targetOf(el).getBoundingClientRect()

                return `${describe(el)} ${Math.round(b.width)}×${Math.round(b.height)}`
            })

        const tinyText: string[] = []
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        let node: Node | null

        while ((node = walker.nextNode())) {
            if (!node.textContent || node.textContent.trim() === '') {
                continue
            }

            const el = node.parentElement

            if (!el || el.closest('script, style, .visually-hidden') || el.closest('svg')) {
                continue
            }

            const cs = getComputedStyle(el)

            if (cs.display === 'none' || cs.visibility === 'hidden') {
                continue
            }

            if (parseFloat(cs.fontSize) < 12) {
                tinyText.push(`${describe(el)} ${cs.fontSize}`)
            }
        }

        return { overflow, smallTargets: [...new Set(smallTargets)].slice(0, 8), tinyText: [...new Set(tinyText)].slice(0, 8) }
    })
}
