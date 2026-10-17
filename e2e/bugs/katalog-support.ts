import { expect, type Locator, type Page, type Route } from '@playwright/test';
import { inertiaHeaders, isInertiaGet, pageInsteadOf } from './bell-support';
import { focused, signIn, waitForApp } from './faq-support';

/*
 * Shared steps of the Katalog bug tests (docs/qa/BUGS.md, KATALOG-xx): /admin/felgen, /admin/felgen/{id},
 * /admin/felgen/neu, /admin/katalog/import and /admin/katalog/import/{id}.
 *
 * Nothing here writes to the database, and no demo model is published, archived or deleted:
 *
 *   - `guardWrites` aborts, in the browser, every request under /admin/felgen and /admin/katalog that is
 *     not a GET — unless a test has put its own handler in front for exactly that request;
 *   - a „create" (POST /admin/felgen) is answered in the browser with an existing model's edit page (a GET
 *     with the same Inertia headers), the way the server's redirect would end — nothing is created;
 *   - where a test lets a save reach the server it is one the server must refuse (no brand on /neu, an
 *     empty Modell), checked in the browser before it is sent, or one that carries a size whose id belongs
 *     to no model (`bogusSize`), which makes WheelEditor refuse the whole save at its end and roll its
 *     transaction back;
 *   - the Katalog-Import run of KATALOG-11 exists only in the test's browser.
 *
 * Sign-in is the e2e helper of the FAQ tests (super-admin).
 */

export { focused, inertiaHeaders, isInertiaGet, pageInsteadOf, signIn, waitForApp };

/** Where the bug tests leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/katalog';

export function isPhone(projectName: string): boolean {
    return projectName.startsWith('mobile');
}

/** Every write the page tried that `guardWrites` stopped, as `METHOD /path`. */
export interface WriteLog {
    stopped: string[];
}

/** Aborts every non-GET request under /admin/felgen and /admin/katalog that no later handler answers. */
export async function guardWrites(page: Page): Promise<WriteLog> {
    const log: WriteLog = { stopped: [] };

    await page.route(
        (url) => url.pathname.startsWith('/admin/felgen') || url.pathname.startsWith('/admin/katalog'),
        async (route) => {
            const request = route.request();

            if (request.method() === 'GET' || request.method() === 'HEAD') {
                await route.fallback();

                return;
            }

            log.stopped.push(`${request.method()} ${new URL(request.url()).pathname}`);
            await route.abort();
        },
    );

    return log;
}

