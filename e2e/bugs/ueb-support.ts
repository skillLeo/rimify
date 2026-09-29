import { expect, type Locator, type Page, type Request, type Route } from '@playwright/test';
import type { DemandGap, DemandList } from '../../resources/js/types/admin/uebersicht';
import { inertiaHeaders, isInertiaGet, pageInsteadOf } from './bell-support';
import { focused, signIn, waitForApp } from './faq-support';

/*
 * Shared steps of the Übersicht / shell bug tests (docs/qa/BUGS.md, UEB-xx).
 *
 * Nothing here writes to the database. The charts' deferred request is held, answered late, answered
 * with a failure or answered with the server's own data changed in the browser; the Nachfrage marks
 * (POST /admin/nachfrage/markierung) never reach the application — each is answered with the list
 * as it stands (a GET with the same Inertia headers), without the marked gap, as the server's answer
 * would be. Where the dev data holds fewer open gaps than a test needs, stand-in gaps exist only in
 * that test's browser.
 *
 * The Zeitraum is remembered on the account: every test that opens the Übersicht opens it on
 * `?zeitraum=30`, the value the account is left with.
 */

export { focused, inertiaHeaders, isInertiaGet, signIn, waitForApp };

/** Where the bug tests leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/uebersicht';

export function isPhone(projectName: string): boolean {
    return projectName.startsWith('mobile');
}

/* ── The Übersicht and its deferred charts ─────────────────────────────────────────────── */

/**
 * Opens the Übersicht on 30 days without waiting for the network to settle — the charts' request
 * may be held on purpose.
 */
export async function openUebersicht(page: Page): Promise<void> {
    await page.goto('/admin?zeitraum=30', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Übersicht' })).toBeVisible();
}

/** One widget of the Übersicht, found by its title (DashWidget's `h2.widget__title`). */
export function widget(page: Page, title: string): Locator {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exact = new RegExp(`^\\s*${escaped}\\s*$`);

    return page.locator('section.widget').filter({ has: page.locator('h2.widget__title', { hasText: exact }) });
}

/** Whether a request is the Übersicht's deferred `charts` reload: an Inertia partial GET of /admin. */
export async function isChartsRequest(request: Request): Promise<boolean> {
    if (request.method() !== 'GET' || new URL(request.url()).pathname !== '/admin') {
        return false;
    }

    const only = await request.headerValue('x-inertia-partial-data');

    return only !== null && only.split(',').map((key) => key.trim()).includes('charts');
}

/** Sends the charts request to `answer`; every other request goes on as it was. */
export async function routeCharts(page: Page, answer: (route: Route) => Promise<void>): Promise<void> {
    await page.route(
        (url) => url.pathname === '/admin',
        async (route) => {
            if (!(await isChartsRequest(route.request()))) {
                await route.fallback();

                return;
            }

            await answer(route);
        },
    );
}

/** Holds the charts request until `release()`: the skeletons stay on screen meanwhile. */
export async function holdCharts(page: Page): Promise<{ arrived: Promise<void>; release: () => void }> {
    let unlock: () => void = () => undefined;
    let arrive: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
        unlock = () => resolve();
    });
    const arrived = new Promise<void>((resolve) => {
        arrive = () => resolve();
    });

    await routeCharts(page, async (route) => {
        arrive();
        await gate;
        await route.continue();
    });

    return { arrived, release: () => unlock() };
}

/** Answers the charts request with the server's own answer, changed in the browser by `patch`. */
export async function patchCharts(page: Page, patch: (charts: Record<string, unknown>) => void): Promise<void> {
    await routeCharts(page, async (route) => {
        const response = await route.fetch();
        const json = (await response.json()) as { props: { charts?: Record<string, unknown> } };

        if (json.props.charts) {
            patch(json.props.charts);
        }

        await route.fulfill({ response, json });
    });
}

/**
 * Opens the Übersicht by a click in the rail — an Inertia visit — whose answer is the server's own,
 * changed in the browser by `patch`: for props that come with the page, not with the charts (Top-Felgen).
 */
export async function openUebersichtWith(page: Page, patch: (props: Record<string, unknown>) => void): Promise<void> {
    await page.route(
        (url) => url.pathname === '/admin',
        async (route) => {
            const request = route.request();
            const partial = (await request.headerValue('x-inertia-partial-data')) !== null;

            if (!(await isInertiaGet(request)) || partial) {
                await route.fallback();

                return;
            }

            const response = await route.fetch({ headers: await inertiaHeaders(request) });
            const json = (await response.json()) as { props: Record<string, unknown> };
            patch(json.props);
            await route.fulfill({ response, json });
        },
    );

    await page.goto('/admin/bestellungen', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.getByRole('link', { name: 'Übersicht' }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'Übersicht' })).toBeVisible();
}

/* ── Layout shift, measured the way the brief asks: a PerformanceObserver ─────────────── */

interface Shift {
    t: number;
    v: number;
    input: boolean;
}

/** Records every layout shift of the documents opened after this call (Chromium only). */
export async function recordLayoutShifts(page: Page): Promise<void> {
    await page.addInitScript(() => {
        const log: Array<{ t: number; v: number; input: boolean }> = [];

        (window as unknown as { __uebShifts: typeof log }).__uebShifts = log;

        try {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };

                    log.push({ t: shift.startTime, v: shift.value, input: shift.hadRecentInput });
                }
            }).observe({ type: 'layout-shift', buffered: true });
        } catch {
            // Not Chromium: no entries; the heights decide.
        }
    });
}

