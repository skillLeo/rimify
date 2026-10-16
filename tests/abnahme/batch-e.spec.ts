import { BASE, VISITOR, hasCredentials, statePath } from './instance'
import { consent, evidence, evidenceAround, evidencePage, expect, open, phone, test } from './fixtures'
import { PRODUCT, box, onSize, withCar } from './shop'

/*
 * Batch E — the items that are not ours to tick: three solved differently (#9, #19, #23), three that wait on the client's
 * judgement (#11, #32, #33) and one that waits on his answer (#34). Each test proves what the row says the shop does and
 * leaves its picture; the state stays what the operator set („anders gelöst“, „Urteil offen“, „Rückfrage“), whatever the
 * result. #23 is the admin's and runs only where a Super-Admin's credentials are in the environment.
 */

test.describe('as a visitor', () => {
    test.use({ storageState: VISITOR })

    test.beforeEach(async ({ page }) => {
        await consent(page)
    })

    test('solved differently: the turning wheel is a published product from the client\'s photographs, and its caption opens it', { tag: '@kunde-09' }, async ({ page, request }, info) => {
        await open(page, '/')
        const band = page.locator('#h7').first()
        await band.scrollIntoViewIfNeeded()

        await expect(band).toBeVisible()
        const caption = band.locator('figcaption a').first()
        await expect(caption).toHaveText(/^Felge im Bild: BORBET DB8GT2/i)
        const href = await caption.getAttribute('href')
        expect(href).toBe(PRODUCT)
        expect((await request.get(new URL(href ?? '', BASE).toString())).status()).toBe(200)

        // The client's own cut-out, never a picture from anywhere else.
        expect(await band.locator('img').first().getAttribute('src')).toContain('borbet-db8gt2')

        await evidence(band.locator('figure').first(), 9, info)
    })

    test('judgement: our own cross-section — ET, Felgenbreite and Lochkreis — and the wheel moves in the arch when the ET changes', { tag: '@kunde-11' }, async ({ page }, info) => {
        await open(page, '/felgenrechner')

        const drawing = page.locator('.calc-drawing').first()
        await expect(drawing.locator('[data-measure="et"]')).toBeAttached()
        await expect(drawing.locator('[data-measure="width"]')).toBeAttached()
        await expect(drawing).toContainText('Felgenbreite')
        await expect(drawing).toContainText('Lochkreis')
        await expect(drawing).toContainText('Einpresstiefe (ET)')

        const wheel = drawing.locator('[data-wheel="next"]')
        const before = await box(wheel)

        if (phone(info)) {
            await page.getByRole('tab', { name: 'Neu' }).click()
        }

        const et = page.locator('input[id$="-next-etMm"]')
        await et.fill(String(Number(await et.inputValue()) - 20))
        await et.press('Enter')
        await expect.poll(async () => Math.abs((await box(wheel)).x - before.x), { timeout: 5_000 }).toBeGreaterThan(2)

        await evidence(drawing, 11, info)
    })

    test('solved differently: reviews come only from buyers — no stars until there are any, and the page says what it can prove', { tag: '@kunde-19' }, async ({ page }, info) => {
        await withCar(page, 'e46', PRODUCT)

        await expect(page.locator('.pdp__rating')).toHaveCount(0)
        await expect(page.locator('#bewertungen')).toHaveCount(0)
        await expect(page.locator('.pdp__proof')).toHaveText(/^\d+ Gutachten · für \d+ Fahrzeugvarianten? freigegeben · Freigabe vor dem Kauf geprüft$/)

        await evidenceAround(page, [page.locator('.pdp__buy h1'), page.locator('.pdp__proof')], 19, info)
    })

    test('judgement: the bands alternate a pale surface with white, not every section tinted — before and after', { tag: '@kunde-32' }, async ({ page }, info) => {
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

        const tinted = tones.sections.filter((c) => c === tones.band).length
        const white = tones.sections.filter((c) => c === tones.white || c === 'rgba(0, 0, 0, 0)').length
        expect(tinted, 'no band carries the pale surface').toBeGreaterThan(0)
        expect(tinted, 'every section is tinted').toBeLessThan(tones.sections.length)
        expect(white, 'no white section between the bands').toBeGreaterThan(0)

        // The whole page as a visitor who has scrolled through it sees it (`cv-off`: the page's own switch for that).
        await page.evaluate(async () => {
            document.documentElement.classList.add('cv-off')

            for (let y = 0; y < document.documentElement.scrollHeight; y += Math.round(window.innerHeight * 0.8)) {
                window.scrollTo(0, y)
                await new Promise((done) => setTimeout(done, 120))
            }

            window.scrollTo(0, 0)
            await new Promise((done) => setTimeout(done, 300))
        })

        await evidencePage(page, 32, info)

        // Before: the same page with the bands in the neutral grey they had until D-115.
        await page.evaluate(() => document.documentElement.style.setProperty('--c-band-blue', '#f3f4f6'))
        await evidencePage(page, 32, info, `32-vorher-${phone(info) ? 'webkit' : 'chromium'}`)
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

            const units: Element[] = []

            for (const el of document.querySelectorAll<Element>('body *')) {
                const r = el.getBoundingClientRect()

                if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > window.innerHeight) {
                    continue
                }

                const s = getComputedStyle(el)
                const own = el instanceof SVGElement ? s.color === rgb || s.stroke === rgb || s.fill === rgb : s.color === rgb || s.backgroundColor === rgb

                if (!own || units.some((u) => u.contains(el))) {
                    continue
                }

                units.push(el)
            }

            return units.map((el) => {
                const action = el.closest('a, button, [role="tab"], label, summary')
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

        expect(found.filter((u) => u.kind === 'other'), 'blue on something that is neither an icon nor an action').toEqual([])
        expect(found.length).toBeGreaterThan(0)
        expect(found.length, JSON.stringify(found)).toBeLessThanOrEqual(12)
        await info.attach('blue-units', { body: JSON.stringify(found, null, 2), contentType: 'application/json' })

        await evidence(page, 33, info)
    })

    test('Rückfrage: „Product Detail Page needs …“ ends there — the product page as it stands, for him to finish the sentence', { tag: '@kunde-34' }, async ({ page }, info) => {
        await withCar(page, 'e46', PRODUCT)
        await onSize(page, 19, 'Schwarz matt')
        await expect(page.locator('h1')).toHaveText(/^BORBET DB8GT2$/i)
        await page.evaluate(() => window.scrollTo(0, 0))

        await evidence(page, 34, info)
    })
})

test.describe('as the Super-Admin', () => {
    test.use({ storageState: hasCredentials('super-admin') ? statePath('super-admin') : VISITOR })

    test('solved differently: the level of an Auflage is set per Gutachten and code — an Abnahme can never be a mere Hinweis, the form says why', { tag: '@kunde-23' }, async ({ page }, info) => {
        test.skip(!hasCredentials('super-admin'), 'no Super-Admin credentials in the environment (RIMIFY_EMAIL, RIMIFY_PASSWORD)')

        // Read only: the admin's page of ABE 55255 is opened and looked at; nothing on it is changed or saved.
        await open(page, '/admin/gutachten')
        await page.locator('a', { hasText: '55255' }).first().click()
        await page.waitForLoadState('networkidle')

        const table = page.locator('.av__table')
        await expect(table).toBeVisible()

        const abnahme = table.locator('tbody tr', { has: page.locator('.av__code', { hasText: /^A01$/ }) })
        await expect(abnahme).toHaveCount(1)
        const level = abnahme.locator('select.av__level-select')
        await expect(level).toHaveValue('auflage')
        await expect(level.locator('option[value="hinweis"]')).toBeDisabled()
        await expect(level.locator('option[value="nicht_zulaessig"]')).toBeEnabled()
        await expect(page.locator('.av__levels-note')).toContainText('Eine Abnahme oder Arbeit an der Karosserie ist immer eine Auflage')

        await evidenceAround(page, [table.locator('thead tr'), abnahme], 23, info)
    })
})
