import { expect, test, type Page } from '@playwright/test';
import { waitForApp } from './faq-support';
import { SHOTS, handle, openAdmin, railWidth, recordSaves, resetRail } from './rail-support';

/*
 * RAIL-01 (S2) — the window's collapse is saved as the person's own choice.
 *
 * Between 1024 and 1219 px (260 px rail) the window has no room for the rail beside 960 px of
 * content, so AdminLayout collapses it by force (`railForced`; `railShown = railCollapsed || railForced`).
 * AdminRailHandle starts every drag, click and key from the *shown* state (`state.collapsed =
 * rail.shown`), and dragTo()/keyTo() answer „collapsed" whenever the room is under 232 px — and
 * rail.set() writes that into `railCollapsed`, the stored choice, and PATCHes {"rail":"collapsed"}.
 * The `[` shortcut does the same through toggleRail(), which flips the (invisible) stored choice while
 * the window keeps the rail collapsed anyway.
 *
 * So at 1100 px: one plain click on the handle, Enter or Space on it, one press of `[`, or a drag
 * during which the window becomes that narrow — and the next time the window is wide (or on another
 * machine: the choice is on the account) the rail is collapsed although nobody collapsed it.
 *
 * Expected: a collapse forced by the window never changes the stored choice. Back at 1440 px — and
 * after a reload — the rail is open, as the person left it.
 */

test.skip(({ isMobile }) => isMobile, 'The rail is resized from 1024 px up.');

test.beforeEach(async ({ page }) => {
    await openAdmin(page, 1440);
});

test.afterEach(async ({ page, isMobile }) => {
    // A skipped test still runs this hook, on a blank page with no cookie to read.
    if (!isMobile) {
        await resetRail(page);
    }
});

const shell = (page: Page) => page.locator('.adm');

/** At 1100 px: no room for even 232 px of rail beside 960 px of content, so the window collapses it. */
async function narrowWindow(page: Page): Promise<void> {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.reload({ waitUntil: 'networkidle' });
    await waitForApp(page);
    await expect(shell(page), 'rig: at 1100 px the window collapses the rail').toHaveAttribute('data-rail', 'collapsed');
}

/** Back to a wide window: the rail must be open again, now and after a reload (at `width`, if given). */
async function expectOpenWhenWide(page: Page, saves: string[], shot: string, width: number | null = 260): Promise<void> {
    await page.waitForTimeout(400); // any save the step sent has left
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${SHOTS}/rail-01-${shot}-1440.png` });

    await expect(shell(page), `at 1440 px the rail stays collapsed — the window's collapse was saved as a choice: ${saves.join(' ') || 'no save'}`).toHaveAttribute(
        'data-rail',
        'open',
    );

    await page.reload({ waitUntil: 'networkidle' });
    await expect(shell(page), 'after a reload the stored choice is still „collapsed"').toHaveAttribute('data-rail', 'open');

    if (width !== null) {
        expect(await railWidth(page)).toBe(width);
    }
}

// Fixed by the intent and the effective rail being two states: where the window owns the collapse
// there is no handle to press, and the toggle — still there, saying why — changes nothing.
test('RAIL-01 in a 1100 px window neither the handle nor the toggle can store „collapsed"', async ({ page }) => {
    await narrowWindow(page);
    const saves = recordSaves(page);

    await expect(handle(page)).toBeHidden();

    const toggle = page.locator('.adm-rail__toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-disabled', 'true');
    // Pressed anyway (Playwright would wait for an aria-disabled button to become enabled).
    await toggle.click({ force: true });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(shell(page)).toHaveAttribute('data-rail', 'collapsed');

    await expectOpenWhenWide(page, saves, 'no-handle');
    expect(saves, 'nothing was saved in the narrow window').toEqual([]);
});

test('RAIL-01 the [ shortcut in a 1100 px window does not store „collapsed"', async ({ page }) => {
    await narrowWindow(page);
    const saves = recordSaves(page);

    // Nothing visible happens: the toggle is hidden and the window keeps the rail collapsed.
    await page.locator('#inhalt').focus();
    await page.keyboard.press('[');

    await expectOpenWhenWide(page, saves, 'shortcut');
});

test('RAIL-01 a drag during which the window becomes 1100 px wide does not store „collapsed"', async ({ page }) => {
    const saves = recordSaves(page);
    const box = await handle(page).boundingBox();

    if (!box) {
        throw new Error('no handle');
    }

    const y = box.y + box.height / 2;

    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(300, y, { steps: 6 });
    await page.waitForTimeout(50);

    // The window is made narrower while the button is still held (a snap to half the screen, say).
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.waitForTimeout(100);
    await page.mouse.move(310, y, { steps: 2 });
    await page.waitForTimeout(50);
    await page.mouse.up();

    // Open at the width the drag had reached or at the one it started from: either is the person's.
    await expectOpenWhenWide(page, saves, 'drag-resize', null);
});
