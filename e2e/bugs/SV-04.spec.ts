import { expect, test } from '@playwright/test'
import { SHOTS, bar, cleanUp, createViews, open, start } from './sv-support'

/*
 * SV-04 (S2) — on a phone the open view's „Aktionen" button — the only way to rename, share or delete a
 * view — is a 32 × 32 px target (docs/qa/BUGS.md).
 *
 * ListViews.vue: scoped `.lv__more { width: var(--sp-32); height: var(--sp-32) }`. The touch floor in
 * admin.css (`@media (pointer: coarse) { .adm .adm-iconbtn { 44 × 44 } }`) has the same specificity
 * (0,2,0) and loses: the page's CSS (Index-*.css) is linked after the layout's (AdminPage-*.css). The
 * tokens promise 44 px for every control below 768 px (`--adm-control-h-lg`, WCAG 2.5.8).
 *
 * Expected: at least 44 × 44 px on a touch screen.
 */

test.skip(({ isMobile }) => !isMobile, 'The touch target on a phone.')

test.beforeEach(async ({ page }) => {
    await start(page, 390, 844)
})

test.afterEach(async ({ page }) => {
    if (!page.isClosed()) {
        await cleanUp(page)
    }
})

test('SV-04 the open view\'s „Aktionen" button is a 44 px target on a phone', async ({ page }) => {
    const [view] = await createViews(page, [{ name: 'QA-SV-04', query: { status: 'offen' } }])

    await open(page, view!.href)

    const more = page.getByRole('button', { name: `Aktionen für die Ansicht „${view!.name}“` })
    await expect(more).toBeVisible()
    await bar(page).screenshot({ path: `${SHOTS}/sv-04-aktionen-390.png` })

    const box = await more.boundingBox()
    const size = `${Math.round(box?.width ?? 0)} × ${Math.round(box?.height ?? 0)} px`

    expect.soft(box?.width ?? 0, `„Aktionen für die Ansicht …" is ${size}`).toBeGreaterThanOrEqual(44)
    expect(box?.height ?? 0, `„Aktionen für die Ansicht …" is ${size}`).toBeGreaterThanOrEqual(44)
})
