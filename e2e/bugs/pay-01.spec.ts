import { expect, test } from '../fixtures';
import { SHOP } from '../shop';
import { open } from '../support';
import { CUSTOMER, SHOTS, basketWithAWheel, fillAddress, orderToTestPayment, quantityAgainstStock, toPayment } from './pay-support';

// The shop with wheels in it (e2e/shop.ts); its payment is the review's sandbox.
test.use({ baseURL: SHOP });

/*
 * PAY-01 (S1) — Block G review: after a declined payment the customer cannot pay again for the same basket.
 *
 * The order takes its goods off the shelf when it is written (OrderPayments::reserve, inside OrderWriter), and a
 * declined payment keeps them („the order keeps its stock for a retry until it expires" — Failed releases nothing).
 * But the basket reads the shelf as if that order did not exist: Basket::summary sets `inStock` to
 * `stock_qty >= quantity`, and Basket::refusalOf / the page's `blocked` stop the Kasse on it. So wherever the
 * customer's own declined order leaves fewer than they ordered — every size with less than twice the quantity in
 * stock, i.e. the last sets — „Zurück zur Kasse und noch einmal bezahlen" leads to „Eine Position im Warenkorb kann
 * so nicht bestellt werden", and the basket calls their wheel „Nicht mehr verfügbar". The same holds for Stripe
 * (KasseZahlungController asks refusalOf before it looks for the pending order it would reuse), not testable here.
 *
 * Expected: the page the decline leads to takes the payment again, with everything typed still there.
 *
 * The whole cycle, as a customer meets it: reserve, decline, retry, succeed — the retry replaces the declined order
 * (its goods go back first, the new order takes them) and is paid; the basket is empty afterwards.
 *
 * Writes (the brief allows test orders on rimify_wf_e2e): one declined test order, cancelled by the retry, and one paid
 * test order that keeps `quantity` of one size of the second-or-later product sold. One run only (desktop-1440): the
 * bug is on the server and knows no width, and every run sells stock (`composer e2e:shop` restocks the shop).
 */

test('PAY-01 after a declined test payment the same basket can be paid again, and is', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1440', 'server-side and width-free; one run, because every run holds stock');
    test.slow();

    // More than half of the size's stock: after the first order holds it, fewer than that are left on the shelf.
    await basketWithAWheel(page, 1);
    const { stock, quantity } = await quantityAgainstStock(page, (s) => Math.floor(s / 2) + 1);

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
        `after the test payment for ${quantity} of the ${stock} in stock was declined, the Kasse refuses the same basket: ` +
            `the declined order ${declined} still holds its ${quantity}, and the basket counts them as gone`,
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
