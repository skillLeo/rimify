import { expect, test } from '@playwright/test';
import { SHOTS, busiestDocument, chooseOneEach, composer, guardWrites, openAsDraft, signIn } from './gutachten-support';

/*
 * GUTACHTEN-05 (S2) — Enter in a search box of „Zeilen hinzufügen" sends the rows (docs/qa/BUGS.md).
 * The two search fields sit inside `<form class="rc">`, whose submit button is enabled as soon as a vehicle
 * and a size are ticked: Enter — the key everyone presses after typing a search — is the form's implicit
 * submission, and `submit()` posts a row for every vehicle × size ticked so far, with whatever the row
 * fields hold. After the first batch the tyre sizes and the page stay filled while Auflagen and Eintragung
 * are reset, so the rows go out complete-looking and without the Auflagen still to be ticked.
 *
 * Expected: Enter in a search field searches (or does nothing); rows are sent only by the button.
 *
 * Nothing is written: the document is a released one answered in the browser as a draft, and `guardWrites`
 * stops (and counts) the POST in the browser.
 */

test('GUTACHTEN-05 Enter in the vehicle search does not send the rows', async ({ page }, info) => {
    await signIn(page);

    const writes = await guardWrites(page);
    const id = await busiestDocument(page);

    await openAsDraft(page, id);
    await chooseOneEach(page);
    await page.locator('#rc-size-0').fill('225/40 R18');

    const search = composer(page).vehicleSearch;
    await search.fill('BMW');
    await search.press('Enter');
    await page.waitForTimeout(800);

    await page.locator('.rc').screenshot({ path: `${SHOTS}/gutachten-05-enter-${info.project.name}.png` });

    const sent = writes.stopped.filter((w) => w === `POST /admin/gutachten/${id}/zeilen`);

    expect(sent, 'Enter in „Fahrzeuge suchen" posted the rows (stopped in the browser)').toEqual([]);
});
