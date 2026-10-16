import { expect, type APIResponse, type BrowserContext, type Locator, type Page, type Request, type Route } from '@playwright/test';
import { propsOf, send } from '../teardown';
import { focusFell, focused, guardWrites, inertiaHeaders, isInertiaGet, pageInsteadOf, signIn, waitForApp } from './katalog-support';

/*
 * Shared steps of the K2 bug tests (docs/qa/BUGS.md, „Katalog 2 — Marken, Fotos je Farbe, Import mit
 * Lieferant", review of 2026-09-28): /admin/marken, a Felge's photos per colour (FinishPhotos.vue) and
 * /admin/katalog/import.
 *
 * What these tests write, and what they do not:
 *
 *   - K2-03, K2-04 and K2-05 write nothing. Every non-GET under /admin/marken and /admin/felgen is aborted in the
 *     browser unless the test answers it itself; the answer is the page as it stands (a GET with the same
 *     Inertia headers), changed in the browser the way the server's answer would have been. The brand
 *     and the photos they act on exist only in the test's browser.
 *   - K2-01 and K2-02 must reach the server (the defect is the server's answer). They work only on their
 *     own brands, named „QA K2-…", never ticked for the brand wall, and take them off again in their
 *     afterEach — by request, never through the page (`takeBackBrands`, `dropBrands`; e2e/teardown.ts, D-263).
 *     A removed brand is soft-deleted (R-04): the next run's „Marke anlegen" with the same name brings that
 *     row back instead of adding one (MarkenController::store), so the table holds at most three such rows,
 *     all removed — K2-01's kept brand gets its own name back before it goes, since its rename is saved.
 *     K2-02's logo is taken off before its brand, so no file is left.
 *   - Every write waits for the page to settle before the next step (`settled`).
 *   - Nothing is imported into the catalogue, no Felge is saved, no photo is uploaded.
 */

export { expect, focusFell, focused, guardWrites, inertiaHeaders, isInertiaGet, pageInsteadOf, signIn, waitForApp };

/** Where the bug tests leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/katalog-2';

/* ── Marken ───────────────────────────────────────────────────────────────────── */

/** One row as MarkenController::row() ships it (resources/js/Pages/Admin/Marken/Index.vue). */
export interface BrandRow {
    id: number;
    name: string;
    slug: string;
    isWheelBrand: boolean;
    sortOrder: number;
    logo: { url: string; aspect: number } | null;
    logoBroken: boolean;
    wheels: number;
    removedWheels: number;
    tyres: number;
}

interface MarkenPage {
    component: string;
    url: string;
    props: Record<string, unknown> & { brands: BrandRow[] };
}

/** A 4 : 1 black bar, as a data address: the stand-in brand's logo. It never reaches the server. */
const FAKE_LOGO = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50"><path d="M0 0h200v50H0z"/></svg>')}`;

/** A brand that exists only in the test's browser: no Felge, no Reifen, so it offers „Entfernen". */
export function fakeBrand(id: number, name: string, withLogo: boolean): BrandRow {
    return {
        id,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        isWheelBrand: false,
        sortOrder: 9999,
        logo: withLogo ? { url: FAKE_LOGO, aspect: 4 } : null,
        logoBroken: false,
        wheels: 0,
        removedWheels: 0,
        tyres: 0,
    };
}

/** Aborts every write under /admin/marken that no later handler answers. Returns what it stopped. */
export async function guardMarkenWrites(page: Page): Promise<string[]> {
    const stopped: string[] = [];

    await page.route(
        (url) => url.pathname.startsWith('/admin/marken'),
        async (route) => {
            const request = route.request();

            if (request.method() === 'GET' || request.method() === 'HEAD') {
                await route.fallback();

                return;
            }

            stopped.push(`${request.method()} ${new URL(request.url()).pathname}`);
            await route.abort();
        },
    );

    return stopped;
}

/** The Marken page as the server has it now, as an Inertia answer, its brands changed by `patch`. */
export async function markenAnswer(route: Route, patch: (brands: BrandRow[]) => BrandRow[]): Promise<{ response: APIResponse; json: MarkenPage }> {
    const response = await pageInsteadOf(route, new URL('/admin/marken', route.request().url()).toString());
    const json = (await response.json()) as MarkenPage;

    json.props.brands = patch(json.props.brands);

    return { response, json };
}

/**
 * Opens Katalog › Marken with an Inertia visit from the rail — as a person's click does — whose answer is
 * the server's own list, changed in the browser by `patch` (e.g. a stand-in brand added at the end).
 */
