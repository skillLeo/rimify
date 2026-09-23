import { expect, test, type Page } from '@playwright/test';
import { consentGiven, expectNoHorizontalOverflow, open } from './support';

/*
 * The compare flow (docs/design/sections/home-overhaul.md §2): tick a card → toast and tray; the
 * tray survives an Inertia navigation; *Vergleichen (2)* opens /vergleich with two columns; the
 * card's CTA opens the product page; a keyboard reaches the CTA and then the checkbox; the fifth
 * checkbox is disabled at the cap.
 */

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8000';

function tiles(page: Page) {
    return page.locator('#h5 .tile');
}

function compareInput(page: Page, index: number) {
    return tiles(page).nth(index).locator('input.tile__compare-input');
}

function tray(page: Page) {
    return page.getByRole('region', { name: 'Vergleich' });
}

test.describe('compare', () => {
    test.beforeEach(async ({ context }) => {
        await consentGiven(context, BASE);
    });

    test('ticking a card shows the toast and the tray; the tray survives navigation and opens the comparison', async ({ page }) => {
        // Six server round trips on `php artisan serve`: three times the default budget.
        test.slow();

        // The store hydrates after mount, never during: no hydration warning anywhere on the way.
        const hydration: string[] = [];
        page.on('console', (message) => {
            if (/hydrat/i.test(message.text())) {
                hydration.push(message.text());
            }
        });

        await open(page, '/');
        await expect(tiles(page).first()).toBeVisible();

        await compareInput(page, 0).check();
        await expect(page.locator('.toast__text')).toHaveText(/zum Vergleich hinzugefügt\.$/);
        await expect(page.locator('.toast__action')).toHaveText('Rückgängig');

        const bar = tray(page);
        await expect(bar).toBeVisible();
        await expect(bar.locator('.tray__thumb')).toHaveCount(1);
        await expect(bar.getByRole('button', { name: 'Vergleichen (1)' })).toHaveAttribute('aria-disabled', 'true');

        await compareInput(page, 1).check();
        await expect(bar.locator('.tray__thumb')).toHaveCount(2);
        await expect(bar.getByRole('link', { name: 'Vergleichen (2)' })).toBeVisible();
        await expectNoHorizontalOverflow(page);

        // Persists across an Inertia navigation.
        await page.locator('#h5').getByRole('link', { name: /Felgen (ansehen|anzeigen)/ }).first().click();
        await page.waitForURL('**/felgen**');
        await expect(tray(page).locator('.tray__thumb')).toHaveCount(2);

        // A third from the listing.
        const listingInput = page.locator('.tile input.tile__compare-input:not(:checked)').first();
        await listingInput.check();
        await expect(tray(page).getByRole('link', { name: 'Vergleichen (3)' })).toBeVisible();

        await tray(page).getByRole('link', { name: 'Vergleichen (3)' }).click();
        await page.waitForURL(/\/vergleich\?f=/);
        await expect(page.locator('.compare__head .compare__cell')).toHaveCount(3);
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Felgen vergleichen');
        await expect(tray(page)).toBeHidden();
        await expectNoHorizontalOverflow(page);

        // The same link in a fresh load: the columns are server-rendered, there before hydration.
        const url = page.url();
        await page.goto(url, { waitUntil: 'load' });
        await expect(page.locator('.compare__head .compare__cell')).toHaveCount(3);
        await page.waitForFunction(
            () => (document.querySelector('#app') as (Element & { __vue_app__?: unknown }) | null)?.__vue_app__ !== undefined,
            null,
            { timeout: 15_000 },
        );

        // Removing a column narrows the table, and the link in the address bar follows.
        await page.locator('.compare__head .compare__remove').first().click();
        await expect(page.locator('.compare__head .compare__cell')).toHaveCount(2);
        await expect.poll(() => decodeURIComponent(page.url())).toMatch(/\/vergleich\?f=\d+:\d+,\d+:\d+$/);

        expect(hydration).toEqual([]);
    });

    test('the card CTA opens the product page', async ({ page }) => {
        await open(page, '/');

        const cta = tiles(page).first().locator('a.tile__cta');
        await expect(cta).toHaveText('Details ansehen');
        await expect(cta).toHaveAttribute('aria-label', /: Details ansehen$/);
        // One link per card.
        expect(await tiles(page).first().locator('a').count()).toBe(1);

        await cta.click();
        await page.waitForURL(/\/felgen\/[a-z0-9-]+/);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('a keyboard reaches the CTA and then the checkbox', async ({ page }) => {
        await open(page, '/');

        const tile = tiles(page).first();
        await tile.locator('a.tile__cta').focus();
        await expect(tile.locator('a.tile__cta')).toBeFocused();

        await page.keyboard.press('Tab');
        await expect(tile.locator('input.tile__compare-input')).toBeFocused();

        await page.keyboard.press('Space');
        await expect(tray(page)).toBeVisible();
    });

    test('the cap disables the fifth checkbox and says why', async ({ page }) => {
        await open(page, '/');
        await expect(tiles(page)).toHaveCount(8);

        for (let i = 0; i < 4; i++) {
            await compareInput(page, i).check();
        }

        await expect(tray(page).getByRole('link', { name: 'Vergleichen (4)' })).toBeVisible();
        await expect(compareInput(page, 4)).toBeDisabled();
        await expect(compareInput(page, 3)).toBeEnabled();

        await tiles(page).nth(4).locator('.tile__compare').click({ force: true });
        await expect(page.locator('.toast__text')).toHaveText('Höchstens 4 Felgen im Vergleich – entferne eine, um eine andere hinzuzufügen.');

        await tray(page).getByRole('button', { name: 'Alle entfernen' }).or(tray(page).locator('.tray__thumbs-btn')).first().click();
    });
});
