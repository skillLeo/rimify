import { expect, type Page } from '@playwright/test';
import { DEV as BASE_DEV, consentGiven, open } from '../support';

/*
 * Shared steps of the Block E/F bug tests (docs/qa/BUGS.md, EF-xx).
 *
 * Nothing here writes to a database:
 *   - a car is chosen the way the guided route chooses one (POST /fahrzeug): the answer only sets the test
 *     context's own cookies (rmf_vehicle, the garage) — FahrzeugController::store writes no row;
 *   - the variant lists are read through the selectors' own GET endpoints;
 *   - the admin is not touched by these specs.
 * (Every request still passes Laravel's session and rate-limit middleware, which keep their counters in the
 * cache and session tables as they do for every visitor — no product data.)
 *
 * The BMW › 1er-Reihe cars typed from the Borbet documents (docs/gutachten/fahrzeuge.json: 187 at
 * `0287*00-09` / `*10-..`, 1K2 at `0273*00-03` / `*04-..`, 1K4 at `0283*00-03` / `*04-..`) exist on the
 * development shop (:8000, database `rimify`), not on the e2e shop — the specs that need them say
 * `test.use({ baseURL: DEV })`.
 */

/** Where the Block E/F bug tests leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/block-ef';

/** The development shop, with the cars typed from the Borbet documents. */
export const DEV = BASE_DEV;

export const MAKE = 'BMW';
export const MODEL = '1er-Reihe';

/** One row of GET /api/v1/vehicles/variants (VehicleTree::variants). */
export interface VariantRow {
    id: number;
    variant: string;
    buildWindow: string;
    needsReview: boolean;
    approval?: string | null;
    approvalShort?: string | null;
}

export interface OptionInfo {
    text: string;
    disabled: boolean;
    value: string | null;
}

/** Non-breaking spaces and runs of white space as one space: the texts are compared as a reader sees them. */
const NO_BREAK = new RegExp(`[${String.fromCharCode(0xa0, 0x202f)}]`, 'g');

export const norm = (text: string): string => text.replace(NO_BREAK, ' ').replace(/\s+/g, ' ').trim();

const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Whether an option's text is the row of this variant name: `187 · …`, `187 (…)` or `187`. */
export const namesVariant = (text: string, variant: string): boolean => new RegExp(`^${escape(variant)}( ·| \\(|$)`).test(norm(text));

/** The variants of BMW › 1er-Reihe as every selector loads them. */
export async function variants(page: Page): Promise<VariantRow[]> {
    const response = await page.request.get(`/api/v1/vehicles/variants?marke=${encodeURIComponent(MAKE)}&modell=${encodeURIComponent(MODEL)}`, {
        headers: { Accept: 'application/json' },
    });

    expect(response.status(), `GET /api/v1/vehicles/variants for ${MAKE} › ${MODEL} did not answer 200`).toBe(200);

    return ((await response.json()) as { variants: VariantRow[] }).variants;
}

/**
 * The cars typed from a Gutachten (a Feld K line), and the names that stand twice — the halves a document
 * splits a car into. Fails loudly when the shop has none: then the spec proves nothing.
 */
export async function halves(page: Page): Promise<{ fromDocument: VariantRow[]; split: VariantRow[][] }> {
    const fromDocument = (await variants(page)).filter((row) => typeof row.approval === 'string' && row.approval !== '');
    const byName = new Map<string, VariantRow[]>();

    for (const row of fromDocument) {
        byName.set(row.variant, [...(byName.get(row.variant) ?? []), row]);
    }

    const split = [...byName.values()].filter((group) => group.length > 1);

    expect(
        split.length,
        `precondition: no variant of ${MAKE} › ${MODEL} stands twice with a Feld K line on ${new URL(page.url() === 'about:blank' ? DEV : page.url()).origin} — is this the development shop (:8000) with the Borbet documents entered?`,
    ).toBeGreaterThan(0);

    return { fromDocument, split };
}

/** The half whose range is open-ended (`ab *10`): the longest Feld K line of the pair. */
export function openEnded(split: VariantRow[][]): VariantRow {
    const rows = split.flat();

    return rows.find((row) => /\bab\s/.test(norm(row.approval ?? ''))) ?? rows[0]!;
}

