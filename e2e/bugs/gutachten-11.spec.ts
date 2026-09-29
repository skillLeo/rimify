import { expect, test } from '../fixtures';
import { SHOTS, answerWithDocument, asDraft, busiestDocument, chooseOneEach, composer, guardWrites, openAsDraft, signIn } from './gutachten-support';

/*
 * GUTACHTEN-11 (S2) — a refused tyre size's sentence stands under another line (docs/qa/BUGS.md).
 * `payload()` (Pages/Admin/Gutachten/rows.ts) leaves empty size lines out before sending, so the server's
 * `tyre_sizes.N.*` counts the sent sizes only; RowFields.vue reads `tyre_sizes.${index}` by the line's place
 * on screen. With an empty line above (a line added and left empty, or one cleared), „Diese Reifengröße steht
 * mit diesem kW-Bereich und diesen Indizes schon in der Liste." or „Dieses Geschwindigkeitssymbol gibt es
 * nicht." lands under a size that is fine,
 * and the one at fault shows nothing. Removing a line afterwards moves the sentences again (the errors stay
 * keyed by place until the next answer, the KATALOG-03 pattern).
 *
 * Expected: the sentence stands under the size it is about.
 *
 * Nothing is written: the document is a released one answered in the browser as a draft, and „Zeilen
 * anlegen" is answered in the browser with the refusal FitmentRowsRequest gives for these sizes — the
 * duplicate's place computed from the payload the page sent, the way the request's `after()` does.
 */

test('GUTACHTEN-11 the duplicate tyre size carries its own sentence', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const id = await busiestDocument(page);
    let refusedAt = -1;

    await page.route(
        (url) => url.pathname === `/admin/gutachten/${id}/zeilen`,
        async (route) => {
            if (route.request().method() !== 'POST') {
                await route.fallback();

                return;
            }

            const sent = JSON.parse(route.request().postData() ?? '{}') as { tyre_sizes?: Array<Record<string, unknown>> };
            const seen = new Set<string>();

            (sent.tyre_sizes ?? []).forEach((size, index) => {
                const key = [size.width_mm, size.aspect, size.diameter, size.axle].join('|');

                if (seen.has(key) && refusedAt < 0) {
                    refusedAt = index;
                }

                seen.add(key);
            });

            await answerWithDocument(route, id, asDraft, refusedAt < 0 ? {} : { [`tyre_sizes.${refusedAt}.width_mm`]: 'Diese Reifengröße steht mit diesem kW-Bereich und diesen Indizes schon in der Liste.' });
        },
    );

    await openAsDraft(page, id);
    await chooseOneEach(page);

    // Line 1 stays empty; lines 2 and 3 are one size, written two ways.
    const add = page.locator('.rc').getByRole('button', { name: 'Reifengröße hinzufügen' });
    await add.click();
    await add.click();
    await page.locator('#rc-size-1').fill('225/40 R18');
    await page.locator('#rc-size-2').fill('225/40 ZR18');
    await composer(page).submit.click();

    // The sentence since Block D names the band and the indexes: „… steht mit diesem kW-Bereich und diesen Indizes schon in der Liste."
    await expect(page.locator('.rc .rf-size__err').filter({ hasText: 'schon in der Liste' })).toHaveCount(1);

    const under = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.rc .rf-size')).map((line) => ({
            text: (line.querySelector('input') as HTMLInputElement | null)?.value ?? '',
            error: line.querySelector('.rf-size__err')?.textContent?.trim() ?? '',
        })),
    );

    await page.locator('.rc fieldset').first().screenshot({ path: `${SHOTS}/gutachten-11-size-error-${info.project.name}.png` });

    const atFault = under[2]?.error ?? '';

    expect(
        atFault,
        `sent as tyre_sizes.${refusedAt}; on screen: ${under.map((u, i) => `line ${i + 1} „${u.text}" → „${u.error}"`).join(' · ')}`,
    ).toContain('schon in der Liste');
});
