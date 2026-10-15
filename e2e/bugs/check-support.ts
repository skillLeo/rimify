import { expect, type Locator, type Page } from '@playwright/test';
import { SHOP } from '../shop';
import { consentGiven, open } from '../support';

/*
 * Shared steps of the RIMIFY-Check bug tests of 02.10.2026 (docs/qa/BUGS.md, CHECK-xx; docs/qa/reviews/CHECK-2026-10-02.md):
 * the rebuilt question page „Passt diese Felge auf mein Auto?“ (the client's #28), `/rimify-check`.
 *
 * The e2e shop (e2e/shop.ts, seeded by the suite itself), so the specs hold on any machine:
 * - `fahrzeug=14` is the BMW 330i Limousine (HSN 0005 / TSN CKT), approved on the Kraftrad KR-9 with Auflagen, so the
 *   page sells the rims (as in pdp-support.ts);
 * - the KR-9 has two finishes (Kristallsilber, Schwarz Klarlack) in three sizes each — six entries in „Ausführung und Größe“;
 * - 1860 / AAS is the seed's pair with two cars behind it (two Audi RS 4 Avant, VehicleSeeder) — the chooser (R-01);
 *   0005 / 582 has one (the BMW 3er Coupé E36).
 * `CHECK_BASE_URL` names another shop. A shop without the car, the wheel or the pairs fails the precondition by name.
 *
 * Nothing here writes product data: the car is a cookie. CHECK-06 and CHECK-07 put rims into the session's basket
 * (CHECK-07 twice while its bug is there); CHECK-08 has its add refused by the server and writes nothing.
 */

export const CHECK_BASE = process.env.CHECK_BASE_URL ?? SHOP;

/** Where the specs leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/check-2026-10-02';

export const WHEEL = 'kraftrad-kr-9';

/** The BMW 330i Limousine in the e2e shop. */
export const CAR = 14;

export interface SizeOption {
    id: string;
    label: string;
}

/** `/rimify-check` with the query given, in that order. */
export function checkPath(query: Record<string, string | number> = {}): string {
    const search = new URLSearchParams(Object.entries(query).map(([key, value]) => [key, String(value)])).toString();

    return search === '' ? '/rimify-check' : `/rimify-check?${search}`;
}

/** Step 1, „Dein Auto“: the chosen car with „Ändern“, or the vehicle selector. */
export function carStep(page: Page): Locator {
    return page.locator('section[aria-labelledby="chk-car-h"]');
}

/** The entries of „Ausführung und Größe“, in the page's order: [id, „Kristallsilber · 7,5J × 17 · ET 45“]. */
export async function sizes(page: Page): Promise<SizeOption[]> {
    return page.locator('#chk-size option:not([disabled])').evaluateAll((options) =>
        options.map((option) => ({ id: (option as HTMLOptionElement).value, label: (option.textContent ?? '').trim() })),
    );
}

/** The page with the query given, hydrated, the cookie sheet already answered. */
export async function openCheck(page: Page, query: Record<string, string | number> = {}): Promise<void> {
    await consentGiven(page.context(), CHECK_BASE);
    await open(page, checkPath(query));
}

/** The KR-9 chosen, the BMW 330i chosen through the address (VehicleFromUrl). */
export async function openWithCar(page: Page, query: Record<string, string | number> = {}): Promise<void> {
    await openCheck(page, { felge: WHEEL, ...query, fahrzeug: CAR });

    await expect(
        carStep(page).locator('.chk__vehicle'),
        `precondition: fahrzeug=${CAR} on ${CHECK_BASE} does not choose the BMW 330i`,
    ).toContainText('330i');
}

/** The BMW 330i and the KR-9 in its first size: an answer on screen, whatever it says. */
export async function openAnswer(page: Page): Promise<SizeOption> {
    await openWithCar(page);

    const [first] = await sizes(page);

    expect(first, `precondition: ${WHEEL} offers no size on ${CHECK_BASE}`).toBeDefined();
    await open(page, checkPath({ felge: WHEEL, groesse: first!.id, fahrzeug: CAR }));
    await expect(page.locator('#antwort'), 'precondition: no answer on screen for the car and the size').toBeVisible();

    return first!;
}

/**
 * The BMW 330i and the KR-9 in the first size the page sells for it: „Jetzt kaufen“ live. With `set`, a size whose
 * Komplettrad offers a choice — two tyres, or two Wuchtgewichte colours — and „Komplettrad“ chosen.
 */
export async function openSellableAnswer(page: Page, set = false): Promise<SizeOption> {
    await openWithCar(page);

    const offered = await sizes(page);

    expect(offered.length, `precondition: ${WHEEL} offers fewer than two sizes on ${CHECK_BASE}`).toBeGreaterThan(1);

    for (const size of offered) {
        await open(page, checkPath({ felge: WHEEL, groesse: size.id, fahrzeug: CAR }));

        if ((await page.locator('button.chk__go:enabled').count()) === 0) {
            continue;
        }

        if (!set) {
            return size;
        }

        await page.locator('label.bmc-tile', { hasText: 'Kompletträder' }).click();

        const tyres = await page.locator('label.kc-row').count();
        const colours = await page.locator('label.kc-swatch').count();

        if (tyres > 0 && tyres + colours > 2 && (await page.locator('button.chk__go:enabled').count()) > 0) {
            return size;
        }
    }

    throw new Error(
        `precondition: no size of ${WHEEL} is sold to car ${CAR} on ${CHECK_BASE}${set ? ' as a Komplettrad with a choice of tyre or colour' : ''}`,
    );
}
