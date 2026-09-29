import { expect, test } from '../fixtures';
import { SHOTS, addSizes, fillSize, guardWrites, onlyRefusedCreates, openNeu, pressSave, signIn, sizeRows } from './katalog-support';

/*
 * KATALOG-03 (S2) — the server's sentences stick to row numbers, not to rows: remove a size after a
 * refused save and its errors move to the size that takes its place — a filled row turns red and reads
 * „Zeile 1: Bitte gib den Durchmesser an." under „18" (docs/qa/BUGS.md). Removing a finish does the same
 * to the finish below it.
 *
 * Edit.vue's `errors` are the server's keys (`configs.0.diameter`, `finishes.1.name`); SizesTable reads them
 * by index (`configs.${index}.${field}`). `removeSize()` / `removeFinish()` only splice the array: nothing
 * clears or re-keys the errors, and the page's `page.props.errors` stay until the next answer.
 *
 * Expected: after the row is removed, the remaining row carries no error it does not have.
 *
 * Nothing is written: the save is from /neu with no brand, which WheelModelRequest must refuse
 * (`onlyRefusedCreates` stops it in the browser otherwise).
 */

test('KATALOG-03 removing a refused size does not move its errors to the next size', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);
    await onlyRefusedCreates(page);
    await openNeu(page);

    // Row 1 left empty, row 2 complete.
    await addSizes(page, 2);
    await fillSize(page, 1, { diameter: '18', width: '8', et: '35', bolt_circle: '112', bore: '66,6', sku: 'QA-KATALOG-03-ZEILE-2', price: '189' });

    await pressSave(page);
    await expect(page.locator('#fe-size-0-diameter')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#fe-size-1-diameter')).not.toHaveAttribute('aria-invalid', 'true');

    // The empty row goes.
    await page.locator('button[aria-label="Zeile 1 entfernen"]').click();
    await expect(sizeRows(page)).toHaveCount(1);
    await expect(page.locator('#fe-size-0-diameter')).toHaveValue('18');

    await page.locator('.fe-sizes').screenshot({ path: `${SHOTS}/katalog-03-errors-moved-${info.project.name}.png` });

    const row = await page.evaluate(() => ({
        invalid: document.querySelector('#fe-size-0-diameter')?.getAttribute('aria-invalid') ?? null,
        red: document.querySelector('.fe-sizes__table tbody tr')?.classList.contains('fe-sizes__row--bad') ?? false,
        said: document.querySelector('.fe-sizes__errors')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    }));

    expect(
        row.invalid === 'true' || row.red,
        `the complete row (Ø 18) is marked wrong after the empty one was removed: ${row.said || '(no sentence)'}`,
    ).toBe(false);
});
