import { expect, test, type Page } from '@playwright/test';
import { signIn, waitForApp } from './bugs/faq-support';
import { expectNoHorizontalOverflow } from './support';

/*
 * The sketches of the Gutachten rework (the operator's brief of 01.11.2026, Phase 1), as a smoke test: each of the four
 * opens with its banner, its main click path works, nothing overflows the screen — and not one request that could write
 * leaves the browser, whatever is clicked. The sketches hold example data only; this guards that they stay that way.
 */

/** Every request the page sends that is not a read. */
function writes(page: Page): string[] {
    const sent: string[] = [];

    page.on('request', (request) => {
        if (!['GET', 'HEAD'].includes(request.method())) {
            sent.push(`${request.method()} ${new URL(request.url()).pathname}`);
        }
    });

    return sent;
}

async function open(page: Page, path: string): Promise<void> {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await expect(page.locator('[data-sketch-banner]')).toContainText('Skizze – keine echten Daten');
}

test('the Gutachten sketch walks its five steps, reads pasted tyres, and asks before release', async ({ page }) => {
    await signIn(page);
    const sent = writes(page);

    await open(page, '/admin/skizze/gutachten?schritt=1');
    await page.evaluate(() => sessionStorage.clear());
    await open(page, '/admin/skizze/gutachten?schritt=1');

    await expect(page.getByRole('heading', { name: 'Gutachten', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Weiter: Felge' }).click();
    await expect(page.getByRole('heading', { name: 'Für welche Felge gilt das Gutachten?' })).toBeVisible();
    await page.getByRole('button', { name: 'Weiter: Fahrzeuge' }).click();
    await expect(page.getByRole('heading', { name: 'Für welche Fahrzeuge?' })).toBeVisible();
    await page.getByRole('button', { name: 'Weiter: Reifen' }).click();
    await expect(page).toHaveURL(/schritt=4/);

    // „Mehrere einfügen" on the empty Z3 row: two sizes and a pair read, a heading refused, then taken over.
    await page.locator('.sk-todo__item', { hasText: 'BMW Z3' }).click();
    await page.getByRole('button', { name: 'Mehrere einfügen' }).click();
    await page.locator('#sk-paste').fill('225/40R18-88\nFolgende Kombinationen:\nNr. 1: 225/40R18 – 255/35R18');
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('.sk-paste__line')).toHaveCount(3);
    await expect(dialog.locator('.sk-paste__line--bad')).toHaveCount(1);
    await dialog.getByRole('button', { name: '1 Reifen und 1 Kombination übernehmen' }).click();
    await expect(page.locator('.sk-todo__item', { hasText: 'BMW Z3' })).toContainText('1 Reifen · 1 Kombination');

    await page.getByRole('navigation', { name: 'Schritte zum Gutachten' }).getByRole('button', { name: /Freigeben/ }).click();
    await expect(page).toHaveURL(/schritt=5/);

    // Release waits for what is open: the undescribed codes, the cars without provenance, the two questions.
    await expect(page.getByRole('heading', { name: 'Prüfen und freigeben' })).toBeVisible();
    await expect(page.locator('.sk-release__open')).toContainText('ohne Beschreibung');
    await expect(page.locator('.sk-release').getByRole('button', { name: 'Freigeben' })).toBeDisabled();

    await expectNoHorizontalOverflow(page);
    expect(sent, 'the sketch sent a request that could write').toEqual([]);
});

test('the tyre sketch lists models and opens one with its sizes and the question for the client', async ({ page }) => {
    await signIn(page);
    const sent = writes(page);

    await open(page, '/admin/skizze/reifen');
    await expect(page.locator('.rk-row')).toHaveCount(12);
    await page.locator('#rk-saison').selectOption('winter');
    await expect(page.locator('.rk-row')).toHaveCount(4);
    await page.locator('.rk-open').first().click();
    await expect(page).toHaveURL(/modell=/);
    await expect(page.getByRole('heading', { name: 'Größen' })).toBeVisible();
    await expect(page.getByText('Welcher Preis soll im Shop stehen?')).toBeVisible();

    await expectNoHorizontalOverflow(page);
    expect(sent).toEqual([]);
});

test('the product page sketch shows every version without a car and only the approved ones with it', async ({ page }) => {
    const sent = writes(page);

    await open(page, '/skizze/felge');
    await expect(page.locator('.sf-version')).toHaveCount(2);
    await expect(page.locator('.sf-version').first()).toContainText('Breite 8,5 J · ET 30 · Lochkreis 5 × 120');
    await expect(page.getByText('Wähle dein Fahrzeug, dann zeigen wir nur die Ausführungen, die dafür freigegeben sind.')).toBeVisible();

    await page.getByRole('button', { name: /Mit Fahrzeug/ }).click();
    await expect(page.locator('.sf-version:not(.sf-version--struck)')).toHaveCount(1);
    await expect(page.locator('.sf-hint')).toContainText('keine Freigabe vor');
    await page.getByRole('button', { name: 'Anzeigen' }).click();
    await expect(page.locator('.sf-version--struck')).toHaveCount(1);
    await expect(page).toHaveURL(/fahrzeug=1/);

    await expectNoHorizontalOverflow(page);
    expect(sent).toEqual([]);
});

test('the Komplettrad sketch goes from the tyre cards to the basket, with no extra chosen for the customer', async ({ page }) => {
    const sent = writes(page);

    await open(page, '/skizze/komplettraeder?schritt=2');
    await expect(page.locator('.kr-card')).toHaveCount(6);
    await page.getByRole('button', { name: /weitere Reifen anzeigen/ }).click();
    await expect(page.locator('.kr-card')).toHaveCount(12);

    await page.locator('.kr-opt', { hasText: 'Vorne und hinten verschieden' }).click();
    await expect(page.locator('.kr-count')).toHaveText('8 Reifen passen');
    await expect(page.getByRole('button', { name: /Weiter: Extras/ })).toBeDisabled();
    await page.locator('.kr-card').first().locator('.kr-card__pick').click();
    await expect(page.locator('.kr-card--on')).toHaveCount(1);
    await page.getByRole('button', { name: /Weiter: Extras/ }).click();

    // No paid extra chosen for the customer: the free weights, the RDKS question open.
    await expect(page.locator('input[name=kr-rdks]:checked')).toHaveCount(0);
    await expect(page.locator('input[name=kr-weights]:checked')).toHaveValue('silber');

    await page.getByRole('button', { name: /Weiter: Warenkorb/ }).click();
    await expect(page.locator('.kr-basket tbody tr')).toHaveCount(4);
    await expect(page.locator('.kr-basket tbody')).not.toContainText('RDKS');
    await expect(page.locator('.kr-basket tfoot')).toContainText('€');

    await expectNoHorizontalOverflow(page);
    expect(sent).toEqual([]);
});
