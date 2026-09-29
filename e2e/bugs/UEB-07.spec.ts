import { expect, test } from '../fixtures';
import { SHOTS, gapRows, isPhone, openNachfrage, signIn } from './ueb-support';

/*
 * UEB-07 (S2) — „Gutachten anfordern" on a phone: the text field is 14 px, so iOS Safari zooms the
 * page when it is tapped (docs/qa/BUGS.md).
 *
 * RequestDialog.vue's scoped `.rq__body { font-size: var(--fs-small) }` (14 px) applies at every
 * width and, being unlayered, beats the storefront's `.input` (16 px, „Never below 16px on a phone:
 * iOS zooms into a smaller field and never zooms back", components.css). The text is the one field
 * of this dialog that is meant to be edited: tapping it zooms the page, the dialog's right part and
 * its buttons leave the screen, and the zoom stays after the dialog closes.
 *
 * Expected: every field of the dialog is ≥ 16 px below 768 px.
 *
 * Nothing is written: the dialog is only opened.
 */

test('UEB-07 the fields of „Gutachten anfordern" are at least 16 px on a phone', async ({ page }, info) => {
    test.skip(!isPhone(info.project.name), 'iOS zooms into a field below 16 px on a phone.');

    await signIn(page);
    await openNachfrage(page, 1);
    await gapRows(page).first().getByRole('button', { name: 'Gutachten anfordern' }).click();

    const dialog = page.getByRole('dialog', { name: 'Gutachten anfordern' });

    await expect(dialog).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/ueb-07-request-dialog-${info.project.name}.png` });

    for (const [name, selector] of [
        ['Marke', '#demand-brand'],
        ['Betreff', '#demand-subject'],
        ['Text', '#demand-body'],
    ] as const) {
        const size = await dialog.locator(selector).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

        expect.soft(size, `„${name}" is ${size} px: iOS Safari zooms the page when it is tapped`).toBeGreaterThanOrEqual(16);
    }
});
