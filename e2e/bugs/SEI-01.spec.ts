import { expect, test } from '@playwright/test';
import { SHOTS, openEditor, signIn } from './seiten-support';

/*
 * SEI-01 (S1) — browser Back with unsaved changes leaves the editor without asking, and the words
 * are gone (docs/qa/BUGS.md).
 *
 * admin-shell.md §8.4: "Navigation away from a dirty form opens a dialog … the panel fails to a
 * kept change, never to a lost one." useDirtyForm holds Inertia's `before` event and the browser's
 * `beforeunload`; Back inside the app is neither — Inertia 3 answers `popstate` by swapping the
 * page from history without a visit, so the guard never hears it.
 *
 * Nothing is saved: the change stays in the form and is dropped with the context.
 */
test('SEI-01 browser Back with unsaved changes asks first and keeps the words', async ({ page }) => {
    await signIn(page);
    await openEditor(page, 'Impressum');

    const title = page.locator('#pg-title');
    const typed = 'Impressum QA SEI-01';

    await title.fill(typed);
    await expect(page.locator('.adm-savebar')).toHaveAttribute('data-state', 'dirty');

    // Alt+Left, the mouse's back button and Android's back gesture all land here.
    await page.goBack({ waitUntil: 'commit' }).catch(() => null);
    await page.waitForTimeout(1_000);
    await page.screenshot({ path: `${SHOTS}/sei-01-back-${test.info().project.name}.png`, fullPage: true });

    const leave = page.getByRole('dialog', { name: 'Änderungen nicht gespeichert' });

    await expect(leave, `no question was asked; the browser is now on ${page.url()}`).toBeVisible({ timeout: 2_000 });

    await leave.getByRole('button', { name: 'Weiter bearbeiten' }).click();
    await expect(page).toHaveURL(/\/admin\/seiten\/\d+$/);
    await expect(title).toHaveValue(typed);
});
