import { expect, test } from '../fixtures';
import { SHOP } from '../shop';
import { open } from '../support';
import { CUSTOMER, SHOTS, basketWithAWheel } from './pay-support';

// The shop with wheels in it (e2e/shop.ts).
test.use({ baseURL: SHOP });

/*
 * PAY-02 (S2) — Block G review: a street the browser's address autofill writes with its number („Musterstraße 12")
 * keeps the number, and the address step refuses with „Bitte gib die Hausnummer an.".
 *
 * The number is moved only in touch('street') — on the street field's blur (Kasse/Index.vue, splitHouseNumber). An
 * autofill picked in another field (E-Mail, Name: where the form starts) writes every field without focusing the
 * street, so the street is never left and never split; validateAddress() does not split either. The customer is sent
 * to Hausnummer, types the 12 again — and the order goes to „Musterstraße 12 12". (Hausnummer has
 * `autocomplete="off"`, so the browser leaves it empty; `address-line1` is street and number in one.)
 *
 * Simulated as Chrome fills: value set and `input` + `change` dispatched on each field, the focus left in E-Mail
 * where the suggestion was picked. Expected: „Weiter" goes on to Optionen & Versand, and the recap reads
 * „Musterstraße 12," — street and number each once. Writes nothing: the basket lives in the session.
 */

const STREET_WITH_NUMBER = 'Musterstraße 12';

test('PAY-02 an address autofill that writes the number into Straße still ends with the number in Hausnummer', async ({ page }, info) => {
    test.slow();
    await basketWithAWheel(page);
    await open(page, '/kasse');

    // The customer is in E-Mail and picks the browser's saved address there.
    await page.locator('#ko-mail').focus();
    await page.evaluate(
        (values) => {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

            for (const [selector, value] of Object.entries(values)) {
                const input = document.querySelector<HTMLInputElement>(selector);

                if (input === null || setter === undefined) {
                    throw new Error(`no field ${selector}`);
                }

                setter.call(input, value);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        },
        {
            '#ko-mail': CUSTOMER.email,
            '#ko-name': CUSTOMER.name,
            '#ko-street': STREET_WITH_NUMBER,
            '#ko-zip': CUSTOMER.zip,
            '#ko-city': CUSTOMER.city,
        },
    );

    await expect(page.locator('#ko-mail'), 'the focus stays where the suggestion was picked').toBeFocused();
    await expect(page.locator('#ko-nr'), 'Hausnummer is autocomplete="off": the browser leaves it empty').toHaveValue('');

    await page.getByRole('button', { name: 'Weiter zu Optionen & Versand' }).click();

    const onwards = page.getByRole('heading', { name: 'Optionen & Versand' });
    const numberError = page.locator('#ko-nr-err');

    await expect
        .poll(async () => (await onwards.isVisible()) || (((await numberError.textContent().catch(() => '')) ?? '').trim() !== ''))
        .toBe(true);

    let stuck = '';

    if (!(await onwards.isVisible())) {
        // The autofill did reach the form: every other field passed its check; only the number is missing.
        for (const id of ['ko-mail-err', 'ko-name-err', 'ko-street-err', 'ko-zip-err', 'ko-city-err']) {
            await expect(page.locator(`#${id}`), `precondition: the simulated autofill did not reach the form (#${id})`).toHaveText('');
        }

        await page.screenshot({ path: `${SHOTS}/pay-02-autofilled-street-${info.project.name}.png`, fullPage: true });
        stuck =
            ` — it stayed on Adresse with „${((await numberError.textContent()) ?? '').trim()}" under Hausnummer,` +
            ` and Straße still holds „${await page.locator('#ko-street').inputValue()}"`;
    }

    await expect(onwards, `after an autofill that wrote „${STREET_WITH_NUMBER}" into Straße, „Weiter" must go on${stuck}`).toBeVisible();

    const recap = page.locator('.ko__recap');

    await expect(recap).toContainText(`${STREET_WITH_NUMBER},`);
    await expect(recap).not.toContainText('12 12');
});
