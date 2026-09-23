import type { BrowserContext, Page } from '@playwright/test';

/*
 * Shared pieces of the journeys. Every journey runs against the production build with SSR on,
 * so the two things a test must wait for are hydration (a form filled before it is a form the
 * client re-renders empty) and the fonts (a late swap moves targets).
 */

export const CONSENT_COOKIE = 'rmf_consent';

/** The choice a returning visitor has already made, so the sheet stays out of a journey. */
export async function consentGiven(context: BrowserContext, baseURL: string): Promise<void> {
    await context.addCookies([
        {
            name: CONSENT_COOKIE,
            value: encodeURIComponent(JSON.stringify({ necessary: true, statistics: false, decidedAt: '2026-01-01T00:00:00.000Z' })),
            url: baseURL,
        },
    ]);
}

/** Open a route and wait until the client has taken over the server-rendered page. */
export async function open(page: Page, path: string): Promise<void> {
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.waitForFunction(
        () => (document.querySelector('#app') as (Element & { __vue_app__?: unknown }) | null)?.__vue_app__ !== undefined,
        null,
        { timeout: 15_000 },
    );
    await page.evaluate(() => document.fonts.ready);
}

/** The width of the document must never exceed the viewport (G4). */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

    if (overflow > 0) {
        throw new Error(`document overflows the viewport by ${overflow}px`);
    }
}
