import { expect, test, type Page } from '@playwright/test';
import {
    SHOTS,
    answerWithDocument,
    asDraft,
    busiestDocument,
    focusFell,
    guardWrites,
    inertiaHeaders,
    isInertiaGet,
    openAsDraft,
    pageInsteadOf,
    rowIdOf,
    signIn,
    waitForApp,
} from './gutachten-support';

/*
 * GUTACHTEN-08 (S2) — keyboard: three confirmed actions drop the focus to `<body>`; the next Tab starts again
 * at „Zum Inhalt springen" (docs/qa/BUGS.md, the KATALOG-09 / SV-05 pattern):
 *
 *   a) „Zeile … entfernen" → „Entfernen": the row goes, and with it the button that opened the confirm;
 *   b) „Freigeben" → „Freigeben": the released document has no „Freigeben" any more (`v-if="can.release"`);
 *   c) Auflagen-Katalog, „… löschen" → „Löschen": the Auflage's row goes.
 *
 * Ui/Dialog.vue gives the focus back only `if (opener?.isConnected)`; none of the three pages says where it
 * goes instead.
 *
 * Expected: the focus lands on the next sensible control — the next row, the document's state or title, the
 * next Auflage.
 *
 * Nothing is written: (a) and (b) work on a released document answered in the browser as a draft, and the
 * DELETE / the Freigabe are answered in the browser with the document as the server would show it after;
 * in (c) one Auflage is shown as unused in the browser, and its DELETE is answered with the list without it.
 * No request but GETs reaches the application.
 */

async function confirmFromKeyboard(page: Page, trigger: string, dialogName: string, confirm: string): Promise<void> {
    await page.locator(trigger).first().focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: dialogName });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: confirm, exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await page.waitForTimeout(400);
}

test('GUTACHTEN-08a removing a row from the keyboard keeps the focus in the rows', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const id = await busiestDocument(page);

    await page.route(
        (url) => /^\/admin\/gutachten\/\d+\/zeilen\/\d+$/.test(url.pathname),
        async (route) => {
            if (route.request().method() !== 'DELETE') {
                await route.fallback();

                return;
            }

            const gone = rowIdOf(route.request().url());

            await answerWithDocument(route, id, (props) => {
                asDraft(props);
                props.rows = props.rows.filter((row) => row.id !== gone);
            });
        },
    );

    await openAsDraft(page, id);
    await confirmFromKeyboard(page, '.gs-table button[aria-label$=" entfernen"]', 'Zeile entfernen?', 'Entfernen');

    const focus = await focusFell(page);
    await page.screenshot({ path: `${SHOTS}/gutachten-08a-after-remove-${info.project.name}.png` });

    expect(focus.fell, `after „Entfernen" the focus is on ${focus.on}`).toBe(false);
});

test('GUTACHTEN-08b after „Freigeben" from the keyboard the focus stays on the page', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const id = await busiestDocument(page);

    // The Freigabe, answered with the document as it is: released, as the server shows it afterwards.
    await page.route(
        (url) => url.pathname === `/admin/gutachten/${id}/freigeben`,
        async (route) => {
            await answerWithDocument(route, id, () => undefined);
        },
    );

    await openAsDraft(page, id);
    await confirmFromKeyboard(page, '.adm-page__actions button.btn--primary', 'Gutachten freigeben?', 'Freigeben');

    await expect(page.locator('.adm-page__actions').getByRole('button', { name: 'Freigeben' })).toHaveCount(0);

    const focus = await focusFell(page);
    await page.screenshot({ path: `${SHOTS}/gutachten-08b-after-release-${info.project.name}.png` });

    expect(focus.fell, `after „Freigeben" the focus is on ${focus.on}`).toBe(false);
});

test('GUTACHTEN-08c deleting an Auflage from the keyboard keeps the focus in the list', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    let shown: { id: number; code: string } | null = null;

    // The Auflagen-Katalog with its first Auflage shown as unused, so it offers „löschen".
    await page.route(
        (url) => url.pathname === '/admin/auflagen',
        async (route) => {
            const request = route.request();

            if (!(await isInertiaGet(request))) {
                await route.fallback();

                return;
            }

            const response = await route.fetch({ headers: await inertiaHeaders(request) });
            const json = (await response.json()) as { props: { codes: Array<{ id: number; code: string; used: number }> } };
            const first = json.props.codes[0];

            if (first) {
                first.used = 0;
                shown = { id: first.id, code: first.code };
            }

            await route.fulfill({ response, json });
        },
    );

    // Its DELETE, answered with the list without it.
    await page.route(
        (url) => /^\/admin\/auflagen\/\d+$/.test(url.pathname),
        async (route) => {
            if (route.request().method() !== 'DELETE') {
                await route.fallback();

                return;
            }

            const gone = Number(new URL(route.request().url()).pathname.split('/').pop());
            const response = await pageInsteadOf(route, new URL('/admin/auflagen', route.request().url()).toString());
            const json = (await response.json()) as { props: { codes: Array<{ id: number }> } };

            json.props.codes = json.props.codes.filter((c) => c.id !== gone);
            await route.fulfill({ response, json });
        },
    );

    await page.goto('/admin/gutachten', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.locator('a[href$="/admin/auflagen"]').first().evaluate((link) => (link as HTMLElement).click());
    await page.waitForURL(/\/admin\/auflagen$/);
    await expect(page.locator('.adm-page__title')).toHaveText('Auflagen-Katalog');

    const target = shown as { id: number; code: string } | null;

    expect(target, 'the Auflagen-Katalog is empty').not.toBeNull();

    await confirmFromKeyboard(page, `tr:has(#al-text-${target?.id ?? 0}) button[aria-label="Löschen"]`, 'Auflage löschen?', 'Löschen');

    const focus = await focusFell(page);
    await page.screenshot({ path: `${SHOTS}/gutachten-08c-after-delete-${info.project.name}.png` });

    expect(focus.fell, `after „Löschen" the focus is on ${focus.on}`).toBe(false);
});
