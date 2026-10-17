import { expect, test } from '../fixtures';
import { CHECK_BASE, SHOTS, openSellableAnswer } from './check-support';

test.use({ baseURL: CHECK_BASE });

/*
 * CHECK-08 (S2) — a refused add threw the choice away: the tyre, the Wuchtgewichte colour and the RDKS answer jumped back
 * to the defaults, while the refusal under the button still spoke of the choice that was refused.
 *
 * A refusal is `back()->withErrors()` (WarenkorbController::store, BasketLineRequest): the page comes back with new props
 * for the same size. `watch(() => props.answer, …)` fired on every new answer object and reset the choice; and a refusal
 * cleared on „another answer“ would not have been shown at all. Fixed (D-137): the choice is replaced only where the new
 * answer lacks it, and a refusal is cleared only by another size, mode, tyre or colour.
 *
 * The e2e shop holds no tyre for its car (no Komplettrad is offered — the product-page specs met the same), so this spec
 * stages the refusal on the rims: the posted amount raised to 100, which BasketLineRequest refuses („Mehr als 99 Stück …“)
 * with the same redirect back. The Komplettrad half — the tyre and the colour kept — is Check/Index.test.ts („keeps the
 * tyre and colour chosen when a refused add comes back as a new answer“). Writes nothing.
 */

test('CHECK-08 a refused add keeps its refusal and the choice it was made with on screen', async ({ page }, info) => {
    const size = await openSellableAnswer(page);

    // The server refuses the add and answers with this page again.
    await page.route(
        (url) => url.pathname === '/warenkorb',
        async (route) => {
            const request = route.request();

            if (request.method() !== 'POST') {
                await route.continue();

                return;
            }

            await route.continue({ postData: JSON.stringify({ ...(request.postDataJSON() as object), quantity: 100 }) });
        },
    );

    // The add's answer — the redirect back with the refusal — as a step of its own, then the page (D-266).
    const answered = page.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/warenkorb');
    await page.locator('button.chk__go').click();
    await answered;
    await expect(page.locator('.chk__error'), 'the refusal of the add is not shown — or was cleared by the answer that brought it').toContainText('99');
    await page.screenshot({ path: `${SHOTS}/check-08-after-refusal-${info.project.name}.png`, fullPage: true });

    await expect(page.locator('input[name="chk-mode"][value="felgen"]'), 'the mode the add was made in is no longer chosen').toBeChecked();
    await expect(page.locator('#chk-size'), 'the size the add was made for is no longer chosen').toHaveValue(size.id);
    expect(new URL(page.url()).pathname).toBe('/rimify-check');
});
