import { expect, type Page } from '@playwright/test';

/*
 * The audit journeys' shared steps (docs/review/ADMIN-AUDIT.md › Aufgaben): what a person does in the admin and the
 * shop, by the same controls they use. Data the journeys create is named so it is found again: „Prüfrad“, „Prüfwerk“.
 */

/** Waits until the client has taken over the page. */
export async function ready(page: Page): Promise<void> {
    await page.waitForFunction(
        () => (document.querySelector('#app') as (Element & { __vue_app__?: unknown }) | null)?.__vue_app__ !== undefined,
        null,
        { timeout: 20_000 },
    );
}

/** Answers the open confirmation with its button. */
export async function confirm(page: Page, label: string): Promise<void> {
    await page.getByRole('alertdialog').or(page.getByRole('dialog')).getByRole('button', { name: label, exact: true }).click();
}

/** The toast a save leaves, or null when none came within the wait. */
export async function toast(page: Page, timeout = 10_000): Promise<string | null> {
    const element = page.locator('[role="status"].toast, .toast [role="status"], .toast').first();

    return (await element.isVisible({ timeout }).catch(() => false)) ? ((await element.textContent()) ?? '').trim() : null;
}

/** Every error shown beside a field, as it reads. */
export async function fieldErrors(page: Page): Promise<string[]> {
    return (await page.locator('.form-field__error:not(:empty)').allTextContents()).map((t) => t.trim()).filter(Boolean);
}

/** Asserts each error is a German sentence: a capital, an end mark. */
export function expectGermanSentences(errors: string[], where: string): void {
    expect(errors.length, `${where}: errors shown`).toBeGreaterThan(0);

    for (const error of errors) {
        expect(error, `${where}: „${error}“ is a German sentence`).toMatch(/^[A-ZÄÖÜ„"].*[.!?“"]$/u);
    }
}

/** Accepts the cookie notice once, so it covers nothing. */
export async function cookiesAway(page: Page): Promise<void> {
    const button = page.getByRole('button', { name: 'Verstanden' });

    if (await button.isVisible().catch(() => false)) {
        await button.click();
    }
}
