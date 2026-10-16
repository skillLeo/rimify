import { type BrowserContext, type Page } from '@playwright/test';
import { maxFit } from '../../resources/js/composables/admin/railResize';
import { send } from '../teardown';
import { signIn, waitForApp } from './faq-support';

/*
 * Shared steps of the rail-resize bug tests (RAIL-xx, commit 4654f277).
 *
 * The rail's width and state are stored on the signed-in account (PATCH /admin/ansicht). Every test
 * starts from the default — 260 px, open — and its afterEach puts that back, through the same
 * endpoint the handle uses, by request over the test's own session: never through the page, which a
 * teardown must not touch (e2e/teardown.ts, D-263). Nothing else is written.
 */

/** Where the RAIL tests leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/rail';

export const handle = (page: Page) => page.getByRole('separator', { name: 'Seitenleistenbreite' });

export async function railWidth(page: Page): Promise<number> {
    return Math.round((await page.locator('.adm-rail').boundingBox())?.width ?? 0);
}

export async function workWidth(page: Page): Promise<number> {
    return Math.round((await page.locator('.adm-work').boundingBox())?.width ?? 0);
}

/**
 * The widest the rail may be in this window — the app's own rule (railResize's maxFit), applied to the
 * page the rail and the content share: the shell's width, the window less its scrollbar.
 */
export async function room(page: Page): Promise<number> {
    return maxFit(await page.evaluate(() => document.querySelector<HTMLElement>('.adm')?.clientWidth ?? 0));
}

/** Stores a rail on the account through the handle's own endpoint, by request over the session. Returns the HTTP status. */
export async function storeRail(context: BrowserContext, state: { rail: 'open' | 'collapsed'; width: number }): Promise<number> {
    return send(context, 'PATCH', '/admin/ansicht', state);
}

/** The account back to the default rail: 260 px, open. */
export async function resetRail(context: BrowserContext): Promise<void> {
    await storeRail(context, { rail: 'open', width: 260 });
}

/** Signed in, on the Übersicht at `width` × 900, with the account's rail at the default. */
export async function openAdmin(page: Page, width = 1440): Promise<void> {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    await resetRail(page.context());
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await waitForApp(page);
}

/** Every PATCH of the rail's preference from here on, as the body it carried (for failure messages). */
export function recordSaves(page: Page): string[] {
    const saves: string[] = [];

    page.on('request', (request) => {
        if (request.method() === 'PATCH' && new URL(request.url()).pathname === '/admin/ansicht') {
            saves.push(request.postData() ?? '');
        }
    });

    return saves;
}

export function isRailSave(method: string, url: string): boolean {
    return method === 'PATCH' && new URL(url).pathname === '/admin/ansicht';
}
