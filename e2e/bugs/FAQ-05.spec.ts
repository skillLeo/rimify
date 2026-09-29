import { expect, test, type Page } from '../fixtures';
import { SHOTS, focused, openFaq, signIn } from './faq-support';

/*
 * FAQ-05 (S2) — a dialog opened from a row's menu (Bearbeiten, Löschen) does not give focus back:
 * Esc, Abbrechen or the X leave the keyboard on <body>, and the next Tab starts at the top of the
 * page (docs/qa/BUGS.md). admin-shell.md §10.2: „Esc closes the topmost overlay … focus returns to
 * whatever opened it."
 *
 * reka's MenuItem emits `select` and only after `await nextTick()` closes the menu, so the dialog
 * (Components/Ui/Dialog.vue) mounts while the MENU ITEM still has focus; DialogContentImpl stores
 * that item as the opener (`triggerElement`), the menu then removes it, and on close
 * `triggerElement.focus()` is called on a detached node. The menu's own return of focus to its
 * trigger comes in a setTimeout, while the dialog's trap is already up, and is pulled back into the
 * dialog. The same drop follows a successful Löschen (the row and its button are gone) and a
 * Speichern that moves a question to the other group (its row is created anew in the other list).
 *
 * Nothing is saved: both dialogs are left with Esc.
 */
async function openFromMenu(page: Page, item: 'Bearbeiten' | 'Löschen'): Promise<void> {
    const trigger = page.getByRole('button', { name: /^Aktionen für / }).first();

    await trigger.focus();
    await page.keyboard.press('Enter');

    const menu = page.getByRole('menu');

    await expect(menu).toBeVisible();
    await menu.getByRole('menuitem', { name: item }).press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
}

for (const item of ['Löschen', 'Bearbeiten'] as const) {
    test(`FAQ-05 Esc in the dialog „${item}" opened from the row menu puts focus back on that menu's button`, async ({ page }) => {
        await signIn(page);
        await openFaq(page);

        const trigger = page.getByRole('button', { name: /^Aktionen für / }).first();

        await openFromMenu(page, item);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toBeHidden();
        await page.waitForTimeout(300);
        await page.screenshot({ path: `${SHOTS}/faq-05-focus-${item === 'Löschen' ? 'loeschen' : 'bearbeiten'}-${test.info().project.name}.png` });

        await expect(trigger, `after Esc the focus is on ${await focused(page)}`).toBeFocused();
    });
}
