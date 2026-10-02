import { expect, test } from '../fixtures';
import { CHECK_BASE, SHOTS, openSellableAnswer, sizes } from './check-support';

test.use({ baseURL: CHECK_BASE });

/*
 * CHECK-09 (S2) — without a connection, another size fails without a word, and the page then contradicts itself: the
 * select shows the new size, the answer, the price and „Jetzt kaufen“ under it are still the old size's. „Jetzt kaufen“
 * fails the same silent way.
 *
 * Each choice is a GET visit; the storefront registers no `networkError` handler (only AdminLayout does — see G-05) and
 * Check/Index.vue passes no `onNetworkError`. The select's DOM value is the browser's, so it keeps the size that never
 * loaded.
 *
 * Expected: a designed state — the page says the size could not be loaded and offers to try again, or puts the select
 * back to the size it is answering for. Writes nothing.
 */

test('CHECK-09 a size chosen offline says it could not load, or goes back to the size answered', async ({ page, context }, info) => {
    const before = await openSellableAnswer(page);
    const other = (await sizes(page)).find((size) => size.id !== before.id);

    expect(other, 'precondition: no second size').toBeDefined();

    await context.setOffline(true);
    await page.locator('#chk-size').selectOption(other!.id);

    const select = page.locator('#chk-size');
    const told = page.locator('[role="alert"]:visible, .toast:visible');

    await page.waitForTimeout(3_000);
    await page.screenshot({ path: `${SHOTS}/check-09-offline-${info.project.name}.png`, fullPage: true });

    await expect
        .poll(async () => (await told.count()) > 0 || (await select.inputValue()) === before.id, {
            message: `offline, the select shows „${other!.label}“ over the answer for „${before.label}“, and nothing says the size did not load`,
            timeout: 5_000,
        })
        .toBe(true);

    await context.setOffline(false);
});
