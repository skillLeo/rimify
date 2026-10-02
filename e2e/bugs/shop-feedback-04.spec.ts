import { expect, test } from '../fixtures';
import { consentGiven } from '../support';
import { SHOP_FEEDBACK_BASE, SHOTS, feedbackDialog, guardSends, openFeedback, openShop, signIn } from './shop-feedback-support';

test.use({ baseURL: SHOP_FEEDBACK_BASE });

/*
 * SHOP-FEEDBACK-04 (S2) — Back with the feedback dialog open changes the page behind it and leaves the dialog open,
 * still naming the page it was opened on and carrying that page's screenshot (docs/qa/BUGS.md).
 *
 * The dialog's state is module state (`feedback` in useFeedback.ts: open, url, screenshot); AppLayout and MobileLayout
 * are persistent layouts, so on a popstate Inertia 3 swaps only the page (`setQuietly`) and ShopFeedback stays mounted.
 * AppLayout closes the palette, the help and the vehicle sheet on `navigate` („Every navigation closes whatever is open,
 * and so does the back button“); the phone shell's sheets push a history entry so Back closes them — the feedback dialog
 * does neither. On Android, Back is how a dialog is dismissed. The address bar then shows the earlier page while the
 * dialog says „diese Seite (/kontakt)“, and „Senden“ files the point under /kontakt with /kontakt's screenshot.
 *
 * Expected: Back closes the dialog (either staying on the page, as the sheets do, or going back with it closed).
 * Writes nothing: nothing is sent, and `guardSends` would stop a send in the browser.
 */

test('SHOP-FEEDBACK-04 Back does not leave the feedback dialog open over another page', async ({ page }, info) => {
    test.setTimeout(90_000);

    await consentGiven(page.context(), SHOP_FEEDBACK_BASE);
    await signIn(page);
    await guardSends(page);
    await openShop(page, '/faq');

    // An Inertia visit, as a click on the footer's „Kontakt“ is: the same document, a pushed history entry.
    const link = page.locator('footer a[href*="/kontakt"]').first();

    await expect(link, 'precondition: no link to /kontakt in the footer of /faq').toBeAttached();
    await link.click();
    await page.waitForURL(/\/kontakt(\?.*)?$/);
    await expect(page.locator('#kon-message'), 'precondition: the contact page did not arrive').toBeVisible();

    const dialog = await openFeedback(page);

    await expect(dialog).toContainText('diese Seite (/kontakt');

    // A same-document entry: nothing to load, only Inertia's popstate.
    await page.goBack({ waitUntil: 'commit' });
    await page.waitForTimeout(1_500);
    await page.screenshot({ path: `${SHOTS}/shop-feedback-04-after-back-${info.project.name}.png` });

    const here = new URL(page.url()).pathname;
    const open = await feedbackDialog(page).isVisible();
    const named = open ? (/diese Seite \(([^)]*)\)/.exec((await feedbackDialog(page).textContent()) ?? '')?.[1] ?? '?') : null;

    expect(
        open,
        `after Back the address bar shows ${here}; the feedback dialog is still open and names ${named} — „Senden“ would file the point under that page, with its screenshot`,
    ).toBe(false);
});
