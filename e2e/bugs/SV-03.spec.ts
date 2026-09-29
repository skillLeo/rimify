import { expect, test } from '../fixtures'
import { SHOTS, cleanUp, createViews, inside, open, start } from './sv-support'

/*
 * SV-03 (S2) — on a phone an own view, once changed, shows its three actions in one row wider than the
 * screen: „Als Ansicht speichern" (and at 320 px „Verwerfen") is cut off at the edge (docs/qa/BUGS.md).
 *
 * ListViews.vue: `.lv__actions { display: flex; flex: none }` with no wrap, below 768 px only its
 * bottom padding changes. `.btn` is `nowrap`; the three `.btn--sm` („Änderungen speichern", „Verwerfen",
 * „Als Ansicht speichern" with its icon) need ≈ 480 px, the page has 288–398 px (320–430 less 2 × 16).
 * `.adm { overflow-x: clip }` cuts off what sticks out: no sideways scroll, the button is simply gone.
 *
 * Steps: an own view open → change a filter or the sort (the phone sheet) → the actions appear.
 * Expected: every action whole on screen (the row wraps, or stacks).
 */

test.skip(({ isMobile }) => !isMobile, 'The phone widths.')

test.beforeEach(async ({ page }) => {
    await start(page, 390, 844)
})

test.afterEach(async ({ page }) => {
    if (!page.isClosed()) {
        await cleanUp(page)
    }
})

for (const width of [320, 360, 390, 414]) {
    test(`SV-03 at ${width} px the actions of a changed view are whole on screen`, async ({ page }) => {
        const [view] = await createViews(page, [{ name: 'QA-SV-03 Offen', query: { status: 'offen' } }])

        await page.setViewportSize({ width, height: 844 })
        // The view with another sort, as the phone sheet's „Sortierung" leaves it: open, and changed.
        await open(page, `${view!.href}&sort=summe&richtung=ab`)

        const actions = page.locator('.lv__actions').locator('button, a')
        await expect(page.getByRole('button', { name: 'Änderungen speichern' }), 'rig: the view is open and changed').toBeVisible()
        await page.screenshot({ path: `${SHOTS}/sv-03-actions-${width}.png` })

        const cut: string[] = []

        for (const action of await actions.all()) {
            const where = await inside(action, { width })

            if (!where.ok) {
                cut.push(`„${(await action.innerText()).trim()}" ${where.detail}`)
            }
        }

        expect(cut, `cut off at the right edge of a ${width} px screen`).toEqual([])
    })
}
