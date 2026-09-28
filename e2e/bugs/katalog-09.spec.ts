import { expect, test } from '../fixtures';
import { SHOTS, addSizes, firstWheelId, focusFell, guardWrites, openFelge, openNeu, pageInsteadOf, signIn, sizeRows, waitForApp } from './katalog-support';

/*
 * KATALOG-09 (S2) — keyboard: four controls of the Katalog take the focus away with them and drop it to
 * `<body>`; the next Tab starts again at „Zum Inhalt springen" (docs/qa/BUGS.md, the SV-05 / UEB-05
 * pattern):
 *
 *   a) a size's „Zeile N entfernen" (SizesTable.vue) — the row and its button are removed;
 *   b) a finish's „Entfernen" (Edit.vue `removeFinish`) — the finish is removed;
 *   c) „Foto hochladen" / „Foto ersetzen" and the form's „Abbrechen" (FinishPhoto.vue) — `v-if="editable
 *      && !open"` / `v-if="open"` swap the buttons out;
 *   d) a finished step for the selection (Felgen list, „Zurückziehen" …) — `onSuccess` empties the
 *      selection, which removes the bar and the button that opened the confirm; Ui/Dialog.vue returns the
 *      focus only `if (opener?.isConnected)`.
 *
 * Expected: the focus lands on the next sensible control — the row or finish after the removed one (or
 * „Eine Größe hinzufügen"), the file field, „Foto hochladen" again, the table.
 *
 * Nothing is written: (a)–(c) never save; in (d) the step is sent for a draft (a no-op on the server) and is
 * answered in the browser with the list as it stands — the request never reaches the application.
 */

test('KATALOG-09a removing a size from the keyboard keeps the focus in the table', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);
    await openNeu(page);
    await addSizes(page, 2);

    await page.locator('button[aria-label="Zeile 1 entfernen"]').focus();
    await page.keyboard.press('Enter');
    await expect(sizeRows(page)).toHaveCount(1);

    const focus = await focusFell(page);
    await page.screenshot({ path: `${SHOTS}/katalog-09a-after-remove-size-${info.project.name}.png` });

    expect(focus.fell, `after „Zeile 1 entfernen" the focus is on ${focus.on}`).toBe(false);
});

test('KATALOG-09b removing a finish from the keyboard keeps the focus in the finishes', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);
    await openNeu(page);

    await page.getByRole('button', { name: 'Ausführung hinzufügen' }).click();
    await expect(page.locator('.fe-finish')).toHaveCount(2);

    await page.getByRole('button', { name: 'Entfernen', exact: true }).first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.fe-finish')).toHaveCount(1);

    const focus = await focusFell(page);
    await page.screenshot({ path: `${SHOTS}/katalog-09b-after-remove-finish-${info.project.name}.png` });

    expect(focus.fell, `after the finish's „Entfernen" the focus is on ${focus.on}`).toBe(false);
});

test('KATALOG-09c opening and closing the photo form from the keyboard keeps the focus', async ({ page }, info) => {
    await signIn(page);

    const id = await firstWheelId(page);
    await guardWrites(page);
    await openFelge(page, id);

    const photo = page.locator('.fe-photo').first();
    const start = photo.locator('.fe-photo__actions .btn--secondary');

    await expect(start, 'the first finish offers no „Foto hochladen" (read-only?)').toBeVisible();
    await start.focus();
    await page.keyboard.press('Enter');
    await expect(photo.locator('.fe-photo__form')).toBeVisible();

    const opened = await focusFell(page);

    await photo.getByRole('button', { name: 'Abbrechen' }).focus();
    await page.keyboard.press('Enter');
    await expect(photo.locator('.fe-photo__form')).toBeHidden();

    const closed = await focusFell(page);
    await photo.screenshot({ path: `${SHOTS}/katalog-09c-photo-${info.project.name}.png` });

    expect(
        { opened: opened.fell, closed: closed.fell },
        `„Foto hochladen" left the focus on ${opened.on}; „Abbrechen" left it on ${closed.on}`,
    ).toEqual({ opened: false, closed: false });
});

test('KATALOG-09d after a step for the selection the focus stays in the list', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Selection is desk work: the phone list has no check boxes.');

    await signIn(page);
    await guardWrites(page);

    const list = '/admin/felgen?status=draft';

    // The step is answered with the list as it stands; it never reaches the application.
    await page.route(
        (url) => url.pathname === '/admin/felgen/sammelaktion',
        async (route) => {
            const response = await pageInsteadOf(route, new URL(list, route.request().url()).toString());
            await route.fulfill({ response });
        },
    );

    await page.goto(list, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    await page.locator('table.fg-table tbody tr').first().locator('input.fg-check').check();

    const bar = page.locator('.fg-bulk');
    await bar.getByRole('button', { name: 'Zurückziehen' }).focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Zurückziehen' }).focus();
    await page.keyboard.press('Enter');

    await expect(dialog).toBeHidden();
    // The bar keeps its place (KATALOG-07) and falls back to its idle line.
    await expect(page.locator('.fg-bulk--idle')).toBeVisible();
    await page.waitForTimeout(300);

    const focus = await focusFell(page);
    await page.screenshot({ path: `${SHOTS}/katalog-09d-after-bulk-desktop-1440.png` });

    expect(focus.fell, `after „Zurückziehen" for the selection the focus is on ${focus.on}`).toBe(false);
});
