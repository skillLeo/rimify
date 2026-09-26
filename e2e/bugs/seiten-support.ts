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

export async function signIn(page: Page): Promise<void> {
    await page.goto('/admin/anmelden', { waitUntil: 'networkidle' });
    await page.fill('#lg-mail', SUPER_ADMIN.email);
    await page.fill('#lg-pass', SUPER_ADMIN.password);
    await page.locator('button[type=submit]').first().click();
    await page.waitForURL(/\/admin$/, { timeout: 10_000 });
}

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
