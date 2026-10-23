import { expect, type Page, type Response } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { send } from '../teardown';

/*
 * The admin audit's shared pieces (docs/review/ADMIN-AUDIT.md). Every step is watched for what the brief names as
 * „throughout“: no console error, no page error, no answer of 4xx or 5xx that the step did not ask for. What a step
 * saw is kept in a ledger per run, so every row of the inventory can end in a result read from it.
 */

export const SUPER_ADMIN = { email: 'super-admin@rimify.test', password: 'rimify-dev-2026' };

/** Where the ledger and the pictures go: beside the audit's document, never into the client's shots. */
export const OUT = 'docs/review/audit';

export interface Seen {
    console: string[];
    pageErrors: string[];
    failed: string[];
}

export interface Watcher {
    /** What was seen since the last call, and a fresh start. */
    take: () => Seen;
    /** Answers a step asks for on purpose (a 422 for a form sent empty): not counted. */
    expect: (patterns: RegExp[]) => void;
}

/** Watches a page for its whole test: console errors, uncaught errors and every answer of 400 or more. */
export function watch(page: Page): Watcher {
    let seen: Seen = { console: [], pageErrors: [], failed: [] };
    let expected: RegExp[] = [];
    const allowed = (text: string): boolean => expected.some((re) => re.test(text));

    page.on('console', (message) => {
        // Chromium reports a refused answer in the console too, without its address: counted once, as the answer.
        if (message.type() === 'error' && !/^Failed to load resource: the server responded with a status of/.test(message.text())) {
            seen.console.push(message.text().slice(0, 300));
        }
    });
    page.on('pageerror', (error) => seen.pageErrors.push(String(error.message).slice(0, 300)));
    page.on('response', (response: Response) => {
        const line = `${response.status()} ${response.request().method()} ${new URL(response.url()).pathname}`;

        if (response.status() >= 400 && !allowed(line)) {
            seen.failed.push(line);
        }
    });

    return {
        take: () => {
            const taken = seen;
            seen = { console: [], pageErrors: [], failed: [] };
            expected = [];

            return taken;
        },
        expect: (patterns) => {
            expected = patterns;
        },
    };
}

/** Whether a step saw nothing it should not have. */
export function clean(seen: Seen): boolean {
    return seen.console.length === 0 && seen.pageErrors.length === 0 && seen.failed.length === 0;
}

/** Fails the step with everything it saw, when it saw anything. */
export function expectClean(seen: Seen, where: string): void {
    expect({ console: seen.console, pageErrors: seen.pageErrors, failed: seen.failed }, `${where}: console errors, page errors and failed answers`).toEqual({
        console: [],
        pageErrors: [],
        failed: [],
    });
}

/** Signs in as the super-admin by request (as the e2e suites do, D-266) and leaves the page where it is. */
export async function signIn(page: Page): Promise<void> {
    const context = page.context();

    await context.request.get('/admin/anmelden', { headers: { 'X-Inertia': 'true', 'X-Requested-With': 'XMLHttpRequest' }, maxRedirects: 0 });
    const status = await send(context, 'POST', '/admin/anmelden', { email: SUPER_ADMIN.email, password: SUPER_ADMIN.password });

    expect(status, 'the super-admin is signed in').toBe(302);
}

/**
 * Asks for the password once, as the panel's own „Passwort bestätigen“ does before Benutzer, Einstellungen and refunds:
 * the confirmation lasts 15 minutes, so every later page of the step opens directly.
 */
export async function confirmPassword(page: Page): Promise<void> {
    const status = await send(page.context(), 'POST', '/admin/bestaetigen', { password: SUPER_ADMIN.password });

    expect([302, 303], 'the password is confirmed').toContain(status);
}

/** Opens an admin page and waits until the client has taken it over; returns the document's status. */
export async function openAdmin(page: Page, url: string): Promise<number> {
    const response = await page.goto(url, { waitUntil: 'networkidle' });

    await page.waitForFunction(
        () => (document.querySelector('#app') as (Element & { __vue_app__?: unknown }) | null)?.__vue_app__ !== undefined,
        null,
        { timeout: 20_000 },
    );

    return response?.status() ?? 0;
}

/** How far the document is wider than the window, in pixels: 0 is what every width must show. */
export function overflow(page: Page): Promise<number> {
    return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

/** Appends one line of JSON to the run's ledger. */
export function record(file: string, entry: Record<string, unknown>): void {
    fs.mkdirSync(OUT, { recursive: true });
    fs.appendFileSync(path.join(OUT, file), `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`);
}

/** The pattern a URL belongs to: every number a placeholder, so one detail page stands for its kind. */
export function patternOf(pathname: string): string {
    return pathname.replace(/\/\d+(?=\/|$)/g, '/{id}').replace(/\/[0-9A-HJKMNP-TV-Z]{26}(?=\/|$)/g, '/{ulid}');
}
