import { expect, type Locator, type Page, type Route } from '@playwright/test';
import { inertiaHeaders, isInertiaGet, pageInsteadOf } from './bell-support';
import { focused, signIn, waitForApp } from './faq-support';

/*
 * Shared steps of the Gutachten / Auflagen / Fahrzeuge / Review bug tests (docs/qa/BUGS.md, GUTACHTEN-xx and
 * REVIEW-xx): /admin/gutachten, /admin/gutachten/neu, /admin/gutachten/{id}, /admin/auflagen, /admin/fahrzeuge,
 * /admin/review/rueckmeldungen and the feedback dialog.
 *
 * Nothing here writes to the database, and no seeded document, vehicle or Auflage is changed:
 *
 *   - `guardWrites` aborts, in the browser, every request under /admin/gutachten, /admin/auflagen,
 *     /admin/fahrzeuge, /admin/review and /admin/uploads that is not a GET — unless a test has put its own
 *     handler in front for exactly that request;
 *   - the dev database holds no draft Gutachten (ApprovalSeeder releases every document), so the entry
 *     workspace is opened on a released document whose page is answered in the browser as a draft
 *     (`openAsDraft`); its row edits, removals and the Freigabe are answered in the browser too
 *     (`answerWithDocument`) — the server's own page for the document, changed the way its answer would be;
 *   - the searches of „Zeilen hinzufügen" and the preview are GETs and reach the server as they are.
 *
 * GUTACHTEN-01 is the one test that sends a write to the server, on a draft someone created, built so that
 * its transaction cannot commit (see that file).
 *
 * Sign-in is the e2e helper of the FAQ tests (super-admin).
 */

export { focused, inertiaHeaders, isInertiaGet, pageInsteadOf, signIn, waitForApp };

/** Where the bug tests leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/gutachten';

export function isPhone(projectName: string): boolean {
    return projectName.startsWith('mobile');
}

/* ── Props as GutachtenController::show ships them (resources/js/types/admin/gutachten.ts) ─────────── */

export interface TyreSizeRow {
    width_mm: number;
    aspect: number;
    diameter: number;
    min_load_index: number | null;
    min_speed_symbol: string;
    axle: string;
    label: string;
}

export interface RowView {
    id: number;
    vehicleId: number;
    vehicle: string;
    wheel: string;
    size: string;
    tyreSizes: TyreSizeRow[];
    [key: string]: unknown;
}

export interface ShowProps {
    document: { id: number; label: string; status: string; statusLabel: string; pdfUrl: string | null; [key: string]: unknown };
    rows: RowView[];
    vehicles: Array<{ id: number; label: string }>;
    blockers: string[];
    previewVehicle: number | null;
    /** The document's own Auflagenverzeichnis (the corrections memo §1). */
    conditions: Array<{ id: number; code: string; uses: number; [key: string]: unknown }>;
    can: { edit: boolean; release: boolean };
    errors?: Record<string, string>;
    [key: string]: unknown;
}

export interface InertiaJson<P> {
    component: string;
    url: string;
    props: P;
    [key: string]: unknown;
}

/* ── Writes ────────────────────────────────────────────────────────────────────────────────────────── */

/** Every write the page tried that `guardWrites` stopped, as `METHOD /path`. */
export interface WriteLog {
    stopped: string[];
}

const GUARDED = ['/admin/gutachten', '/admin/auflagen', '/admin/fahrzeuge', '/admin/review', '/admin/uploads'];

