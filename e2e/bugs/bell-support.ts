import { expect, type APIResponse, type Page, type Request, type Route } from '@playwright/test';

/*
 * Shared steps of the bell / Benachrichtigungen bug tests (docs/qa/BUGS.md, BELL-xx).
 *
 * Nothing here writes to the database. Marking an alert read, „Alle als gelesen markieren" and the
 * „Was du bekommst" switches are held in the browser: the POST / PUT never reaches the application
 * and is answered with the page as it stands (a GET with the same Inertia headers), changed in the
 * browser the way the server's answer would have been. Running these tests leaves every alert and
 * every preference exactly as it found them.
 *
 * Sign-in is the existing helper of the FAQ tests (e2e/bugs/faq-support.ts).
 */

export { focused, signIn, waitForApp } from './faq-support';

/** Where the bug tests leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/bell';

/** One alert as BenachrichtigungenController::item() ships it (resources/js/types/admin.ts). */
export interface AlertItem {
    id: string;
    kind: string;
    kindLabel: string;
    title: string;
    detail: string | null;
    href: string | null;
    read: boolean;
    day: string;
    dayLabel: string;
    time: string | null;
    at: string | null;
    iso: string | null;
}

/** An Inertia page object, as far as these tests touch it. */
export interface InertiaPage {
    component: string;
    url: string;
    props: Record<string, unknown> & {
        admin?: { notifications?: { unread: number | null; offered?: boolean } };
        items?: AlertItem[];
        counts?: { unread: number; all: number };
    };
}

/** A stand-in alert for an account whose list is shorter than a test needs. Never sent anywhere. */
export function syntheticAlert(n: number): AlertItem {
    const id = `00000000-0000-4000-8000-${String(900_000_000_000 + n).padStart(12, '0')}`;

    return {
        id,
        kind: 'job_failed',
        kindLabel: 'Hintergrundaufgabe fehlgeschlagen',
        title: `Eine Hintergrundaufgabe ist fehlgeschlagen. (QA ${n + 1})`,
        detail: 'Aufgabe: QaProbe. Kein echter Eintrag – nur im Browser dieses Tests.',
        href: null,
        read: false,
        day: '26.09.2026',
        dayLabel: 'Heute',
        time: '09:00 Uhr',
        at: '26.09.2026, 09:00 Uhr',
        iso: '2026-09-26T07:00:00+00:00',
    };
}

/** The headers an Inertia visit needs to be answered with the page as JSON. */
export async function inertiaHeaders(request: Request): Promise<Record<string, string>> {
    const keep = ['accept', 'cookie', 'x-inertia', 'x-inertia-version', 'x-requested-with', 'x-xsrf-token'];

    return Object.fromEntries(Object.entries(await request.allHeaders()).filter(([name]) => keep.includes(name.toLowerCase())));
}

/**
 * Answers a held POST the way Laravel's `back()` ends — with the page it was sent from — without the
 * POST ever reaching the application: the request is sent on as a GET of that page.
 */
export async function pageInsteadOf(route: Route, url: string): Promise<APIResponse> {
    return route.fetch({ url, method: 'GET', headers: await inertiaHeaders(route.request()), postData: '' });
}

/** Whether a request is an Inertia page visit (a GET the router sends, answered with JSON). */
export async function isInertiaGet(request: Request): Promise<boolean> {
    return request.method() === 'GET' && (await request.headerValue('x-inertia')) !== null;
}

/** Every address under /admin. */
export function isAdminUrl(url: URL): boolean {
    return url.pathname === '/admin' || url.pathname.startsWith('/admin/');
}

/** The bell the viewer can see: the topbar's from 768 px, the app bar's below. */
export function bell(page: Page) {
    return page.locator('.adm-bell:visible');
}

/**
 * Answers the bell's list (`GET /admin/benachrichtigungen/neueste`) late, as on a slow line, with at
 * least `min` alerts — the account's own, topped up with stand-ins when it has fewer.
 */
export async function holdLatest(page: Page, ms: number, min = 2): Promise<void> {
    await page.route('**/admin/benachrichtigungen/neueste', async (route) => {
        const response = await route.fetch();
        const json = (await response.json()) as { unread?: number; items?: AlertItem[] };
        const items = Array.isArray(json.items) ? [...json.items] : [];

        while (items.length < min) {
            items.push(syntheticAlert(items.length));
        }

        await new Promise((resolve) => setTimeout(resolve, ms));
        await route.fulfill({ response, json: { ...json, items } });
    });
}

/** Opens the centre with an Inertia visit from the bell's „Alle Benachrichtigungen", as a click does. */
export async function openCentreFromBell(page: Page): Promise<void> {
    await bell(page).click();

    const item = page.getByRole('menuitem', { name: 'Alle Benachrichtigungen' });

    await expect(item).toBeVisible();
    await item.click();
    await page.waitForURL(/\/admin\/benachrichtigungen(\?.*)?$/);
    await expect(page.locator('.adm-page__title')).toHaveText('Benachrichtigungen');
}
