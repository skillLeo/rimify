import { expect, test, type Locator, type Page } from './fixtures';
import { busiestDocument, guardWrites, openAsDraft, signIn, waitForApp } from './bugs/gutachten-support';

/*
 * D-290 in the admin (the operator's brief of 19.10.2026 §3): the figures the team enters that feed a verdict keep their
 * value under the mouse wheel — the Gutachten's axle limit (a number field: numberWheelGuard.ts takes the keyboard off it
 * before the browser can step it) and a car's axle load in the vehicle form (a text field with a numeric keyboard, which
 * the wheel never steps). The shop's half is number-wheel.spec.ts.
 *
 * Nothing is written: guardWrites aborts every write under /admin/gutachten and /admin/fahrzeuge in the browser, and the
 * document is a released one answered in the browser as a draft (gutachten-support.ts).
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

    test('the Gutachten’s axle limit and a car’s axle load keep their values under the wheel', async ({ page }) => {
        // The hazard, in this browser, on a bare page: proved first, so the assertions below cannot pass for want of a
        // browser that steps a focused number field.
        await page.setContent('<input id="bare" type="number" value="1160" step="1" style="margin:200px;width:200px">');
        await wheelOver(page, page.locator('#bare'), '1160');
        await expect(page.locator('#bare'), 'precondition: this browser does not step a focused number field under the wheel').not.toHaveValue('1160');

        await signIn(page);
        await guardWrites(page);

        // The Gutachten entry: the count's axle limit, a number field that decides whether a rim sells alone (D-289).
        const id = await busiestDocument(page);
        await openAsDraft(page, id);
        await page.locator('#zl-edit').click();
        const limit = page.locator('#zl-axle-limit-kg');
        await expect(limit).toHaveAttribute('type', 'number');
        await wheelOver(page, limit, '1160');
        await expect(limit, 'the Gutachten’s axle limit moved under the wheel').toHaveValue('1160');

        // The vehicle form: field 8.1, a text field — the wheel has nothing to step.
        await page.goto('/admin/fahrzeuge/neu', { waitUntil: 'domcontentloaded' });
        await waitForApp(page);
        const front = page.locator('#fn-front');
        await expect(front).toHaveAttribute('type', 'text');
        await wheelOver(page, front, '1.160');
        await expect(front, 'the axle load moved under the wheel').toHaveValue('1.160');
    });
});
