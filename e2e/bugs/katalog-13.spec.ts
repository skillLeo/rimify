import { expect, test } from '@playwright/test';
import { SHOTS, addSizes, guardWrites, onlyRefusedCreates, openNeu, pressSave, signIn } from './katalog-support';

/*
 * KATALOG-13 (S2) — a size's error sentence is not at its field: every refused cell of the size table is
 * only tinted red, and all sentences are listed once, below the whole table („Zeile 3: Den Preis können
 * wir nicht lesen …"). On a phone, where every size is a card of ≈ 600 px, the sentence for the first card
 * is below the last one; the field the save puts the focus on (useDirtyForm: first `[aria-invalid]`) has
 * no `aria-describedby`, so a screen reader says „ungültig" and never why (docs/qa/BUGS.md). Every other
 * field of this form carries its sentence under it and names it in `aria-describedby`; WheelModelRequest
 * promises „the page puts the sentence under the cell it is about", WheelEditor „under the row".
 *
 * Expected: the refused field names its sentence (`aria-describedby`), and the sentence stands with its row.
 *
 * Nothing is written: the save is from /neu with no brand, which the server must refuse
 * (`onlyRefusedCreates` stops it in the browser otherwise).
 */

test('KATALOG-13 a refused size field carries its own sentence', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);
    await onlyRefusedCreates(page);
    await openNeu(page);
    await addSizes(page, 1);

    await page.locator('#fe-size-0-price').focus();
    await pressSave(page);

    const field = page.locator('#fe-size-0-diameter');
    await expect(field).toHaveAttribute('aria-invalid', 'true');

    const tied = await field.evaluate((input) => {
        const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
        const text = ids.map((id) => document.getElementById(id)?.textContent?.trim() ?? '').join(' ');
        const list = document.querySelector('.fe-sizes__errors');
        const row = input.closest('tr');

        return {
            describedby: ids.join(' ') || null,
            text,
            listInsideRow: list !== null && row !== null && row.contains(list),
            listed: list?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
        };
    });

    await page.locator('.fe-sizes').screenshot({ path: `${SHOTS}/katalog-13-row-errors-${info.project.name}.png` });

    expect(
        tied.text.includes('Durchmesser'),
        `the refused „Ø Zoll" field names ${tied.describedby ?? 'no sentence'}; the sentences are listed below the table: „${tied.listed}"`,
    ).toBe(true);
});
