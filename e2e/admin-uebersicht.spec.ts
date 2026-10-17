import { expect, test, type Page } from './fixtures'
import { signIn } from './bugs/faq-support'

/*
 * The Übersicht as a person uses it (docs/admin/rest-build-plan.md, „Übersicht und Shell“ step H):
 * one Zeitraum steers every widget, every figure opens the list it counts, every coverage cell the
 * variants it counts, and the rail's foot — health, Neu, the account — is reachable from the keyboard
 * and signs out. On a phone the foot lives in „Mehr“.
 *
 * The Zeitraum is remembered on the account, so every test that changes it puts 30 days back.
 */

const desktop = (name: string): boolean => !name.startsWith('mobile')

async function open(page: Page, query = '?zeitraum=30'): Promise<void> {
    await signIn(page)
    await page.goto(`/admin${query}`, { waitUntil: 'networkidle' })
}

/** `Y-m-d` of the first Berlin day of the last `days` days. */
function firstDay(days: number): string {
    const berlin = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
    berlin.setDate(berlin.getDate() - (days - 1))

    return `${berlin.getFullYear()}-${String(berlin.getMonth() + 1).padStart(2, '0')}-${String(berlin.getDate()).padStart(2, '0')}`
}

test.describe('the Übersicht', () => {
    test('one Zeitraum changes every widget, and is remembered', async ({ page }) => {
        await open(page)
        await expect(page.locator('.dash__period-name')).toHaveText('Letzte 30 Tage')

        await page.getByRole('group', { name: 'Zeitraum' }).getByText('7 Tage', { exact: true }).click()
        await expect(page).toHaveURL(/zeitraum=7/)
        await expect(page.locator('.dash__period-name')).toHaveText('Letzte 7 Tage')

        // The figures count the new days: each tile's list opens on them.
        const umsatz = page.locator('a.kpi').filter({ has: page.locator('.kpi__label', { hasText: /^\s*Umsatz\s*$/ }) })
        await expect(umsatz).toHaveAttribute('href', new RegExp(`von=${firstDay(7)}`))

        // The deferred widgets come again for the new days: the Nachfrage-Lücken count them.
        await expect(page.getByRole('heading', { name: 'Nachfrage-Lücken' })).toBeVisible()

        // Remembered: the Übersicht opens on it without asking.
        await page.goto('/admin', { waitUntil: 'networkidle' })
        await expect(page.locator('.dash__period-name')).toHaveText('Letzte 7 Tage')

        await page.goto('/admin?zeitraum=30', { waitUntil: 'networkidle' })
        await expect(page.locator('.dash__period-name')).toHaveText('Letzte 30 Tage')
    })

    test('a figure opens the list it counts', async ({ page }) => {
        await open(page)

        const open_ = page.locator('a.kpi', { hasText: 'Offene Bestellungen' })
        await expect(open_).toHaveAttribute('href', /status=offen/)
        await open_.click()

        await expect(page).toHaveURL(/\/admin\/bestellungen\?.*status=offen/)
        await expect(page.getByRole('heading', { level: 1, name: 'Bestellungen' })).toBeVisible()
    })

    test('a coverage cell opens the variants it counts', async ({ page }) => {
        await open(page)

        const cell = page.locator('a.cm__cell').first()
        await cell.scrollIntoViewIfNeeded()
        const sentence = (await cell.getAttribute('aria-label')) ?? ''
        const [make, size] = sentence.split(' Zoll')[0]!.split(', ')

        await cell.click()

        await expect(page).toHaveURL(new RegExp(`/admin/abdeckung\\?marke=${encodeURIComponent(make!).replace(/%20/g, '\\+')}&zoll=${size}`))
        await expect(page.getByRole('heading', { name: `${make}, ${size} Zoll` })).toBeVisible()
    })

    test('the rail foot is reachable from the keyboard, and its account menu signs out', async ({ page }, info) => {
        test.skip(!desktop(info.project.name), 'On a phone the foot lives in „Mehr“ (next test).')
        await open(page)

        const profile = page.locator('.adm-foot__profile')
        let reached = false

        for (let i = 0; i < 80 && !reached; i++) {
            await page.keyboard.press('Tab')
            reached = await profile.evaluate((el) => el === document.activeElement)
        }

        expect(reached).toBe(true)
        await page.keyboard.press('Enter')

        const menu = page.getByRole('menu')
        await expect(menu).toBeVisible()
        await expect(menu.getByRole('menuitem', { name: 'Profil' })).toBeVisible()

        await menu.getByRole('menuitem', { name: 'Abmelden' }).click()
        await expect(page).toHaveURL(/\/admin\/anmelden/)
    })

    test('on a phone the foot is in „Mehr“: health, Neu anlegen, the account, Abmelden', async ({ page }, info) => {
        test.skip(desktop(info.project.name), 'The phone shell only.')
        await open(page)

        await page.getByRole('button', { name: 'Mehr' }).click()
        const sheet = page.getByRole('dialog', { name: 'Mehr' })

        await expect(sheet).toBeVisible()
        await expect(sheet.getByText('Neu anlegen')).toBeVisible()
        await expect(sheet.getByRole('link', { name: /Profil/ })).toBeVisible()

        await sheet.getByRole('button', { name: 'Abmelden' }).click()
        await expect(page).toHaveURL(/\/admin\/anmelden/)
    })

    test('never scrolls sideways', async ({ page }) => {
        await open(page)

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow).toBeLessThanOrEqual(0)
    })

    // One test per width: three pages each, not nine in one minute (D-266).
    for (const [screen, width] of [['the tablet', 768], ['the laptop', 1280], ['the wide screen', 1920]] as const) {
        test(`fits ${screen} (${width} px), with its two pages beneath`, async ({ page }, info) => {
            test.skip(!desktop(info.project.name), 'The widths of a desktop browser.')
            await signIn(page)
            await page.setViewportSize({ width, height: 1000 })

            for (const path of ['/admin?zeitraum=30', '/admin/nachfrage', '/admin/abdeckung?marke=BMW&zoll=19']) {
                await page.goto(path, { waitUntil: 'networkidle' })
                const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

                expect(overflow, `${path} at ${width} px`).toBeLessThanOrEqual(0)
            }
        })
    }
})
