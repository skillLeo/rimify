import { chooseVehicleFromHome, expect, open, screenChecks, test } from './fixtures'

test.describe('mobile shell', () => {
    test('app bar is 56 px, sticky, and carries the wordmark, search and vehicle', async ({ page }) => {
        await open(page, '/')

        const bar = page.locator('header.mbar')
        await expect(bar).toBeVisible()
        const box = await bar.boundingBox()
        expect(Math.round(box?.height ?? 0)).toBe(56)

        await expect(bar.getByRole('link', { name: 'RIMIFY – Startseite' })).toBeVisible()
        await expect(bar.getByRole('button', { name: 'Suche' })).toBeVisible()
        await expect(bar.getByRole('link', { name: 'Fahrzeug wählen' })).toBeVisible()

        // Mobile WebKit has no mouse wheel; the page scrolls the way a script would.
        await page.evaluate(() => window.scrollTo(0, 600))
        await page.waitForTimeout(300)
        const after = await bar.boundingBox()
        expect(Math.round(after?.y ?? -1)).toBe(0)
        expect(Math.round(after?.height ?? 0)).toBe(56)
        await expect(bar).toHaveClass(/mbar--scrolled/)
    })

    test('tab bar: four tabs, 44 px targets, current tab marked, active tab scrolls to top', async ({ page }) => {
        await open(page, '/')

        const nav = page.getByRole('navigation', { name: 'Hauptnavigation' })
        const tabs = nav.locator('a')
        await expect(tabs).toHaveCount(4)
        await expect(tabs.nth(0)).toHaveAttribute('aria-current', 'page')

        for (let i = 0; i < 4; i++) {
            const box = await tabs.nth(i).boundingBox()
            expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
            expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
        }

        const labelSize = await nav.locator('.mtab__label').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
        expect(labelSize).toBeGreaterThanOrEqual(12)

        const navBox = await nav.boundingBox()
        const vp = page.viewportSize()
        expect(Math.round((navBox?.y ?? 0) + (navBox?.height ?? 0))).toBe(vp?.height)

        await page.evaluate(() => window.scrollTo(0, 800))
        await page.waitForTimeout(300)
        expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300)
        await tabs.nth(0).click()
        await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBeLessThan(2)
    })

    test('a tab switch navigates to the destination', async ({ page }) => {
        await open(page, '/')
        await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('link', { name: 'Check' }).click()
        await page.waitForURL('**/rimify-check')
    })

    test('no overflow, no target under 44 px, no text under 12 px, nothing under the bars', async ({ page }) => {
        await open(page, '/')
        const checks = await screenChecks(page)

        expect(checks.overflow, 'horizontal overflow').toBeLessThanOrEqual(1)
        expect(checks.smallTargets, 'targets under 44 px').toEqual([])
        expect(checks.tinyText, 'text under 12 px').toEqual([])

        // At the end of the page, the last control of the document sits above the tab bar, not
        // under it: the page keeps room for the bar.
        const clear = await page.evaluate(() => {
            window.scrollTo(0, document.documentElement.scrollHeight)
            const controls = [...document.querySelectorAll('main a, main button, footer a, footer button')].filter(
                (el) => (el as HTMLElement).offsetParent !== null
            )
            const last = controls[controls.length - 1] as HTMLElement | undefined
            const bar = document.querySelector('.mtab')?.getBoundingClientRect()

            if (!last || !bar) {
                return { ok: true, detail: '' }
            }

            const rect = last.getBoundingClientRect()

            return { ok: rect.bottom <= bar.top + 0.5, detail: `${last.textContent?.trim()} bottom ${Math.round(rect.bottom)} vs bar ${Math.round(bar.top)}` }
        })
        expect(clear.ok, `last control clears the tab bar (${clear.detail})`).toBe(true)
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
        await field.fill('bbs')
        await expect(dialog.getByRole('link', { name: /BBS/ }).first()).toBeVisible()

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
        await dialog.getByRole('searchbox', { name: 'Suche' }).fill('bbs')
        const first = dialog.getByRole('link', { name: /BBS/ }).first()
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

        const sw = await request.get('/sw.js')
        expect(sw.ok()).toBe(true)
        expect(await sw.text()).not.toContain('text/html')

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
