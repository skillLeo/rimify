import { expect, test } from './fixtures'
import { consentGiven, expectNoHorizontalOverflow, open } from './support'
import { EMPTY_SHOP } from './shop'

/*
 * A shop with no wheel at all (the operator's brief of 05.10.2026, §2; E2eEmptyShopSeeder): the homepage's hero stands
 * on the brand's photograph — present, with a height, nothing wider than the screen — with no leader, caption or spec
 * line, and the selector answers a car with 0 rather than with a gap: „0 Felgen für dieses Fahrzeug“ and one sentence.
 * At 1440 and at 390, as every journey.
 */

test.use({ baseURL: EMPTY_SHOP })

test.beforeEach(async ({ context }) => {
    await consentGiven(context, EMPTY_SHOP)
})

/** The seed's Golf GTI (VehicleSeeder: HSN 0603, TSN BGU): one car behind the pair. */
const GOLF = { hsn: '0603', tsn: 'BGU' }

const ZERO = /^0\s*Felgen für dieses Fahrzeug$/
const EMPTY_SENTENCE = 'Noch ist keine Felge im Sortiment'

test.describe('an empty shop', () => {
    test('the hero stands on its photograph: present, with a height, and nothing wider than the screen', async ({ page }, testInfo) => {
        const phone = testInfo.project.name === 'mobile-390'
        await open(page, '/')

        const hero = page.locator('#h2')
        await expect(hero, 'the hero section is gone').toBeVisible()
        expect((await hero.boundingBox())?.height ?? 0, 'the hero has no height').toBeGreaterThan(200)

        // The brand's photograph, loaded — never the outline, never a placeholder.
        const photo = hero.locator(phone ? '.hero-frame__roll img' : '.hero__roll img')
        await expect(photo, 'no photograph in the hero').toHaveCount(1)
        await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { message: 'the hero photograph did not load' }).toBe(true)
        expect((await photo.boundingBox())?.height ?? 0, 'the hero photograph has no height').toBeGreaterThan(100)
        await expect(hero.locator(phone ? '.hero-frame__outline' : '.hero__outline'), 'the outline stands where the photograph belongs').toHaveCount(0)

        // The photograph's own values, with nothing published (the client's #4: the hero asks the catalogue nothing) —
        // the leaders and the spec line, never a price or a link to a wheel. The one link the hero does carry is the
        // contact line under the selector, which stood in the strip above the header until that went (the client's #3).
        await expect(page.locator('[data-hero="values"]'), 'the hero lost its values with the shop empty').toHaveCount(1)
        await expect(hero.locator('[data-callout]').first()).toBeAttached()
        await expect(hero.locator(phone ? '.hero-mobile__spec' : '.hero__spec')).toHaveCount(1)
        await expect(hero.locator('a[href*="/felgen"]'), 'the hero links to a wheel with none in the shop').toHaveCount(0)
        await expect(hero.locator('a'), 'the hero carries a link other than the contact line').toHaveCount(1)
        await expect(hero.locator('a')).toHaveAttribute('href', '/kontakt')
        await expect(hero.getByText('Symbolbild')).toHaveCount(0)

        await expectNoHorizontalOverflow(page)
    })

    test('a car typed in reads 0 on the button, and one sentence says the shop is still empty', async ({ page }, testInfo) => {
        const phone = testInfo.project.name === 'mobile-390'
        await open(page, '/')

        const hero = page.locator('#h2')
        await hero.getByRole('tab', { name: 'HSN/TSN' }).click()
        await hero.getByLabel('HSN (Feld 2.1)').fill(GOLF.hsn)
        await hero.getByLabel('TSN (Feld 2.2)').fill(GOLF.tsn)

        await expect(hero.locator(phone ? '.vpanel__go' : '.sel__go'), 'the button does not read 0').toHaveText(ZERO)
        await expect(hero.locator(phone ? '.vpanel__zero' : '.sel__zero'), 'the zero says nothing, or not why').toContainText(EMPTY_SENTENCE)

        await expectNoHorizontalOverflow(page)
    })

    test('a chosen car keeps its 0 on the homepage: the sentence under it, the 0 on the button', async ({ page }, testInfo) => {
        const phone = testInfo.project.name === 'mobile-390'
        await open(page, '/')

        // Chosen the way the key-number form does it, with the page's own session.
        const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')
        await page.request.post('/fahrzeug/schluesselnummern', {
            headers: { Accept: 'text/html', 'X-XSRF-TOKEN': decodeURIComponent(xsrf?.value ?? '') },
            form: { hsn: GOLF.hsn, tsn: GOLF.tsn },
        })

        await open(page, '/')

        const hero = page.locator('#h2')
        await expect(hero.locator(phone ? '.vpanel__go' : '.sel__go'), 'the chosen car\'s button does not read 0').toHaveText(ZERO)
        await expect(hero.locator(phone ? '.vpanel__count' : '.sel__count'), 'the chosen car\'s 0 says nothing').toContainText(EMPTY_SENTENCE)

        await expectNoHorizontalOverflow(page)
    })
})
