import { expect, test } from '@playwright/test'
import { SHOTS, bar, cleanUp, createViews, myViews, open, send, start } from './sv-support'

/*
 * SV-01 (S2) — a view can keep filters the list refuses; such a view can never be opened again, nor
 * renamed or deleted from the page (docs/qa/BUGS.md).
 *
 * SavedViewStoreRequest / SavedViewUpdateRequest check only the query's keys (SavedViewRules:
 * `array_diff(array_keys($query), $spec['keys'])`) and that each value is a string of ≤ 120 characters —
 * not the values. BestellungenFilterRequest refuses `status=gibt-es-nicht` or `min=zwölf`, and
 * refuses with `$redirectRoute = 'admin.bestellungen.index'`: the bare list, `?ansicht=` dropped. The
 * view is therefore never the open one, and its „Aktionen für die Ansicht …" menu (ListViews.vue:
 * only `view.id === views.active`) never appears — a tab in the bar that leads to an error and cannot
 * be taken away. The same dead end follows for stored views whenever the list's rules tighten (a
 * status or a sort taken out, a stricter amount parser).
 *
 * Expected: the server refuses to keep what the list refuses (the docblock of SavedViewStoreRequest:
 * „a stored view can never carry anything the list's URL could not") — 422 — and a view that is
 * refused on opening stays reachable for its owner.
 */

test.skip(({ isMobile }) => isMobile, 'The answer of the server is the same for every device.')

test.beforeEach(async ({ page }) => {
    await start(page, 1440)
})

test.afterEach(async ({ page }) => {
    if (!page.isClosed()) {
        await cleanUp(page)
    }
})

test('SV-01a a new view is refused when its filters are ones the list refuses', async ({ page }) => {
    const name = 'QA-SV-01 Status gibt es nicht'
    const status = await send(page, 'POST', '/admin/ansichten', { list: 'bestellungen', name, query: { status: 'gibt-es-nicht' }, role_id: null })

    if (status !== 422) {
        // It was kept. What its owner then meets: the tab sends them to the bare list with an error,
        // the view is never the open one, and there is no menu to rename or delete it.
        const view = (await myViews(page)).find((v) => v.name === name)
        expect(view, 'the refused view was stored').toBeDefined()

        await open(page, view!.href)
        await page.screenshot({ path: `${SHOTS}/sv-01-refused-view-opened.png` })

        expect.soft(page.url(), 'opening the view dropped it: sent to the bare list').toContain(`ansicht=${view!.id}`)
        await expect.soft(page.getByRole('button', { name: `Aktionen für die Ansicht „${name}“` }), 'no way to rename or delete it').toBeVisible()
        await expect.soft(bar(page).getByRole('link', { name })).toHaveAttribute('aria-current', 'page')
    }

    expect(status, 'POST /admin/ansichten kept status=gibt-es-nicht, which /admin/bestellungen refuses').toBe(422)
})

test('SV-01b „Änderungen speichern" is refused for filters the list refuses', async ({ page }) => {
    const [view] = await createViews(page, [{ name: 'QA-SV-01 Gültig', query: { status: 'offen' } }])

    const status = await send(page, 'PATCH', `/admin/ansichten/${view!.id}`, { query: { min: 'zwölf' } })

    expect(status, 'PATCH /admin/ansichten/{view} kept min=zwölf, which /admin/bestellungen refuses').toBe(422)
})
