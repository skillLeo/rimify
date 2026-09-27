import { expect, test } from '@playwright/test';
import { SHOTS, answerWithDocument, asDraft, busiestDocument, guardWrites, openAsDraft, rowIdOf, signIn } from './gutachten-support';

/*
 * GUTACHTEN-09 (S2) — „Entfernen" in „Zeile entfernen?" (and „Löschen" in „Auflage löschen?") sends one
 * DELETE per click (docs/qa/BUGS.md). Show.vue and Auflagen/Index.vue pass no `busy` to AdminConfirm, and
 * the dialog stays open until the answer: a double click sends two. Inertia cancels the first in the
 * browser when the second starts — but the server has already removed the row — and the second is answered
 * 404, which the admin turns into „Das gibt es nicht mehr – vielleicht hat es gerade jemand gelöscht. Es
 * wurde nichts gespeichert." The row is gone; the page says nothing was saved and still lists it until it
 * is reloaded.
 *
 * Expected: one DELETE, however often the button is pressed (AdminConfirm's `busy`, as for „Freigeben").
 *
 * Nothing is written: the document is a released one answered in the browser as a draft; every DELETE is
 * held for a moment and answered in the browser with the document without that row.
 */

test('GUTACHTEN-09 a double click on „Entfernen" removes a row with one request', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const id = await busiestDocument(page);
    const deletes: string[] = [];

    page.on('request', (request) => {
        if (request.method() === 'DELETE') {
            deletes.push(new URL(request.url()).pathname);
        }
    });

    await page.route(
        (url) => /^\/admin\/gutachten\/\d+\/zeilen\/\d+$/.test(url.pathname),
        async (route) => {
            if (route.request().method() !== 'DELETE') {
                await route.fallback();

                return;
            }

            const gone = rowIdOf(route.request().url());

            // A server a little slower than a double click.
            await new Promise((resolve) => setTimeout(resolve, 600));

            try {
                await answerWithDocument(route, id, (props) => {
                    asDraft(props);
                    props.rows = props.rows.filter((row) => row.id !== gone);
                });
            } catch {
                // The page gave this request up (Inertia cancels a visit when the next one starts).
            }
        },
    );

    await openAsDraft(page, id);
    await page.locator('.gs-table button[aria-label$=" entfernen"]').first().click();

    const dialog = page.getByRole('dialog', { name: 'Zeile entfernen?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Entfernen', exact: true }).dblclick();
    await page.waitForTimeout(2_000);

    await page.screenshot({ path: `${SHOTS}/gutachten-09-double-remove-${info.project.name}.png` });

    expect(deletes, `a double click on „Entfernen" sent ${deletes.length} DELETE request(s): ${deletes.join(', ')}`).toHaveLength(1);
});
