import { expect, test } from '../fixtures';
import { SHOP } from '../shop';
import { open } from '../support';
import { CUSTOMER, SHOTS, basketWithAWheel, fillAddress, orderToTestPayment, toPayment } from './pay-support';

// The shop with wheels in it (e2e/shop.ts); its payment is the review's sandbox.
test.use({ baseURL: SHOP });

/*
 * PAY-01 (S1) — Block G review: after a declined payment the customer cannot pay again for the same basket.
 *
 * Found when the order took its goods off the shelf as it was written and a declined payment kept them, while the
 * basket read the shelf as if that order did not exist — so the customer's own declined order made their last wheels
 * „Nicht mehr verfügbar". Since his admin item 7 a rim is not counted any more (D-299): it is available or not. The
 * cycle stays the test, as a customer meets it: decline, back to the Kasse with everything typed
 * still there, pay again — the retry replaces the declined order and is paid; the basket is empty afterwards.
 *
 * Writes (the brief allows test orders on rimify_wf_e2e): one declined test order, cancelled by the retry, and one paid
 * test order. One run only (desktop-1440): the bug was on the server and knows no width.
 */

test('PAY-01 after a declined test payment the same basket can be paid again, and is', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1440', 'server-side and width-free; one run, because every run places orders');
    test.slow();

    await basketWithAWheel(page, 1);

    await open(page, '/kasse');
    await fillAddress(page);
    await toPayment(page);
    await orderToTestPayment(page);

    await page.getByRole('button', { name: 'Zahlung abgelehnt' }).click();
    await page.waitForURL(/\/bestellung\/RMF-/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Die Zahlung hat nicht geklappt.');

    const declined = new URL(page.url()).pathname.split('/').pop() ?? '?';

    await page.getByRole('link', { name: 'Zurück zur Kasse und noch einmal bezahlen' }).click();
    await page.waitForURL((url) => url.pathname === '/kasse', { timeout: 30_000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SHOTS}/pay-01-kasse-after-decline-${info.project.name}.png`, fullPage: true });

    await expect(
        page.getByText('Eine Position im Warenkorb kann so nicht bestellt werden.'),
        `after the test payment was declined, the Kasse refuses the same basket (declined order ${declined})`,
    ).toHaveCount(0);
    await expect(page.locator('#ko-mail'), 'what was typed is still there after the decline').toHaveValue(CUSTOMER.email);

    // And it goes through to the payment again — and this time the payment succeeds.
    await toPayment(page);
    await orderToTestPayment(page);
    await page.getByRole('button', { name: 'Zahlung erfolgreich' }).click();
    await page.waitForURL(/\/bestellung\/RMF-/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vielen Dank für deine Bestellung.');

    const paid = new URL(page.url()).pathname.split('/').pop() ?? '?';
    expect(paid, 'the retry is a new order: the declined one was cancelled and its goods went back first').not.toBe(declined);

    // Paid: the basket is empty.
    await open(page, '/warenkorb');
    await expect(page.getByText('Dein Warenkorb ist noch leer.')).toBeVisible();
});
