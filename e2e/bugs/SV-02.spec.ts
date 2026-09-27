import { expect, test, type Page } from '@playwright/test'
import { SHOTS, bar, cleanUp, createViews, inside, open, start, type ViewItem } from './sv-support'

/*
 * SV-02 (S2) — the bar of views hides what does not fit: the open view (with its „geändert" and its
 * menu) can be out of sight, and on a desk nothing shows that there are more views (docs/qa/BUGS.md).
 *
 * ListViews.vue: the tabs are one row that scrolls sideways (`.adm-tabs { overflow-x: auto }`) with its
 * scrollbar switched off (`.lv__tabs { scrollbar-width: none }`), and nothing ever scrolls the current
 * tab into view. Every tab is a Link: opening a view re-draws the page and the row starts at „Alle
 * Bestellungen" again. With the own view changed, „Änderungen speichern", „Verwerfen" and „Als Ansicht
 * speichern" (`.lv__actions`, flex: none, ≈ 500 px) take the row's room: at 1024 px the tabs keep
 * ≈ 180–370 px — „Alle Bestellungen" and little else.
 *
 * Who meets it: anyone with more views than fit (up to 30 are allowed, plus those shared with the
 * role) — on a phone after two or three, at 1440 after five or six, at 1024 with one changed view.
 * With a mouse on Windows there is no way to reach the hidden tabs at all (no scrollbar, no
 * sideways wheel); the open view's „Aktionen für die Ansicht …" (rename, delete) is out of reach.
 *
 * Expected: the open view is in sight in the bar, and a row that holds more than it shows says so
 * and can be moved with a mouse (a scrollbar, arrows or a „Weitere Ansichten" menu).
 */

// Chromium as Windows draws it: Playwright's headless default hides every scrollbar.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } })

const MANY: { name: string; query: Record<string, string> }[] = [
    { name: 'QA-Bezahlt, noch nicht versendet', query: { status: 'bezahlt' } },
    { name: 'QA-Offen seit mehr als drei Tagen', query: { status: 'offen' } },
    { name: 'QA-Große Bestellungen ab 1.000 €', query: { min: '1.000' } },
    { name: 'QA-Mit Auflagen, Eintragung nötig', query: { auflagen: '1' } },
    { name: 'QA-Komplettrad, Versand heute', query: { q: 'Komplettrad' } },
    { name: 'QA-Rückfragen zur Zulassungsbescheinigung', query: { q: 'Zulassungsbescheinigung' } },
]

test.beforeEach(async ({ page, isMobile }) => {
    await start(page, isMobile ? 390 : 1440, isMobile ? 844 : 900)
})

test.afterEach(async ({ page }) => {
    if (!page.isClosed()) {
        await cleanUp(page)
    }
})

async function currentTabInSight(page: Page, view: ViewItem, shot: string): Promise<void> {
    const tab = bar(page).getByRole('link', { name: view.name })

    await expect(tab, 'rig: the view is the open one').toHaveAttribute('aria-current', 'page')
    await page.screenshot({ path: `${SHOTS}/${shot}.png` })

    const where = await inside(tab, bar(page))
    expect(where.ok, `the open view „${view.name}" is out of sight in the bar (${where.detail})`).toBe(true)
}

test('SV-02a the open view is in sight in the bar', async ({ page }, info) => {
    const views = await createViews(page, MANY)
    const last = views[views.length - 1]!

    await open(page, last.href)
    await currentTabInSight(page, last, `sv-02a-open-view-${info.project.name}`)

    // Its menu is where rename and delete are.
    const more = page.getByRole('button', { name: `Aktionen für die Ansicht „${last.name}“` })
    const where = await inside(more, bar(page))
    expect(where.ok, `its „Aktionen" button is out of sight (${where.detail})`).toBe(true)
})

test('SV-02b at 1024 px an own view, changed, stays in sight beside its actions', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The actions stand beside the row from 768 px.')

    const views = await createViews(page, MANY.slice(0, 3))
    const last = views[2]!

    await page.setViewportSize({ width: 1024, height: 768 })
    // The view with another sort: open, and changed.
    await open(page, `${last.href}&sort=summe&richtung=ab`)
    await expect(bar(page)).toContainText('geändert')
    await expect(page.getByRole('button', { name: 'Änderungen speichern' })).toBeVisible()

    await currentTabInSight(page, last, 'sv-02b-changed-view-1024')
})

test('SV-02c a row with more views than room shows that there are more, and moves with a mouse', async ({ page, isMobile }) => {
    test.skip(isMobile, 'On a phone the row is swiped.')

    await createViews(page, MANY)
    await open(page, '/admin/bestellungen')
    await page.screenshot({ path: `${SHOTS}/sv-02c-row-1440.png` })

    const row = await bar(page).evaluate((el) => ({
        scroll: el.scrollWidth,
        client: el.clientWidth,
        scrollbar: (el as HTMLElement).offsetHeight - el.clientHeight,
        style: getComputedStyle(el).getPropertyValue('scrollbar-width'),
    }))

    expect(row.scroll, 'rig: six views overflow the row at 1440 px').toBeGreaterThan(row.client)

    const control = await page.locator('.lv').getByRole('button', { name: /weitere|mehr|alle ansichten|blättern|scroll/i }).count()

    expect(
        row.scrollbar > 0 || control > 0,
        `${row.scroll - row.client} px of views are hidden, with no scrollbar (scrollbar-width: ${row.style}) and no control to reach them`
    ).toBe(true)
})
