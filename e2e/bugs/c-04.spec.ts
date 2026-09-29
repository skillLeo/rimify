import { expect, test } from '../fixtures';
import { signIn } from './gutachten-support';
import { REASON, SHOTS, T88, openWithLimitWarning } from './c-support';

/*
 * C-04 (S2) — Block C review: „Zahl bestätigen" double-clicked sends the confirmation twice.
 *
 * Auflagenverzeichnis.vue confirmLimit() posts at once and never sets `busy` — the button's `:disabled="busy"`
 * stays false for the whole round trip, and the function has no guard of its own. A double click fires two
 * submits: Inertia interrupts the first visit in the browser, but both POSTs have left, and
 * GutachtenAuflagenController::confirmLimit() writes the confirmation and an `approval.limit_confirmed` audit
 * entry for each. The audit log is immutable (R-12): the Protokoll keeps the doubled „… so bestätigt …" for good.
 *
 * Expected: one POST, however often the button is pressed while the first is under way.
 *
 * Nothing is written: a released document is answered in the browser as a draft with the unconfirmed T88
 * (c-support openWithLimitWarning); the confirmation is answered in the browser.
 */

test('C-04 „Zahl bestätigen" pressed twice sends one confirmation', async ({ page }, info) => {
    await signIn(page);

    const { posts } = await openWithLimitWarning(page);

    await page.locator(`#av-limit-${T88.id}`).fill(REASON);
    await page.locator('.av-limit__form').getByRole('button', { name: 'Zahl bestätigen' }).dblclick();

    await expect(page.locator('.av-limit__done'), 'T88 was not shown as confirmed after the answer').toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(500);
    await page.locator('.av').screenshot({ path: `${SHOTS}/c-04-limit-double-click-${info.project.name}.png` });

    expect(posts.length, `„Zahl bestätigen" double-clicked sent ${posts.length} POSTs to …/auflagen/${T88.id}/grenze`).toBe(1);
});
