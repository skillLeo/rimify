import { expect, test, type Page } from '../fixtures'
import { REVIEW_PASSWORD } from '../support'
import { ABNAHME, PRODUCT, consent, open, pageProps, shotAround } from './support'

/*
 * His admin list (201–218, `npm run adminliste`), against the acceptance shop: what there is to look at, at 1440 and
 * 390. The rest of each item is proven in Pest and Vitest, tagged the same way (`@admin-208` …).
 */

test.beforeEach(async ({ context }) => {
    await consent(context, ABNAHME)
})

/** The admin of the acceptance shop, as its full-rights review account (ReviewAccountsSeeder, development password). */
async function admin(page: Page): Promise<void> {
    await page.goto(`${ABNAHME}/admin/anmelden`, { waitUntil: 'networkidle' })
    await page.fill('#lg-mail', 'admin@rimify.test')
    await page.fill('#lg-pass', REVIEW_PASSWORD)
    await page.locator('button[type=submit]').first().click()
    await page.waitForURL(/\/admin(\?.*)?$/, { timeout: 30_000 })
}

/**
 * A draft of the released ABE 55255 to enter into: its new Fassung (D-250) — opened where one was started, started where
 * none was. The released document itself takes no entry (R-11).
 */
async function draftOf55255(page: Page): Promise<void> {
    await page.goto(`${ABNAHME}/admin/gutachten`, { waitUntil: 'networkidle' })
    await page.locator('a', { hasText: '55255' }).first().click()
    await page.waitForLoadState('networkidle')

    if (await page.locator('#kb-edit').isVisible()) {
        return
    }

    const started = page.getByRole('link', { name: 'Neue Fassung öffnen' })

    if ((await started.count()) > 0) {
        await started.click()
    } else {
        await page.getByRole('button', { name: 'Neue Fassung anlegen' }).click()
        await page.getByRole('dialog').getByRole('button', { name: 'Neue Fassung anlegen' }).click()
    }

    await page.waitForLoadState('networkidle')
    await expect(page.locator('#kb-edit')).toBeVisible()
}

// His item 8, his own example: one front size, three rear sizes — „combination 1 … 2 … 3“.
const HIS = [
    ['225/40 R18', '225/40 R18'],
    ['225/40 R18', '245/35 R18'],
    ['225/40 R18', '255/35 R18'],
] as const

test('the Bereifungskombinationen take his list as he wrote it — number, front, rear, page — and stand as a closed list', { tag: '@admin-208' }, async ({ page }, info) => {
    await admin(page)
    await draftOf55255(page)

    const card = page.locator('section[aria-labelledby="gs-combinations-h"]')
    await card.locator('#kb-edit').click()

    const rows = card.locator('table.kb-grid tbody tr')

    while ((await rows.count()) > HIS.length) {
        await card.getByRole('button', { name: /^Kombination .+ entfernen$/ }).last().click()
    }

    while ((await rows.count()) < HIS.length) {
        await card.locator('#kb-add-row').click()
    }

    await card.locator('#kb-page').fill('1')

    for (const [i, [front, rear]] of HIS.entries()) {
        await card.locator(`#kb-number-${i}`).fill(String(i + 1))
        await card.locator(`#kb-front-${i}`).fill(front)
        await card.locator(`#kb-rear-${i}`).fill(rear)
    }

    await card.locator('#kb-save').click()

    // Saved and shown as the list it is, in his numbering, with the page it stands on.
    const saved = card.locator('table.kb-table tbody tr')
    await expect(saved).toHaveCount(HIS.length)

    for (const [i, [front, rear]] of HIS.entries()) {
        await expect(saved.nth(i)).toContainText(String(i + 1))
        await expect(saved.nth(i)).toContainText(front)
        await expect(saved.nth(i)).toContainText(rear)
    }

    await expect(card).toContainText('Seite 1 im Gutachten.')
    // The card says what the list does in the shop: these pairs and no others.
    await expect(card).toContainText('Dann bietet der Shop zu diesem Gutachten nur diese an')

    await shotAround(page, [card], 208, info)
})

test('load index and speed symbol in two fields of their own — a size pasted as printed settles into them', { tag: '@admin-209' }, async ({ page }, info) => {
    await admin(page)
    await draftOf55255(page)

    // Typed — or pasted from the PDF — with its minimum: on leaving the field, the minimum moves into its own two fields.
    const size = page.locator('#rc-size-0')
    await size.fill('245/35 R19 93Y')
    await size.blur()

    await expect(size).toHaveValue('245/35 R19')
    await expect(page.locator('#rc-size-0-li')).toHaveValue('93')
    await expect(page.locator('#rc-size-0-symbol')).toHaveValue('Y')
    await expect(page.locator('#rc-size-0-err')).toHaveText('')

    // Nothing is saved: the picture shows the fields as they stand.
    await shotAround(page, [page.locator('.rc fieldset').first()], 209, info)
})

