import { propsOf, send } from '../../e2e/teardown'
import { BASE, MAY_WRITE, PREVIEW, VISITOR, hasCredentials, statePath } from './instance'
import { consent, evidence, evidenceAround, evidencePage, expect, open, phone, test } from './fixtures'
import { PRODUCT, box, onSize, withCar } from './shop'

/*
 * Batch E — the items that are not ours to tick: two solved differently (#9, #23), #19 built as we promised it (stars
 * typed in the admin, beside their sentence — D-344), three that wait on the client's judgement (#11, #32, #33) and one
 * that waits on his answer (#34). Each test proves what the row says the shop does and leaves its picture; the state
 * stays what the operator set, whatever the result. #19's and #23's admin halves run only where a Super-Admin's
 * credentials are in the environment; on the preview #23 writes the one thing the operator allowed there — a demo
 * document's level, set to each of the three and back — and #19 writes nothing: it reads the card and the shop.
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

    test('built: stars typed in the admin stand under the name only beside the shop\'s sentence about them — never as a checked purchase; none without it', { tag: '@kunde-19' }, async ({ page, context }, info) => {
        await withCar(page, 'e46', PRODUCT)
        // What the server sends, read before the page is judged: the state stands as the operator (or the client) left it.
        const product = (await propsOf<{ product: { statedRating?: { label: string; disclosure: string } | null; ratingCount: number } }>(context, PRODUCT))?.product
        expect(product, 'the product page sends no props').toBeDefined()
        const name = page.locator('.pdp__buy h1')

        if (product?.statedRating) {
            const line = page.locator('[data-stated-rating]')
            await expect(line.locator('.tabular')).toHaveText(product.statedRating.label)
            await expect(line.locator('.pdp__rating-origin')).toHaveText(`– ${product.statedRating.disclosure}`)
            await expect(page.locator('.pdp__buy h1 + [data-stated-rating]')).toHaveCount(1)
            await expect(line).not.toContainText(/Geprüft|verifiziert/i)
            await evidenceAround(page, [name, line], 19, info)
        } else {
            // No sentence, no stars: the page shows none — never an empty row of them — and says what it can prove instead.
            await expect(page.locator('[data-stated-rating]')).toHaveCount(0)

            if (product?.ratingCount === 0) {
                await expect(page.locator('.pdp__rating')).toHaveCount(0)
                await expect(page.locator('.pdp__proof')).toHaveText(/^\d+ Gutachten · für \d+ Fahrzeugvarianten? freigegeben · Freigabe vor dem Kauf geprüft$/)
            }

            await evidenceAround(page, [name, page.locator('.pdp__proof, .pdp__rating').first()], 19, info)
        }
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

    /** The admin's three levels and their names, as the form lists them (ConditionLevel). */
    const LEVELS = { hinweis: 'Hinweis – nichts zu tun', auflage: 'Auflage – etwas ist zu tun oder eingeschränkt', nicht_zulaessig: 'Nicht zulässig' } as const
    type Level = keyof typeof LEVELS

    /*
     * Where #23 wrote, and the level to put back if the run stops half-way. The run itself ends on the level it found; this
     * is the net under it — by request over the session, never through the page (e2e/teardown.ts, D-263): as a `finally`
     * that clicked the level back, it ran on a page the timeout was already closing. It writes only where the run left
     * the level otherwise, so the client's Protokoll keeps its three lines and gains no fourth.
     */
    let restore: { path: string; level: Level } | null = null

    /** Where #19 typed stars on our own instance, to take off again should the run stop before its own last step does. */
    let unstar: string | null = null

    test.afterEach(async ({ context }) => {
        if (unstar !== null) {
            const path = unstar
            unstar = null
            const stated = (await propsOf<{ statedRating: unknown }>(context, path.replace(/\/sterne$/, '')))?.statedRating

            if (stated !== null && stated !== undefined) {
                await send(context, 'DELETE', path)
            }
        }

        if (restore === null) {
            return
        }

        const { path, level } = restore
        restore = null
        const a14 = (await propsOf<{ conditions: { id: number; code: string; level: string }[] }>(context, path))?.conditions.find((c) => c.code === 'A14')

        if (a14 !== undefined && a14.level !== level) {
            await send(context, 'PUT', `${path}/auflagen/${a14.id}/stufe`, { level })
        }
    })

    test('solved differently: each of the three levels set on a demo Gutachten\'s Auflage and the shop\'s label read after each — an Abnahme can never be a mere Hinweis, the form says why', { tag: '@kunde-23' }, async ({ page }, info) => {
        test.skip(!hasCredentials('super-admin'), 'no Super-Admin credentials in the environment (RIMIFY_EMAIL, RIMIFY_PASSWORD)')
        test.setTimeout(300_000)

        // The document by its link's address: on a phone the list draws its links twice, one of them hidden, and a click
        // on the hidden one waits for the test's whole budget (the preview's iPhone pass, 16.10.2026).
        await open(page, '/admin/gutachten')
        const documentPage = new URL((await page.locator('a', { hasText: /^\s*55255\s*$/ }).first().getAttribute('href', { timeout: 15_000 })) ?? '/', BASE).pathname
        expect(documentPage, 'ABE 55255 is not in the list').toMatch(/^\/admin\/gutachten\/\d+$/)
        await open(page, documentPage)

        // The one write this test makes on the client's preview (the operator's brief of 16.10.2026, §3): one Auflage of a
        // document born demo, set to each level and back where it was — three Protokoll lines about a demo document,
        // „fine and true“. On any other document it stops before writing: the page's own mark says which it is (the
        // admin encrypts its history, so its props cannot be read back after a visit). There the desktop pass writes
        // them; the iPhone pass reads the same page and the shop without writing — six lines would say nothing three do not.
        await expect(page.locator('.adm-facts .adm-demo'), 'a level is set only on a demo document').toHaveText('Demodaten')
        const writes = !PREVIEW || !phone(info)

        const table = page.locator('.av__table')
        await expect(table).toBeVisible()

        // A01, the Abnahme: an Auflage, and „Hinweis“ cannot be chosen — the form says why.
        const abnahme = table.locator('tbody tr', { has: page.locator('.av__code', { hasText: /^A01$/ }) })
        await expect(abnahme).toHaveCount(1)
        const floor = abnahme.locator('select.av__level-select')
        await expect(floor).toHaveValue('auflage')
        await expect(floor.locator('option[value="hinweis"]')).toBeDisabled()
        await expect(floor.locator('option[value="nicht_zulaessig"]')).toBeEnabled()
        await expect(page.locator('.av__levels-note')).toContainText('Eine Abnahme oder Arbeit an der Karosserie ist immer eine Auflage')

        // A14 — the balance weights, a Hinweis by the operator's default — stands on the X3's 19-inch rows.
        const a14 = table.locator('tbody tr', { has: page.locator('.av__code', { hasText: /^A14$/ }) })
        const select = a14.locator('select.av__level-select')
        const original = (await select.inputValue()) as Level
        const order = writes ? [...(Object.keys(LEVELS) as Level[]).filter((l) => l !== original), original] : []

        const setLevel = async (level: Level): Promise<void> => {
            if (new URL(page.url()).pathname !== documentPage) {
                await open(page, documentPage)
            }

            if ((await select.inputValue()) !== level) {
                await Promise.all([page.waitForResponse((r) => r.request().method() === 'PUT' && new URL(r.url()).pathname.endsWith('/stufe')), select.selectOption(level)])
                await expect(select).toHaveValue(level)
            }
        }

        // The shop for the X3: the listing's label and the product page's answer on the 19-inch rim. A level moves the
        // label only where no Eintragung is needed (D-104); the X3's answer needs one — the Abnahme with 255/40 R19 — so it
        // reads „Mit Auflagen“ at every level, as the client finds it there.
        const shopSays = async (): Promise<void> => {
            await withCar(page, 'x3', '/felgen')
            const badges = await page.locator('main .tile', { hasText: 'DB8GT2' }).locator('.verdict').all()
            expect(badges.length, 'the acceptance wheel is not in the X3\'s listing').toBeGreaterThan(0)

            for (const badge of badges) {
                await expect(badge).toHaveText('Mit Auflagen')
            }

            await withCar(page, 'x3', PRODUCT)
            await onSize(page, 19, 'Schwarz matt')
            await expect(page.locator('.rcheck-panel__vehicle').first()).toHaveText(/^Mit Auflagen freigegeben für /)
            await expect(page.locator('.fit__entry--verdict').first()).toContainText('Eintragung')
        }

        // The level it found, put back by the afterEach should the run stop before its last step does it.
        restore = order.length > 0 ? { path: documentPage, level: original } : null

        for (const level of order) {
            await setLevel(level)
            // What the shop does with it, said as it is saved (D-247): the label of an answer, never a colour it does not paint.
            await expect(page.getByText(`Gespeichert: A14 ist jetzt „${LEVELS[level]}“.`)).toBeVisible()
            await shopSays()
        }

        // The pass that writes nothing reads the shop at the level that stands.
        if (order.length === 0) {
            await shopSays()
        }

        await open(page, documentPage)
        await expect(select).toHaveValue(original)
        await evidenceAround(page, [table.locator('thead tr'), abnahme, a14], 23, info)
    })

    test('built: stars typed on the Felge\'s admin page show under its name beside their sentence, a sentence claiming a check is refused, and they come off again', { tag: '@kunde-19' }, async ({ page, context, request }, info) => {
        test.skip(!hasCredentials('super-admin'), 'no Super-Admin credentials in the environment (RIMIFY_EMAIL, RIMIFY_PASSWORD)')
        test.setTimeout(240_000)

        const modelId = (await propsOf<{ product: { modelId: number } }>(context, PRODUCT))?.product.modelId
        expect(modelId, 'the acceptance rim has no product page').toBeGreaterThan(0)
        const adminPage = `/admin/felgen/${modelId}`

        await open(page, adminPage)
        const card = page.locator('.fe-stars')
        await expect(card.getByRole('heading', { name: 'Sterne von Hand' })).toBeVisible()
        await expect(card.locator('#fe-stars-rating')).toBeVisible()
        await expect(card.locator('#fe-stars-count')).toBeVisible()
        await expect(card.locator('#fe-stars-note')).toBeVisible()
        await expect(card.getByRole('button', { name: 'Sterne speichern' })).toBeVisible()

        // The client's preview gains no Protokoll line from this run (instance.ts): there it reads the card, and proves the
        // address the card saves to answers — a request with no session is refused for its missing token, not as unknown.
        if (!MAY_WRITE) {
            const probe = await request.fetch(`${BASE}${adminPage}/sterne`, { method: 'PUT', maxRedirects: 0 })
            expect(probe.status(), 'the stars cannot be saved: the address is unknown').toBe(419)
            await evidenceAround(page, [card], 19, info, 16, `19-admin-${phone(info) ? 'iphone' : 'desktop'}`)

            return
        }

        unstar = `${adminPage}/sterne`
        const sentence = (await card.locator('#fe-stars-note').inputValue()).trim()
        expect(sentence, 'the sentence beside the stars is empty: no stars would show').not.toBe('')

        // A rating without its count is refused beside its field, and nothing reaches the shop.
        await card.locator('#fe-stars-rating').fill('4,9')
        await card.getByRole('button', { name: 'Sterne speichern' }).click()
        await expect(card.locator('#fe-stars-count-err')).toHaveText('Trag ein, auf wie vielen Bewertungen die Sterne beruhen.')
        await expect(card.locator('[data-stars-now]')).toHaveText('Im Shop stehen keine Sterne von Hand.')

        await card.locator('#fe-stars-count').fill('13')
        await card.getByRole('button', { name: 'Sterne speichern' }).click()
        await expect(card.locator('.fe-stars__line')).toHaveText(`★ 4,9 (13 Bewertungen) – ${sentence}`)
        await evidenceAround(page, [card], 19, info, 16, `19-admin-${phone(info) ? 'iphone' : 'desktop'}`)

        // The listing: on the rim's card, under its name.
        await withCar(page, 'e46', '/felgen')
        await expect(page.locator('main .tile', { hasText: 'DB8GT2' }).first().locator('.tile__title + [data-stated-rating]')).toHaveText(`★ 4,9 (13 Bewertungen) – ${sentence}`)

        // The product page: under the name, beside the sentence — no link to reviews that are not there, no checked purchase.
        await withCar(page, 'e46', PRODUCT)
        const line = page.locator('.pdp__buy h1 + [data-stated-rating]')
        await expect(line.locator('.tabular')).toHaveText('4,9 (13 Bewertungen)')
        await expect(line.locator('.pdp__rating-origin')).toHaveText(`– ${sentence}`)
        await expect(page.locator('a.pdp__rating')).toHaveCount(0)
        await expect(page.getByText('Geprüfter Kauf')).toHaveCount(0)
        await evidenceAround(page, [page.locator('.pdp__buy h1'), line], 19, info, 16, `19-shop-${phone(info) ? 'iphone' : 'desktop'}`)

        // And off again: the card says so, and the shop shows none.
        await open(page, adminPage)
        await card.getByRole('button', { name: 'Sterne entfernen' }).click()
        await expect(card.locator('[data-stars-now]')).toHaveText('Im Shop stehen keine Sterne von Hand.')
        unstar = null

        await withCar(page, 'e46', PRODUCT)
        await expect(page.locator('[data-stated-rating]')).toHaveCount(0)
    })
})
