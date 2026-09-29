import { expect, test } from '../fixtures';
import { SHOTS, brandMenu, brandRow, createBrand, removeBrand, signIn, waitForApp } from './k2-support';

/*
 * K2-01 (S1) — a removed brand keeps its name and slug in the table's unique keys, while every check and
 * every lookup sees only live brands (docs/qa/BUGS.md):
 *
 *   - Katalog › Marken: renaming a brand to the name of a removed one passes BrandRequest
 *     (`unique … whereNull('deleted_at')`) and then hits `brands.name` UNIQUE — 500, „Das hat auf unserer
 *     Seite nicht geklappt … Versuch es gleich noch einmal", again on every retry;
 *   - the Felge form's „Neue Marke anlegen …" with that name: WheelEditor::brand() looks only at live
 *     brands, the insert collides, and the catch answers „Zwei Größen wären danach gleich …";
 *   - Katalog-Import with a line of that brand: the Probelauf plans „neue Marke", „Importieren" → 500.
 *
 * The development database already holds such names (CatalogueSeeder::retireFormerBrands soft-deletes
 * Rotiform, MAM, YIDO, Demo, Bridgestone, Continental, Michelin) — and every „Entfernen" on the new Marken
 * page makes one more.
 *
 * Only the first path is tested (the others would save a Felge or import a file). Expected: the rename is
 * saved, or refused with a sentence under „Name" — never a server error.
 *
 * Writes: two brands of its own, never on the brand wall, both removed again (soft-deleted, R-04; the next
 * run's „Marke anlegen" brings the same rows back instead of adding new ones).
 */

const GONE = 'QA K2-01 Entfernt';
const KEPT = 'QA K2-01 Bleibt';

test('K2-01 renaming a brand to the name of a removed brand is saved or refused in a sentence — never a server error', async ({ page }, info) => {
    await signIn(page);
    await page.goto('/admin/marken', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    // A run that stopped half-way left its brands: they go first, so this run starts clean.
    await removeBrand(page, GONE);
    await removeBrand(page, KEPT);

    // A removed brand, exactly as „Entfernen" leaves one.
    await createBrand(page, GONE);
    await removeBrand(page, GONE);

    await createBrand(page, KEPT);

    let status: number;
    let sentence: string;
    let saved: boolean;

    try {
        await brandMenu(page, KEPT).click();
        await page.getByRole('menuitem', { name: 'Bearbeiten', exact: true }).click();
        await expect(page.locator('#mk-name')).toHaveValue(KEPT);
        await page.fill('#mk-name', GONE);

        const [response] = await Promise.all([
            page.waitForResponse((r) => r.request().method() === 'PUT' && /^\/admin\/marken\/\d+$/.test(new URL(r.url()).pathname)),
            page.getByRole('button', { name: 'Änderungen speichern' }).click(),
        ]);

        status = response.status();
        await page.waitForTimeout(800);

        sentence = ((await page.locator('#mk-name-err').textContent()) ?? '').trim();
        saved = (await brandRow(page, GONE).count()) > 0;

        await page.screenshot({ path: `${SHOTS}/k2-01-rename-to-removed-${info.project.name}.png`, fullPage: true });
    } finally {
        // Whatever happened: the form back to „Neue Marke", both brands off the list again.
        const cancel = page.getByRole('button', { name: 'Abbrechen', exact: true });

        if ((await cancel.count()) > 0) {
            await cancel.click();
        }

        await removeBrand(page, KEPT);
        await removeBrand(page, GONE);
    }

    expect(status, `the rename to „${GONE}" (a removed brand's name) was answered ${status}`).toBeLessThan(500);
    expect(saved || sentence !== '', `neither saved nor refused under „Name" (sentence: „${sentence}")`).toBe(true);
});
