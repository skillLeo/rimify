import { expect, type Locator, type Page } from '@playwright/test';
import { DEV, consentGiven, open } from '../support';

/*
 * Shared steps of the storefront sweep's bug tests (docs/qa/BUGS.md, SWEEP-xx; docs/reviews/sweep-storefront.md).
 *
 * They need the shop the client walks: the BORBET DB8GT2 published, ABE 53841, ABE 55255 and Nachtrag
 * 366-0350-21-WIRD/N1 released, and the cars those documents name (BMW X3 X83, MINI Paceman UKL-C/X …). The
 * preview (staging) has them. `SWEEP_BASE_URL` names the shop; without it the development shop (:8000), which has
 * them once the Borbet documents are released there. A shop without them fails the precondition loudly — then the
 * spec proves nothing, and says so.
 *
 * Nothing here writes product data:
 *   - a car is chosen the way the guided route chooses one (POST /fahrzeug): cookies only, FahrzeugController::store
 *     writes no row;
 *   - the variant lists are read through GET /api/v1/vehicles/variants;
 *   - SWEEP-02 puts one wheel into the session's basket (Basket::SESSION_KEY) — normal shopping, no order.
 */

export const SWEEP = process.env.SWEEP_BASE_URL ?? DEV;

/** Where the sweep's bug tests leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/sweep-storefront';

export const SLUG = 'borbet-db8gt2';

/** ABE 55255, page 5: the three sizes the BMW X3 X83 may carry on the 19″. */
export const SIZES_19 = ['235/45 R19', '245/40 R19', '255/40 R19'] as const;

/** A10 (235/45 and 245/40) and A12 (255/40): the two sentences that must never stand in one list. */
export const FINE_LINK_CHAINS = 'feingliedrige';
export const NO_CHAINS = 'Die Verwendung von Schneeketten ist nicht zulässig';

/** The papers line the brief asks for (fitment/papers.ts entryBySize). */
export const ENTRY_BY_SIZE =
    'Eintragung in die Fahrzeugpapiere erforderlich mit 255/40 R19, nicht mit 235/45 R19 und 245/40 R19.';

/** Non-breaking spaces and runs of white space as one space: texts are compared as a reader sees them. */
const NO_BREAK = new RegExp(`[${String.fromCharCode(0xa0, 0x202f)}]`, 'g');

export const norm = (text: string): string => text.replace(NO_BREAK, ' ').replace(/\s+/g, ' ').trim();

/** One row of GET /api/v1/vehicles/variants (VehicleTree::variants). */
export interface VariantRow {
    id: number;
    variant: string;
    typeDesignation: string | null;
    needsReview: boolean;
    approval?: string | null;
}

/** The variants of one model as every selector loads them. */
export async function variantsOf(page: Page, make: string, model: string): Promise<VariantRow[]> {
    const response = await page.request.get(
        `/api/v1/vehicles/variants?marke=${encodeURIComponent(make)}&modell=${encodeURIComponent(model)}`,
        { headers: { Accept: 'application/json' } },
    );

    expect(response.status(), `GET /api/v1/vehicles/variants for ${make} › ${model} on ${SWEEP}`).toBe(200);

    return ((await response.json()) as { variants: VariantRow[] }).variants;
}

/**
 * Chooses a car as POST /fahrzeug does for the guided route, with the page's own session and XSRF cookie, so the
 * vehicle cookie lands in the test's browser context. `prefer` picks one half of a car a document splits (Feld K).
 */
export async function chooseCar(
    page: Page,
    make: string,
    model: string,
    type: string,
    prefer: (row: VariantRow) => boolean = () => true,
): Promise<VariantRow> {
    await consentGiven(page.context(), SWEEP);
    await open(page, '/');

    const rows = (await variantsOf(page, make, model)).filter((row) => norm(row.typeDesignation ?? row.variant) === type);
    const row = rows.find(prefer) ?? rows[0];

    expect(
        row,
        `precondition: ${make} › ${model} › ${type} is not in the vehicle list of ${SWEEP} — is this a shop with the Borbet documents released?`,
    ).toBeDefined();

    const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN');

    expect(xsrf, 'no XSRF-TOKEN cookie on the shop').toBeDefined();

    const response = await page.request.post('/fahrzeug', {
        headers: { Accept: 'text/html', 'X-XSRF-TOKEN': decodeURIComponent(xsrf?.value ?? '') },
        form: { fahrzeug: String(row?.id ?? 0) },
        maxRedirects: 0,
    });

    expect(response.status(), `choosing ${make} ${model} ${type}: POST /fahrzeug answered ${response.status()}`).toBe(302);
    expect((await page.context().cookies()).some((c) => c.name === 'rmf_vehicle'), 'POST /fahrzeug set no vehicle cookie').toBe(
        true,
    );

    return row as VariantRow;
}

/** The size chip of a diameter in the product page's „Durchmesser“ row. */
export function sizeChip(page: Page, diameter: string): Locator {
    return page.locator('#groessen').getByRole('button', { name: diameter, exact: true });
}

/** The product page with the 19″ chosen, its panel answered. */
export async function openNineteen(page: Page): Promise<Locator> {
    await open(page, `/felgen/${SLUG}`);

    const chip = sizeChip(page, '19');

    await expect(chip, `precondition: /felgen/${SLUG} on ${SWEEP} offers no 19″`).toBeVisible();
    await expect(chip, 'precondition: the 19″ is struck through for this car').toBeEnabled();
    await chip.click();

    const panel = page.locator('.rcheck-panel').first();

    await expect(panel.locator('.rcheck-panel__vehicle')).toContainText('Mit Auflagen freigegeben für');

    return panel;
}

/** The texts of every list under `scope` that holds both snow-chain sentences. */
export async function listsWithBothChainSentences(scope: Locator): Promise<string[]> {
    const lists = await scope.locator('ul').evaluateAll((uls) => uls.map((ul) => ul.textContent ?? ''));

    return lists.filter((text) => text.includes(FINE_LINK_CHAINS) && text.includes(NO_CHAINS)).map(norm);
}

/** How often `needle` stands in `haystack`. */
export const times = (haystack: string, needle: string): number => haystack.split(needle).length - 1;
