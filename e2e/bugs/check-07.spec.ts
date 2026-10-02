import { expect, test } from '../fixtures';
import { CHECK_BASE, SHOTS, openSellableAnswer } from './check-support';

test.use({ baseURL: CHECK_BASE });

/*
 * CHECK-07 (S2) — after „Jetzt kaufen“ has added the rims, and while the basket is still loading, the button is live
 * again and reads „Jetzt kaufen“; the panel after an add even offers „Weiter einkaufen“ on a page that is already
 * leaving. A second press — the customer who saw nothing happen on a slow connection — adds a second set: eight rims.
 *
 * `buy()` (Check/Index.vue) guards with `basket.processing` only. The add's `onSuccess` starts `router.visit('/warenkorb')`
 * and returns; the form's `onFinish` then sets `processing` back to false while that visit is in flight. The next
 * press posts again, and the new POST cancels the basket visit. Basket::add merges the same key: 4 + 4.
 *
 * The spec holds the basket's GET back for four seconds and presses the button once more while it waits (a DOM click,
 * so an overlay over the button cannot hide the defect).
 * Expected: one add per „Jetzt kaufen“ that was meant — the button stays busy until the basket is on screen.
 * Puts four rims into the session's basket (eight while the bug is there).
 */

test('CHECK-07 „Jetzt kaufen“ adds once even when pressed again while the basket loads', async ({ page }, info) => {
    await openSellableAnswer(page);

    const posts: string[] = [];

    page.on('request', (request) => {
        if (request.method() === 'POST' && new URL(request.url()).pathname === '/warenkorb') {
            posts.push(request.postData() ?? '');
        }
    });

    // The basket opens slowly, as on a phone on 4G.
    await page.route(
        (url) => url.pathname === '/warenkorb',
        async (route) => {
            if (route.request().method() === 'GET') {
                await new Promise((resolve) => setTimeout(resolve, 4_000));
            }

            await route.continue().catch(() => undefined);
        },
    );

    const button = page.locator('button.chk__go');
    const leaving = page.waitForRequest((request) => request.method() === 'GET' && new URL(request.url()).pathname === '/warenkorb');

    await button.click();
    await leaving;
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${SHOTS}/check-07-while-basket-loads-${info.project.name}.png` });

    // The second press, while the page is on its way to the basket.
    await button.evaluate((element) => (element as HTMLButtonElement).click());
    await page.waitForURL((url) => url.pathname === '/warenkorb', { timeout: 20_000 });

    expect(posts, 'a second press while the basket was loading added a second set').toHaveLength(1);
});
