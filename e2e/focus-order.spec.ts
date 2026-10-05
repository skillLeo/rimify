import { expect, test, type Page } from './fixtures';
import { DEV, consentGiven, open } from './support';

/*
 * The vehicle selector's focus order is its reading order, at 390 (WCAG 1.3.2, 2.4.3; the operator's decision of
 * 02.10.2026). The key numbers stood first on a phone through CSS `order` while the markup put the makes first, so
 * Tab walked every make row (40 and more) before it reached HSN — CHECK-18. The markup now carries the order and the
 * layout only spaces it; this spec fails the day a layout reorders again.
 *
 * At 390 the selector is one column, so reading order is top to bottom, and left to right within a row (HSN | TSN).
 * Every page that shows the selector, in every state a visitor tabs through: the makes, a make's models, the check page.
 */

const ROUTES = ['/felgen-suchen', '/felgen-suchen?marke=BMW', '/rimify-check'];

/** Pixels two stops may differ by and still be one row. */
const ROW = 6;

interface Stop {
    top: number;
    left: number;
    id: string;
    className: string;
    name: string;
}

/**
 * Tab from the selector's first control until the focus leaves the selector, marking each stop; then measure every stop
 * in one layout — the page and every scrolling list inside the selector back at their start — because the make list
 * scrolls itself as the focus moves down it, and a stop measured mid-scroll stands where it is shown, not where it is.
 */
async function tabStops(page: Page): Promise<Stop[]> {
    const started = await page.evaluate(() => {
        const root = document.querySelector('.vsel');
        const focusable =
            'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const first = root === null ? undefined : [...root.querySelectorAll<HTMLElement>(focusable)].find((el) => el.getClientRects().length > 0);

        first?.focus();

        return first !== undefined;
    });

    expect(started, 'precondition: no vehicle selector with a control on the page').toBe(true);

    let count = 0;

    for (; count < 120; count++) {
        const inside = await page.evaluate((index) => {
            const el = document.activeElement as HTMLElement | null;
            const root = document.querySelector('.vsel');

            if (el === null || root === null || !root.contains(el) || el.dataset.focusStop !== undefined) {
                return false;
            }

            el.dataset.focusStop = String(index);

            return true;
        }, count);

        if (!inside) {
            break;
        }

        await page.keyboard.press('Tab');
    }

    return page.evaluate((total) => {
        const root = document.querySelector('.vsel');

        for (const el of [document.scrollingElement, ...(root?.querySelectorAll<HTMLElement>('*') ?? [])]) {
            if (el instanceof HTMLElement && el.scrollTop !== 0) {
                el.scrollTop = 0;
            }
        }

        window.scrollTo(0, 0);

        return Array.from({ length: total }, (_, index) => {
            const el = document.querySelector<HTMLElement>(`[data-focus-stop="${index}"]`)!;
            const box = el.getBoundingClientRect();

            delete el.dataset.focusStop;

            return {
                top: Math.round(box.top),
                left: Math.round(box.left),
                id: el.id,
                className: el.className,
                name: (el.getAttribute('aria-label') ?? el.textContent ?? el.getAttribute('placeholder') ?? el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40),
            };
        });
    }, count);
}

for (const route of ROUTES) {
    test(`the vehicle selector is tabbed in the order it is read, at 390 — ${route}`, async ({ page, baseURL }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await consentGiven(page.context(), baseURL ?? DEV);
        await open(page, route);

        const stops = await tabStops(page);

        expect(stops.length, 'too few stops to say anything about an order').toBeGreaterThan(3);

        // The finding itself: the key numbers come before the first make or model row.
        const hsn = stops.findIndex((stop) => stop.id.startsWith('hsn-'));
        const firstRow = stops.findIndex((stop) => stop.className.includes('row-item'));

        expect(hsn, 'HSN is not reached by Tab').toBeGreaterThanOrEqual(0);
        expect(firstRow, 'no make or model row is reached by Tab').toBeGreaterThan(-1);
        expect(hsn, 'Tab reaches a make or model row before HSN, which is shown first').toBeLessThan(firstRow);

        // And every step goes down the page, or right within a row — never back up.
        const misordered = stops.slice(1).flatMap((after, i) => {
            const before = stops[i]!;
            const sameRow = Math.abs(after.top - before.top) <= ROW;

            return (!sameRow && after.top < before.top) || (sameRow && after.left < before.left - ROW)
                ? [`„${after.name}“ (y ${after.top}) is tabbed after „${before.name}“ (y ${before.top}) but read before it`]
                : [];
        });

        expect(misordered).toEqual([]);
    });
}
