import { expect, test } from '../fixtures';
import { waitForApp } from './faq-support';
import { SHOTS, openAdmin, railWidth, resetRail, room, storeRail, workWidth } from './rail-support';

/*
 * RAIL-03 (S2) — the rail is collapsed by the window although the window has room for it, and its own
 * button to open it is hidden.
 *
 * AdminLayout forces the collapse whenever the *stored* width does not fit beside 960 px of content
 * (`railForced = !fits(railWidth, viewport)`), and app.blade.php does the same before the first paint;
 * `.adm[data-rail-forced] .adm-rail__toggle { display: none }` then takes the toggle away („nothing to
 * open"). But there is something to open: railResize.ts says the rail „may not be that wide — and
 * with no room even for 232 px, it stays collapsed", and the handle agrees — a drag or Enter on it
 * opens the rail at the room there is (openAt). The toggle and the handle disagree, and `[` flips the
 * hidden stored choice instead (RAIL-01).
 *
 * Who meets it: anyone who set 400 px on a big screen and opens the panel on a 1280 px laptop (room
 * for 320), and everyone at the default 260 px in a 1192–1219 px window (room for 232–259). They get
 * an icon rail with no button to open it; only the invisible 8 px handle does.
 *
 * Expected: where the window has room for at least 232 px of rail, the rail is open at the room there
 * is — or, if it stays collapsed, its toggle is there and opens it. Either way the content keeps 960 px.
 */

test.skip(({ isMobile }) => isMobile, 'The rail is resized from 1024 px up.');

test.beforeEach(async ({ page }) => {
    await openAdmin(page, 1440);
});

// By request, never through the page (e2e/teardown.ts): cleanup never navigates.
test.afterEach(async ({ context, isMobile }) => {
    if (!isMobile) {
        await resetRail(context);
    }
});

const CASES = [
    // A width set on a big screen, the panel opened on a laptop: room for 320 px.
    { viewport: 1280, stored: 400 },
    // The default width, a window a little narrower than 1220 px plus its scrollbar: room for about 235 px.
    { viewport: 1210, stored: 260 },
] as const;

for (const { viewport, stored } of CASES) {
    test(`RAIL-03 at ${viewport} px with ${stored} px stored the rail can be opened, beside 960 px of content`, async ({ page }) => {
        expect(await storeRail(page.context(), { rail: 'open', width: stored }), 'rig: the width is stored').toBeLessThan(300);

        await page.setViewportSize({ width: viewport, height: 900 });
        await page.reload({ waitUntil: 'networkidle' });
        await waitForApp(page);

        const space = await room(page);
        expect(space, 'rig: this window has room for at least 232 px of rail').toBeGreaterThanOrEqual(232);

        await page.screenshot({ path: `${SHOTS}/rail-03-${viewport}-stored-${stored}.png` });

        const shell = page.locator('.adm');
        const toggle = page.locator('.adm-rail__toggle');

        if ((await shell.getAttribute('data-rail')) === 'collapsed') {
            await expect(toggle, `collapsed although ${space} px are free for the rail — and the button that opens it is hidden`).toBeVisible();
            await toggle.click();
        }

        await expect(shell).toHaveAttribute('data-rail', 'open');

        const rail = await railWidth(page);

        expect(rail).toBeGreaterThanOrEqual(232);
        expect(rail).toBeLessThanOrEqual(space);
        expect(await workWidth(page)).toBeGreaterThanOrEqual(960);
    });
}