/** The first Felge the list shows for `query` (e.g. `?sort=groessen&richtung=ab`): its id. */
export async function firstWheelId(page: Page, query = ''): Promise<number> {
    await page.goto(`/admin/felgen${query}`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    const link = page.locator('a.fg-name').first();

    await expect(link, 'the Felgen list shows no Felge to open (the dev DB should hold the demo catalogue)').toBeVisible();

    const href = (await link.getAttribute('href')) ?? '';
    const id = Number(href.split('/').pop());

    expect(Number.isInteger(id) && id > 0, `no model id in „${href}"`).toBe(true);

    return id;
}

/** Opens one Felge's form. */
export async function openFelge(page: Page, id: number): Promise<void> {
    await page.goto(`/admin/felgen/${id}`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await expect(page.locator('.adm-page__title')).toBeVisible();
    await expect(page.locator('#fe-name')).toBeVisible();
}

/** Opens the empty form of a new Felge. */
export async function openNeu(page: Page): Promise<void> {
    await page.goto('/admin/felgen/neu', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await expect(page.locator('.adm-page__title')).toHaveText('Neue Felge');
}

/** The rows of the size table. */
export function sizeRows(page: Page): Locator {
    return page.locator('.fe-sizes__table tbody tr');
}

/** „Eine Größe hinzufügen", `n` times. */
export async function addSizes(page: Page, n: number): Promise<void> {
    const add = page.getByRole('button', { name: 'Eine Größe hinzufügen' });

    for (let i = 0; i < n; i++) {
        await add.click();
    }

    await expect(sizeRows(page)).toHaveCount(n);
}

/** Fills one row of the size table (0-based), field by field, as a person types them. */
export async function fillSize(page: Page, index: number, size: Partial<Record<'diameter' | 'width' | 'et' | 'bolt_circle' | 'bore' | 'sku' | 'price' | 'stock', string>>): Promise<void> {
    for (const [field, value] of Object.entries(size)) {
        await page.locator(`#fe-size-${index}-${field}`).fill(value ?? '');
    }
}

/**
 * Strg+S, the form's own shortcut (useDirtyForm), pressed with the focus inside the page — and where it sends the form
 * (POST /admin/felgen, PUT /admin/felgen/{id}), its answer as a step of its own: a refusal is the server's to give, so
 * the page's sign of it is checked after the answer, not within a wait that also held the round trip (D-266). An answer
 * a guard stopped, or one held in the browser, ends the step as well; a save the page never sends is not waited for.
 */
export async function pressSave(page: Page): Promise<void> {
    const sent = page
        .waitForRequest((request) => ['POST', 'PUT'].includes(request.method()) && /^\/admin\/felgen(\/\d+)?$/.test(new URL(request.url()).pathname), { timeout: 3_000 })
        .catch(() => null);

    await page.keyboard.press('Control+s');

    const request = await sent;

    if (request !== null) {
        await request.response();
    }
}

/**
 * Answers the first save of /admin/felgen/neu (POST /admin/felgen) with model `id`'s edit page, the way
 * the server's redirect after a create ends — without anything being created.
 */
export async function answerCreateWith(page: Page, id: number): Promise<{ posted: Promise<void> }> {
    let done: () => void = () => undefined;
    const posted = new Promise<void>((resolve) => {
        done = () => resolve();
    });

    await page.route(
        (url) => url.pathname === '/admin/felgen',
        async (route) => {
            const request = route.request();

            if (request.method() !== 'POST') {
                await route.fallback();

                return;
            }

            const response = await pageInsteadOf(route, new URL(`/admin/felgen/${id}`, request.url()).toString());
            await route.fulfill({ response });
            done();
        },
    );

    return { posted };
}

/**
 * Lets a save of /admin/felgen/neu reach the server only if the server must refuse it: neither a brand
 * chosen nor a new one named (WheelModelRequest: brand_id required_without brand_new).
 */
export async function onlyRefusedCreates(page: Page): Promise<void> {
    await page.route(
        (url) => url.pathname === '/admin/felgen',
        async (route) => {
            const request = route.request();

            if (request.method() !== 'POST') {
                await route.fallback();

                return;
            }

            const body = JSON.parse(request.postData() ?? '{}') as { brand_id?: unknown; brand_new?: unknown };
            const named = body.brand_id !== null && body.brand_id !== undefined;
            const created = typeof body.brand_new === 'string' && body.brand_new.trim() !== '';

            if (named || created) {
                await route.abort();

                return;
            }

            await route.continue();
        },
    );
}

/**
 * A size whose id belongs to no model. WheelEditor collects „Diese Größe gehört zu einer anderen Felge"
 * for it and throws at the end of `configs()`: the whole save is refused and its transaction rolled back,
 * whatever else the save would have done. It passes WheelModelRequest's rules on its own.
 */
export function bogusSize(finishKey: string): Record<string, unknown> {
    return {
        key: 'qa-bogus',
        id: 2147483647,
        finish: finishKey,
        diameter: '26',
        width: '14',
        et: '99',
        bolt_holes: 5,
        bolt_circle: '210',
        bore: '90',
        sku: 'QA-KATALOG-02-NIE-GESPEICHERT',
        ean: '',
        kba: '',
        price: '1,00',
        stock: 0,
        weight_g: null,
    };
}

/**
 * Opens the Felgen list and then makes one Inertia visit to it (the search's „Suchen") whose answer is
 * the server's own list, changed in the browser by `patch`.
 */
export async function openFelgenPatched(page: Page, patch: (props: Record<string, unknown>) => void): Promise<void> {
    await page.goto('/admin/felgen', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    let answered: () => void = () => undefined;
    const done = new Promise<void>((resolve) => {
        answered = () => resolve();
    });

    await page.route(
        (url) => url.pathname === '/admin/felgen',
        async (route) => {
            const request = route.request();

            if (!(await isInertiaGet(request)) || (await request.headerValue('x-inertia-partial-data')) !== null) {
                await route.fallback();

                return;
            }

            const response = await route.fetch({ headers: await inertiaHeaders(request) });
            const json = (await response.json()) as { props: Record<string, unknown> };

            patch(json.props);
            await route.fulfill({ response, json });
            answered();
        },
    );

    await page.locator('form.fg-search button[type="submit"]').click();
    await done;
    await page.waitForTimeout(300);
}

/** Answers an Inertia request with a page built in the browser from another page's shared props. */
export async function fulfillSynthetic(route: Route, from: string, component: string, url: string, props: Record<string, unknown>, drop: string[] = []): Promise<void> {
    const response = await pageInsteadOf(route, new URL(from, route.request().url()).toString());
    const json = (await response.json()) as { component: string; url: string; props: Record<string, unknown> };
    const shared = { ...json.props };

    for (const key of drop) {
        delete shared[key];
    }

    json.component = component;
    json.url = url;
    json.props = { ...shared, errors: {}, ...props };

    await route.fulfill({ response, json });
}

/** Where the focus is, and whether it fell to the page itself. */
export async function focusFell(page: Page): Promise<{ fell: boolean; on: string }> {
    const on = await focused(page);

    return { fell: on === '<body>' || on.startsWith('<main#inhalt'), on };
}
