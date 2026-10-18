import { expect, test } from '../fixtures';
import { SHOP } from '../shop';
import { focused } from './faq-support';
import { SHOTS, chooseCar, keyboardIsIn, openProductWithPapers } from './c-support';

// A storefront spec: the shop with wheels in it (e2e/shop.ts).
test.use({ baseURL: SHOP });

/*
 * C-02 (S2) — Block C review: „Ändern" under „Nach deinen Angaben: …" drops the keyboard to <body>.
 *
 * PapersForm.vue: the summary's „Ändern" (`#pp-change`) only sets `open = true`. The summary — and the button
 * that has the focus — is replaced by the form (`v-if` / `v-else`), and nothing moves the focus into it. A
 * keyboard or screen-reader user who presses „Ändern" is thrown to the top of the document and must tab
 * through the whole header again to reach 8.1. (The save moves the focus to „Ändern", „Werte löschen" to 8.1:
 * only this third step was missed.)
 *
 * Expected: after „Ändern" the keyboard is in the form — on its first field.
 *
 * The Golf's data holds 8.1, 8.2 and T: the form shows them with where they came from and asks for none of them
 * (D-291), so what the customer gives here is 15.1 and 15.2.
 *
 * Writes nothing but the test context's own cookies (the car, `rmf_papiere`).
 */

test('C-02 „Ändern" puts the keyboard into the form it opens', async ({ page }, info) => {
    test.slow();

    await chooseCar(page);
    await openProductWithPapers(page);

    // Shown, not asked: the figures our data holds.
    await expect(page.locator('.pp__known'), 'the Golf\'s 8.1, 8.2 and T are not shown as known').toHaveCount(3);

    // 15.1 and 15.2 typed and kept, as a customer does — from the keyboard.
    await page.locator('#pp-index_front').fill('225/40 R18 92Y');
    await page.locator('#pp-index_rear').fill('225/40 R18 92Y');
    await page.locator('#pp-index_rear').press('Enter');

    await expect(page.locator('.pp__summary'), 'the summary did not replace the form after „Werte übernehmen"').toBeVisible();
    await expect(page.locator('#pp-change'), 'after the save the keyboard is not on „Ändern" (the builder\'s own promise)').toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.locator('.pp__form')).toBeVisible();
    await page.waitForTimeout(300);

    const on = await focused(page);
    const inForm = await keyboardIsIn(page, '.pp__form');

    await page.locator('.rcheck-panel').screenshot({ path: `${SHOTS}/c-02-after-aendern-${info.project.name}.png` });

    expect(inForm, `after „Ändern" the keyboard is on ${on}, not in the form it opened`).toBe(true);
});
