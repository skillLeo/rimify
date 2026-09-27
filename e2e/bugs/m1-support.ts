import { expect, type Locator, type Page } from '@playwright/test';
import { holdCharts, isPhone, openUebersicht, signIn, waitForApp, widget } from './ueb-support';

/*
 * Shared steps of the M1 Übersicht bug tests (docs/qa/BUGS.md, M1-xx): the flat card grid, the KPI
 * tiles, the charts, Neueste Bestellungen and the rail foot's Demodaten strip.
 *
 * Nothing here writes to the database. Sign-in is the e2e helper (`signIn`, super-admin). Every test
 * opens the Übersicht on `?zeitraum=30`, the value the account keeps. The demo data are never
 * purged: `guardDemoData` answers any write under /admin/demodaten in the browser (aborted, recorded)
 * before a test does anything else, and no test ever activates „Entfernen“ in the confirm dialog —
 * the dialog is only opened and put away with Esc.
 */

export { holdCharts, isPhone, openUebersicht, signIn, waitForApp, widget };

/**
 * Where the bug tests leave their evidence. Relative to the project root, where Playwright runs. Not
 * `shots/m1`: on Windows that is the builder's `shots/M1` proof folder.
 */
export const SHOTS = 'docs/qa/shots/uebersicht-m1';

/** Every deferred chart has landed (no widget is busy), the fonts are in, the bars and lines have grown. */
export async function chartsSettled(page: Page): Promise<void> {
    await expect(page.locator('section.widget[aria-busy="true"]')).toHaveCount(0, { timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
}

/**
 * The safety net for the demo data this review must keep: any request under /admin/demodaten other
 * than a GET is aborted in the browser and recorded. A test asserts the list stays empty.
 */
export async function guardDemoData(page: Page): Promise<string[]> {
    const stopped: string[] = [];

    await page.route(
        (url) => url.pathname.startsWith('/admin/demodaten'),
        async (route) => {
            const request = route.request();

            if (request.method() === 'GET') {
                await route.fallback();

                return;
            }

            stopped.push(`${request.method()} ${new URL(request.url()).pathname}`);
            await route.abort();
        },
    );

    return stopped;
}

/** An element's top edge in page coordinates (independent of the scroll position). */
export async function pageTop(locator: Locator): Promise<number> {
    return locator.evaluate((el) => Math.round(el.getBoundingClientRect().top + window.scrollY));
}

/** An element's rendered height. */
export async function heightOf(locator: Locator): Promise<number> {
    return locator.evaluate((el) => Math.round(el.getBoundingClientRect().height));
}

export interface FocusStop {
    /** The focused element, briefly: tag, classes, name. */
    what: string;
    /** The title of the Übersicht card it is in, if any. */
    card: string | null;
    /** Whether a point in its middle hits it — false for an element clipped away, covered or off screen. */
    seen: boolean;
}

/** Where the keyboard's focus is now, and whether a sighted person can see where that is. */
export async function focusStop(page: Page): Promise<FocusStop> {
    return page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;

        if (!el || el === document.body) {
            return { what: '<body>', card: null, seen: false };
        }

        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        const card = el.closest('section.widget')?.querySelector('h2.widget__title')?.textContent?.trim() ?? null;
        const name = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 48);
        const classes = el.classList.length > 0 ? `.${[...el.classList].join('.')}` : '';

        return {
            what: `<${el.tagName.toLowerCase()}${classes}> "${name}"`,
            card,
            seen: r.width > 0 && r.height > 0 && hit !== null && (hit === el || el.contains(hit)),
        };
    });
}
