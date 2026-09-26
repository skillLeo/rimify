import { expect, test } from '@playwright/test';
import { SHOTS, focused, openEditor, signIn } from './seiten-support';

/*
 * SEI-06 (S2) — keyboard: after the preview's Desktop/Handy switch, Tab walks into the live
 * storefront inside the preview frame — its header, search, vehicle selector, every link, the
 * footer — before it ever reaches Verwerfen/Speichern. Enter on a link there navigates the frame
 * away from the draft while the note above still says „Zeigt den gespeicherten Stand im echten
 * Shop." In Desktop mode the frame is scaled (≈0,2–0,7), and so is the shop's focus ring
 * (docs/qa/BUGS.md).
 *
 * PreviewFrame.vue gives the iframe no `tabindex="-1"`/`inert`, and the preview document is fully
 * interactive. Nothing is saved.
 */
test.describe('SEI-06 preview frame in the tab order', () => {
    test.skip(({ isMobile }) => isMobile, 'the preview column exists from 1280 px');

    test('SEI-06 Tab from the device switch goes on to the save bar, not into the shop', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await signIn(page);
        await openEditor(page, 'Startseite');
        await expect(page.locator('.pg-preview__frame--loaded')).toBeVisible({ timeout: 20_000 });

        await page.locator('.pg-preview__devices .adm-chip', { hasText: 'Handy' }).focus();
        await page.keyboard.press('Tab');

        const landed = await page.evaluate(() => document.activeElement?.tagName ?? '');
        const first = await focused(page);

        await page.screenshot({ path: `${SHOTS}/sei-06-tab-into-preview.png` });

        // How far away the save bar really is.
        let tabs = 1;

        while (tabs < 150 && !(await page.evaluate(() => document.activeElement?.classList.contains('adm-savebar__save') ?? false))) {
            await page.keyboard.press('Tab');
            tabs++;
        }

        expect(landed, `Tab from „Handy" landed on ${first}; Speichern came after ${tabs} Tabs`).not.toBe('IFRAME');
    });
});
