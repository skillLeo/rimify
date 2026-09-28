import { expect, test } from '../fixtures';
import { SHOTS, signIn, waitForApp } from './bell-support';

/*
 * BELL-04 (S2) — a „Was du bekommst" switch whose save fails stays in the position that was NOT
 * saved (docs/qa/BUGS.md).
 *
 * Benachrichtigungen/Index.vue, saveChoices(): „Refused or lost on the way: the switches go back to
 * what is actually stored." — but it does that in `onError`, and Inertia 3 calls `onError` only for
 * validation errors (a page with `props.errors`). A server failure (500, and 419/403/429 — answered
 * by AdminErrorPage::formFailure as JSON) goes to the `httpException` event, a lost connection to
 * `networkError`; AdminLayout turns both into a toast („… Es wurde nichts gespeichert, deine
 * Eingaben sind noch da …") and the switch keeps the flipped position. The page then shows e.g.
 * „Per E-Mail" on while the account still gets no e-mail — and there is no save button to retry:
 * the only way is to flip it twice. After the toast has gone nothing says it was not stored.
 *
 * Nothing is saved: the PUT never reaches the application (answered 500 in the browser, or dropped).
 */
for (const failure of ['server-500', 'offline'] as const) {
    test(`BELL-04 a switch whose save fails (${failure}) shows what is stored again`, async ({ page }) => {
        await signIn(page);
        await page.goto('/admin/benachrichtigungen', { waitUntil: 'networkidle' });
        await waitForApp(page);

        const box = page.locator('.bn-prefs__table tbody input[type="checkbox"]').first();

        await expect(box, 'this account has no „Was du bekommst" switches').toBeVisible();

        const stored = await box.isChecked();

        await page.route('**/admin/benachrichtigungen/einstellungen', async (route) => {
            if (route.request().method() !== 'PUT') {
                await route.fallback();

                return;
            }

            if (failure === 'offline') {
                await route.abort('internetdisconnected');

                return;
            }

            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                // AdminErrorPage::formFailure(500)
                body: JSON.stringify({
                    message: 'Das hat auf unserer Seite nicht geklappt. Es wurde nichts gespeichert, deine Eingaben sind noch da. Versuch es gleich noch einmal.',
                }),
            });
        });

        const sent = page.waitForRequest((r) => r.url().includes('/admin/benachrichtigungen/einstellungen') && r.method() === 'PUT');

        await box.click();
        await sent;
        await page.waitForTimeout(1_000);
        await page.screenshot({ path: `${SHOTS}/bell-04-switch-after-${failure}-${test.info().project.name}.png`, fullPage: true });

        await expect(
            box,
            `the save failed, yet the switch shows ${stored ? 'off' : 'on'} while ${stored ? 'on' : 'off'} is what is stored`,
        ).toBeChecked({ checked: stored });
        await expect(box, 'the switches are still locked after the failed save').toBeEnabled();
    });
}
