import { expect, test, type Page } from '../fixtures';
import { SHOTS, anchorOf, focused, gapRows, keepMailtoInPage, openNachfrage, signIn, type MarkRig } from './ueb-support';

/*
 * UEB-05 (S2) — Nachfrage: marking a gap from the keyboard drops the focus to <body>
 * (docs/qa/BUGS.md).
 *
 * Nachfrage/Index.vue: „Als beobachtet markieren" / „Als angefordert markieren" (row menu) and
 * „In E-Mail-Programm öffnen" (dialog) call mark(), which disables the row's controls for the round
 * trip (`busy`) and posts. The list shown is „Offen": a marked gap is no longer open, so the answer
 * removes its row — and with it the control reka / Dialog.vue just returned the focus to (the menu's
 * trigger, or „Gutachten anfordern", which was disabled at that moment anyway). Nothing moves the
 * focus on: document.activeElement is <body>, the next Tab starts at „Zum Inhalt springen" and walks
 * the rail and topbar again. Working down the list from the keyboard means starting over after
 * every row (admin-shell.md §10: focus is never lost).
 *
 * Expected: the focus lands in the list — the next row's control, or the list itself.
 *
 * Nothing is written: every mark is held in the browser and answered with the list as it stands,
 * without the marked gap (e2e/bugs/ueb-support.ts).
 */

async function markedRowGone(page: Page, rig: MarkRig): Promise<void> {
    await expect.poll(() => rig.marked.size, { message: 'no mark was sent' }).toBe(1);

    const key = [...rig.marked][0] ?? '';

    await expect(page.locator(`[id="${anchorOf(key)}"]`), 'the marked gap is still listed under „Offen"').toHaveCount(0);
    await page.waitForTimeout(500);
}

test.describe('UEB-05 marking a gap from the keyboard keeps the focus in the list', () => {
    test('from the row menu („Als beobachtet markieren")', async ({ page }, info) => {
        await signIn(page);

        const rig = await openNachfrage(page);
        const trigger = gapRows(page).first().getByRole('button', { name: /^Weitere Aktionen für / });

        await trigger.focus();
        await page.keyboard.press('Enter');

        const item = page.getByRole('menuitem', { name: 'Als beobachtet markieren' });

        await expect(item).toBeVisible();
        await item.press('Enter');
        await markedRowGone(page, rig);

        const where = await focused(page);

        await page.screenshot({ path: `${SHOTS}/ueb-05a-focus-after-menu-mark-${info.project.name}.png` });
        expect(where, 'after „Als beobachtet markieren" the focus fell to <body>: the next Tab starts at the top of the page').not.toBe('<body>');
    });

    test('from „Gutachten anfordern" → „In E-Mail-Programm öffnen"', async ({ page }, info) => {
        await signIn(page);
        await keepMailtoInPage(page);

        const rig = await openNachfrage(page);

        await gapRows(page).first().getByRole('button', { name: 'Gutachten anfordern' }).focus();
        await page.keyboard.press('Enter');

        const dialog = page.getByRole('dialog', { name: 'Gutachten anfordern' });

        await expect(dialog).toBeVisible();
        await dialog.getByRole('link', { name: 'In E-Mail-Programm öffnen' }).press('Enter');
        await markedRowGone(page, rig);

        const where = await focused(page);

        await page.screenshot({ path: `${SHOTS}/ueb-05b-focus-after-request-${info.project.name}.png` });
        expect(where, 'after „In E-Mail-Programm öffnen" the focus fell to <body>').not.toBe('<body>');
    });
});