/** The layout shift not caused by input since `since` (a `performance.now()` of the page). */
export async function layoutShiftSince(page: Page, since: number): Promise<number> {
    return page.evaluate((from) => {
        const log = (window as unknown as { __uebShifts?: Shift[] }).__uebShifts ?? [];

        return log.filter((shift) => !shift.input && shift.t >= from).reduce((sum, shift) => sum + shift.v, 0);
    }, since);
}

/* ── Nachfrage: the list with open gaps, every mark held in the browser ────────────────── */

/** The gap rows of the Nachfrage list (the first table; the second is „Suchen ohne Treffer"). */
export function gapRows(page: Page): Locator {
    return page.locator('.nf__panel tbody tr');
}

/** `v:12` → `gap-v-12`: the row's id, as Nachfrage/Index.vue and DemandGaps.vue build it. */
export function anchorOf(key: string): string {
    return `gap-${key.replace(':', '-')}`;
}

/** A stand-in open gap for a list shorter than a test needs. Never sent anywhere. */
export function syntheticGap(n: number): DemandGap {
    return {
        key: `k:QA-UEB-${n + 1}`,
        kind: 'keys',
        title: `HSN 0005 · TSN QA${n + 1}`,
        detail: 'Nicht im Fahrzeugkatalog – nur im Browser dieses Tests',
        asked: 9 - n,
        waiting: 1,
        lastAgo: 'vor 2 Std.',
        lastIso: null,
        score: 9 - n,
        weight: Math.max(10, 100 - n * 10),
        mark: null,
        mail: {
            subject: `Gutachten-Anfrage für HSN 0005 · TSN QA${n + 1}`,
            body: 'Guten Tag,\n\nQA-Test – diese E-Mail wird nie gesendet.\n\nViele Grüße',
        },
    };
}

export interface MarkRig {
    /** Every mark the page sent, as `METHOD body`. None of them reached the application. */
    posts: string[];
    /** The gap keys marked so far: the answers leave them out of „Offen", as the server's would. */
    marked: Set<string>;
}

interface NachfragePage {
    props: { demand: DemandList };
}

/**
 * Opens Übersicht › Nachfrage on „Offen" (an Inertia visit from the Stand chips) with at least `min`
 * open gaps, and holds every mark in the browser.
 */
export async function openNachfrage(page: Page, min = 3): Promise<MarkRig> {
    const rig: MarkRig = { posts: [], marked: new Set<string>() };

    const shape = (demand: DemandList): void => {
        const rows = demand.rows.filter((row) => row.mark === null && !rig.marked.has(row.key));

        for (let n = 0; rows.length < min; n++) {
            const gap = syntheticGap(n);

            if (!rig.marked.has(gap.key) && !rows.some((row) => row.key === gap.key)) {
                rows.push(gap);
            }
        }

        demand.rows = rows;
        demand.counts.offen = rows.length;
    };

    await page.goto('/admin/nachfrage?stand=alle', { waitUntil: 'networkidle' });
    await waitForApp(page);

    await page.route(
        (url) => url.pathname === '/admin/nachfrage',
        async (route) => {
            const request = route.request();

            if (!(await isInertiaGet(request)) || (await request.headerValue('x-inertia-partial-data')) !== null) {
                await route.fallback();

                return;
            }

            const response = await route.fetch();
            const json = (await response.json()) as NachfragePage;

            shape(json.props.demand);
            await route.fulfill({ response, json });
        },
    );

    await page.route(
        (url) => url.pathname === '/admin/nachfrage/markierung',
        async (route) => {
            const request = route.request();
            const body = request.postData() ?? '';

            rig.posts.push(`${request.method()} ${body}`);

            try {
                const key = (JSON.parse(body) as { key?: unknown }).key;

                if (typeof key === 'string') {
                    rig.marked.add(key);
                }
            } catch {
                // Not JSON: counted all the same.
            }

            try {
                const response = await pageInsteadOf(route, new URL('/admin/nachfrage?stand=offen', request.url()).toString());
                const json = (await response.json()) as NachfragePage;

                shape(json.props.demand);
                await route.fulfill({ response, json });
            } catch {
                // Cancelled meanwhile by a newer visit: there is nobody left to answer.
            }
        },
    );

    await page.getByRole('group', { name: 'Stand' }).getByRole('button', { name: /^Offen/ }).click();
    await page.waitForURL(/stand=offen/);
    await expect
        .poll(() => gapRows(page).count(), { message: 'the Nachfrage list shows no open gaps to work with' })
        .toBeGreaterThanOrEqual(min);

    return rig;
}

/**
 * A `mailto:` link opens nothing in the test browser: its click still runs the page's own handler
 * (which records the mark), but the navigation to the mail program is cancelled.
 */
export async function keepMailtoInPage(page: Page): Promise<void> {
    await page.addInitScript(() => {
        window.addEventListener(
            'click',
            (event) => {
                const link = event.target instanceof Element ? event.target.closest('a[href^="mailto:"]') : null;

                if (link) {
                    event.preventDefault();
                }
            },
            true,
        );
    });
}
