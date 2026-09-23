import { chooseVehicleFromHome, expect, open, screenChecks, test } from './fixtures'

test.describe('mobile shell', () => {
    test('app bar is 56 px, sticky, and carries the wordmark, search, vehicle and menu', async ({ page }) => {
        await open(page, '/')

        const bar = page.locator('header.mbar')
        await expect(bar).toBeVisible()
        const box = await bar.boundingBox()
        expect(Math.round(box?.height ?? 0)).toBe(56)

        await expect(bar.getByRole('link', { name: 'RIMIFY – Startseite' })).toBeVisible()
        await expect(bar.getByRole('button', { name: 'Suche' })).toBeVisible()
        await expect(bar.getByRole('link', { name: 'Fahrzeug wählen' })).toBeVisible()
        await expect(bar.getByRole('button', { name: 'Menü' })).toBeVisible()

        // Mobile WebKit has no mouse wheel; the page scrolls the way a script would.
        await page.evaluate(() => window.scrollTo(0, 600))
        await page.waitForTimeout(300)
        const after = await bar.boundingBox()
        expect(Math.round(after?.y ?? -1)).toBe(0)
        expect(Math.round(after?.height ?? 0)).toBe(56)
        await expect(bar).toHaveClass(/mbar--scrolled/)
    })

    test('menu: every destination, 44 px targets, the current page marked', async ({ page }) => {
        await open(page, '/')
        await page.getByRole('button', { name: 'Menü' }).click()

        const menu = page.getByRole('menu')
        await expect(menu).toBeVisible()

        const rows = menu.locator('a')
        const count = await rows.count()
        expect(count).toBeGreaterThanOrEqual(5)

        for (let i = 0; i < count; i++) {
            const box = await rows.nth(i).boundingBox()
            // 43.5, not 44: a 44px row on a device with a fractional pixel ratio measures
            // 43.99999237 — a rounding artefact of the ruler, not a row anybody can mis-tap.
            expect(box?.height ?? 0, `row ${i}`).toBeGreaterThanOrEqual(43.5)
        }

        // The page you are on is shown and marked, never dropped from the list.
        await expect(menu.locator('a[aria-current="page"]')).toHaveCount(1)
    })

    test('a menu row navigates to the destination', async ({ page }) => {
        await open(page, '/')
        await page.getByRole('button', { name: 'Menü' }).click()
        await page.getByRole('menu').getByRole('menuitem', { name: 'Check' }).click()
        await page.waitForURL('**/rimify-check')
    })

    test('no overflow, no target under 44 px, no text under 12 px, and nothing fixed to the bottom edge', async ({ page }) => {
        await open(page, '/')
        const checks = await screenChecks(page)

        expect(checks.overflow, 'horizontal overflow').toBeLessThanOrEqual(1)
        expect(checks.smallTargets, 'targets under 44 px').toEqual([])
        expect(checks.tinyText, 'text under 12 px').toEqual([])

        // The destinations moved into the header's menu: no bar crosses the bottom of the screen,
        // so the end of the page is the end of the page.
        const fixedAtBottom = await page.evaluate(() => {
            window.scrollTo(0, document.documentElement.scrollHeight)

            return [...document.querySelectorAll('body *')]
                .filter((el) => {
                    const style = getComputedStyle(el)
                    const rect = el.getBoundingClientRect()

                    return style.position === 'fixed' && style.display !== 'none' && rect.height > 0 && rect.bottom >= window.innerHeight - 1 && rect.width > window.innerWidth * 0.8
                })
                .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`)
        })
        expect(fixedAtBottom, 'a bar fixed across the bottom edge').toEqual([])
    })

    test('search sheet: opens full screen with focus in the field, shows results, closes on back', async ({ page }) => {
        await open(page, '/')
        await page.getByRole('button', { name: 'Suche' }).click()

        const dialog = page.getByRole('dialog', { name: 'Suche' })
        await expect(dialog).toBeVisible()
        const field = dialog.getByRole('searchbox', { name: 'Suche' })
        await expect(field).toBeFocused()

        const box = await dialog.boundingBox()
        const vp = page.viewportSize()
        expect(Math.round(box?.width ?? 0)).toBe(vp?.width)
        expect(Math.round(box?.y ?? -1)).toBe(0)

        await expect(dialog.getByText('Direkt zu')).toBeVisible()
        await field.fill('motec')
        await expect(dialog.getByRole('link', { name: /MOTEC/ }).first()).toBeVisible()

        await page.goBack()
        await expect(dialog).toBeHidden()
        expect(new URL(page.url()).pathname).toBe('/')

        // Abbrechen also closes it, and the history is left as it was.
        await page.getByRole('button', { name: 'Suche' }).click()
        await expect(dialog).toBeVisible()
        await dialog.getByRole('button', { name: 'Abbrechen' }).click()
        await expect(dialog).toBeHidden()
        expect(new URL(page.url()).pathname).toBe('/')
    })

    test('search result opens the product', async ({ page }) => {
        await open(page, '/')
        await page.getByRole('button', { name: 'Suche' }).click()
        const dialog = page.getByRole('dialog', { name: 'Suche' })
        await dialog.getByRole('searchbox', { name: 'Suche' }).fill('motec')
        const first = dialog.getByRole('link', { name: /MOTEC/ }).first()
        await expect(first).toBeVisible()
        await first.click()
        await page.waitForURL(/\/felgen(\/|\?)/)
    })

    test('vehicle sheet: opens from the bar with the vehicle, closes on back, offers three actions', async ({ page }) => {
        await chooseVehicleFromHome(page)
        await open(page, '/')

        const icon = page.getByRole('button', { name: /Dein Fahrzeug:/ })
        await expect(icon).toBeVisible()
        await icon.click()

        const sheet = page.getByRole('dialog', { name: 'Dein Fahrzeug' })
        await expect(sheet).toBeVisible()
        await expect(sheet.getByText('BMW')).toBeVisible()
        await expect(sheet.getByRole('link', { name: 'Passende Felgen anzeigen' })).toBeVisible()
        await expect(sheet.getByRole('link', { name: 'Fahrzeug ändern' })).toBeVisible()
        await expect(sheet.getByRole('button', { name: 'Fahrzeug entfernen' })).toBeVisible()

        await page.goBack()
        await expect(sheet).toBeHidden()
        expect(new URL(page.url()).pathname).toBe('/')
    })

    test('a sheet link navigates and the history has no dead entry', async ({ page }) => {
        await chooseVehicleFromHome(page)
        await open(page, '/')
        await page.getByRole('button', { name: /Dein Fahrzeug:/ }).click()
        const sheet = page.getByRole('dialog', { name: 'Dein Fahrzeug' })
        await sheet.getByRole('link', { name: 'Passende Felgen anzeigen' }).click()
        await page.waitForURL('**/felgen')

        await page.goBack()
        await page.waitForURL((url) => url.pathname === '/')
        await expect(sheet).toBeHidden()
    })

    test('PWA files are served', async ({ request }) => {
        const manifest = await request.get('/manifest.webmanifest')
        expect(manifest.ok()).toBe(true)
        const json = (await manifest.json()) as { name: string; display: string; start_url: string; icons: { src: string; purpose: string }[] }
        expect(json.name).toBe('RIMIFY')
        expect(json.display).toBe('standalone')
        expect(json.start_url).toBe('/?source=pwa')
        expect(json.icons.some((i) => i.purpose === 'maskable')).toBe(true)

        for (const icon of json.icons) {
            expect((await request.get(icon.src)).ok(), icon.src).toBe(true)
        }

        /*
         * The worker must arrive as a script. A server that answers `/sw.js` with an HTML error
         * page registers nothing and takes the whole offline story with it — this used to be
         * checked by looking for `text/html` in the body, which now matches the worker's own
         * last-resort offline response. The header is what actually decides it.
         */
        const sw = await request.get('/sw.js')
        expect(sw.ok()).toBe(true)
        expect(sw.headers()['content-type']).toContain('javascript')
        expect(await sw.text()).not.toContain('<!doctype html')

        const offline = await request.get('/offline.html')
        expect(offline.ok()).toBe(true)
        expect(await offline.text()).toContain('Du bist offline')
    })

    test('the service worker caches only assets, fonts and images', async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', 'service workers are inspected on Chromium only')
        await open(page, '/')

        const registered = await page.evaluate(async () => {
            const reg = await navigator.serviceWorker.ready
            const keys = await caches.keys()

            return { scope: reg.scope, caches: keys }
        })
        expect(registered.caches.some((k) => k.startsWith('rmf-'))).toBe(true)

        const cached = await page.evaluate(async () => {
            const urls: string[] = []

            for (const key of await caches.keys()) {
                for (const req of await (await caches.open(key)).keys()) {
                    urls.push(new URL(req.url).pathname)
                }
            }

            return urls
        })

        for (const url of cached) {
            expect(url, 'cached path').toMatch(/^\/(build\/assets|fonts|images|icons)\/|^\/offline\.html$/)
        }
    })
})
