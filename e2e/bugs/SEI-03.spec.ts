import { expect, test } from '@playwright/test';
import { SHOTS, openEditor, signIn } from './seiten-support';

/*
 * SEI-03 (S2) — a Speichern that never reaches the server (offline, Wi-Fi gone, proxy down) fails
 * without a word: the bar shows „Wird gespeichert …" and then quietly returns to „Nicht
 * gespeicherte Änderungen", no toast, no failed state, no retry hint (docs/qa/BUGS.md).
 *
 * useDirtyForm.send() only knows validation errors (onError); Inertia 3 reports a network failure
 * through onNetworkError, which nothing handles, and then rejects a promise nobody catches.
 * admin-shell.md §8.3 (Error: „Die Änderungen konnten nicht gespeichert werden.") and §9.4
 * (a mutation failure is a toast).
 *
 * Nothing is saved: the request is aborted in the browser.
 */
test('SEI-03 a Speichern that cannot reach the server says so', async ({ page }) => {
    const uncaught: string[] = [];

    page.on('pageerror', (error) => uncaught.push(String(error)));

    await signIn(page);
    await openEditor(page, 'Impressum');
    await page.locator('#pg-title').fill('Impressum QA SEI-03');

    await page.route('**/admin/seiten/*/entwurf', (route) =>
        route.request().method() === 'PUT' ? route.abort('internetdisconnected') : route.continue(),
    );

    await page.locator('.adm-savebar__save').click();
    await page.waitForTimeout(1_500);
    await page.screenshot({ path: `${SHOTS}/sei-03-offline-${test.info().project.name}.png` });

    const status = (await page.locator('.adm-savebar__status').textContent())?.trim();
    const context = `bar status "${status}"; uncaught: ${uncaught.join(' | ') || 'none'}`;

    await expect(page.locator('.adm-savebar'), context).toHaveAttribute('data-state', 'failed');

    // Said where the person looks: the bar's status line from 768 px, a toast on the phone.
    const said = page
        .locator('.toast, .adm-savebar__status, [role="alert"]')
        .filter({ hasText: /nicht gespeichert werden|keine Verbindung|nicht erreichbar|offline/i })
        .filter({ visible: true });

    await expect(said.first(), context).toBeVisible();
});
