import { expect, test } from '../fixtures';
import { open } from '../support';
import { SHOTS, SLUG, SWEEP, chooseCar, norm, sizeChip } from './sweep-support';

test.use({ baseURL: SWEEP });

/*
 * SWEEP-03 (S2) — storefront sweep of 01.10.2026: on the product page a size whose answer waits for the car's
 * Karosserieform is struck through and cannot be chosen, so the question that would answer it is never asked there.
 *
 * MINI Paceman UKL-C/X (the `*00` half, ABE 55255 page 5, row „Cpe“): the car from the document has no body style
 * and „Paceman“ derives none (BuildFromName), so the 19″ answers UNKNOWN with `missing: ['bodyForm']` — „Noch offen“,
 * answered in place by BuildForm. The 18″ answers UNKNOWN too (Anlage 16 does not name the car: ANNEX_MISSING). Both
 * are unsellable, so useConfigurator strikes and disables both chips (`blocked = !group.some(sellable)`,
 * `selectSize` returns on a blocked chip) and opens on the cheaper 18″. FitmentPanel renders BuildForm for the
 * selected size's `missing` only — the 18″ has none — so the page never asks for the Karosserieform. What the 19″
 * waits for is said only in the chip's `title` (no tooltip on a phone), and the note under the chips calls it
 * „Für durchgestrichene Größen liegt uns für dein Fahrzeug keine Freigabe vor.“ — while ABE 55255 approves the
 * Paceman Coupé on the 19″. The listing (/felgen) asks the question; a customer who arrives on the product page from
 * the home shelf, a shared link, the compare page or the search does not get it.
 *
 * Expected: the 19″ can be chosen and its panel asks for the Karosserieform (as /felgen does), or the page asks for it
 * beside the struck chip. Writes nothing: POST /fahrzeug sets only cookies.
 */

test('SWEEP-03 the product page asks for the Karosserieform a size waits for (MINI Paceman, 19″)', async ({ page }, info) => {
    await chooseCar(page, 'MINI', 'Paceman', 'UKL-C/X', (row) => /, \*00$/.test(norm(row.approval ?? '')));
    await open(page, `/felgen/${SLUG}`);

    const nineteen = sizeChip(page, '19');

    await expect(nineteen, `precondition: /felgen/${SLUG} on ${SWEEP} offers no 19″`).toBeVisible();
    await page.locator('#groessen').screenshot({ path: `${SHOTS}/sweep-03-sizes-${info.project.name}.png` });

    const reason = norm((await nineteen.getAttribute('title')) ?? '');
    const enabled = await nineteen.isEnabled();

    expect(
        enabled || reason.includes('Karosserieformen oder Antriebe'),
        `precondition: the 19″ for MINI Paceman UKL-C/X *00 does not wait for the body style on ${SWEEP} (title „${reason}“)`,
    ).toBe(true);

    if (enabled) {
        await nineteen.click();
    }

    // The body-style question (BuildForm, `.bf`) anywhere on this page — in the panel or beside the struck chip.
    const asked = await page.locator('.bf').first().isVisible();

    await page.locator('.pdp__buy').screenshot({ path: `${SHOTS}/sweep-03-panel-${info.project.name}.png` });

    expect(
        asked,
        `the 19″ waits for the Karosserieform („${reason}“); its chip is ${enabled ? 'enabled' : 'struck through and disabled'} and the page never asks for it`,
    ).toBe(true);
});
