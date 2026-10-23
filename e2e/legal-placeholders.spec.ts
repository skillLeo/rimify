import { expect, test } from '@playwright/test';
import { SHOP } from './shop';
import { consentGiven, open } from './support';

/*
 * The legal texts are placeholders until the client's Kanzlei delivers them (D-319, the operator's brief of
 * 23.10.2026): every page the footer links, and the Muster-Widerrufsformular the checkout links, holds one notice and
 * nothing that reads like a clause — while the links themselves stay real. The shop's own seed starts every legal text
 * as a placeholder, as a new shop does.
 */

const NOTICE = 'PLATZHALTER: Dieser Text wird vor der Veröffentlichung durch den Rechtstext der Kanzlei ersetzt.';

test.use({ baseURL: SHOP });

test('every legal page the footer links shows the placeholder notice and no word of a text', async ({ page, context }) => {
    await consentGiven(context, SHOP);
    await open(page, '/');

    const links = await page
        .locator('footer')
        .last()
        .getByRole('link')
        .evaluateAll((anchors) => anchors.map((a) => new URL((a as HTMLAnchorElement).href).pathname).filter((p) => p.startsWith('/rechtliches/')));
    const pages = [...new Set([...links, '/rechtliches/widerrufsformular'])];

    // The footer's legal column: the four texts the brief names, the Impressum and Versand among them.
    expect(pages).toEqual(expect.arrayContaining(['/rechtliches/impressum', '/rechtliches/datenschutz', '/rechtliches/agb', '/rechtliches/widerrufsbelehrung', '/rechtliches/widerrufsformular']));

    for (const path of pages) {
        await open(page, path);
        const main = page.locator('main');

        await expect(main.getByText(NOTICE, { exact: true }), `${path} shows the notice`).toBeVisible();
        await expect(main, `${path} shows no seeded marker`).not.toContainText('[Rechtstext folgt');
        await expect(main, `${path} shows no line of the statutory form`).not.toContainText('Hiermit widerrufe');
    }
});
