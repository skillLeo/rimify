import { expect, test } from '../fixtures';
import { SHOTS, chooseFromBrandMenu, focused, guardMarkenWrites, signIn, waitForApp } from './k2-support';

/*
 * K2-05 (S2) — Katalog › Marken: „⋯" → „Bearbeiten" never brings the person to the form (docs/qa/BUGS.md).
 *
 * `edit()` fills the form and calls `nameField.focus()` from inside the menu item's `@select` — while the
 * menu is still open and traps the focus (reka FocusScope, modal menu), which takes it straight back; then
 * the closing menu returns the focus to its trigger in a `setTimeout` (DropdownMenuContent
 * `handleCloseAutoFocus`). The focus ends on the row's „⋯", and the page scrolls back to it: the form at the
 * top — now „Marke bearbeiten: …", filled — stays out of view for any row below the fold, which on a phone is
 * nearly every row. „Bearbeiten" looks like it did nothing.
 *
 * Expected: the Name field focused and in view.
 *
 * Nothing is written (every write under /admin/marken is aborted; nothing is saved). The last brand in the
 * list is used — the one furthest from the form.
 */

test('K2-05 „Bearbeiten" from a row\'s menu puts the focus in the form\'s Name field, in view', async ({ page }, info) => {
    await signIn(page);
    await guardMarkenWrites(page);
    await page.goto('/admin/marken', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    const last = ((await page.locator('table.mk__table tbody tr .adm-table__key').last().textContent()) ?? '').trim();

    expect(last, 'no brand listed on /admin/marken').not.toBe('');

    await chooseFromBrandMenu(page, last, 'Bearbeiten');
    await expect(page.locator('#mk-form-title')).toHaveText(`Marke bearbeiten: ${last}`);
    await page.waitForTimeout(400);

    const on = await focused(page);
    const name = page.locator('#mk-name');
    const inView = await name.evaluate((el) => {
        const box = el.getBoundingClientRect();

        return box.bottom > 0 && box.top < window.innerHeight;
    });

    await page.screenshot({ path: `${SHOTS}/k2-05-after-bearbeiten-${info.project.name}.png` });

    expect({ nameFocused: on.startsWith('<input#mk-name'), nameInView: inView }, `after „Bearbeiten" the focus is on ${on}`).toEqual({ nameFocused: true, nameInView: true });
});
