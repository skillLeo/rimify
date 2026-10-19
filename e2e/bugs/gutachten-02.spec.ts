import { expect, test } from '../fixtures';
import { SHOTS, busiestDocument, guardWrites, openAsDraft, signIn } from './gutachten-support';

/*
 * GUTACHTEN-02 (S2) — a minimum Lastindex without a speed symbol, as a Gutachten may print it
 * („245/35 R19 93", „Tragfähigkeit mind. 93"), cannot be entered, and one stored that way is lost the
 * next time its row is saved (docs/qa/BUGS.md).
 *
 *   a) `parseTyre()` (Pages/Admin/Gutachten/rows.ts) reads the minimum only as a pair, `(\d{2,3})\s*([A-Z]{1,2})`:
 *      „245/35 R19 93" is „Diese Reifengröße können wir nicht lesen. Schreib sie bitte so: 225/40 R18." —
 *      although FitmentRowsRequest and `fitment_tyre_sizes` take a load index alone, and the hint under the
 *      field speaks of a „Mindest-Lastindex". The editor must drop the document's minimum (the derivation,
 *      possibly lower, then governs — R-06) or invent a speed symbol.
 *   b) `formFromRow()` writes the minimum back into the text only when both are there
 *      (`s.min_load_index !== null && s.min_speed_symbol`): a row whose size carries 93 without a symbol opens
 *      in „Zeile ändern" as „245/45 R18" — „Speichern" (say, to fix the page number) deletes the 93.
 *
 * Expected: „245/35 R19 93" is read (load index 93, no symbol); „Zeile ändern" shows the 93 it will keep.
 *
 * Nothing is written: the document is a released one answered in the browser as a draft (openAsDraft); (b)
 * gives its first row's first size a load index of 93 in the browser; nothing is saved.
 */

test('GUTACHTEN-02a a minimum Lastindex without a speed symbol can be typed', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const id = await busiestDocument(page);
    await openAsDraft(page, id);

    const field = page.locator('#rc-size-0');
    await field.fill('245/35 R19 93');
    await field.blur();

    const error = page.locator('#rc-size-0-err');
    const said = ((await error.textContent()) ?? '').trim();

    await page.locator('.rc fieldset').first().screenshot({ path: `${SHOTS}/gutachten-02a-load-index-${info.project.name}.png` });

    expect(said, '„245/35 R19 93" — a size with the document\'s minimum load index and no speed symbol — is refused').toBe('');
});

test('GUTACHTEN-02b „Zeile ändern" keeps a minimum Lastindex stored without a speed symbol', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const id = await busiestDocument(page);
    let stored = '';

    await openAsDraft(page, id, (props) => {
        const size = props.rows[0]?.tyreSizes[0];

        if (size) {
            size.min_load_index = 93;
            size.min_speed_symbol = '';
            stored = `${size.width_mm}/${size.aspect} R${size.diameter}, Lastindex 93`;
        }
    });

    expect(stored, 'the document has no row with a tyre size to open').not.toBe('');

    await page.locator('.gs-table button[aria-label$=" ändern"]').first().click();

    const dialog = page.getByRole('dialog', { name: 'Zeile ändern' });
    await expect(dialog).toBeVisible();

    // The load index stands in a field of its own since his admin item 9 (`#…-size-0-li`), the size alone in its field.
    const loadIndex = await page.locator('#gs-edit-size-0-li').inputValue();

    await dialog.screenshot({ path: `${SHOTS}/gutachten-02b-edit-${info.project.name}.png` });

    expect(loadIndex, `the row stores ${stored}; „Zeile ändern" shows „${loadIndex}" as its load index — saving it would drop the 93`).toBe('93');
});
