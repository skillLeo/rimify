import { expect, test } from '@playwright/test';
import { SHOTS, guardWrites, isPhone, signIn, waitForApp } from './katalog-support';

/*
 * KATALOG-06 (S2) — phone: in „Felgen filtern", choosing a Sortierung applies at once and shuts the sheet.
 * A Status (Marke, Freigaben, Herkunft) picked a moment before, in the same sheet, is dropped without a
 * word; picked afterwards, it needs the sheet opened again (docs/qa/BUGS.md).
 *
 * Felgen/Index.vue: the sheet's Sortierung is `v-model="sortChoice"`, whose setter closes the sheet and
 * visits with `props.query` — the filters the server last answered, not the sheet's form — and the
 * `watch(() => props.filters)` then resets the form to them. The sheet's own „Anwenden" is never reached.
 *
 * Expected: the sheet stays open until „Anwenden", which applies sort and filters together (or the
 * sort keeps the filters chosen in the sheet).
 *
 * Nothing is written: only GET visits of the list.
 */

test('KATALOG-06 the filter sheet keeps a chosen Status when the Sortierung is changed', async ({ page }, info) => {
    if (!isPhone(info.project.name)) {
        // The sheet is the phone's (below 768 px); a desk browser that narrow gets it too.
        await page.setViewportSize({ width: 390, height: 844 });
    }

    await signIn(page);
    await guardWrites(page);
    await page.goto('/admin/felgen', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    await page.locator('.fg-filterbar').getByRole('button', { name: /Filter/ }).click();

    const sheet = page.getByRole('dialog', { name: 'Felgen filtern' });
    await expect(sheet).toBeVisible();

    await sheet.locator('#fg-s-status').selectOption('draft');
    await sheet.locator('#fg-s-sort').selectOption('preis:auf');

    await page.waitForURL(/sort=preis/, { timeout: 5_000 }).catch(() => undefined);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOTS}/katalog-06-sheet-after-sort-${info.project.name}.png` });

    const url = new URL(page.url());
    const open = await sheet.isVisible();

    expect(
        open || url.searchParams.get('status') === 'draft',
        `after the Sortierung the sheet is ${open ? 'open' : 'closed'} and the list is ${url.pathname}${url.search} — the Status „Entwurf" chosen in the sheet is gone`,
    ).toBe(true);
});