/**
 * Chooses a car the way the guided route does (POST /fahrzeug, FahrzeugController::store), with the page's own
 * session and XSRF cookie, so the vehicle cookie lands in the test's browser context.
 *
 * The redirect to /felgen is NOT followed: on the development shop the Borbet documents are drafts, the listing for
 * such a car is empty, and an empty unfiltered listing writes a `catalogue_gap_events` row
 * (FelgenController::index). The specs read the bar on /warenkorb and /felgen-suchen instead, which write nothing.
 */
export async function chooseById(page: Page, id: number): Promise<void> {
    await consentGiven(page.context(), DEV);
    await open(page, '/');

    const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN');

    expect(xsrf, 'no XSRF-TOKEN cookie on the shop').toBeDefined();

    const response = await page.request.post('/fahrzeug', {
        headers: { Accept: 'text/html', 'X-XSRF-TOKEN': decodeURIComponent(xsrf?.value ?? '') },
        form: { fahrzeug: String(id) },
        maxRedirects: 0,
    });

    expect(response.status(), `choosing car ${id}: POST /fahrzeug answered ${response.status()}`).toBe(302);
    expect(new URL(response.headers()['location'] ?? '', DEV).pathname, `choosing car ${id} did not lead to the listing`).toBe('/felgen');

    const chosen = (await page.context().cookies()).some((c) => c.name === 'rmf_vehicle');

    expect(chosen, 'the vehicle cookie was not set by POST /fahrzeug').toBe(true);
}

/**
 * The phone homepage's panel (#h2, VehiclePanel.vue): Marke → Modell through the native selects, then the
 * Fahrzeug select's options as the customer gets them.
 */
export async function panelOptions(page: Page): Promise<OptionInfo[]> {
    const panel = page.locator('#h2');

    await panel.getByLabel('Marke', { exact: true }).selectOption(MAKE);

    const model = panel.getByLabel('Modell', { exact: true });

    await expect(model).toBeEnabled();
    await expect(model.locator(`option[value="${MODEL}"]`)).toHaveCount(1);
    await model.selectOption(MODEL);

    const vehicle = panel.getByLabel('Fahrzeug', { exact: true });

    await expect(vehicle).toBeEnabled();
    await expect.poll(() => vehicle.locator('option').count()).toBeGreaterThan(1);

    return vehicle.locator('option').evaluateAll((options) =>
        options.map((o) => ({
            text: (o.textContent ?? '').trim(),
            disabled: (o as HTMLOptionElement).disabled,
            value: (o as HTMLOptionElement).value,
        })),
    );
}

/**
 * The desktop homepage's hero selector (HeroSelector.vue): Marke → Modell through the comboboxes, then the
 * Fahrzeug list opened, and its options as the customer gets them.
 */
export async function heroOptions(page: Page): Promise<OptionInfo[]> {
    const hero = page.locator('.hero__panel');

    await expect(hero, 'the desktop hero selector is not on the page').toBeVisible();
    await hero.getByLabel('Marke', { exact: true }).click();
    await page.locator('[aria-label="Marken"]').getByRole('option', { name: new RegExp(`^${escape(MAKE)}\\b`) }).click();

    const modelInput = hero.getByLabel('Modell', { exact: true });

    await expect(modelInput).toBeEnabled();

    const models = page.locator('[aria-label="Modelle"]');

    // The model list opens by itself once it has loaded; a click opens it where it did not.
    if (!(await models.isVisible())) {
        await modelInput.click();
    }

    await models.getByRole('option', { name: new RegExp(`^${escape(MODEL)}\\b`) }).click();

    const input = hero.getByLabel('Fahrzeug', { exact: true });

    await expect(input).toBeEnabled();
    await input.click();

    const list = page.locator('[aria-label="Fahrzeuge"]');

    await expect(list.getByRole('option').first()).toBeVisible();

    return list.getByRole('option').evaluateAll((options) =>
        options.map((o) => ({
            text: (o.textContent ?? '').replace(/\s+/g, ' ').trim(),
            disabled: o.getAttribute('aria-disabled') === 'true' || o.hasAttribute('data-disabled'),
            value: o.getAttribute('data-value'),
        })),
    );
}
