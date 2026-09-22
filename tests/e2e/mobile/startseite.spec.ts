import { chooseVehicleFromHome, expect, isLandscape, open, screenChecks, test } from './fixtures'

test.describe('Startseite/Mobile', () => {
    test('fold: h1 and the whole panel with its button, primary action in the thumb zone', async ({ page }) => {
        await open(page, '/')

        await expect(page.locator('h1')).toHaveCount(1)
        const h1 = page.locator('#h2 h1')
        await expect(h1).toBeVisible()

        const button = page.locator('[data-primary]')
        await expect(button).toHaveText('Fahrzeug wählen')
        await expect(button).toBeDisabled()

        const vp = page.viewportSize()

        // The fold check is specified at 390 × 844 (home.md H2). A landscape phone (390 px tall)
        // holds the h1 and the scan button only; the panel is one scroll away. A 667 px iPhone SE
        // cannot hold h1, subline and the whole panel; there the tabs must still be in view and
        // the button reachable.
        if (isLandscape(page)) {
            await button.scrollIntoViewIfNeeded()
            await expect(button).toBeInViewport()

            return
        }

        if ((vp?.height ?? 0) < 800) {
            await expect(page.getByRole('tab', { name: 'HSN/TSN' })).toBeInViewport()
            await button.scrollIntoViewIfNeeded()
            await expect(button).toBeInViewport()

            return
        }

        const box = await button.boundingBox()
        const bar = await page.locator('.mtab').boundingBox()
        expect(box, 'button box').not.toBeNull()
        expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual((bar?.y ?? vp?.height ?? 0) + 0.5)
        // Thumb zone: the button's centre sits in the bottom 40 % of the viewport.
        expect((box?.y ?? 0) + (box?.height ?? 0) / 2).toBeGreaterThanOrEqual((vp?.height ?? 0) * 0.6)
    })

    test('screen checks: overflow, targets, text size', async ({ page }) => {
        await open(page, '/')
        const checks = await screenChecks(page)
        expect(checks.overflow).toBeLessThanOrEqual(1)
        expect(checks.smallTargets).toEqual([])
        expect(checks.tinyText).toEqual([])
    })

    test('sections in order, one column, never two bands touching, one dark band', async ({ page }) => {
        await open(page, '/')

        const ids = await page.locator('main section[data-section]').evaluateAll((els) => els.map((el) => el.id))
        expect(ids[0]).toBe('h2')
        expect(ids).toContain('h3')
        expect(ids).toContain('h4')
        expect(ids).toContain('h5')
        expect(ids).toContain('h8')
        expect(ids[ids.length - 1]).toBe('h11')
        expect([...ids].sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))).toEqual(ids)

        const tones = await page.locator('main section[data-section]').evaluateAll((els) =>
            els.map((el) => (el.classList.contains('dark') ? 'dark' : el.classList.contains('band') ? 'band' : 'surface'))
        )
        for (let i = 1; i < tones.length; i++) {
            expect(`${tones[i - 1]}→${tones[i]}`).not.toBe('band→band')
        }
        expect(tones.filter((t) => t === 'dark').length).toBeLessThanOrEqual(1)
    })

    test('promise row has four items with the confirmed titles', async ({ page }) => {
        await open(page, '/')
        const items = page.locator('#h3 li')
        await expect(items).toHaveCount(4)
        await expect(items.nth(0)).toContainText('Garantierte Passgenauigkeit')
        await expect(items.nth(3)).toContainText('Express-Versand aus Deutschland')
    })

    test('scan button opens the camera input', async ({ page }) => {
        await open(page, '/')
        const input = page.locator('#h2 input[type="file"]')
        await expect(input).toHaveAttribute('accept', 'image/*')
        await expect(input).toHaveAttribute('capture', 'environment')
        await expect(page.getByRole('button', { name: 'Fahrzeugschein fotografieren' })).toBeVisible()
    })

    test('HSN/TSN: the live count lands in the button and leads to the listing; back shows the vehicle', async ({ page }) => {
        await open(page, '/')
        await page.getByRole('tab', { name: 'HSN/TSN' }).click()

        const hsn = page.getByLabel('HSN (Feld 2.1)')
        const tsn = page.getByLabel('TSN (Feld 2.2)')
        await expect(hsn).toHaveAttribute('inputmode', 'numeric')
        await expect(tsn).toHaveAttribute('autocapitalize', 'characters')

        await hsn.fill('0005')
        await expect(tsn).toBeFocused()
        // The BMW 330i G20: 5 × 112, a car the demo documents cover well.
        await tsn.fill('CKT')

        await expect(page.locator('#h2')).toContainText(/Felgen mit Gutachten für/)
        const button = page.locator('[data-primary]')
        await expect(button).toHaveText(/\d+ passende Felgen anzeigen/)
        await button.click()
        await page.waitForURL('**/felgen', { timeout: 30_000 })

        // Back lands on the homepage again. Inertia restores a popstate page from its history
        // snapshot (the props from before the choice), so the vehicle state is asserted on a
        // fresh visit, which is what the server now renders for this session.
        await page.goBack()
        await page.waitForURL((url) => url.pathname === '/')

        await open(page, '/')
        await expect(page.locator('#h2')).toContainText('Dein Fahrzeug')
        await expect(page.locator('#h2 h1')).toContainText('Felgen, die an deinen BMW')
        await expect(page.locator('[data-primary]')).toHaveText(/passende Felgen anzeigen/)
    })

    test('Marke → Modell → Fahrzeug through native selects', async ({ page }) => {
        await open(page, '/')

        // `exact`: the tab panel is labelled "Marke & Modell" and would match a substring query.
        const make = page.getByLabel('Marke', { exact: true })
        const model = page.getByLabel('Modell', { exact: true })
        const vehicle = page.getByLabel('Fahrzeug', { exact: true })

        await expect(model).toBeDisabled()
        await make.selectOption({ index: 1 })
        await expect(model).toBeEnabled()
        await expect.poll(() => model.locator('option').count()).toBeGreaterThan(1)

        await model.selectOption({ index: 1 })
        await expect(vehicle).toBeEnabled()
        await expect.poll(() => vehicle.locator('option').count()).toBeGreaterThan(1)

        const firstEnabled = await vehicle.locator('option:not([disabled])').nth(1).getAttribute('value')
        expect(firstEnabled).not.toBeNull()
        await vehicle.selectOption(firstEnabled as string)

        const button = page.locator('[data-primary]')
        await expect(button).toBeEnabled()
        await expect(button).toHaveText(/passende Felgen anzeigen|Passende Felgen anzeigen|Keine Felgen/)
    })

    test('an ambiguous key pair asks, never guesses', async ({ page }) => {
        await open(page, '/')
        await page.getByRole('tab', { name: 'HSN/TSN' }).click()
        await page.getByLabel('HSN (Feld 2.1)').fill('1860')
        await page.getByLabel('TSN (Feld 2.2)').fill('AAS')

        const radios = page.locator('#h2 input[type="radio"]')
        await expect(radios.first()).toBeVisible()
        expect(await radios.count()).toBeGreaterThanOrEqual(2)
        await expect(page.getByRole('button', { name: 'Dieses Fahrzeug wählen' })).toBeDisabled()
        await expect(page.locator('[data-primary]')).toBeDisabled()
        expect(new URL(page.url()).pathname).toBe('/')

        await radios.first().check()
        await page.getByRole('button', { name: 'Dieses Fahrzeug wählen' }).click()
        await expect(page.locator('[data-primary]')).toBeEnabled()
        await expect(page.locator('#h2')).toContainText(/Felgen mit Gutachten für|noch keine Felge/)
    })

    test('an unknown key pair keeps the input and offers three ways forward', async ({ page }) => {
        await open(page, '/')
        await page.getByRole('tab', { name: 'HSN/TSN' }).click()
        await page.getByLabel('HSN (Feld 2.1)').fill('9999')
        await page.getByLabel('TSN (Feld 2.2)').fill('ZZZ')

        await expect(page.locator('#h2')).toContainText('haben wir kein Fahrzeug gefunden')
        await expect(page.getByLabel('HSN (Feld 2.1)')).toHaveValue('9999')
        await expect(page.getByRole('button', { name: 'Nochmal prüfen' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Über Marke & Modell wählen' })).toBeVisible()
        // The third route: the e-mail while the client has published no phone number (R-09).
        const write = page.locator('#h2').getByRole('link', { name: /^Schreib uns: / })
        await expect(write).toBeVisible()
        await expect(write).toHaveAttribute('href', /^mailto:/)
        await expect(page.locator('[data-primary]')).toBeDisabled()
    })

    test('the HSN/TSN help is a sheet that closes on back', async ({ page }) => {
        await open(page, '/')
        await page.getByRole('tab', { name: 'HSN/TSN' }).click()
        await page.getByRole('button', { name: 'Wo finde ich HSN und TSN?' }).click()

        const sheet = page.getByRole('dialog', { name: 'Wo finde ich HSN und TSN?' })
        await expect(sheet).toBeVisible()
        await expect(sheet.locator('svg').first()).toBeVisible()

        await page.goBack()
        await expect(sheet).toBeHidden()
        expect(new URL(page.url()).pathname).toBe('/')
    })

    test('popular row: a shelf that scrolls sideways, tabs that reload only the row', async ({ page }) => {
        await open(page, '/')

        const track = page.locator('#h5 .mshelf__track').first()
        await expect(track).toBeVisible()
        const scrolls = await track.evaluate((el) => el.scrollWidth > el.clientWidth + 10)
        expect(scrolls).toBe(true)
        expect(await page.locator('#h5 .tile').count()).toBeGreaterThanOrEqual(4)
        // A narrow no-break space joins the number and the €, as format.ts writes it.
        await expect(page.locator('#h5 .tile__price').first()).toHaveText(/^ab \d{1,3}(\.\d{3})*,\d{2}[\s ]€\s?pro Felge$/)

        // Scoped to the row: the calculator teaser has a tab named "Neu" as well.
        const neu = page.locator('#h5').getByRole('tab', { name: 'Neu' })
        await neu.click()
        await expect.poll(() => new URL(page.url()).searchParams.get('beliebt')).toBe('neu')
        await expect(neu).toHaveAttribute('aria-selected', 'true')
        expect(await page.locator('#h5 .tile').count()).toBeGreaterThanOrEqual(1)
    })

    test('with a vehicle every tile carries a verdict; without one, none does', async ({ page }) => {
        await open(page, '/')
        expect(await page.locator('#h5 .verdict').count()).toBe(0)

        await chooseVehicleFromHome(page)
        await open(page, '/')
        const tiles = await page.locator('#h5 .tile').count()
        expect(tiles).toBeGreaterThan(0)
        expect(await page.locator('#h5 .tile .verdict').count()).toBe(tiles)
        await expect(page.locator('#h5 h2')).toContainText('Beliebt für deinen BMW')
    })

    test('size shelf and brand grid lead into the listing', async ({ page }) => {
        await open(page, '/')
        const size = page.locator('#h6 a.size-tile').first()
        await expect(size).toHaveAttribute('href', /\/felgen\?zoll=\d+/)
        // `felgen()` joins the number and the noun with a narrow no-break space; one wheel is *1 Felge*.
        await expect(size).toContainText(/\d+\sFelgen?\b/)
        const brand = page.locator('#h6 .brand-grid__link').first()
        await expect(brand).toHaveAttribute('href', /\/felgen\?marke=/)
        // Named by its content, not an aria-label, so the visible count is part of the name (WCAG 2.5.3).
        await expect(brand).not.toHaveAttribute('aria-label')
        await expect(brand).toHaveAccessibleName(/^\S.* \d+\sFelgen?$/)
    })

    test('hero frame: two callouts over the wheel, the key line beneath, no placeholder in the code fields', async ({ page }) => {
        await open(page, '/')

        const frame = page.locator('#h2 .hero-frame')
        await expect(frame).toHaveCount(1)
        await expect(frame.locator('.callout')).toHaveCount(2)
        await expect(frame.locator('.callout__label').nth(0)).toContainText(/größe|breite|durchmesser/i)
        await expect(frame.locator('.callout__label').nth(1)).toContainText(/einpress/i)
        await expect(page.locator('#h2 .hero-mobile__rest')).toContainText(/LK .+ · MLB .+mm$/)

        // A symbolic picture names no product: no brand, no price, no link; the sentence says what it is.
        const symbolic = page.locator('#h2 .hero-mobile__symbolic')
        if ((await symbolic.count()) === 1) {
            await expect(symbolic).toHaveText('Symbolbild – Werte einer Beispielkonfiguration')
            await expect(page.locator('#h2 .hero-mobile a')).toHaveCount(0)
            await expect(page.locator('#h2 .hero-mobile')).not.toContainText(/pro Felge/)
        } else {
            await expect(page.locator('#h2 .hero-mobile__caption')).toContainText(/pro Felge/)
            await expect(frame).toHaveAttribute('href', /^\/felgen\//)
        }

        await page.getByRole('tab', { name: 'HSN/TSN' }).click()
        await expect(page.getByLabel('HSN (Feld 2.1)')).not.toHaveAttribute('placeholder')
        await expect(page.getByLabel('TSN (Feld 2.2)')).not.toHaveAttribute('placeholder')
    })

    test('Gutachten crops: three, whole headings, one tyre size per row, the marked row in the middle', async ({ page }) => {
        await open(page, '/')

        const crops = page.locator('#h4 .doc--crop')
        await expect(crops).toHaveCount(3)
        await crops.first().scrollIntoViewIfNeeded()

        const overflowing = await crops.evaluateAll((figures) =>
            figures.flatMap((f) => [...f.querySelectorAll('th, td')].filter((c) => c.scrollWidth > c.clientWidth + 1).map((c) => c.textContent?.trim() ?? ''))
        )
        expect(overflowing, 'cells that ellipsise').toEqual([])

        const marked = crops.nth(2).locator('tbody tr').nth(1)
        await expect(marked).toContainText('BMW')
        await expect(marked).toContainText('346C')
        await expect(marked).toContainText('225/40 R18')
        await expect(marked).not.toContainText(',')
        await expect(crops.nth(2).locator('.doc__stamp')).toContainText('Freigegeben')
    })

    test('dark band: the cut-out at 240 px, no lifestyle photograph', async ({ page }) => {
        await open(page, '/')

        const band = page.locator('#h7')
        test.skip((await band.count()) === 0, 'no Kompletträder on this catalogue')

        await band.scrollIntoViewIfNeeded()
        await expect(band).toContainText('Kompletträder – montiert und gewuchtet.')
        await expect(band.locator('.home-komplett__photo')).toHaveCount(0)

        const wheel = band.locator('.komplett-wheel')
        await expect(wheel).toHaveCount(1)
        const box = await wheel.boundingBox()
        expect(Math.round(box?.width ?? 0)).toBeLessThanOrEqual(240)
        expect(Math.round(box?.width ?? 0)).toBe(Math.round(box?.height ?? 0))
        await expect(wheel.locator('img')).toHaveAttribute('src', /hero-wheel/)
    })

    test('guides are one link each, into the Ratgeber', async ({ page }) => {
        await open(page, '/')
        const links = page.locator('#h10 a')
        const count = await links.count()
        expect(count).toBeGreaterThan(0)
        // Title and reading time only: no teaser, no box on the band.
        await expect(page.locator('#h10 .guide__teaser')).toHaveCount(0)

        for (let i = 0; i < count; i++) {
            await expect(links.nth(i)).toHaveAttribute('href', /^\/ratgeber\/[a-z0-9-]+$/)
            await expect(links.nth(i).locator('.guide__title')).toBeVisible()
        }

        const href = await links.first().getAttribute('href')
        const response = await page.request.get(href as string)
        expect(response.ok(), href as string).toBe(true)
    })

    test('calculator renders the worked example and the honest line', async ({ page }) => {
        await open(page, '/')
        const section = page.locator('#h8')
        await expect(section).toContainText('Was ändert sich mit der neuen Größe?')
        await expect(section).toContainText('Rechenwerte ersetzen kein Gutachten')
        await expect(section.locator('svg').first()).toBeVisible()
    })

    test('service block: real contact data and five questions', async ({ page }) => {
        await open(page, '/')
        // The client has published no phone and no WhatsApp: the e-mail is the one link, never an invented number.
        await expect(page.locator('#h11 a[href^="tel:"]')).toHaveCount(0)
        await expect(page.locator('#h11 a[href*="wa.me"]')).toHaveCount(0)
        await expect(page.locator('#h11 a[href^="mailto:"]')).toHaveCount(1)
        await expect(page.locator('#h11 .accordion__item')).toHaveCount(5)

        const first = page.locator('#h11 .accordion__trigger').first()
        await first.click()
        await expect(first).toHaveAttribute('aria-expanded', 'true')
        await expect(page.getByRole('link', { name: 'Alle Fragen ansehen' })).toHaveAttribute('href', '/faq')
    })

    test('interaction latency stays under 200 ms at 4× CPU', async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', 'CPU throttling is a Chromium feature')

        await open(page, '/')
        const cdp = await page.context().newCDPSession(page)
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

        await page.evaluate(() => {
            const w = window as Window & { __rmfEvents?: { name: string; duration: number }[] }
            w.__rmfEvents = []
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries() as PerformanceEventTiming[]) {
                    if (entry.name === 'click') {
                        w.__rmfEvents?.push({ name: entry.name, duration: entry.duration })
                    }
                }
            }).observe({ type: 'event', durationThreshold: 16 })
        })

        // One interaction at a time: each tap settles (network idle, a frame or two) before the
        // next, so a duration measures that tap and not the previous tap's re-render.
        const settle = async (): Promise<void> => {
            await page.waitForLoadState('networkidle')
            await page.waitForTimeout(600)
        }

        await page.getByRole('tab', { name: 'HSN/TSN' }).click()
        await settle()
        await page.getByRole('tab', { name: 'Marke & Modell' }).click()
        await settle()
        await page.locator('#h5').getByRole('tab', { name: 'Neu' }).click()
        await settle()
        await page.locator('#h11 .accordion__trigger').first().scrollIntoViewIfNeeded()
        await settle()
        await page.locator('#h11 .accordion__trigger').first().click()
        await settle()
        await page.waitForTimeout(1000)

        const events = await page.evaluate(() => (window as Window & { __rmfEvents?: { name: string; duration: number }[] }).__rmfEvents ?? [])
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
        const durations = events.map((e) => e.duration)
        const worst = durations.length ? Math.max(...durations) : 0
        expect(worst, `click durations at 4×: ${durations.map((d) => Math.round(d)).join(', ')}`).toBeLessThanOrEqual(200)
    })
})
