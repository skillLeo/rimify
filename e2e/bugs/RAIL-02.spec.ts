import { expect, test } from '../fixtures';
import { SHOTS, handle, isRailSave, openAdmin, railWidth, recordSaves, resetRail } from './rail-support';

/*
 * RAIL-02 (S2) — moved from the keyboard, then off to another page within the second: the rail jumps
 * back to an earlier width, and that earlier width is what gets saved.
 *
 * Keys save „soon" (AdminLayout's saveRail(false)): the first key is sent at once, every later one
 * waits for the one-second timer — and nothing sends it earlier when the keys stop (a drag has its
 * pointerup „now"; the keyboard has no equivalent). Meanwhile AdminLayout watches the server's
 * `admin.preferences.railWidth` and copies it into the rail whenever it changes, unless a drag is in
 * progress. An Inertia visit inside that second brings back the width of the first key (the server
 * has nothing newer), the watcher puts the rail back there, and when the timer fires it sends… the
 * rail's width as it now is: the old one. The width the person chose is gone, on screen and on the
 * account. (Enter twice — collapse, open — then a visit ends with the rail collapsed the same way.)
 *
 * Steps: 1440 px, Übersicht, rail 260. Tab to the handle, → → → (308 px), then at once click
 * „Übersicht" in the rail (or `g u`).
 * Expected: the rail stays at 308 px, and 308 is saved (still 308 after a reload).
 * Actual: the rail jumps back to 276 px when the page arrives; 276 is saved.
 */

test.skip(({ isMobile }) => isMobile, 'The rail is resized from 1024 px up.');

test.beforeEach(async ({ page }) => {
    await openAdmin(page, 1440);
});

test.afterEach(async ({ page, isMobile }) => {
    if (!isMobile) {
        await resetRail(page);
    }
});

test('RAIL-02 keys, then a page visit within the second: the rail keeps its width, and that width is saved', async ({ page }) => {
    const saves = recordSaves(page);
    const firstSave = page.waitForResponse((response) => isRailSave(response.request().method(), response.url()));

    await handle(page).focus();
    const started = Date.now();

    await page.keyboard.press('ArrowRight'); // 276 — sent at once
    await page.keyboard.press('ArrowRight'); // 292 — waits for the rest of the second
    await page.keyboard.press('ArrowRight'); // 308 — waits too
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '308');

    const first = await firstSave;
    expect(first.request().postData() ?? '', 'rig: the first key is saved at once').toContain('"width":276');

    // The visit itself — not the charts' deferred request that follows it.
    const visit = page.waitForResponse(async (response) => {
        const request = response.request();

        return (
            request.method() === 'GET' &&
            new URL(response.url()).pathname === '/admin' &&
            (await request.headerValue('x-inertia')) !== null &&
            (await request.headerValue('x-inertia-partial-data')) === null
        );
    });

    expect(Date.now() - started, 'rig: the page must be left inside the second the later keys wait for').toBeLessThan(900);

    // The rail's own „Übersicht": an ordinary Inertia visit.
    await page.locator('a.adm-rail__item[href="/admin"]').click();
    await visit;
    // The page swapped in, and the held-back save has left.
    await page.waitForTimeout(1_500);

    await page.screenshot({ path: `${SHOTS}/rail-02-after-visit-1440.png` });

    expect(await handle(page).getAttribute('aria-valuenow'), `the rail jumped back to the width the server had a moment ago; saved: ${saves.join(' ')}`).toBe('308');
    expect(await railWidth(page)).toBe(308);

    await page.reload({ waitUntil: 'networkidle' });
    expect(await railWidth(page), `after a reload: the width saved last is not the one the rail was left at; saved: ${saves.join(' ')}`).toBe(308);
});
