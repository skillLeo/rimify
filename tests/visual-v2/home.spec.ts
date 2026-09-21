import { expect, test } from '@playwright/test';

/*
 * The homepage, as approved. Two states: without a vehicle (the selector) and with one (the
 * vehicle panel and the fitment-aware tiles). Fonts are awaited so a late swap never counts as
 * a diff.
 */

async function settle(page: import('@playwright/test').Page): Promise<void> {
    await page.waitForFunction(() => document.querySelector('#app')?.__vue_app__ !== undefined, null, { timeout: 15_000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

test('homepage without a vehicle', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await settle(page);

    await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});

test('homepage with a vehicle', async ({ page }) => {
    await page.goto('/felgen-suchen', { waitUntil: 'networkidle' });
    await settle(page);
    await page.fill('input[id^=hsn]', '0005');
    await page.fill('input[id^=tsn]', '582');
    await page.locator('form:has(input[id^=hsn]) button[type=submit]').first().click();
    await page.waitForURL('**/felgen', { timeout: 20_000 });

    await page.goto('/', { waitUntil: 'networkidle' });
    await settle(page);

    await expect(page).toHaveScreenshot('home-vehicle.png', { fullPage: true });
});
