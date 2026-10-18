import { expect, test } from './fixtures';
import { chooseCar, openProductWithPapers } from './bugs/c-support';
import { SHOP } from './shop';
import { consentGiven, open } from './support';

// A storefront spec: the shop with wheels in it (e2e/shop.ts).
test.use({ baseURL: SHOP });

/*
 * D-290 (the operator's brief of 18.10.2026, §2): in Chrome a focused `<input type="number">` steps its value when the
 * mouse wheel turns over it — a customer types 1160 into a field, scrolls on to read the page, and the figure a verdict
 * is computed from has moved. Every number field lets go of the keyboard when the wheel turns over it
 * (numberWheelGuard.ts, installed for the shop and the admin alike), and the papers form's fields are text fields.
 *
 * A wheel is a mouse's: the phone project has none.
 */
test.describe('D-290 a mouse wheel never moves a figure', () => {
    test.skip(({ isMobile }) => isMobile, 'a phone has no mouse wheel');

    test('a focused number field keeps its value when the wheel turns over it', async ({ page }) => {
        // The hazard, in this browser, on a bare page: a focused number field under the wheel steps — this is what the
        // shop must not do. Proved first, so the assertion below can never pass for want of a browser that steps.
        await page.setContent('<input id="bare" type="number" value="35" step="1" style="margin:200px;width:200px">');
        const bare = page.locator('#bare');
        await bare.focus();
        await bare.hover();
        await page.mouse.wheel(0, -120);
        await expect(bare, 'precondition: this browser does not step a focused number field under the wheel').not.toHaveValue('35');

        // The shop: the Felgenrechner's ET, typed and focused, the wheel turned over it both ways.
        await consentGiven(page.context(), SHOP);
        await open(page, '/felgenrechner');
        const et = page.locator('input[type="number"]').first();
        await et.fill('35');
        await et.focus();
        await et.hover();
        await page.mouse.wheel(0, -120);
        await page.mouse.wheel(0, 120);

        await expect(et).toHaveValue('35');
    });

    test('the papers form has no number field, and what is typed there stays under the wheel', async ({ page }) => {
        test.slow();

        await chooseCar(page);
        await openProductWithPapers(page);

        await expect(page.locator('.pp input[type="number"]'), 'a number field in the papers form').toHaveCount(0);

        const field = page.locator('.pp__form input.input').first();
        await field.fill('1160');
        await field.focus();
        await field.hover();
        await page.mouse.wheel(0, -120);
        await page.mouse.wheel(0, 120);

        await expect(field).toHaveValue('1160');
    });
});
