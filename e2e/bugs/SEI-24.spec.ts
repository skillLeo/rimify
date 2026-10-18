import { expect, test } from '../fixtures';
import { SHOTS, openEditor, sections, signIn } from './seiten-support';

/*
 * SEI-24 (S2) — a double-click on a remove button removes two (docs/qa/BUGS.md, review SEI-BLOCKS-2026-10-19).
 *
 * The first click removes the block (or the table's row); the next one moves up into the same place, so the second click
 * lands on ITS remove button. Bearbeiten.vue removeSection() and GridField.vue removeRow()/removeColumn() take every
 * click. The toast keeps one „Rückgängig" at a time (Chrome/toast.ts: a new toast replaces the current), so only the
 * second block comes back; a row or a column has no undo at all — the only way back is Verwerfen, which drops every other
 * unsaved change too.
 *
 * Nothing is saved: the changes stay in the form.
 */
test('SEI-24a a double-click on a quote’s remove button removes that quote only', async ({ page }) => {
    await signIn(page);
    await openEditor(page, 'HSN und TSN finden');

    const all = sections(page);
    const before = await all.count();

    await page.locator('#pg-add-quote').click();
    await page.locator('#pg-add-quote').click();
    await expect(all).toHaveCount(before + 2);

    await all.nth(before).locator('textarea[id$="-data-text"]').fill('QA SEI-24 erstes Zitat');
    await all.nth(before + 1).locator('textarea[id$="-data-text"]').fill('QA SEI-24 zweites Zitat');

    const label = ((await all.nth(before).locator('h2').textContent()) ?? '').trim();

    expect(label, 'rig: the first new block is a quote').toMatch(/^Zitat \d+$/);

    await page.getByRole('button', { name: `${label} entfernen`, exact: true }).dblclick();
    await page.waitForTimeout(300);

    const left = await all.count();

    await page.screenshot({ path: `${SHOTS}/sei-24a-double-click-remove-${test.info().project.name}.png`, fullPage: true });

    expect(left, `one double-click should remove one quote; ${before + 2 - left} blocks went`).toBe(before + 1);
    await expect(all.nth(before).locator('textarea[id$="-data-text"]')).toHaveValue('QA SEI-24 zweites Zitat');
});

test('SEI-24b a double-click on „Zeile 1 entfernen" removes one row of the table', async ({ page }) => {
    await signIn(page);
    await openEditor(page, 'HSN und TSN finden');

    const all = sections(page);
    const before = await all.count();

    await page.locator('#pg-add-table').click();
    await expect(all).toHaveCount(before + 1);

    const table = all.nth(before);

    await table.getByRole('button', { name: 'Zeile hinzufügen' }).click();
    await table.getByRole('button', { name: 'Zeile hinzufügen' }).click();
    await table.getByLabel('Zeile 1, Spalte 1', { exact: true }).fill('eins');
    await table.getByLabel('Zeile 2, Spalte 1', { exact: true }).fill('zwei');
    await table.getByLabel('Zeile 3, Spalte 1', { exact: true }).fill('drei');

    await table.getByRole('button', { name: 'Zeile 1 entfernen', exact: true }).dblclick();
    await page.waitForTimeout(300);

    const rows = await table.locator('tbody tr').count();

    await page.screenshot({ path: `${SHOTS}/sei-24b-double-click-row-${test.info().project.name}.png`, fullPage: true });

    expect(rows, `one double-click should remove one row; ${3 - rows} went`).toBe(2);
    await expect(table.getByLabel('Zeile 1, Spalte 1', { exact: true })).toHaveValue('zwei');
});