export async function openMarkenWith(page: Page, patch: (brands: BrandRow[]) => BrandRow[]): Promise<void> {
    await page.goto('/admin/marken', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    await page.route(
        (url) => url.pathname === '/admin/marken',
        async (route) => {
            if (!(await isInertiaGet(route.request()))) {
                await route.fallback();

                return;
            }

            const response = await route.fetch({ headers: await inertiaHeaders(route.request()) });
            const json = (await response.json()) as MarkenPage;

            json.props.brands = patch(json.props.brands);
            await route.fulfill({ response, json });
        },
    );

    const link = page.locator('a[href$="/admin/marken"]').first();

    await expect(link, 'the rail has no link to Katalog › Marken').toHaveCount(1);
    await link.evaluate((el) => (el as HTMLElement).click());
}

/** A brand's row, found by its name exactly (the key line), not by a part of it. */
export function brandRow(page: Page, name: string): Locator {
    return page.locator('table.mk__table tbody tr', { has: page.locator('.adm-table__key').getByText(name, { exact: true }) });
}

/** The row's „⋯" (the menu with Bearbeiten, Logo hochladen / ersetzen / entfernen and Entfernen). */
export function brandMenu(page: Page, name: string): Locator {
    return brandRow(page, name).getByRole('button', { name: `Aktionen für ${name}`, exact: true });
}

/** Opens the row's menu from the keyboard and chooses `item` with Enter. */
export async function chooseFromBrandMenu(page: Page, name: string, item: string): Promise<void> {
    await brandMenu(page, name).press('Enter');

    const entry = page.getByRole('menuitem', { name: item, exact: true });

    await expect(entry, `the menu of „${name}" offers no „${item}"`).toBeVisible();
    await entry.press('Enter');
}

/** The Marken form's submit button: disabled for the whole round trip of a save (`busy`), enabled once it has ended. */
export function brandSubmit(page: Page): Locator {
    return page.locator('form.mk__form button[type="submit"]');
}

/**
 * Waits until the Marken page has finished what it was sent: the round trip over (the submit button enabled
 * again — the page sets it at the very end of the visit) and the focus landed where the page puts it
 * (`focus`). A step that goes on before that races the page: it reads an answer not rendered yet, or clicks a
 * control the answer is about to take away, or opens a menu the page's own focus request then pulls the focus
 * out of — the k2-01 flake of 30.09.2026, reproduced under load.
 */
export async function settled(page: Page, focus: Locator | null): Promise<void> {
    await expect(brandSubmit(page), 'the save never finished').toBeEnabled({ timeout: 20_000 });

    if (focus !== null) {
        await expect(focus, 'the focus did not land where the page puts it').toBeFocused();
    }
}

/** „Marke anlegen" for `name`, not ticked for the brand wall; waits for its row and for the page to settle. */
export async function createBrand(page: Page, name: string): Promise<void> {
    await expect(page.locator('#mk-form-title')).toHaveText('Neue Marke');
    await page.fill('#mk-name', name);

    const wall = page.getByRole('checkbox', { name: /Markenwand zeigen/ });

    if (await wall.isChecked()) {
        await wall.uncheck();
    }

    await page.getByRole('button', { name: 'Marke anlegen' }).click();
    await expect(brandRow(page, name), `„${name}" was not created`).toHaveCount(1);
    // Created: the keyboard is back in Name (MarkenController's page, `submit` → onFinish).
    await settled(page, page.locator('#mk-name'));
}

/**
 * A test's own brands taken back by request — never through the page (e2e/teardown.ts: cleanup never navigates, D-263).
 * A live brand that now carries `gone` — `kept`, renamed by a saved rename — gets `kept` back first, so the next run's
 * „Marke anlegen" restores these rows instead of adding a third; then every live brand of either name is removed
 * (soft-deleted, R-04). Without a session it finds no list and writes nothing.
 */
export async function takeBackBrands(context: BrowserContext, kept: string, gone: string): Promise<void> {
    const before = await liveBrands(context);

    for (const brand of before.filter((b) => b.name === gone)) {
        if (!before.some((b) => b.name === kept)) {
            await send(context, 'PUT', `/admin/marken/${brand.id}`, { name: kept, isWheelBrand: brand.isWheelBrand, sortOrder: brand.sortOrder });
        }
    }

    await dropBrands(context, [kept, gone]);
}

/**
 * Every live brand of these names removed by request: a stored logo first („Logo entfernen" deletes its file,
 * BrandLogoStore::forget), then the brand (soft-deleted, R-04) — never through the page (e2e/teardown.ts, D-263).
 */
export async function dropBrands(context: BrowserContext, names: string[]): Promise<void> {
    for (const brand of (await liveBrands(context)).filter((b) => names.includes(b.name))) {
        if (brand.logo !== null) {
            await send(context, 'DELETE', `/admin/marken/${brand.id}/logo`);
        }

        await send(context, 'DELETE', `/admin/marken/${brand.id}`);
    }
}

/** The live brands as Katalog › Marken lists them, read over the session — empty without one. */
async function liveBrands(context: BrowserContext): Promise<BrandRow[]> {
    return (await propsOf<{ brands: BrandRow[] }>(context, '/admin/marken'))?.brands ?? [];
}

/** Takes the brand `name` off (its menu's „Entfernen", then the dialog's), if it is listed; waits for the page to settle. */
export async function removeBrand(page: Page, name: string): Promise<void> {
    const row = brandRow(page, name);

    if ((await row.count()) === 0) {
        return;
    }

    await brandMenu(page, name).click();
    await page.getByRole('menuitem', { name: 'Entfernen', exact: true }).click();

    const dialog = page.getByRole('dialog');

    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Entfernen', exact: true }).click();
    await expect(row).toHaveCount(0);
    await expect(dialog).toHaveCount(0);
    // Removed: the keyboard is on the next row's „⋯", or the one before, or in Name (K2-04) — never on <body>.
    await settled(page, null);
    await expect
        .poll(() => page.evaluate(() => {
            const active = document.activeElement;

            return active !== null && active !== document.body && active.closest('[role="dialog"], [role="menu"]') === null;
        }), { message: 'the focus did not land after „Entfernen"' })
        .toBe(true);
}

/* ── Photos of a colour (FinishPhotos.vue) ───────────────────────────────────── */

export interface FakePhoto {
    id: number;
    alt: string;
    manifest: Record<string, unknown>;
}

/** A photo that exists only in the test's browser. Its file is not there: the frame stays grey. */
export function fakePhoto(id: number, alt: string): FakePhoto {
    return {
        id,
        alt,
        manifest: {
            name: `qa-k2-foto-${id}`,
            base: `/qa-k2-nicht-vorhanden-${id}`,
            width: 800,
            height: 800,
            widths: [800],
            placeholder: 'data:image/svg+xml,',
            fallback: 'jpg',
            formats: [],
        },
    };
}

/** The Felge this test opened, and the photos its first colour shows (the browser's copy). */
export interface PhotoFelge {
    modelId: number;
    finishId: number;
    photos: FakePhoto[];
}

interface FelgePage {
    props: Record<string, unknown> & { finishes: Array<Record<string, unknown> & { id: number | null; photos: FakePhoto[] }> };
}

function withPhotos(json: FelgePage, felge: PhotoFelge): FelgePage {
    const first = json.props.finishes[0];

    if (first) {
        first.photos = felge.photos;
    }

    return json;
}

/**
 * Opens the first draft Felge from the list with an Inertia visit (the list's own link), its first colour
 * showing `photos` instead of its own. Every later answer for that page shows the same browser copy.
 */
export async function openFelgeWithPhotos(page: Page, photos: FakePhoto[]): Promise<PhotoFelge> {
    await page.goto('/admin/felgen?status=draft', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    const link = page.locator('a.fg-name').first();

    await expect(link, 'the Felgen list shows no draft to open (the dev DB should hold the example catalogue)').toBeVisible();

    const href = (await link.getAttribute('href')) ?? '';
    const modelId = Number(href.split('/').pop());

    expect(Number.isInteger(modelId) && modelId > 0, `no model id in „${href}"`).toBe(true);

    const felge: PhotoFelge = { modelId, finishId: 0, photos };

    await page.route(
        (url) => url.pathname === `/admin/felgen/${modelId}`,
        async (route) => {
            if (!(await isInertiaGet(route.request()))) {
                await route.fallback();

                return;
            }

            const response = await route.fetch({ headers: await inertiaHeaders(route.request()) });
            const json = (await response.json()) as FelgePage;

            felge.finishId = Number(json.props.finishes[0]?.id ?? 0);
            await route.fulfill({ response, json: withPhotos(json, felge) });
        },
    );

    await link.click();
    await page.waitForURL(new RegExp(`/admin/felgen/${modelId}$`));
    await waitForApp(page);

    expect(felge.finishId, 'the Felge has no saved colour to show photos in').toBeGreaterThan(0);
    await expect(page.locator(`#fe-photo-${felge.finishId}-start`), 'the first colour offers no „Foto hinzufügen" (read-only?)').toBeVisible();

    return felge;
}

/**
 * Answers every photo write of the opened colour in the browser: `change` does to the browser's copy
 * what the server would have done, and the answer is the Felge's page with that copy — the request never
 * reaches the application.
 */
export async function answerPhotoWrites(page: Page, felge: PhotoFelge, change: (request: Request, felge: PhotoFelge) => void): Promise<void> {
    await page.route(
        (url) => url.pathname.startsWith(`/admin/felgen/${felge.modelId}/ausfuehrungen/${felge.finishId}/`),
        async (route) => {
            const request = route.request();

            if (request.method() === 'GET') {
                await route.fallback();

                return;
            }

            change(request, felge);

            const response = await pageInsteadOf(route, new URL(`/admin/felgen/${felge.modelId}`, request.url()).toString());
            const json = withPhotos((await response.json()) as FelgePage, felge);

            await route.fulfill({ response, json });
        },
    );
}
