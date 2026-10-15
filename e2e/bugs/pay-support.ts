import { expect, type Page } from '@playwright/test';
import { open } from '../support';
import { chooseCar } from './c-support';

/*
 * Shared steps of the Block G payment bug tests (docs/qa/BUGS.md, PAY-xx), on the e2e shop (:8010, database
 * `rimify_wf_e2e`), where the payment is the review's sandbox: no money moves.
 *
 * What they write: the car is chosen by key numbers (a cookie), the basket lives in the session. PAY-01 places test
 * orders on this database — the brief allows it — and says in its header which stock they hold. PAY-02 writes nothing.
 */

/** Where the Block G payment bug tests leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/block-g-pay';

/** One customer, typed the way a person types it. */
export const CUSTOMER = {
    email: 'qa-pay@example.com',
    name: 'Erika Mustermann',
    street: 'Hauptstraße',
    houseNumber: '12',
    zip: '10115',
    city: 'Berlin',
};

const ADDED = 'Zum Warenkorb hinzugefügt.';
const SOLD_OUT = 'Diese Größe ist derzeit ausverkauft.';

/** The product pages the listing links to for the chosen car, in the listing's order. */
async function productPaths(page: Page): Promise<string[]> {
    await open(page, '/felgen');

    return page.evaluate(() => {
        const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a.tile__cta, main a[href*="/felgen/"]'));

        return [...new Set(links.map((a) => new URL(a.href).pathname).filter((p) => /^\/felgen\/[^/]+$/.test(p)))];
    });
}

/**
 * Chooses the Golf (HSN 0603, TSN BGU) and puts one wheel into the basket with „In den Warenkorb" — from the
 * `from`-th product of the listing on (the first is kasse.spec's), passing over any whose size is sold out.
 */
export async function basketWithAWheel(page: Page, from = 0): Promise<string> {
    await chooseCar(page);

    const paths = await productPaths(page);

    expect(paths.length, 'the listing for the Golf shows too few products — is the e2e shop seeded?').toBeGreaterThan(from);

    for (const path of paths.slice(from)) {
        await open(page, path);

        const buy = page.getByRole('button', { name: 'In den Warenkorb' }).first();

        if (!(await buy.isVisible()) || !(await buy.isEnabled())) {
            continue;
        }

        await buy.click();
        await expect(page.getByText(ADDED).or(page.getByText(SOLD_OUT)).first()).toBeVisible({ timeout: 20_000 });

        if (await page.getByText(ADDED).first().isVisible()) {
            return path;
        }
    }

    throw new Error(`no product from the ${from + 1}. on could be put into the basket: ${paths.join(', ')}`);
}

/**
 * Finds the stock of the basket line's size the way a customer would: „Anzahl erhöhen" until the basket marks the
 * line „Nicht mehr verfügbar" (the stock is one below), then „Anzahl verringern" down to `pick(stock)`.
 */
export async function quantityAgainstStock(page: Page, pick: (stock: number) => number): Promise<{ stock: number; quantity: number }> {
    await open(page, '/warenkorb');

    const line = page.locator('.bl__line').first();
    const shown = line.locator('.bl__n');
    const more = line.getByRole('button', { name: 'Anzahl erhöhen' });
    const less = line.getByRole('button', { name: 'Anzahl verringern' });
    const soldOut = line.getByText('Nicht mehr verfügbar', { exact: true });

    await expect(soldOut, 'precondition: the line is marked sold out before its quantity was touched').toHaveCount(0);

    let n = Number((await shown.textContent())?.trim());

    while (!(await soldOut.isVisible())) {
        expect(n, 'the size has 99 or more in stock: no quantity can outrun it').toBeLessThan(99);
        await more.click();
        n += 1;
        await expect(shown).toHaveText(String(n));
    }

    const stock = n - 1;
    const quantity = pick(stock);

    while (n > quantity) {
        await less.click();
        n -= 1;
        await expect(shown).toHaveText(String(n));
    }

    await expect(soldOut, `${quantity} of ${stock} must be in stock`).toHaveCount(0);

    return { stock, quantity };
}

/** Types the address step, field by field. */
export async function fillAddress(page: Page): Promise<void> {
    await page.locator('#ko-mail').fill(CUSTOMER.email);
    await page.locator('#ko-name').fill(CUSTOMER.name);
    await page.locator('#ko-street').fill(CUSTOMER.street);
    await page.locator('#ko-nr').fill(CUSTOMER.houseNumber);
    await page.locator('#ko-zip').fill(CUSTOMER.zip);
    await page.locator('#ko-city').fill(CUSTOMER.city);
}

/** From the address step to the payment step with the steps' own buttons. */
export async function toPayment(page: Page): Promise<void> {
    await page.getByRole('button', { name: 'Weiter zu Optionen & Versand' }).click();
    await expect(page.getByRole('heading', { name: 'Optionen & Versand' })).toBeVisible();
    await page.getByRole('button', { name: 'Weiter zur Zahlung' }).click();
    await expect(page.getByRole('heading', { name: 'Zahlung', exact: true })).toBeVisible();
}

/** „Zahlungspflichtig bestellen" → the sandbox's Testzahlung page, or a failure naming the refusal. */
export async function orderToTestPayment(page: Page): Promise<void> {
    const refusal = page.locator('.ko__refusal--after');

    await page.getByRole('button', { name: 'Zahlungspflichtig bestellen' }).click();
    await expect
        .poll(async () => new URL(page.url()).pathname.startsWith('/kasse/testzahlung/') || (await refusal.isVisible()), { timeout: 30_000 })
        .toBe(true);

    if (await refusal.isVisible()) {
        throw new Error(`„Zahlungspflichtig bestellen" was refused: „${((await refusal.textContent()) ?? '').trim()}"`);
    }

    await expect(page.getByRole('button', { name: 'Zahlung abgelehnt' })).toBeVisible();
}
