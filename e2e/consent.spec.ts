import { expect, test } from '@playwright/test';
import { CONSENT_COOKIE, expectNoHorizontalOverflow, open } from './support';

/*
 * H0 — the cookie sheet. First thing the client sees: two equal buttons and a settings link, no
 * scroll lock, no dark pattern, the choice kept for twelve months, and reopenable from the footer.
 */

test.describe('cookie consent', () => {
    test('offers two equal choices and keeps the decision for twelve months', async ({ page, context }) => {
        await open(page, '/');

        // A region, not a dialog: it must not trap focus or lock the page behind it.
        const sheet = page.getByRole('region', { name: /Cookies/ });
        await expect(sheet).toBeVisible();

        const accept = sheet.getByRole('button', { name: 'Alle akzeptieren' });
        const necessary = sheet.getByRole('button', { name: 'Nur notwendige' });
        await expect(accept).toBeVisible();
        await expect(necessary).toBeVisible();
        await expect(sheet.getByRole('button', { name: 'Einstellungen' }).or(sheet.getByRole('link', { name: 'Einstellungen' }))).toBeVisible();

        // Equal weight: the same height, neither one styled as the "right" answer.
        const [a, n] = await Promise.all([accept.boundingBox(), necessary.boundingBox()]);
        expect(a?.height).toBe(n?.height);

        // No scroll lock while the sheet is open.
        await page.mouse.wheel(0, 400);
        await page.waitForTimeout(100);
        expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

        await necessary.click();
        await expect(sheet).toBeHidden();

        const cookie = (await context.cookies()).find((c) => c.name === CONSENT_COOKIE);
        expect(cookie).toBeDefined();
        expect(JSON.parse(decodeURIComponent(cookie?.value ?? ''))).toMatchObject({ necessary: true, statistics: false });

        // Twelve months, give or take the day the test runs.
        const days = ((cookie?.expires ?? 0) - Date.now() / 1000) / 86_400;
        expect(days).toBeGreaterThan(350);
        expect(days).toBeLessThan(380);

        await page.reload({ waitUntil: 'networkidle' });
        await expect(page.getByRole('region', { name: /Cookies/ })).toBeHidden();
    });

    test('can be reopened from the footer', async ({ page }) => {
        await open(page, '/');
        await page.getByRole('region', { name: /Cookies/ }).getByRole('button', { name: 'Alle akzeptieren' }).click();

        const reopen = page.getByRole('contentinfo').getByRole('button', { name: 'Cookie-Einstellungen' });
        await reopen.scrollIntoViewIfNeeded();
        await reopen.click();

        await expect(page.getByRole('dialog', { name: /Cookie-Einstellungen/ })).toBeVisible();
        await expectNoHorizontalOverflow(page);
    });
});
