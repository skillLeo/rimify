import { expect, test } from '../fixtures';
import { SHOTS, brandMenu, brandRow, createBrand, removeBrand, settled, signIn, takeBackBrands, waitForApp } from './k2-support';

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
 * run's „Marke anlegen" brings the same rows back instead of adding new ones). Since the fix the rename is
 * saved, so the cleanup renames the kept brand back before removing it: every run leaves the table as it
 * found it. The cleanup goes by request in the afterEach, never through the page (e2e/teardown.ts, D-263):
 * as a `finally` that clicked through the list it ran on a page the timeout was already closing.
 *
 * Every step waits for the page to settle (`settled`: the round trip over, the focus landed) before it reads
 * or clicks. The spec used to read the outcome 800 ms after the PUT: on a loaded machine the redirected page
 * came later, and the test failed in the full suite while passing alone (30.09.2026, reproduced under load).
 */

const GONE = 'QA K2-01 Entfernt';
const KEPT = 'QA K2-01 Bleibt';

// Whatever happened, both brands go again — by request over the session, never through the page.
test.afterEach(async ({ context }) => {
    await takeBackBrands(context, KEPT, GONE);
});

test('K2-01 renaming a brand to the name of a removed brand is saved or refused in a sentence — never a server error', async ({ page }, info) => {
    await signIn(page);

    // A run that stopped half-way left its brands: they go first, by request, so this run starts clean.
    await takeBackBrands(page.context(), KEPT, GONE);

    await page.goto('/admin/marken', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    // A removed brand, exactly as „Entfernen" leaves one.
    await createBrand(page, GONE);
    await removeBrand(page, GONE);

    await createBrand(page, KEPT);

    await brandMenu(page, KEPT).click();
    await page.getByRole('menuitem', { name: 'Bearbeiten', exact: true }).click();
    await expect(page.locator('#mk-name')).toHaveValue(KEPT);
    await page.fill('#mk-name', GONE);

    const [response] = await Promise.all([
        page.waitForResponse((r) => r.request().method() === 'PUT' && /^\/admin\/marken\/\d+$/.test(new URL(r.url()).pathname)),
        page.getByRole('button', { name: 'Änderungen speichern' }).click(),
    ]);

    const status = response.status();
    // The PUT's answer is a redirect; the page the browser fetches after it is what says saved or refused.
    // Read the outcome once the page has finished that round trip — never at a fixed time after the PUT,
    // which a loaded machine outran (30.09.2026: the page showed its answer after the 800 ms this waited).
    await settled(page, page.locator('#mk-name'));

    const sentence = ((await page.locator('#mk-name-err').textContent()) ?? '').trim();
    const saved = (await brandRow(page, GONE).count()) > 0;

    await page.screenshot({ path: `${SHOTS}/k2-01-rename-to-removed-${info.project.name}.png`, fullPage: true });

    expect(status, `the rename to „${GONE}" (a removed brand's name) was answered ${status}`).toBeLessThan(500);
    expect(saved || sentence !== '', `neither saved nor refused under „Name" (sentence: „${sentence}")`).toBe(true);
});
