import { expect, test, type Page } from '@playwright/test';
import { SHOTS, answerCreateWith, firstWheelId, guardWrites, openNeu, pressSave, signIn, sizeRows } from './katalog-support';

/*
 * KATALOG-05 (S2) — „Größen erzeugen" keeps counting finishes that are gone. After a finish is removed,
 * and after the first „Speichern" of a new Felge (its finish is then `f<id>`, no longer `n1`), the panel
 * still holds the old key: no box is ticked, yet the button offers „1 Größe in die Tabelle"; pressed, it
 * adds nothing and says „Alle diese Größen stehen schon in der Tabelle." — over an empty table
 * (docs/qa/BUGS.md). Ticking the real finish then counts double.
 *
 * MatrixPanel.vue copies `props.finishes.map((f) => f.key)` into its own `input` once, at mount, and never
 * looks again; `planned()` multiplies by `input.finishes.length`, `missing` asks only for a non-empty list,
 * and `generate()` skips every key it cannot find.
 *
 * Expected: the button counts only finishes that exist and are ticked (disabled, with „Noch nötig: eine
 * Ausführung" when none is); pressed, it adds what it promised.
 *
 * Nothing is written: (a) never saves; in (b) the create is answered in the browser.
 */

async function generate(page: Page, d: string, w: string, et: string): Promise<{ label: string; enabled: boolean }> {
    // The matrix opens from the Größen header (it starts open while a Felge has no size yet).
    if (!(await page.locator('#fe-m-d').isVisible())) {
        await page.getByRole('button', { name: 'Größen aus Listen erzeugen' }).click();
    }
    await page.locator('#fe-m-d').fill(d);
    await page.locator('#fe-m-w').fill(w);
    await page.locator('#fe-m-et').fill(et);

    const button = page.locator('.fe-matrix__foot button');

    return { label: (await button.textContent())?.trim() ?? '', enabled: await button.isEnabled() };
}

async function ticked(page: Page): Promise<number> {
    return page.locator('.fe-matrix__finishes input[type="checkbox"]:checked').count();
}

/** The panel's answer under it („3 Größen hinzugefügt …"), or '' when it said nothing. */
async function said(page: Page): Promise<string> {
    const status = page.locator('.fe-added');

    return (await status.count()) > 0 ? ((await status.textContent()) ?? '').trim() : '';
}

test('KATALOG-05a after a finish is removed, „Größen erzeugen" does not offer sizes for it', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);
    await openNeu(page);

    await page.getByRole('button', { name: 'Ausführung hinzufügen' }).click();
    await expect(page.locator('.fe-finish')).toHaveCount(2);
    // The first finish — the one the panel ticked at the start — goes.
    await page.getByRole('button', { name: 'Entfernen', exact: true }).first().click();
    await expect(page.locator('.fe-finish')).toHaveCount(1);

    const offer = await generate(page, '18', '8', '35');
    const boxes = await ticked(page);

    if (offer.enabled) {
        await page.locator('.fe-matrix__foot button').click();
    }

    await page.locator('.fe-matrix').screenshot({ path: `${SHOTS}/katalog-05a-matrix-${info.project.name}.png` });

    const rows = await sizeRows(page).count();

    expect(
        offer.enabled && rows === 0,
        `${boxes} finish(es) ticked, the button said „${offer.label}" and was enabled; pressed, it added ${rows} rows and said „${await said(page)}"`,
    ).toBe(false);
});

test('KATALOG-05b after the first „Speichern", „Größen erzeugen" knows the saved finishes', async ({ page }, info) => {
    await signIn(page);

    const id = await firstWheelId(page);
    await guardWrites(page);
    const create = await answerCreateWith(page, id);

    await openNeu(page);
    await page.locator('#fe-name').fill('QA KATALOG-05 nie gespeichert');
    await page.locator('#fe-f-0-name').fill('QA Graphit');
    await pressSave(page);
    await create.posted;
    await page.waitForURL(new RegExp(`/admin/felgen/${id}$`));

    const before = await sizeRows(page).count();
    // A size no model has: nothing in the table can already be it.
    const offer = await generate(page, '26', '14', '-99');
    const boxes = await ticked(page);
    const finishes = await page.locator('.fe-matrix__finishes input[type="checkbox"]').count();

    if (offer.enabled) {
        await page.locator('.fe-matrix__foot button').click();
    }

    await page.locator('.fe-matrix').screenshot({ path: `${SHOTS}/katalog-05b-matrix-after-create-${info.project.name}.png` });

    const after = await sizeRows(page).count();

    expect(
        offer.enabled && after === before,
        `${boxes} of ${finishes} finishes ticked, the button said „${offer.label}"; pressed, the table went from ${before} to ${after} rows and the page said „${await said(page)}"`,
    ).toBe(false);
});
