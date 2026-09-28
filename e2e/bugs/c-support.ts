import { expect, type Page } from '@playwright/test';
import { SHOP } from '../shop';
import { consentGiven, open } from '../support';
import { answerWithDocument, asDraft, busiestDocument, guardWrites, openAsDraft, type ShowProps } from './gutachten-support';

/*
 * Shared steps of the Block C interaction bug tests (docs/qa/BUGS.md, C-xx): the papers form in the
 * RIMIFY-CHECK panel (storefront, e2e shop at :8010), „Fahrzeug aus diesem Gutachten anlegen" and the
 * load-index confirmation of the Auflagenverzeichnis (admin, :8000).
 *
 * Nothing here writes to a database:
 *   - the storefront steps choose a car by key numbers (a cookie, no row: FahrzeugController::resolve writes
 *     a gap event only for a MISS) and type the papers (a cookie, `rmf_papiere`, in the test's own context);
 *   - the admin steps open a released document answered in the browser as a draft (openAsDraft), and every
 *     write they make is answered in the browser (guardWrites stops anything else).
 */

/** Where the Block C bug tests leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/block-c';

/** The seed's Golf GTI (VehicleSeeder: HSN 0603, TSN BGU): one car behind the pair, full vehicle data. */
export const GOLF = { hsn: '0603', tsn: 'BGU' };

/**
 * Chooses a car in the e2e shop the way the key-number form does (POST /fahrzeug/schluesselnummern), with the
 * page's own session and XSRF cookie, so the vehicle cookie lands in the test's browser context.
 */
export async function chooseCar(page: Page, keys: { hsn: string; tsn: string } = GOLF): Promise<void> {
    await consentGiven(page.context(), SHOP);
    await open(page, '/');

    const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN');

    expect(xsrf, 'no XSRF-TOKEN cookie on the shop').toBeDefined();

    const response = await page.request.post('/fahrzeug/schluesselnummern', {
        headers: { Accept: 'text/html', 'X-XSRF-TOKEN': decodeURIComponent(xsrf?.value ?? '') },
        form: { hsn: keys.hsn, tsn: keys.tsn },
    });

    expect(
        new URL(response.url()).pathname,
        `HSN ${keys.hsn} / TSN ${keys.tsn} did not lead to the listing — several cars behind the pair, or none (is the e2e shop seeded?)`,
    ).toBe('/felgen');
}

/**
 * With a car chosen: opens a product page whose RIMIFY-CHECK panel carries the papers form (a verdict with a
 * tyre half). Tries the listing's first products and, on each, the sizes the car may have.
 */
export async function openProductWithPapers(page: Page): Promise<string> {
    await open(page, '/felgen');

    const hrefs = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a.tile__cta, main a[href*="/felgen/"]'));

        return [...new Set(links.map((a) => new URL(a.href).pathname).filter((p) => /^\/felgen\/[^/]+$/.test(p)))].slice(0, 8);
    });

    expect(hrefs.length, 'the listing for the chosen car shows no product').toBeGreaterThan(0);

    for (const href of hrefs) {
        await open(page, href);

        if (await page.locator('.pp').isVisible()) {
            return href;
        }

        const chips = page.locator('#groessen .chip:not([disabled])');
        const n = await chips.count();

        for (let i = 0; i < n; i++) {
            await chips.nth(i).click();
            // Price, stock and verdict change in one commit on the client; give Vue its frame.
            await page.waitForTimeout(150);

            if (await page.locator('.pp').isVisible()) {
                return href;
            }
        }
    }

    throw new Error(`none of ${hrefs.join(', ')} shows the papers form (no verdict with a tyre half for the chosen car)`);
}

/** Where the keyboard is, as an element path the failure message can name; `<body>` when it fell. */
export async function keyboardIsIn(page: Page, selector: string): Promise<boolean> {
    return page.evaluate((s) => document.activeElement !== null && document.activeElement !== document.body && document.activeElement.closest(s) !== null, selector);
}

/* ── The load-index confirmation (Auflagenverzeichnis) ─────────────────────────────────────────────── */

/**
 * A T-code whose kilograms are not twice its index's capacity (T88 → 2 × 560 kg = 1.120 kg; entered 1.125 kg),
 * shaped as GutachtenController::conditionView ships it. It exists only in the browser.
 */
export const T88 = {
    id: 990_088,
    code: 'T88',
    kind: 'reifen_tragfaehigkeit',
    kindLabel: 'Reifen: Tragfähigkeit',
    section: 'Reifen',
    text: 'Reifen mit Tragfähigkeitsindex 88 sind bis zu einer zulässigen Achslast von 1.125 kg zulässig.',
    page: 4,
    bodyForms: [] as string[],
    drive: null,
    maxAxleLoadKg: 1125,
    axle: null,
    uses: 0,
    limitWarning:
        'T88 steht für Tragfähigkeitsindex 88: das wären 2 × 560 kg = 1.120 kg, eingetragen sind 1.125 kg. Stimmt die Zahl mit dem Gutachten überein, bestätige sie mit einem Satz.',
};

export const REASON = 'So steht die Zahl auf Seite 4 des Gutachtens gedruckt.';

function withT88(props: ShowProps, confirmed: boolean): void {
    props.conditions = [
        ...props.conditions.filter((c) => c.id !== T88.id),
        { ...T88, limitConfirmed: confirmed ? { reason: REASON, by: 'QA', at: '29.09.2026' } : null },
    ];
}

/**
 * Opens a released document as a draft whose Auflagenverzeichnis carries the unconfirmed T88, and answers its
 * confirmation (POST …/auflagen/{T88}/grenze) in the browser with the page as the server's `back()` would —
 * T88 confirmed. Returns every confirmation POST the page sent, in order.
 */
export async function openWithLimitWarning(page: Page): Promise<{ id: number; posts: string[] }> {
    await guardWrites(page);

    const id = await busiestDocument(page);
    const path = `/admin/gutachten/${id}/auflagen/${T88.id}/grenze`;
    const posts: string[] = [];

    page.on('request', (request) => {
        if (request.method() === 'POST' && new URL(request.url()).pathname === path) {
            posts.push(request.postData() ?? '');
        }
    });

    await page.route(
        (url) => url.pathname === path,
        async (route) => {
            try {
                await answerWithDocument(route, id, (props) => {
                    asDraft(props);
                    withT88(props, true);
                });
            } catch {
                // The page itself cancelled this request (Inertia interrupts a visit in flight): nothing to answer.
            }
        },
    );

    await openAsDraft(page, id, (props) => withT88(props, false));
    await expect(page.locator(`#av-limit-${T88.id}`), 'the confirm form of T88 is not on the page').toBeVisible();

    return { id, posts };
}
