import { propsOf } from '../../e2e/teardown'
import { BASE, PREVIEW, VISITOR, hasCredentials, statePath } from './instance'
import { consent, evidence, evidenceAround, expect, open, test } from './fixtures'
import { PRODUCT } from './shop'

/*
 * His admin list (201–218) in the acceptance run: the pass that may point at the site he looks at, so the only one that
 * can tick his sheet (scripts/kundenliste/sheet.mjs, D-246). The list's own suite (e2e/kundenliste/admin.spec.ts) builds,
 * saves and imports on our acceptance shop; here each item is walked up to its save point and stops (the operator's
 * brief of 13.10.2026: on his preview nothing that stays). A refusal the server gives writes nothing, so the Radtypen-
 * bezeichnung's is provoked; a dialog that asks before storing is answered with its way back. What only a write can
 * show — a draft Gutachten's entry form (209), a dry run of an import (202) — is not here, and its row says so.
 *
 * The run signs in with the review account of the Super-Admin role (instance.ts); the client's own records are opened
 * to be read, never changed.
 */

test.describe('as the Super-Admin', () => {
    test.use({ storageState: hasCredentials('super-admin') ? statePath('super-admin') : VISITOR })

    test.beforeEach(async () => {
        test.skip(!hasCredentials('super-admin'), 'no Super-Admin credentials in the environment (RIMIFY_EMAIL, RIMIFY_PASSWORD)')
    })

    test('a car typed from its papers: each field by its number there, the axle loads asked for before anything is stored', { tag: ['@admin-201', '@admin-203'] }, async ({ page }, info) => {
        await open(page, '/admin/fahrzeuge/neu')

        // Each field named with its number in the Zulassungsbescheinigung Teil I.
        await expect(page.locator('label[for="fn-hsn"]')).toContainText('2.1')
        await expect(page.locator('label[for="fn-tsn"]')).toContainText('2.2')
        await expect(page.locator('label[for="fn-eg"] .fn-field')).toHaveText('(Feld K)')
        await expect(page.locator('label[for="fn-front"]')).toContainText('8.1')
        await expect(page.locator('label[for="fn-rear"]')).toContainText('8.2')

        await page.fill('#fn-make', 'Beispielmarke')
        await page.fill('#fn-model', 'Muster (BM1)')
        await page.fill('#fn-variant', '1.6 Limousine (Abnahme, nicht gespeichert)')
        await page.fill('#fn-type', 'BM1')
        await page.fill('#fn-hsn', '0000')
        await page.fill('#fn-tsn', 'ABN')
        await page.fill('#fn-eg', 'e1*2007/46*0001*00')
        await page.fill('#fn-kw', '85')
        await page.fill('#fn-from', '03.2015')

        // Without the axle loads the form says first what that costs; the way back leads to the fields — nothing stored.
        await page.getByRole('button', { name: 'Fahrzeug anlegen' }).click()
        const warning = page.getByRole('dialog')
        await expect(warning).toContainText('Ohne die Achslasten aus den Feldern 8.1 und 8.2')
        await evidenceAround(page, [warning], 201, info)
        await warning.locator('#fn-warn-enter').click()
        await expect(warning).toHaveCount(0)
        await expect(page).toHaveURL(/\/admin\/fahrzeuge\/neu$/)
    })

    test('a new Felge: its Radtypenbezeichnung required, the title composed from it, a title typed otherwise flagged', { tag: ['@admin-204', '@admin-205', '@admin-213'] }, async ({ page }, info) => {
        await open(page, '/admin/felgen/neu')
        await page.selectOption('#fe-brand', '-1')
        await page.fill('#fe-brand-new', 'Beispielmarke')
        await page.fill('#fe-name', 'Muster Abnahme')
        await page.fill('#fe-f-0-name', 'Silber')
        await page.click('#fe-add-size')
        await page.fill('#fe-size-0-diameter', '18')
        await page.fill('#fe-size-0-width', '8')
        await page.fill('#fe-size-0-et', '35')
        await page.fill('#fe-size-0-bolt_circle', '112')
        await page.fill('#fe-size-0-bore', '66,6')
        await page.fill('#fe-size-0-sku', `ABN-${Date.now().toString(36).toUpperCase()}`)
        await page.fill('#fe-size-0-price', '189')

        // Saved without it: refused by the server under its own field. A refusal stores nothing — not the Felge, not the brand.
        await page.locator('.adm-savebar').getByRole('button', { name: 'Speichern' }).click()
        await expect(page.locator('#fe-type-err')).toContainText('Bitte gib die Radtypenbezeichnung ein')
        await expect(page).toHaveURL(/\/admin\/felgen\/neu$/)
        await evidenceAround(page, [page.locator('#fe-type').locator('..')], 204, info)

        // With it, the name in the shop composes itself: brand, model, Radtypenbezeichnung.
        await page.fill('#fe-type', 'BM 18')
        await expect(page.locator('#fe-title-help')).toContainText('Beispielmarke Muster Abnahme BM 18')
        await evidenceAround(page, [page.locator('#fe-type').locator('..'), page.locator('#fe-title').locator('..')], 205, info)

        // A title typed otherwise is kept — and said to differ, the composed one a click away.
        await page.fill('#fe-title', 'Muster Abnahme Sonderedition')
        await expect(page.locator('.fe-title-diverges')).toContainText('Beispielmarke Muster Abnahme BM 18')
        await evidenceAround(page, [page.locator('#fe-title').locator('..')], 213, info)
        await page.getByRole('button', { name: 'Zusammengesetzten Titel verwenden' }).click()
        await expect(page.locator('#fe-title')).toHaveValue('')
        // Never saved a second time: the test ends with the form as it stands.
    })

    test('a Felge in the shop is named as the admin composes it, and each size is available or not — never a count', { tag: ['@admin-206', '@admin-207'] }, async ({ page, context }, info) => {
        // A published Felge that is no example: its page in the admin, read and left as it is.
        await open(page, '/admin/felgen?status=published')
        const rows = page.locator('table.fg-table tbody tr').filter({ hasNot: page.locator('.fg-demo', { hasText: 'Demodaten' }) })
        // An instance without one has nothing to show here: not measured, never a pass.
        test.skip((await rows.count()) === 0, 'no published Felge outside the examples on this instance')
        const editPath = new URL((await rows.first().locator('a.fg-name').getAttribute('href')) ?? '/', BASE).pathname
        const props = await propsOf<{ model: { shopUrl: string | null } }>(context, editPath)
        const shop = props?.model.shopUrl ?? null
        expect(shop, 'the Felge has no address in the shop').toMatch(/^\/felgen\//)

        await open(page, editPath)
        const composed = /Im Shop: „(.+)“/.exec((await page.locator('#fe-title-help').textContent()) ?? '')?.[1] ?? ''
        expect(composed, 'the form does not say the name in the shop').not.toBe('')

        // Available or not, per size; the count is no field any more.
        const available = page.locator('#fe-size-0-available')
        await expect(available).toBeVisible()
        await expect(available.locator('option')).toHaveText(['Verfügbar', 'Nicht verfügbar'])
        await expect(page.locator('#fe-size-0-stock')).toHaveCount(0)

        // The shop: the same name, and the size's state in words.
        await consent(page)
        await open(page, shop as string)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(composed)
        await expect(page.locator('.pdp__stock')).toHaveText(/^(Verfügbar|Nicht verfügbar)$/)
        await evidenceAround(page, [page.getByRole('heading', { level: 1 }), page.locator('.pdp__stock')], 206, info)
        await evidenceAround(page, [page.locator('.pdp__stock')], 207, info)
    })

    test('the Bereifungskombinationen stand on the Gutachten as the closed list it prints', { tag: '@admin-208' }, async ({ page }, info) => {
        await open(page, '/admin/gutachten')
        const documentPage = new URL((await page.locator('a', { hasText: /^\s*55255\s*$/ }).first().getAttribute('href', { timeout: 15_000 })) ?? '/', BASE).pathname
        expect(documentPage, 'ABE 55255 is not in the list').toMatch(/^\/admin\/gutachten\/\d+$/)
        await open(page, documentPage)

        const card = page.locator('section[aria-labelledby="gs-combinations-h"]')
        await expect(card).toContainText('Dann bietet der Shop zu diesem Gutachten nur diese an')
        const rows = card.locator('table.kb-table tbody tr')

        // On his preview the example ABE 55255 was seeded on 14.10, before this section existed (D-256, 16.10): no
        // combination is entered there, and entering one takes a draft — a write this pass never makes. What can be
        // checked is that the page says so; whether the shop then offers only the listed pairs is not measured there.
        if (PREVIEW && (await rows.count()) === 0) {
            await expect(card).toContainText('Zu diesem Gutachten sind keine Bereifungskombinationen hinterlegt.')
            test.skip(true, 'not measured on the preview: ABE 55255 there has no combinations entered, and entering them takes a draft')
        }

        await expect(rows.first(), 'no combination is entered on this Gutachten').toBeVisible()
        await expect(card).toContainText(/Seite \d+ im Gutachten\./)
        await evidenceAround(page, [card], 208, info)
    })

    test('a tyre with its EU label: the size as the wall prints it, the label as the shop prints it — not stored', { tag: '@admin-210' }, async ({ page }, info) => {
        await open(page, '/admin/reifen')
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Reifen')

        await open(page, '/admin/reifen/neu')
        await page.selectOption('#rf-brand', '-1')
        await page.fill('#rf-brand-new', 'Beispielmarke')
        await page.fill('#rf-name', 'Muster Abnahme')
        await page.selectOption('#rf-season', 'sommer')
        await page.fill('#rf-width', '225')
        await page.fill('#rf-aspect', '45')
        await page.fill('#rf-diameter', '18')
        await page.fill('#rf-load', '95')
        await page.selectOption('#rf-speed', 'Y')
        await expect(page.locator('.rf-size-preview')).toHaveText('225/45 R18 95Y')

        await page.selectOption('#rf-fuel', 'B')
        await page.selectOption('#rf-wet', 'A')
        await page.fill('#rf-noise', '71')
        await page.selectOption('#rf-noise-class', 'B')
        await page.locator('input[name="rf-snow"]').nth(1).check()
        await page.locator('input[name="rf-ice"]').nth(1).check()
        await expect(page.locator('.rf-preview .tyre-label')).toContainText('Nasshaftung')
        await evidenceAround(page, [page.locator('section[aria-labelledby="rf-h-size"]'), page.locator('section[aria-labelledby="rf-h-label"]')], 210, info)
        // Nothing saved: the test ends with the form as it stands.
    })
})

test.describe('as a visitor', () => {
    test.use({ storageState: VISITOR })

    test.beforeEach(async ({ page }) => {
        await consent(page)
    })

    test('the Blog lists every published article, for every visitor', { tag: '@admin-212' }, async ({ page }, info) => {
        await open(page, '/blog')
        const main = page.getByRole('main')
        await expect(main.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible()
        await expect(main.getByRole('heading', { level: 2 }).getByRole('link').first()).toBeVisible()
        // The guide on ABE, Teilegutachten and ECE waits for the law firm (D-237): no slot for it.
        await expect(main).not.toContainText('ABE, Teilegutachten, ECE')
        await evidence(main, 212, info)
    })

    test('a Felge that is no example carries its structured data for search engines; an example carries none', { tag: '@admin-214' }, async ({ page }, info) => {
        // The shop's list: the first Felge that is not the example of the acceptance set.
        await open(page, '/felgen')
        // A card's link carries the car or the size after a „?“: the Felge is its path.
        const paths = await page.locator('a[href^="/felgen/"]').evaluateAll((links) => [...new Set(links.map((a) => (a.getAttribute('href') ?? '').split(/[?#]/)[0] ?? ''))])
        const real = paths.find((p) => /^\/felgen\/[a-z0-9-]+$/.test(p) && p !== PRODUCT)
        test.skip(real === undefined, 'no Felge outside the example on this instance')

        await open(page, real as string)
        const raw = await page.locator('script[type="application/ld+json"]').first().textContent()
        const data = JSON.parse(raw ?? '{}') as { '@type'?: string; name?: string; hasVariant?: Array<{ offers?: { price?: string; priceCurrency?: string; availability?: string } }> }

        expect(data['@type']).toBe('ProductGroup')
        expect(data.name).toBe((await page.getByRole('heading', { level: 1 }).textContent())?.trim())
        expect((data.hasVariant ?? []).length).toBeGreaterThan(0)

        for (const variant of data.hasVariant ?? []) {
            expect(variant.offers?.priceCurrency).toBe('EUR')
            expect(variant.offers?.price).toMatch(/^\d+\.\d{2}$/)
            expect(variant.offers?.availability).toMatch(/^https:\/\/schema\.org\/(InStock|OutOfStock)$/)
        }

        // The example of the acceptance set: no structured data at all.
        await open(page, PRODUCT)
        await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0)
        await evidence(page.getByRole('heading', { level: 1 }), 214, info)
    })

    test('no page of the shop is kept by the browser or the host: every answer says no-store', { tag: '@admin-216' }, async ({ page }, info) => {
        for (const path of ['/', '/felgen', PRODUCT]) {
            const response = await page.goto(path, { waitUntil: 'load' })
            expect(response?.headers()['cache-control'], path).toContain('no-store')
        }

        await open(page, PRODUCT)
        await evidence(page.getByRole('heading', { level: 1 }), 216, info)
    })
})
