import { expect, test, type Page } from './fixtures';
import { chooseCar } from './bugs/c-support';
import { expectNoHorizontalOverflow, open } from './support';
import { SHOP } from './shop';

// A storefront spec: the shop with wheels in it (e2e/shop.ts), on the narrowest phone the brief names.
test.use({ baseURL: SHOP, viewport: { width: 320, height: 640 } });

/*
 * The checkout, Block G §2: at 320 px nothing scrolls sideways; the whole way — address, options, payment, the
 * test payment and the confirmation — is done with the keyboard alone; a field is checked when it is left, never
 * while typing; what was typed survives a reload; the button says „Zahlungspflichtig bestellen“. On the e2e shop the
 * payment is the review's sandbox (no money moves), so the order ends on the Testzahlung page.
 */

/** Presses Tab until the keyboard is on the element, or fails naming where it was. */
async function tabTo(page: Page, selector: string, max = 40): Promise<void> {
    for (let i = 0; i < max; i++) {
        if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selector)) {
            return;
        }

        await page.keyboard.press('Tab');
    }

    throw new Error(`Tab never reached ${selector}`);
}

/** Presses Tab until the keyboard is on a button that says this. */
async function tabToButton(page: Page, text: string, max = 40): Promise<void> {
    for (let i = 0; i < max; i++) {
        if (await page.evaluate((t) => document.activeElement?.tagName === 'BUTTON' && (document.activeElement.textContent ?? '').includes(t), text)) {
            return;
        }

        await page.keyboard.press('Tab');
    }

    throw new Error(`Tab never reached the button „${text}“`);
}

async function basketWithAWheel(page: Page): Promise<void> {
    await chooseCar(page);
    await open(page, '/felgen');

    const first = page.locator('a.tile__cta, main a[href*="/felgen/"]').first();
    await first.click();
    await page.waitForURL(/\/felgen\/[^/?]+/);
    await page.getByRole('button', { name: 'In den Warenkorb' }).first().click();
    await expect(page.getByText('Zum Warenkorb hinzugefügt.').first()).toBeVisible({ timeout: 20_000 });
}

test.describe('Kasse', () => {
    test('is done with the keyboard alone at 320 px, checks fields on leaving them and keeps what was typed', async ({ page }) => {
        test.slow();
        await basketWithAWheel(page);
        await open(page, '/kasse');
        await expectNoHorizontalOverflow(page);

        // Checked on leaving the field — never while typing.
        await page.locator('#ko-mail').focus();
        await page.keyboard.type('kunde-ohne-at');
        await expect(page.locator('#ko-mail-err')).toHaveText('');
        await page.keyboard.press('Tab');
        await expect(page.locator('#ko-mail-err')).toHaveText('Diese E-Mail-Adresse ist unvollständig – sie braucht ein @ und eine Domain.');

        await page.locator('#ko-mail').focus();
        await page.keyboard.press('Control+A');
        await page.keyboard.type('probe@example.com');
        await tabTo(page, '#ko-name');
        await page.keyboard.type('Erika Mustermann');
        await tabTo(page, '#ko-street');
        await page.keyboard.type('Hauptstraße 12a');
        // Leaving the street hands the number to its own field.
        await tabTo(page, '#ko-zip');
        await expect(page.locator('#ko-nr')).toHaveValue('12a');
        await page.keyboard.type('10115');
        // One place under the PLZ: Ort is filled, nothing typed is overwritten.
        await expect(page.locator('#ko-city')).toHaveValue('Berlin', { timeout: 10_000 });

        // A reload keeps everything typed (this tab only).
        await page.reload();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('#ko-mail')).toHaveValue('probe@example.com');
        await expect(page.locator('#ko-street')).toHaveValue('Hauptstraße');
        await expect(page.locator('#ko-city')).toHaveValue('Berlin');

        // Onwards with the keyboard: Enter on the step's own button, each step.
        await page.locator('#ko-city').focus();
        await tabTo(page, 'button[type="submit"]');
        await page.keyboard.press('Enter');
        await expect(page.getByRole('heading', { name: 'Optionen & Versand' })).toBeFocused();
        await expectNoHorizontalOverflow(page);

        await tabTo(page, 'button[type="submit"]');
        await page.keyboard.press('Enter');
        await expect(page.getByRole('heading', { name: 'Zahlung', exact: true })).toBeFocused();
        await expectNoHorizontalOverflow(page);

        // §312j: the goods, shipping, delivery time and the total directly above the one button.
        const block = page.locator('section.ko__final');
        await expect(block).toContainText('Lieferzeit');
        await expect(block).toContainText(/Gesamt|Summe ohne Versand/);
        await tabTo(page, 'button.ko__pay');
        await expect(page.locator('button.ko__pay')).toHaveText('Zahlungspflichtig bestellen');
        await page.keyboard.press('Enter');

        await page.waitForURL(/\/kasse\/testzahlung\//, { timeout: 30_000 });
        await expectNoHorizontalOverflow(page);
        await tabToButton(page, 'Zahlung erfolgreich');
        await page.keyboard.press('Enter');

        await page.waitForURL(/\/bestellung\/RMF-/, { timeout: 30_000 });
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vielen Dank für deine Bestellung.');
        await expectNoHorizontalOverflow(page);
    });
});
