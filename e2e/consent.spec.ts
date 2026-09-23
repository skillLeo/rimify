import { expect, test } from '@playwright/test';
import { CONSENT_COOKIE, expectNoHorizontalOverflow, open } from './support';

/*
 * H0 — the cookie sheet. The shop sets only necessary cookies and no statistics service is
 * configured (ACCURACY D7), so the sheet asks for nothing: one sentence, the Datenschutz link and
 * one "Verstanden". No scroll lock, the note kept for twelve months, reopenable from the footer.
 */

test.describe('cookie consent', () => {
    test('offers no statistics choice and keeps the note for twelve months', async ({ page, context }) => {
        await open(page, '/');

        // A region, not a dialog: it must not trap focus or lock the page behind it.
        const sheet = page.getByRole('region', { name: /Cookies/ });
        await expect(sheet).toBeVisible();

        const understood = sheet.getByRole('button', { name: 'Verstanden' });
        await expect(understood).toBeVisible();
        await expect(sheet.getByRole('link', { name: /Datenschutzerklärung/ })).toHaveAttribute('href', '/rechtliches/datenschutz');

        // Nothing to consent to while no statistics service exists.
        await expect(sheet.getByRole('button')).toHaveCount(1);
        await expect(sheet).not.toContainText('Statistik');
        await expect(sheet).not.toContainText('Alle akzeptieren');

        // No scroll lock while the sheet is open.
        await page.mouse.wheel(0, 400);
        await page.waitForTimeout(100);
        expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

        await understood.click();
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
        await page.getByRole('region', { name: /Cookies/ }).getByRole('button', { name: 'Verstanden' }).click();

        const reopen = page.getByRole('contentinfo').getByRole('button', { name: 'Cookie-Einstellungen' });
        await reopen.scrollIntoViewIfNeeded();
        await reopen.click();

        const dialog = page.getByRole('dialog', { name: /Cookie-Einstellungen/ });
        await expect(dialog).toBeVisible();
        // Only the necessary cookies, always on: no switch for a service that does not exist.
        await expect(dialog.getByRole('checkbox')).toHaveCount(0);
        await expect(dialog).not.toContainText('Statistik');
        await expectNoHorizontalOverflow(page);
    });
});
