import { expect, test } from '../fixtures';
import { SHOTS, bell, focused, holdLatest, signIn, waitForApp } from './bell-support';

/*
 * BELL-01 (S2) — opening the bell from the keyboard puts focus on „Alle als gelesen markieren", not
 * on the newest alert (docs/qa/BUGS.md).
 *
 * WAI-ARIA menu button: Enter, Space or ↓ on the button opens the menu and focuses its first item.
 * reka does that at the moment the menu mounts — and at that moment AdminBell shows its loading
 * skeleton, which holds no menu item. The first item that exists is the footer's „Alle als gelesen
 * markieren" (or „Alle Benachrichtigungen" when nothing is unread). The alerts arrive above it a
 * moment later and focus stays on the footer. So the menu pattern every keyboard user knows —
 * Enter to open, Enter on the first item — marks EVERY alert read, and there is no way back.
 * ↓ from there goes to „Alle Benachrichtigungen", away from the alerts. It happens on every open:
 * load() puts the skeleton back each time.
 *
 * The list is answered 400 ms late (a slow line; the order of events is the same at any speed).
 * Nothing is saved: the menu is left with Esc.
 */
test('BELL-01 Enter on the bell focuses the newest alert, ↓ the next, Esc returns to the bell', async ({ page }) => {
    await signIn(page);
    await waitForApp(page);
    await holdLatest(page, 400);

    const trigger = bell(page);

    await trigger.focus();
    await page.keyboard.press('Enter');

    // reka names the menu after its trigger (aria-labelledby), so it is found by its class.
    const menu = page.locator('.adm-alerts[role="menu"]');
    const alerts = menu.locator('.adm-bellitem');

    await expect(menu).toBeVisible();
    await expect(alerts.nth(1)).toBeVisible();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${SHOTS}/bell-01-keyboard-open-${test.info().project.name}.png` });

    await expect(alerts.first(), `after Enter on the bell the focus is on ${await focused(page)}`).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(alerts.nth(1), `after ↓ the focus is on ${await focused(page)}`).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
});
