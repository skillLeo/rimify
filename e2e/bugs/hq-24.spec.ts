import { expect, test, type Page } from '../fixtures';
import { SHOP } from '../shop';
import { consentGiven } from '../support';

test.use({ baseURL: SHOP });

/*
 * HQ-24 (S2, Human QA Part C, 31.10.2026) — on Android's Chrome, closing a bottom sheet threw the page's own state
 * away: HSN and TSN typed, then „Wo finde ich HSN und TSN?“ opened and closed, and both fields were empty again, the
 * panel back on „Marke & Modell“; a Fahrzeugschein read and „Übernehmen“ pressed, and the numbers went nowhere; a
 * photo it could not read, and no word of it.
 *
 * A sheet pushes one history entry and pops it on closing; its popstate listener must run before Inertia's, or Inertia
 * takes the pop as Back and renders the page anew from history. The listener counted on capture running first on
 * `window`; Chromium runs a window's listeners in the order they were added, capture or not, and Inertia's was added
 * first. WebKit (the iPhone) runs capture first, so the phone suite there never saw it.
 */

// eslint-disable-next-line no-empty-pattern
test.beforeEach(({}, info) => {
    test.skip(!info.project.name.includes('390'), 'the phone homepage and its sheets');
});

async function home(page: Page): Promise<ReturnType<Page['locator']>> {
    await consentGiven(page.context(), SHOP);
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => (document.querySelector('#app') as (Element & { __vue_app__?: unknown }) | null)?.__vue_app__ !== undefined);

    return page.locator('.vpanel').first();
}

async function photograph(page: Page, lines: string[], blur: number): Promise<{ name: string; mimeType: string; buffer: Buffer }> {
    const data = await page.evaluate(([text, radius]) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1400;
        canvas.height = 200 + (text as string[]).length * 120;
        const g = canvas.getContext('2d') as CanvasRenderingContext2D;
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, canvas.width, canvas.height);
        g.fillStyle = '#000000';
        g.font = 'bold 64px Arial, Helvetica, sans-serif';
        g.filter = (radius as number) > 0 ? `blur(${radius as number}px)` : 'none';
        (text as string[]).forEach((line, i) => g.fillText(line, 80, 140 + i * 120));

        return canvas.toDataURL('image/png');
    }, [lines, blur] as const);

    return { name: 'zulassungsbescheinigung.png', mimeType: 'image/png', buffer: Buffer.from(data.split(',')[1] ?? '', 'base64') };
}

test('HQ-24 closing the help sheet, by its button or by Back, keeps the HSN and TSN typed', async ({ page }) => {
    const panel = await home(page);
    await panel.getByRole('tab', { name: 'HSN/TSN' }).click();
    const hsn = panel.getByRole('textbox', { name: 'HSN (Feld 2.1)' });
    const tsn = panel.getByRole('textbox', { name: 'TSN (Feld 2.2)' });
    await hsn.fill('0005');
    await tsn.fill('Z9');

    await panel.getByRole('button', { name: 'Wo finde ich HSN und TSN?' }).click();
    const sheet = page.getByRole('dialog', { name: 'Wo finde ich HSN und TSN?' });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Schließen' }).click();
    await expect(sheet).toBeHidden();

    await expect(panel.getByRole('tab', { name: 'HSN/TSN' })).toHaveAttribute('aria-selected', 'true');
    await expect(hsn).toHaveValue('0005');
    await expect(tsn).toHaveValue('Z9');

    // Back closes the sheet and leaves the page as it was.
    await panel.getByRole('button', { name: 'Wo finde ich HSN und TSN?' }).click();
    await expect(sheet).toBeVisible();
    await page.goBack();
    await expect(sheet).toBeHidden();
    expect(new URL(page.url()).pathname).toBe('/');
    await expect(hsn).toHaveValue('0005');
    await expect(tsn).toHaveValue('Z9');
});

test('HQ-24 the Fahrzeugschein read and „Übernehmen“ pressed: the numbers stand in the fields in view', async ({ page }) => {
    test.setTimeout(120_000);
    const panel = await home(page);

    await panel.locator('input[type="file"]').setInputFiles(await photograph(page, ['Zulassungsbescheinigung Teil I', '2.1   0005', '2.2   582AAB12345'], 0));
    const sheet = page.getByRole('dialog', { name: 'Fahrzeugschein' });
    await sheet.getByRole('button', { name: 'Übernehmen' }).click({ timeout: 90_000 });
    await expect(sheet).toBeHidden();

    await expect(panel.getByRole('tab', { name: 'HSN/TSN' })).toHaveAttribute('aria-selected', 'true');
    await expect(panel.getByRole('textbox', { name: 'HSN (Feld 2.1)' })).toBeVisible();
    await expect(panel.getByRole('textbox', { name: 'HSN (Feld 2.1)' })).toHaveValue('0005');
    await expect(panel.getByRole('textbox', { name: 'TSN (Feld 2.2)' })).toHaveValue('582');
});

test('HQ-24 a photo it cannot read says so beside the fields', async ({ page }) => {
    test.setTimeout(120_000);
    const panel = await home(page);

    await panel.locator('input[type="file"]').setInputFiles(await photograph(page, ['Zulassungsbescheinigung Teil I', '2.1   0005', '2.2   582AAB12345'], 9));

    await expect(panel.getByRole('status').filter({ hasText: 'Wir konnten HSN und TSN nicht lesen' })).toBeVisible({ timeout: 90_000 });
    await expect(panel.getByRole('tab', { name: 'HSN/TSN' })).toHaveAttribute('aria-selected', 'true');
    await expect(panel.getByRole('textbox', { name: 'HSN (Feld 2.1)' })).toBeFocused();
});
