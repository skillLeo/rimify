import { expect, test } from '@playwright/test';
import { SHOTS, addSizes, guardWrites, isPhone, openNeu, signIn } from './katalog-support';

/*
 * KATALOG-08 (S2) — phone: the SKU field of every size is 12 px; iOS Safari zooms the page in on tapping
 * it, and the admin stays zoomed (docs/qa/BUGS.md, the UEB-07 pattern).
 *
 * SizesTable.vue: `.fe-in--sku { font-size: var(--fs-micro) }` (12 px), scoped, so it outranks the admin's
 * `.input` (16 px below 768, admin.css „or iOS zooms"); the phone block of SizesTable widens the field to
 * 100 % but keeps its size.
 *
 * Expected: every field typed into on a phone is at least 16 px.
 *
 * Nothing is written: /neu, one empty row, never saved.
 */

test('KATALOG-08 the SKU field of a size is at least 16 px on a phone', async ({ page }, info) => {
    if (!isPhone(info.project.name)) {
        await page.setViewportSize({ width: 390, height: 844 });
    }

    await signIn(page);
    await guardWrites(page);
    await openNeu(page);
    await addSizes(page, 1);

    const sizes = await page.locator('.fe-sizes__table tbody tr').first().evaluate((row) =>
        [...row.querySelectorAll<HTMLElement>('input:not([type="hidden"]), select')].map((field) => ({
            id: field.id,
            px: parseFloat(getComputedStyle(field).fontSize),
        })),
    );

    await page.locator('.fe-sizes').screenshot({ path: `${SHOTS}/katalog-08-size-card-${info.project.name}.png` });

    const small = sizes.filter((field) => field.px < 16);

    expect(small, `fields under 16 px on a phone: ${small.map((f) => `${f.id} ${f.px} px`).join(', ')}`).toEqual([]);
});