/** A document of the acceptance set, by a piece of its number, opened from the Gutachten list. */
async function openDocument(page: Page, number: string): Promise<void> {
    await page.goto(`${ABNAHME}/admin/gutachten`, { waitUntil: 'networkidle' })
    await page.locator('a', { hasText: number }).first().click()
    await page.waitForLoadState('networkidle')
}

test('the table of tyre load at speed: whole where the document prints one, one folded line where it does not', { tag: '@admin-215' }, async ({ page }, info) => {
    await admin(page)

    // The Nachtrag refers to the vehicle's papers for its tyres' index (D-277): no table asked for — one line, folded.
    await openDocument(page, '366-0350-21')
    const fold = page.locator('details.gs-fold')
    await expect(fold.locator('summary')).toContainText('Tragfähigkeit bei hoher Geschwindigkeit')
    await expect(fold.locator('summary')).toContainText('Keine Tabelle hinterlegt')
    await expect(page.locator('section[aria-labelledby="gs-derating-h"]')).toHaveCount(0)

    await fold.locator('summary').click()
    await expect(fold).toContainText('Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt.')
    await expect(fold).toContainText('Laut den Angaben verweist es für Lastindex und Geschwindigkeitssymbol auf die Fahrzeugpapiere.')
    await shotAround(page, [fold], 215, info)

    // ABE 55255 prints its table: there the section stands whole, and says the release waits for it.
    await openDocument(page, '55255')
    const section = page.locator('section[aria-labelledby="gs-derating-h"]')
    await expect(section).toBeVisible()
    await expect(section).toContainText('Laut den Angaben druckt dieses Gutachten eine solche Tabelle')
    await expect(page.locator('details.gs-fold')).toHaveCount(0)
})

type ProductProps = { product: { modelId: number }; catalogue: string }

test('fetched, changed, fetched: a page brought back by Back after a change in the admin asks again and shows it', { tag: '@admin-216' }, async ({ page, context }, info) => {
    // Fetched: the product page — and nothing on its way may keep it.
    const first = await page.goto(`${ABNAHME}${PRODUCT}`, { waitUntil: 'networkidle' })
    expect(first?.headers()['cache-control']).toContain('no-store')
    await open(page, PRODUCT)
    const before = await pageProps<ProductProps>(page)

    // On, by the shop's own link: Back will bring the product page back from the browser's history, unasked.
    await page.getByRole('navigation', { name: 'Brotkrumen' }).getByRole('link', { name: 'Felgen', exact: true }).click()
    await page.waitForURL(/\/felgen(\?|$)/)

    // Changed, in the admin, in another tab: the wheel's description — a write to the catalogue like any other.
    const marker = `Prüftext ${Date.now()}: Diese Beschreibung wurde eben im Admin geändert.`
    const office = await context.newPage()
    await admin(office)
    await office.goto(`${ABNAHME}/admin/felgen/${before.product.modelId}`, { waitUntil: 'networkidle' })
    await office.locator('#fe-desc').fill(marker)
    await Promise.all([
        office.waitForResponse((r) => r.request().method() === 'PUT' && new URL(r.url()).pathname === `/admin/felgen/${before.product.modelId}`),
        office.getByRole('button', { name: 'Speichern', exact: true }).click(),
    ])
    await office.close()

    // Fetched again, by Back: the restored page asks for the catalogue's version, finds it moved on, and shows the change.
    await page.goBack()
    await expect(page.locator('.pdp__desc')).toHaveText(marker)
    expect((await pageProps<ProductProps>(page)).catalogue).not.toBe(before.catalogue)

    await shotAround(page, [page.locator('.pdp__buy h1'), page.locator('.pdp__desc')], 216, info)
})

test('the Blog lists every published article, for every visitor — two guides, the third only after the law firm', { tag: '@admin-212' }, async ({ page }, info) => {
    await open(page, '/blog')

    const main = page.getByRole('main')
    await expect(main.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible()

    const articles = main.getByRole('heading', { level: 2 }).getByRole('link')
    await expect(articles).toHaveCount(2)
    // The guide on ABE, Teilegutachten and ECE waits for the law firm (D-237): no slot, no title, no „weitere folgen“.
    await expect(main).not.toContainText('ABE, Teilegutachten, ECE')
    await expect(main).not.toContainText('weitere folgen')

    await shotAround(page, [main.getByRole('heading', { level: 1 }), articles.last()], 212, info)
})
