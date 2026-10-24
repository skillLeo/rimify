import { expect, test } from '../fixtures';
import { isPhone, signIn, waitForApp } from './ueb-support';

/*
 * D-337 — the suite's servers answer on the day a spec names (X-E2E-Today, App\Http\Middleware\E2eToday): the wiring
 * UEB-02 and every day-bound spec rest on (onDemoDay), proven on a day the calendar is not. Without it a day-bound spec
 * reads the calendar again and breaks the day its data grows old — the smell of docs/dev/TEST-SMELLS.md §4.
 *
 * Nothing is written: one page is read. The Zeitraum it asks for is the one the account is left with (30 days).
 */

test('the suite’s servers answer on the day a spec names, never on the calendar’s (D-337)', async ({ page }, info) => {
    test.skip(isPhone(info.project.name), 'The wiring is the server’s, the same for every width.');

    await signIn(page);
    await page.context().setExtraHTTPHeaders({ 'X-E2E-Today': '2026-09-27' });
    await page.goto('/admin?zeitraum=30', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    // The 30 days up to the day named — whatever today is.
    await expect(page.locator('.dash__period-range')).toHaveText('29.08.–27.09.2026');
});
