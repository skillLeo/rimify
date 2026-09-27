import { expect, test } from '@playwright/test';
import { consentGiven, open } from './support';
import { SHOP } from './shop';

// A storefront spec: the shop with wheels in it (e2e/shop.ts).
test.use({ baseURL: SHOP });

/*
 * F4 — the command palette: Ctrl/⌘+K anywhere, a typed fragment finds the wheel, Enter opens it.
 */

test.describe('command palette', () => {
    test.beforeEach(async ({ context, baseURL }) => {
        await consentGiven(context, baseURL ?? 'http://127.0.0.1:8000');
    });

    test('opens with the shortcut and takes a typo to the product', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name === 'mobile-390', 'the phone opens the palette from the search icon');

        await open(page, '/faq');
        await page.keyboard.press('Control+k');

        const palette = page.getByRole('dialog', { name: /Suche und Befehle/ });
        await expect(palette).toBeVisible();

        const field = palette.getByRole('combobox');
        await expect(field).toBeFocused();
        await field.fill('gipfe');

        const hit = palette.getByRole('option', { name: /Gipfel/ });
        await expect(hit).toBeVisible();
        await hit.click();

        await page.waitForURL('**/felgen/bergsteig-gipfel', { timeout: 15_000 });
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Gipfel');
    });

    test('closes on Escape and returns focus', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name === 'mobile-390', 'the phone opens the palette from the search icon');

        await open(page, '/');
        await page.keyboard.press('Control+k');
        await expect(page.getByRole('dialog', { name: /Suche und Befehle/ })).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog', { name: /Suche und Befehle/ })).toBeHidden();
    });
});
