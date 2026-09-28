import { expect, test } from '../fixtures';
import { SHOTS, brandRow, chooseFromBrandMenu, fakeBrand, focusFell, guardMarkenWrites, markenAnswer, openMarkenWith, signIn, waitForApp } from './k2-support';

/*
 * K2-03 (S2) — keyboard on Katalog › Marken: three actions drop the focus to `<body>`; the next Tab starts
 * again at „Zum Inhalt springen" and walks the rail (docs/qa/BUGS.md, the KATALOG-09 pattern):
 *
 *   a) „Abbrechen" after „Bearbeiten" — `v-if="editing !== null"` removes the button that was pressed;
 *   b) „⋯" → „Logo entfernen" — the menu hands the focus back to „⋯" in a `setTimeout` (reka
 *      DropdownMenuContent), but „⋯" is `:disabled="busy"` for the round trip: the call does nothing, the
 *      menu item it came from is gone, and nothing focuses anything once the answer is in;
 *   c) „⋯" → „Entfernen" → the dialog's „Entfernen" — the row goes, and Ui/Dialog.vue returns the focus only
 *      `if (opener?.isConnected)`.
 *
 * Expected: the focus on the next sensible control — „Bearbeiten"'s row „⋯" or the form, the row's „⋯", the
 * next row or the list.
 *
 * Nothing is written. (a) never saves. In (b) and (c) the brand exists only in the test's browser, and its
 * DELETE is answered in the browser — after 400 ms, a normal round trip — with the list as the server has
 * it; every other write under /admin/marken is aborted.
 */

const FAKE_ID = 2147483100;
const NAME = 'QA K2-03 Nur im Browser';

async function roundTrip(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 400));
}

test('K2-03a „Abbrechen" after „Bearbeiten" keeps the focus in the page', async ({ page }, info) => {
    await signIn(page);
    await guardMarkenWrites(page);
    await page.goto('/admin/marken', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    const first = ((await page.locator('table.mk__table tbody tr .adm-table__key').first().textContent()) ?? '').trim();

    expect(first, 'no brand listed on /admin/marken').not.toBe('');
    await chooseFromBrandMenu(page, first, 'Bearbeiten');
    await expect(page.locator('#mk-form-title')).toHaveText(`Marke bearbeiten: ${first}`);

    await page.getByRole('button', { name: 'Abbrechen', exact: true }).press('Enter');
    await expect(page.locator('#mk-form-title')).toHaveText('Neue Marke');
    await page.waitForTimeout(300);

    const focus = await focusFell(page);
    await page.screenshot({ path: `${SHOTS}/k2-03a-after-abbrechen-${info.project.name}.png` });

    expect(focus.fell, `after „Abbrechen" the focus is on ${focus.on}`).toBe(false);
});

test('K2-03b „Logo entfernen" from the keyboard keeps the focus in the row', async ({ page }, info) => {
    await signIn(page);
    await guardMarkenWrites(page);

    await page.route(
        (url) => url.pathname === `/admin/marken/${FAKE_ID}/logo`,
        async (route) => {
            if (route.request().method() !== 'DELETE') {
                await route.fallback();

                return;
            }

            // The server's answer to a removed logo: the same row, without it.
            const { response, json } = await markenAnswer(route, (brands) => [...brands, fakeBrand(FAKE_ID, NAME, false)]);
            await roundTrip();
            await route.fulfill({ response, json });
        },
    );

    await openMarkenWith(page, (brands) => [...brands, fakeBrand(FAKE_ID, NAME, true)]);

    const row = brandRow(page, NAME);

    await expect(row).toHaveCount(1);
    await chooseFromBrandMenu(page, NAME, 'Logo entfernen');
    await expect(row.getByText('kein Logo')).toBeVisible();
    await page.waitForTimeout(300);

    const focus = await focusFell(page);
    await row.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${SHOTS}/k2-03b-after-logo-entfernen-${info.project.name}.png` });

    expect(focus.fell, `after „Logo entfernen" the focus is on ${focus.on}`).toBe(false);
});

test('K2-03c removing a brand from the keyboard keeps the focus in the list', async ({ page }, info) => {
    await signIn(page);
    await guardMarkenWrites(page);

    await page.route(
        (url) => url.pathname === `/admin/marken/${FAKE_ID}`,
        async (route) => {
            if (route.request().method() !== 'DELETE') {
                await route.fallback();

                return;
            }

            // The server's answer to a removed brand: the list without it.
            const { response, json } = await markenAnswer(route, (brands) => brands);
            await roundTrip();
            await route.fulfill({ response, json });
        },
    );

    await openMarkenWith(page, (brands) => [...brands, fakeBrand(FAKE_ID, NAME, false)]);

    const row = brandRow(page, NAME);

    await expect(row).toHaveCount(1);
    await chooseFromBrandMenu(page, NAME, 'Entfernen');

    const dialog = page.getByRole('dialog');

    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Entfernen', exact: true }).press('Enter');
    await expect(dialog).toBeHidden();
    await expect(row).toHaveCount(0);
    await page.waitForTimeout(300);

    const focus = await focusFell(page);
    await page.screenshot({ path: `${SHOTS}/k2-03c-after-entfernen-${info.project.name}.png` });

    expect(focus.fell, `after removing a brand the focus is on ${focus.on}`).toBe(false);
});
