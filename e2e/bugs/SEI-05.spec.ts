import { expect, test } from '@playwright/test';
import { SHOTS, openEditor, signIn } from './seiten-support';

/*
 * SEI-05 (S2) — from 1280 px the preview column is sticky at `top: var(--sp-16)`, but the admin
 * topbar is sticky at the top too and 56 px tall. Once the fields are scrolled, the preview's head
 * — „Vorschau" and the Desktop/Handy switch — slides under the topbar and is cut off
 * (docs/qa/BUGS.md).
 *
 * admin-shell.md §9.1 puts every other sticky element of the work area at `top: --adm-topbar-h`.
 * Nothing is saved.
 */
test.describe('SEI-05 sticky preview', () => {
    test.skip(({ isMobile }) => isMobile, 'the preview column exists from 1280 px');

    for (const size of [
        { width: 1280, height: 800 },
        { width: 1440, height: 900 },
        { width: 1920, height: 1080 },
    ]) {
        test(`SEI-05 the preview head stays clear of the topbar while scrolling at ${size.width}`, async ({ page }) => {
            await page.setViewportSize(size);
            await signIn(page);
            await openEditor(page, 'Startseite');
            await expect(page.locator('.pg-preview')).toBeVisible();

            await page.evaluate(() => window.scrollTo(0, Math.round(document.documentElement.scrollHeight / 2)));
            await page.waitForTimeout(400);

            const scrolled = await page.evaluate(() => window.scrollY);

            expect(scrolled, 'the editor is long enough to scroll').toBeGreaterThan(200);

            const rects = await page.evaluate(() => {
                const bar = document.querySelector('.adm-topbar')?.getBoundingClientRect();
                const head = document.querySelector('.pg-preview__head')?.getBoundingClientRect();
                const chip = document.querySelector('.pg-preview__devices .adm-chip')?.getBoundingClientRect();
                const probe = chip ? document.elementFromPoint(chip.left + chip.width / 2, chip.top + 4) : null;

                return {
                    barBottom: bar?.bottom ?? 0,
                    headTop: head?.top ?? 0,
                    chipTopCovered: probe !== null && probe.closest('.adm-topbar') !== null,
                };
            });

            await page.screenshot({ path: `${SHOTS}/sei-05-sticky-preview-${size.width}.png` });

            expect(
                rects.headTop,
                `preview head top ${Math.round(rects.headTop)} px, topbar bottom ${Math.round(rects.barBottom)} px; chip top under the topbar: ${rects.chipTopCovered}`,
            ).toBeGreaterThanOrEqual(rects.barBottom);
        });
    }
});
