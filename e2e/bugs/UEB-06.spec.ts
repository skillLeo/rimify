import { expect, test } from '../fixtures';
import { SHOTS, gapRows, keepMailtoInPage, openNachfrage, signIn } from './ueb-support';

/*
 * UEB-06 (S2) — „In E-Mail-Programm öffnen" double-clicked records the request twice and opens two
 * e-mails (docs/qa/BUGS.md).
 *
 * RequestDialog.vue: the link's click runs sent() — emit `requested` (→ Index.vue mark() → POST
 * /admin/nachfrage/markierung) — and closes the dialog. The dialog stays on screen for its 180 ms
 * fade-out (`.adm-dialog[data-state='closed']`) and nothing in it is disabled meanwhile; mark()
 * sets `busy` but never checks it. The second click of a double-click lands on the same link: a
 * second POST (a second „demand.marked" entry in the Protokoll) and a second mail window.
 *
 * Expected: one mark per request, however often the link is pressed while it closes.
 *
 * Nothing is written: every mark is held in the browser and counted there; the mail program is
 * never opened (the link's navigation is cancelled in the test browser, its handler still runs).
 */

test('UEB-06 a double-click on „In E-Mail-Programm öffnen" records the request once', async ({ page }, info) => {
    await signIn(page);
    await keepMailtoInPage(page);

    const rig = await openNachfrage(page);

    await gapRows(page).first().getByRole('button', { name: 'Gutachten anfordern' }).click();

    const dialog = page.getByRole('dialog', { name: 'Gutachten anfordern' });

    await expect(dialog).toBeVisible();
    // Past the dialog's entrance.
    await page.waitForTimeout(400);

    await dialog.getByRole('link', { name: 'In E-Mail-Programm öffnen' }).dblclick();
    await page.waitForTimeout(1_500);
    await page.screenshot({ path: `${SHOTS}/ueb-06-double-request-${info.project.name}.png` });

    expect(rig.posts, `the double-click sent ${rig.posts.length} marks: ${rig.posts.join(' | ')}`).toHaveLength(1);
});
