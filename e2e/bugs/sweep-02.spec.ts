import { expect, test } from '../fixtures';
import { open } from '../support';
import { ENTRY_BY_SIZE, SHOTS, SWEEP, chooseCar, enterPapers, listsWithBothChainSentences, norm, openNineteen } from './sweep-support';

test.use({ baseURL: SWEEP });

/*
 * SWEEP-02 (S2) — storefront sweep of 01.10.2026: the Warenkorb is the one purchase surface that says nothing about
 * the papers. For the BMW X3 X83 on the 19″ the product page, the Kasse (the server's `sentence`), the order page,
 * the order mail and the printable RIMIFY-Check all say „Eintragung in die Fahrzeugpapiere erforderlich mit
 * 255/40 R19, nicht mit 235/45 R19 und 245/40 R19.“ (PapersWording::entryBySize / fitment/papers.ts). Warenkorb/Index.vue
 * renders the verdict's label tag and the ConditionGroups only — neither `verdict.sentence` nor entryBySize(), and
 * no other Eintragung or Abnahme line for any wheel (grep: no „Eintragung“, „Abnahme“ or `papers` in the page).
 * The A01 sentence does stand under „Nur mit 255/40 R19“, as the document's long Änderungsabnahme text — the plain
 * answer to „do I have to go to the Prüfer?“ is missing where the customer last reviews the order before the Kasse.
 *
 * Expected: the basket line carries the papers line the other surfaces carry. Writes nothing but the session's
 * basket (one 19″ wheel line) and the papers' cookie: the car from the document has no figures, and nothing is sold
 * on tyres not confirmed (D-286) — the customer enters them first, as the panel asks.
 */

test('SWEEP-02 the Warenkorb says which tyre size needs the Eintragung (BMW X3 X83, 19″)', async ({ page }, info) => {
    await chooseCar(page, 'BMW', 'X3', 'X83');
    await enterPapers(await openNineteen(page));

    await page.locator('.pdp__add').click();
    await expect(page.getByText('Zum Warenkorb hinzugefügt.').first()).toBeVisible({ timeout: 20_000 });

    await open(page, '/warenkorb');

    const line = page.locator('li.bl__line', { hasText: 'DB8GT2' }).first();

    await expect(line, 'the 19″ did not reach the basket').toBeVisible();

    // The plain answer stands on the line itself, to be read without a press: a Gutachten's paragraphs are folded
    // under their count (D-197), the papers' line never is.
    const entry = line.locator('.bl__entry').first();

    await expect(entry, 'the basket line shows no papers line').toBeVisible();
    await line.screenshot({ path: `${SHOTS}/sweep-02-warenkorb-line-${info.project.name}.png` });

    const said = norm((await entry.textContent()) ?? '');

    expect(said, `the basket line says nothing about the Eintragung: „${said.slice(0, 200)}…“`).toContain(ENTRY_BY_SIZE);

    // The groups are there — one press away where the wording is long — and keep the snow chains apart.
    const fold = line.locator('details[data-auflagen] > summary');

    if ((await fold.count()) > 0) {
        await fold.click();
    }

    await expect(line.locator('[data-condition-groups]')).toBeVisible();
    expect(await listsWithBothChainSentences(line)).toEqual([]);
});
