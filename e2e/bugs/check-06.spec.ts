import { expect, test } from '../fixtures';
import { CHECK_BASE, SHOTS, openSellableAnswer, sizes } from './check-support';

test.use({ baseURL: CHECK_BASE });

/*
 * CHECK-06 (S2) — „Jetzt kaufen“ pressed while another size is loading buys the size that was on screen before.
 *
 * A size is a GET visit (`onSize` → `router.get(…, { preserveState: true })`). Until it answers, the select already
 * shows the new size, while `answer` — and with it `config.id`, the price, the verdict — is still the old one, and the
 * button stays live: `canBuy` knows nothing of a visit in flight. `buy()` posts the old `config.id`; the POST cancels the
 * pending GET, so the page never even shows the size it bought. On a phone on 4G the window is a second or more; at
 * 900 px and wider the button stands right beside the selects.
 *
 * The spec holds the second size's answer back for three seconds, as a slow connection does, and presses the button.
 * Expected: no add of the size the visitor has just left (the button waits for the answer, or adds the size on screen).
 * While the bug is there, four rims of the first size go into the session's basket.
 */

test('CHECK-06 „Jetzt kaufen“ during a size change does not buy the size just left', async ({ page }, info) => {
    const before = await openSellableAnswer(page);
    const other = (await sizes(page)).find((size) => size.id !== before.id);

    expect(other, 'precondition: no second size').toBeDefined();

    const added: number[] = [];

    page.on('request', (request) => {
        if (request.method() === 'POST' && new URL(request.url()).pathname === '/warenkorb') {
            const body = (request.postData() ?? '').match(/"wheelConfigId":\s*(\d+)/);

            added.push(body === null ? Number.NaN : Number(body[1]));
        }
    });

    // The answer for the other size is slow to come, as on a phone on 4G.
    await page.route(
        (url) => url.pathname === '/rimify-check' && url.searchParams.get('groesse') === other!.id,
        async (route) => {
            await new Promise((resolve) => setTimeout(resolve, 3_000));
            await route.continue().catch(() => undefined);
        },
    );

    await page.locator('#chk-size').selectOption(other!.id);
    await page.screenshot({ path: `${SHOTS}/check-06-size-pending-${info.project.name}.png` });
    await page.locator('button.chk__go').click({ timeout: 2_000 }).catch(() => undefined);
    await page.waitForTimeout(1_000);

    expect(
        added,
        `the select showed „${other!.label}“; „Jetzt kaufen“ put „${before.label}“ (id ${before.id}) into the basket`,
    ).not.toContain(Number(before.id));
});
