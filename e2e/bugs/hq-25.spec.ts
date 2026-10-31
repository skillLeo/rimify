import { expect, test } from '../fixtures';
import { SHOP } from '../shop';
import { consentGiven } from '../support';

test.use({ baseURL: SHOP });

/*
 * HQ-25 (S4, Human QA Part C, 31.10.2026) — choosing a car by Marke & Modell on a computer wrote „Applying inline style
 * violates the following Content Security Policy directive“ to the console each time a list opened: reka's list viewport
 * brings a <style> element of its own and takes the CSP nonce from its ConfigProvider, and ours gave it none.
 */

test('HQ-25 the Marke, Modell and Variante lists open without a CSP refusal in the console', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1440', 'the desktop hero\'s comboboxes');
    const refused: string[] = [];
    page.on('console', (m) => {
        if (m.type() === 'error' && /Content Security Policy/.test(m.text())) {
            refused.push(m.text());
        }
    });

    await consentGiven(page.context(), SHOP);
    await page.goto('/', { waitUntil: 'networkidle' });
    const hero = page.getByRole('region', { name: 'Felgen, die an dein Auto dürfen.' });
    await hero.getByRole('tab', { name: 'Marke & Modell' }).click();

    await hero.getByLabel('Marke', { exact: true }).click();
    const makes = page.getByRole('listbox', { name: 'Marken' });
    await expect(makes).toBeVisible();
    // The list's own style is in force: its scrollbar hidden, as reka's <style> sets it.
    await expect(makes.locator('[data-reka-combobox-viewport]')).toHaveCSS('scrollbar-width', 'none');
    await page.getByRole('option', { name: /^BMW/ }).first().click();

    await hero.getByLabel('Modell', { exact: true }).click();
    await expect(page.getByRole('listbox', { name: 'Modelle' })).toBeVisible();

    expect(refused, 'a <style> refused by the CSP').toEqual([]);
});
