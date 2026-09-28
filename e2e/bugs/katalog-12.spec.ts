import { expect, test } from '../fixtures';
import { SHOTS, guardWrites, openNeu, signIn, sizeRows } from './katalog-support';

/*
 * KATALOG-12 (S2) — „Eine Größe hinzufügen" seems to do nothing on any Felge with more than a handful of
 * sizes: the new row is appended at the end of the table, below the fold, the page does not move and the
 * focus stays on the button in the section's head. The keyboard has to Tab through every field of every
 * row (11 per size) to reach it; on a phone every size is a card of ≈ 600 px (docs/qa/BUGS.md).
 *
 * Edit.vue `addSize()` only pushes to `form.configs`.
 *
 * Expected: the new row is brought into view and its first open field has the focus.
 *
 * Nothing is written: /neu, sizes made with „Größen erzeugen", never saved.
 */

test('KATALOG-12 „Eine Größe hinzufügen" shows the row it added', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);
    await openNeu(page);

    // 18 sizes, as „Größen erzeugen" makes them for one finish: 2 diameters × 3 widths × 3 ETs.
    // The matrix opens from the Größen header (it starts open while a Felge has no size yet).
    if (!(await page.locator('#fe-m-d').isVisible())) {
        await page.getByRole('button', { name: 'Größen aus Listen erzeugen' }).click();
    }
    await page.locator('#fe-m-d').fill('18 19');
    await page.locator('#fe-m-w').fill('8 8,5 9');
    await page.locator('#fe-m-et').fill('35 40 45');
    await page.locator('.fe-matrix__foot button').click();
    await expect(sizeRows(page)).toHaveCount(18);

    const add = page.getByRole('button', { name: 'Eine Größe hinzufügen' });
    await add.evaluate((button) => button.scrollIntoView({ block: 'center' }));
    await add.click();
    await expect(sizeRows(page)).toHaveCount(19);
    await page.waitForTimeout(600);

    const seen = await sizeRows(page).last().evaluate((row) => {
        const r = row.getBoundingClientRect();
        const bar = document.querySelector('.adm-savebar')?.getBoundingClientRect();
        const floor = bar && bar.top < window.innerHeight ? bar.top : window.innerHeight;

        return {
            top: Math.round(r.top),
            floor: Math.round(floor),
            inView: r.top < floor && r.bottom > 0,
            focusInside: row.contains(document.activeElement),
            focus: document.activeElement?.textContent?.trim().slice(0, 40) ?? document.activeElement?.tagName ?? '',
        };
    });

    await page.screenshot({ path: `${SHOTS}/katalog-12-after-add-${info.project.name}.png` });

    expect(
        seen.inView,
        `the new row 19 starts at y=${seen.top}, below the visible area (to y=${seen.floor}); the focus is ${seen.focusInside ? 'in it' : `on „${seen.focus}"`}`,
    ).toBe(true);
});
