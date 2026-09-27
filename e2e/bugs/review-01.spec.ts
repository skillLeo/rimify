import { expect, test } from '@playwright/test';
import { SHOTS, guardWrites, signIn, waitForApp } from './gutachten-support';

/*
 * REVIEW-01 (S2) — the screenshot a Rückmeldung carries shows the top of the page, not what the reviewer
 * sees (docs/qa/BUGS.md). useFeedback.ts draws `.adm` with html-to-image, `width`/`height` set to the
 * window: html-to-image applies them to the cloned root and renders it from its own top-left corner, so
 * after any scrolling the picture is the page's first screen. „What the person sees: the window, not the
 * whole scrolled page" is the code's own promise; a point about a row far down arrives with a picture of
 * the header, and the team looks in the wrong place.
 *
 * Expected: the screenshot shows the part of the page that was on screen when R was pressed.
 *
 * The page is marked in the browser with a magenta block at its end; the list is scrolled to it; R opens
 * the dialog; the picture is read back in the browser and the magenta counted.
 *
 * Nothing is written: the dialog is closed with Esc; `guardWrites` would stop a send in the browser.
 */

test('REVIEW-01 the screenshot of a Rückmeldung shows what is on screen', async ({ page }, info) => {
    // Drawing the page into a picture takes a few seconds on a slow machine.
    test.setTimeout(90_000);

    await signIn(page);
    await guardWrites(page);
    await page.goto('/admin/fahrzeuge', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    const visible = await page.evaluate(async () => {
        const marker = document.createElement('div');
        marker.id = 'qa-review-01';
        marker.style.cssText = 'height: 240px; margin: 0; background: #ff00ff;';
        document.querySelector('main#inhalt')?.appendChild(marker);
        window.scrollTo(0, document.documentElement.scrollHeight);
        await new Promise((resolve) => setTimeout(resolve, 300));

        const r = marker.getBoundingClientRect();
        const top = Math.max(0, r.top);
        const bottom = Math.min(window.innerHeight, r.bottom);
        const left = Math.max(0, r.left);
        const right = Math.min(window.innerWidth, r.right);

        return { area: Math.max(0, bottom - top) * Math.max(0, right - left), scrollY: Math.round(window.scrollY) };
    });

    expect(visible.area, 'the marker at the end of the page is not on screen after scrolling').toBeGreaterThan(0);
    expect(visible.scrollY, 'the page did not scroll (too short to test)').toBeGreaterThan(0);

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('r');

    const dialog = page.getByRole('dialog', { name: 'Rückmeldung geben' });
    await expect(dialog).toBeVisible({ timeout: 30_000 });

    const shot = dialog.locator('img.fb-shot');
    const src = (await shot.count()) > 0 ? await shot.getAttribute('src') : null;

    expect(src, 'no screenshot was taken („Ein Bildschirmfoto ließ sich hier nicht machen")').not.toBeNull();

    const magenta = await page.evaluate(async (dataUrl) => {
        const img = new Image();
        img.src = dataUrl;
        await img.decode();

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const context = canvas.getContext('2d');

        if (!context) {
            return -1;
        }

        context.drawImage(img, 0, 0);

        const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let n = 0;

        for (let i = 0; i < data.length; i += 4) {
            if ((data[i] ?? 0) > 220 && (data[i + 1] ?? 255) < 60 && (data[i + 2] ?? 0) > 220) {
                n++;
            }
        }

        return n;
    }, src ?? '');

    await page.screenshot({ path: `${SHOTS}/review-01-dialog-${info.project.name}.png` });
    await page.keyboard.press('Escape');

    expect(
        magenta,
        `scrolled ${visible.scrollY} px down with ${visible.area} px² of the magenta block on screen; the screenshot holds ${magenta} magenta pixels`,
    ).toBeGreaterThan(visible.area * 0.5);
});
