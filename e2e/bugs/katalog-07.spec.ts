import { expect, test } from '@playwright/test';
import { SHOTS, guardWrites, signIn, waitForApp } from './katalog-support';

/*
 * KATALOG-07 (S2) — ticking a Felge in the list inserts the „Auswahl" bar above the table: the whole
 * table jumps down by the bar's height (≈ 64 px) under the pointer, and back up when the last tick is
 * taken away. The next click meant for the row below lands a row higher (docs/qa/BUGS.md).
 *
 * Felgen/Index.vue renders `.fg-bulk` with `v-if="canBulk && selected.length"` in the flow, before
 * `.adm-panel`; it holds no space while nothing is chosen.
 *
 * Expected: choosing rows moves nothing that is already on screen (the bar in reserved space, over the
 * table's head, or fixed at the bottom).
 *
 * Nothing is written: rows are only ticked.
 */

test.skip(({ isMobile }) => isMobile, 'Selection is desk work: the phone list has no check boxes.');

test('KATALOG-07 ticking a Felge does not move the table', async ({ page }) => {
    await signIn(page);
    await guardWrites(page);
    await page.goto('/admin/felgen', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    const table = page.locator('table.fg-table');
    const firstRow = table.locator('tbody tr').first();
    const secondRow = table.locator('tbody tr').nth(1);

    await expect(firstRow.locator('input.fg-check')).toBeVisible();

    const top = () => table.evaluate((el) => Math.round(el.getBoundingClientRect().top));
    const before = await top();
    const secondBefore = await secondRow.evaluate((el) => Math.round(el.getBoundingClientRect().top));

    await firstRow.locator('input.fg-check').check();
    await expect(page.locator('.fg-bulk')).toBeVisible();

    const after = await top();
    const secondAfter = await secondRow.evaluate((el) => Math.round(el.getBoundingClientRect().top));

    await page.screenshot({ path: `${SHOTS}/katalog-07-bulk-bar-desktop-1440.png` });

    expect(
        Math.abs(after - before),
        `ticking row 1 moved the table from y=${before} to y=${after}; row 2, aimed at ${secondBefore}, is now at ${secondAfter}`,
    ).toBeLessThanOrEqual(1);
});
