import { expect, test } from '../fixtures';
import { SHOTS, busiestDocument, focused, guardWrites, openAsDraft, signIn } from './gutachten-support';

/*
 * B-02 (S2) — Block B review: in „Zeile ändern", Enter on an unreadable tyre size refuses without a sentence.
 *
 * The dialog is a form „so Enter in a field saves". Show.vue saveRow() stops an unreadable size before sending
 * and „shows" it by handing RowFields a fresh copy of editErrors (`{ ...editErrors.value }`), then calls
 * focusRefused('.gs-dialog'). RowFields.vue marks every size line as left only when the errors it is handed
 * have keys (`Object.keys(errors).length > 0`) — an empty copy has none. The line the person is still typing
 * in has not been left (no blur), so sizeError() stays '' and aria-invalid unset; focusRefused finds no field
 * and no sentence. Enter does nothing, and nothing says why. (With the mouse the click on „Speichern" blurs
 * the field first, which is why it looks fine there.)
 *
 * Expected: „Diese Reifengröße können wir nicht lesen …" under the line, the field marked invalid and focused.
 *
 * Nothing is written: the document is a released one answered in the browser as a draft (openAsDraft); the
 * size is refused in the browser before any request, and guardWrites would stop a PUT.
 */

test('B-02 Enter on an unreadable size in „Zeile ändern" says why nothing was saved', async ({ page }, info) => {
    await signIn(page);
    const writes = await guardWrites(page);

    const id = await busiestDocument(page);
    await openAsDraft(page, id);

    await page.locator('.gs-table button[aria-label$=" ändern"]').first().click();

    const dialog = page.getByRole('dialog', { name: 'Zeile ändern' });
    await expect(dialog).toBeVisible();

    const size = page.locator('#gs-edit-size-0');

    if ((await size.count()) === 0) {
        await dialog.getByRole('button', { name: 'Reifengröße hinzufügen' }).click();
    }

    // „225/40 18": the R is missing — parseTyre() cannot read it.
    await size.fill('225/40 18');
    await size.press('Enter');
    await page.waitForTimeout(400);

    const sentence = ((await page.locator('#gs-edit-size-0-err').textContent()) ?? '').trim();
    const invalid = await size.getAttribute('aria-invalid');
    const on = await focused(page);

    await dialog.screenshot({ path: `${SHOTS}/b-02-edit-enter-unreadable-${info.project.name}.png` });

    expect(writes.stopped, 'the unreadable size must be stopped in the browser, not sent').toEqual([]);
    expect(sentence, `Enter did nothing visible: no sentence under the size, aria-invalid=${invalid}, focus on ${on}`).toContain('können wir nicht lesen');
    expect(invalid).toBe('true');
});
