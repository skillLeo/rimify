import { expect, type Locator, type Page } from '@playwright/test';

/*
 * Shared steps of the Inhalte › Seiten bug tests (docs/qa/BUGS.md, SEI-xx).
 *
 * Nothing here writes to the database: every test leaves its change unsaved, or its request never
 * reaches the application (aborted, or refused by the CSRF check). Running the suite leaves the
 * local content exactly as it found it.
 */

export const SUPER_ADMIN = { email: 'super-admin@rimify.test', password: 'rimify-dev-2026' };

/** Where the bug tests leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/seiten';

/** The one sign-in of the suites (faq-support): waits for the admin's app, not for \load\. */
export { signIn } from './faq-support';

/**
 * Opens a page's editor from the list with an Inertia visit — so the browser history holds the
 * list behind the editor, exactly as when a person clicks their way there.
 */
export async function openEditor(page: Page, title: string): Promise<void> {
    await page.goto('/admin/seiten', { waitUntil: 'networkidle' });
    await page.waitForFunction(
        () => (document.querySelector('#app') as (Element & { __vue_app__?: unknown }) | null)?.__vue_app__ !== undefined,
        null,
        { timeout: 15_000 },
    );
    await page.locator('a.sn__link', { hasText: title }).first().click();
    await page.waitForURL(/\/admin\/seiten\/\d+$/);
    await expect(page.locator('.adm-savebar')).toBeVisible();
}

/**
 * The page's own requests, counted from now on: `quiet()` waits until none has been in flight for half a second. A test
 * that clears the session cookie must wait for it first: an answer still on its way sets the cookie again (review-roles'
 * trace, 17.10.2026), the session never runs out, and the save the test means to see refused goes through. That run's
 * SEI-02 saved its draft on the desk — „Impressum QA SEI-02“, the title only it types — and the phone's SEI-02 then typed
 * what was already there: nothing to save, no request, a minute's wait.
 */
export function traffic(page: Page): { quiet: (timeout?: number) => Promise<void> } {
    let open = 0;
    let last = Date.now();
    const done = (): void => {
        open = Math.max(0, open - 1);
        last = Date.now();
    };

    page.on('request', () => {
        open++;
        last = Date.now();
    });
    page.on('requestfinished', done);
    page.on('requestfailed', done);

    return {
        quiet: async (timeout = 15_000) => {
            const until = Date.now() + timeout;

            while (open > 0 || Date.now() - last < 500) {
                if (Date.now() > until) {
                    throw new Error(`rig: the page did not go quiet within ${timeout / 1000} s (${open} requests open)`);
                }

                await page.waitForTimeout(100);
            }
        },
    };
}

/** The repeatable sections of a guide or a legal page, in the order they are shown. */
export function sections(page: Page): Locator {
    return page.locator('section[id^="pg-section-"]');
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
