import { expect, test, type Locator, type Page } from './fixtures';
import { signIn, waitForApp } from './bugs/gutachten-support';
import { chooseFirstWheel, freshNumber, newPaper, searchCars } from './gutachten-erfassung-support';

/*
 * D-290 in the admin (the operator's brief of 19.10.2026 §3): the figures the team enters that feed a verdict keep their
 * value under the mouse wheel — a code's axle load in step 4 („Was bewirkt der Code?“ → Tragfähigkeit), which since the client's
 * round of 08.11.2026 is the one place a paper's axle-load limit is entered (D-441), and a car's axle load in the vehicle form.
 * Both are text fields with a numeric keyboard, which the wheel never steps. The shop's half is number-wheel.spec.ts.
 *
 * The figures are not saved: the wheel is turned over the form without saving it.
 */

/**
 * The value typed, the field focused, the wheel turned over it twice the same way. Never up and then down: on an
 * unguarded field the two steps cancel out, and the test would pass without any guard at all.
 */
async function wheelOver(page: Page, field: Locator, value: string): Promise<void> {
    await field.fill(value);
    await field.focus();
    await field.hover();
    await page.mouse.wheel(0, -120);
    await page.mouse.wheel(0, -120);
}

test.describe('D-290 a mouse wheel never moves a figure in the admin', () => {
    test.skip(({ isMobile }) => isMobile, 'a phone has no mouse wheel');

    test('a code’s axle load and a car’s axle load keep their values under the wheel', async ({ page }) => {
        // The hazard, in this browser, on a bare page: proved first, so the assertions below cannot pass for want of a
        // browser that steps a focused number field.
        await page.setContent('<input id="bare" type="number" value="1160" step="1" style="margin:200px;width:200px">');
        await wheelOver(page, page.locator('#bare'), '1160');
        await expect(page.locator('#bare'), 'precondition: this browser does not step a focused number field under the wheel').not.toHaveValue('1160');

        await signIn(page);

        // The Gutachten entry: a code's axle load in step 4, a figure that limits a tyre to cars within it (D-395, D-441).
        await newPaper(page, freshNumber('E2E-RAD'));
        await chooseFirstWheel(page);
        await page.getByRole('button', { name: 'Weiter: Fahrzeuge' }).click();
        await searchCars(page, 'BMW');
        await page.locator('.ef-hit input').first().check();
        await expect(page.locator('.ef-chosen__car')).toHaveCount(1);
        await page.getByRole('button', { name: 'Weiter: Reifen' }).click();
        await page.locator('#ef-tab-codes').click();
        await page.getByRole('button', { name: 'Code hinzufügen' }).click();
        await page.locator('#ef-new-code-kind').selectOption('reifen_tragfaehigkeit');
        const limit = page.locator('#ef-new-code-kg');
        await expect(limit).toHaveAttribute('type', 'text');
        await wheelOver(page, limit, '1850');
        await expect(limit, 'the code’s axle load moved under the wheel').toHaveValue('1850');

        // The vehicle form: field 8.1, a text field — the wheel has nothing to step.
        await page.goto('/admin/fahrzeuge/neu', { waitUntil: 'domcontentloaded' });
        await waitForApp(page);
        const front = page.locator('#fn-front');
        await expect(front).toHaveAttribute('type', 'text');
        await wheelOver(page, front, '1.160');
        await expect(front, 'the axle load moved under the wheel').toHaveValue('1.160');
    });
});
