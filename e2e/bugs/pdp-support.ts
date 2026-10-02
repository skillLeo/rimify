import { expect, type Page } from '@playwright/test';
import { SHOP } from '../shop';
import { consentGiven, open } from '../support';

/*
 * Shared steps of the product-page bug tests of 02.10.2026 (docs/qa/BUGS.md, PDP-xx; docs/qa/reviews/PDP-2026-10-02.md):
 * the reworked purchase panel — Nur Felgen / Komplettrad (#18), Wuchtgewichte and RDKS (#15), the panel after an add
 * (#16), the papers said once (#21).
 *
 * The setup: /felgen?fahrzeug=14 chooses the BMW 330i Limousine (VehicleFromUrl), then the Kraftrad KR-9 in finish 26
 * — in the e2e shop the suite seeds, so the specs hold on any machine. `PDP_BASE_URL` names another shop. A shop without
 * the car or the wheel fails the precondition by name. (Found on the BMW X3 X83 and the BORBET DB8GT2 in development.)
 *
 * Nothing here writes product data: the car is a cookie, and an add puts four rims into the session's basket only.
 */

/*
 * The e2e shop (e2e/shop.ts, seeded by the suite itself), not the development data: there the demo documents approve
 * the BMW 330i Limousine (HSN 0005 / TSN CKT, id 14) on the Kraftrad KR-9 with Auflagen, so the page sells the rims.
 */
export const PDP_BASE = process.env.PDP_BASE_URL ?? SHOP;

/** Where the specs leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/pdp-2026-10-02';

export const PDP = '/felgen/kraftrad-kr-9?ausfuehrung=26';

/** The BMW 330i chosen through the address, then the product page with its answer on screen. */
export async function openPdpWithCar(page: Page): Promise<void> {
    await consentGiven(page.context(), PDP_BASE);
    await open(page, '/felgen?fahrzeug=14');
    await open(page, PDP);

    await expect(
        page.locator('.rcheck-panel__vehicle').first(),
        `precondition: /felgen?fahrzeug=14 on ${PDP_BASE} does not choose the BMW 330i`,
    ).toContainText('330i');
    await expect(page.locator('#groessen .chip--on'), 'precondition: no size is chosen on the product page').toHaveCount(1);
}

/** Down past the main button, so the phone's price bar takes over. */
export async function scrollPastBuyButton(page: Page): Promise<void> {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator('.pdp__sticky'), 'the price bar did not appear below the main button').toBeVisible();
}

/** Until every running animation inside `selector` has finished (the panel arrives from above). */
export async function settled(page: Page, selector: string): Promise<void> {
    await page.locator(selector).evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
}