/** Aborts every non-GET request under the guarded paths that no later handler answers. */
export async function guardWrites(page: Page): Promise<WriteLog> {
    const log: WriteLog = { stopped: [] };

    await page.route(
        (url) => GUARDED.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`)),
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

/* ── Documents ─────────────────────────────────────────────────────────────────────────────────────── */

/**
 * Opens the Dokumente list and returns a released document with rows to work on: the one with the FEWEST
 * rows above zero, so its page stays quick — a document of 1.400 rows makes every step slow, not different.
 */
export async function busiestDocument(page: Page): Promise<number> {
    await page.goto('/admin/gutachten', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await expect(page.locator('a.gd-link').first(), 'the Dokumente list shows no document (the dev DB should hold the seeded Gutachten)').toBeVisible();

    const picked = await page.evaluate(() => {
        let best = { id: 0, rows: Number.POSITIVE_INFINITY };

        for (const tr of Array.from(document.querySelectorAll('table.adm-table tbody tr'))) {
            const href = tr.querySelector('a.gd-link')?.getAttribute('href') ?? '';
            const id = Number(href.split('/').pop());
            // "N von M": N rows in the shop, M in all. Only a released document has rows in the shop — the
            // callers answer it in the browser as a draft and release it again; a real draft (QA-ENTWURF)
            // is not what they are about.
            const cell = tr.querySelector('td[data-label="Zeilen im Shop"]')?.textContent ?? '';
            const [, live = '0', total = '0'] = /([\d.]+)\s+von\s+([\d.]+)/.exec(cell) ?? [];
            const inShop = Number(live.replace(/\./g, ''));
            const rows = Number(total.replace(/\./g, ''));

            if (Number.isInteger(id) && id > 0 && inShop > 0 && rows > 0 && rows < best.rows) {
                best = { id, rows };
            }
        }

        return best;
    });

    expect(picked.id > 0, 'no document id on the Dokumente list').toBe(true);

    return picked.id;
}

/** A released document's props, turned into a draft the viewer may edit and release. */
export function asDraft(props: ShowProps): void {
    props.document = { ...props.document, status: 'draft', statusLabel: 'Entwurf' };
    props.can = { edit: true, release: true };
    props.blockers = [];
}

/**
 * With the Dokumente list open (`busiestDocument`), opens document `id` by clicking it — an Inertia visit —
 * and answers that visit in the browser with the server's own page, turned into a draft (`asDraft`) and then
 * changed by `patch`. Partial reloads (the preview) reach the server untouched.
 */
export async function openAsDraft(page: Page, id: number, patch: (props: ShowProps) => void = () => undefined): Promise<void> {
    await page.route(
        (url) => url.pathname === `/admin/gutachten/${id}`,
        async (route) => {
            const request = route.request();

            if (!(await isInertiaGet(request)) || (await request.headerValue('x-inertia-partial-data')) !== null) {
                await route.fallback();

                return;
            }

            const response = await route.fetch({ headers: await inertiaHeaders(request) });
            const json = (await response.json()) as InertiaJson<ShowProps>;

            asDraft(json.props);
            patch(json.props);
            await route.fulfill({ response, json });
        },
    );

    await page.locator(`a.gd-link[href="/admin/gutachten/${id}"]`).first().click();
    await page.waitForURL(new RegExp(`/admin/gutachten/${id}(\\?.*)?$`));
    await expect(page.locator('.rc'), '„Zeilen hinzufügen" is not on the page (the draft answer did not arrive)').toBeVisible();
}

/**
 * Answers a write (a row removed, rows added, the Freigabe …) in the browser with document `id`'s page as
 * the server has it now, changed by `patch` the way the write's answer would be, and with `errors` as a
 * refusal would carry them. The write itself never reaches the application.
 */
export async function answerWithDocument(route: Route, id: number, patch: (props: ShowProps) => void, errors: Record<string, string> = {}): Promise<void> {
    const response = await pageInsteadOf(route, new URL(`/admin/gutachten/${id}`, route.request().url()).toString());
    const json = (await response.json()) as InertiaJson<ShowProps>;

    patch(json.props);
    json.props.errors = errors;
    await route.fulfill({ response, json });
}

/** The row id in `/admin/gutachten/{document}/zeilen/{row}`, or null. */
export function rowIdOf(url: string): number | null {
    const m = /\/zeilen\/(\d+)$/.exec(new URL(url).pathname);

    return m?.[1] === undefined ? null : Number(m[1]);
}

/* ── „Zeilen hinzufügen" ───────────────────────────────────────────────────────────────────────────── */

export interface Composer {
    vehicleSearch: Locator;
    wheelSearch: Locator;
    vehicles: Locator;
    vehicleLabels: Locator;
    sizes: Locator;
    submit: Locator;
}

export function composer(page: Page): Composer {
    const vehicles = page.locator('section[aria-labelledby="rc-h-vehicles"]');
    const sizes = page.locator('section[aria-labelledby="rc-h-sizes"]');

    return {
        vehicleSearch: page.locator('#rc-vehicle-q'),
        wheelSearch: page.locator('#rc-wheel-q'),
        vehicles: vehicles.locator('.rc-hits input[type="checkbox"]'),
        vehicleLabels: vehicles.locator('.rc-hits .rc-hit__label'),
        sizes: sizes.locator('.rc-hits--sizes input[type="checkbox"]'),
        submit: page.locator('.rc-foot .btn--primary'),
    };
}

/** Ticks the first vehicle and the first size the searches list, as a person does. */
export async function chooseOneEach(page: Page): Promise<void> {
    const c = composer(page);

    await expect(c.vehicles.first(), 'the vehicle search of „Zeilen hinzufügen" lists nothing').toBeVisible({ timeout: 15_000 });
    await c.vehicles.first().check();
    await expect(c.sizes.first(), 'the size search of „Zeilen hinzufügen" lists nothing').toBeVisible({ timeout: 15_000 });
    await c.sizes.first().check();
    await expect(c.submit).toBeEnabled();
}

/* ── Focus ─────────────────────────────────────────────────────────────────────────────────────────── */

/** Where the focus is, and whether it fell to the page itself. */
export async function focusFell(page: Page): Promise<{ fell: boolean; on: string }> {
    const on = await focused(page);

    return { fell: on === '<body>' || on.startsWith('<main#inhalt'), on };
}
