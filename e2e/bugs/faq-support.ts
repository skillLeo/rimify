import { expect, type APIResponse, type Page, type Request, type Route } from '@playwright/test';

/*
 * Shared steps of the Inhalte › FAQ bug tests (docs/qa/BUGS.md, FAQ-xx).
 *
 * Nothing here writes to the database. A test either saves nothing, or its save is held in the
 * browser and answered with the list as it stands (a GET of /admin/faq with the same Inertia
 * headers) — the PUT or DELETE itself never reaches the application. Running these tests leaves the
 * local FAQ exactly as it found it.
 */

export const SUPER_ADMIN = { email: 'super-admin@rimify.test', password: 'rimify-dev-2026' };

/** Where the bug tests leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/faq';

/** The props FragenController ships (resources/js/types/admin/faq.ts). */
export interface FaqEntryRow {
    id: number;
    question: string;
    answer: string;
    published: boolean;
}

export interface FaqProps {
    groups: Array<{ key: string; entries: FaqEntryRow[] }>;
    groupOptions: string[];
    onHome: number[];
    limits: { question: number; answer: number };
    can: { create: boolean; edit: boolean; delete: boolean; publish: boolean };
}

export async function signIn(page: Page): Promise<void> {
    await page.goto('/admin/anmelden', { waitUntil: 'networkidle' });
    await page.fill('#lg-mail', SUPER_ADMIN.email);
    await page.fill('#lg-pass', SUPER_ADMIN.password);
    await page.locator('button[type=submit]').first().click();
    await page.waitForURL(/\/admin$/, { timeout: 10_000 });
}

export async function waitForApp(page: Page): Promise<void> {
    await page.waitForFunction(
        () => (document.querySelector('#app') as (Element & { __vue_app__?: unknown }) | null)?.__vue_app__ !== undefined,
        null,
        { timeout: 15_000 },
    );
}

export async function openFaq(page: Page): Promise<void> {
    await page.goto('/admin/faq', { waitUntil: 'networkidle' });
    await waitForApp(page);
    await expect(page.locator('.faq-adm__entry').first()).toBeVisible();
}

/**
 * Opens the FAQ with an Inertia visit from the rail — as a person's click does — whose answer is
 * changed in the browser before the page sees it: e.g. the rights of a role the seed does not have.
 */
export async function openFaqWith(page: Page, patch: (props: FaqProps) => void): Promise<void> {
    await page.route('**/admin/faq', async (route) => {
        const request = route.request();

        if (request.method() !== 'GET' || (await request.headerValue('x-inertia')) === null) {
            await route.continue();

            return;
        }

        const response = await route.fetch();
        const json = (await response.json()) as { props: FaqProps };

        patch(json.props);
        await route.fulfill({ response, json });
    });

    await page.goto('/admin', { waitUntil: 'networkidle' });
    await waitForApp(page);
    await page.locator('a[href$="/admin/faq"]').first().evaluate((link) => (link as HTMLElement).click());
    await page.waitForURL(/\/admin\/faq$/);
    await expect(page.locator('.faq-adm__entry').first()).toBeVisible();
}

/** The headers an Inertia visit needs to be answered with the page as JSON. */
async function inertiaHeaders(request: Request): Promise<Record<string, string>> {
    const keep = ['accept', 'cookie', 'x-inertia', 'x-inertia-version', 'x-requested-with', 'x-xsrf-token'];

    return Object.fromEntries(Object.entries(await request.allHeaders()).filter(([name]) => keep.includes(name.toLowerCase())));
}

/**
 * Answers a held save the way Laravel's `back()` ends — with the list page — without the save ever
 * reaching the application: the request is sent on as a GET of /admin/faq.
 */
export async function listInsteadOf(route: Route): Promise<APIResponse> {
    const request = route.request();

    return route.fetch({
        url: new URL('/admin/faq', request.url()).toString(),
        method: 'GET',
        headers: await inertiaHeaders(request),
        postData: '',
    });
}

/** A short description of what has keyboard focus, for failure messages. */
export async function focused(page: Page): Promise<string> {
    return page.evaluate(() => {
        const el = document.activeElement;

        if (!el || el === document.body) {
            return '<body>';
        }

        const name = el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 40) ?? '';

        return `<${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}> "${name}"`;
    });
}
