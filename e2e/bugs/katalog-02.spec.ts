import { expect, test } from '../fixtures';
import { SHOTS, bogusSize, firstWheelId, guardWrites, openFelge, pressSave, signIn, sizeRows } from './katalog-support';

/*
 * KATALOG-02 (S2) — a size removed and added again in the same save (by hand, or with „Größen erzeugen"
 * after deleting rows), or two SKUs swapped, is answered with a server fault: „Das hat auf unserer Seite
 * nicht geklappt … Versuch es gleich noch einmal." The save can never succeed as it stands, and nothing on
 * the page says why (docs/qa/BUGS.md).
 *
 * WheelEditor::configs() creates and updates every row first and soft-deletes the removed ones only after
 * the loop. The re-added size (id null, same SKU, same finish and measurements) is inserted while its old
 * row still holds the SKU and the size key: `wheel_configs.sku` and the size's unique key refuse it with a
 * QueryException → 500. Its restore path (`onlyTrashed()`) cannot help — the old row is not trashed yet.
 * WheelModelRequest checks SKUs only against *other* models and within the request, so validation passes.
 * The same order breaks a new finish named like one removed in the same save (uq_finish_model_name).
 *
 * Expected: the save succeeds (the size is simply kept), or is refused with a sentence under the row.
 *
 * Nothing is written: the save that reaches the server carries one more size whose id belongs to no model
 * (`bogusSize`); WheelEditor refuses the whole save for it at the end and rolls the transaction back. Today
 * the fault comes first; once it is fixed, the refusal does — either way the model stays as it was.
 */

test('KATALOG-02 removing a size and adding it again in one save is not a server fault', async ({ page }, info) => {
    await signIn(page);

    const id = await firstWheelId(page, '?sort=groessen&richtung=ab');
    await guardWrites(page);
    await openFelge(page, id);

    const rows = sizeRows(page);
    const count = await rows.count();

    test.skip(count === 0, 'the Felge with the most sizes has none');

    // A row that may be removed: no Gutachten names it.
    let index = -1;

    for (let i = 0; i < count; i++) {
        const remove = page.locator(`button[aria-label="Zeile ${i + 1} entfernen"]`);

        if ((await remove.count()) > 0 && (await remove.isEnabled())) {
            index = i;
            break;
        }
    }

    let story: string;

    if (index >= 0) {
        const value = (field: string) => page.locator(`#fe-size-${index}-${field}`).inputValue();
        const size = {
            finish: await value('finish'),
            diameter: await value('diameter'),
            width: await value('width'),
            et: await value('et'),
            bolt_holes: await value('bolt_holes'),
            bolt_circle: await value('bolt_circle'),
            bore: await value('bore'),
            sku: await value('sku'),
            price: await value('price'),
        };
        // Available or not, by its words (D-299: a size is no longer counted).
        const available = await page.locator(`#fe-size-${index}-available`).evaluate((select: HTMLSelectElement) => select.options[select.selectedIndex]?.text ?? '');

        await page.locator(`button[aria-label="Zeile ${index + 1} entfernen"]`).click();
        await expect(rows).toHaveCount(count - 1);
        await page.getByRole('button', { name: 'Eine Größe hinzufügen' }).click();
        await expect(rows).toHaveCount(count);

        const last = count - 1;
        await page.locator(`#fe-size-${last}-finish`).selectOption(size.finish);
        await page.locator(`#fe-size-${last}-bolt_holes`).selectOption(size.bolt_holes);

        for (const field of ['diameter', 'width', 'et', 'bolt_circle', 'bore', 'sku', 'price'] as const) {
            await page.locator(`#fe-size-${last}-${field}`).fill(size[field]);
        }

        await page.locator(`#fe-size-${last}-available`).selectOption({ label: available });

        story = `row ${index + 1} (${size.sku}) removed and added again`;
    } else {
        test.skip(count < 2, 'every size is named by a Gutachten and there is no second SKU to swap with');

        // Every row is locked: its SKU stays open, so swap two.
        const first = await page.locator('#fe-size-0-sku').inputValue();
        const second = await page.locator('#fe-size-1-sku').inputValue();

        await page.locator('#fe-size-0-sku').fill(second);
        await page.locator('#fe-size-1-sku').fill(first);
        story = `SKUs of rows 1 and 2 swapped (${first} ↔ ${second})`;
    }

    // The save that reaches the server carries the bogus size, so it can never be stored.
    await page.route(
        (url) => url.pathname === `/admin/felgen/${id}`,
        async (route) => {
            const request = route.request();

            if (request.method() !== 'PUT') {
                await route.fallback();

                return;
            }

            const body = JSON.parse(request.postData() ?? '{}') as { finishes: Array<{ key: string }>; configs: unknown[] };

            body.configs.push(bogusSize(body.finishes[0]!.key));
            await route.continue({ postData: JSON.stringify(body) });
        },
    );

    const answer = page.waitForResponse((response) => response.request().method() === 'PUT' && new URL(response.url()).pathname === `/admin/felgen/${id}`);

    await pressSave(page);

    const status = (await answer).status();

    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SHOTS}/katalog-02-save-${info.project.name}.png`, fullPage: false });

    expect(status, `${story}: the save was answered ${status} (a server fault), not saved or refused with a sentence`).toBeLessThan(500);
});
