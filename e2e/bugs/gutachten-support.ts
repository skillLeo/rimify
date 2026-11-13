import { expect, type Page } from '@playwright/test';
import { inertiaHeaders, isInertiaGet, pageInsteadOf } from './bell-support';
import { focused, signIn, waitForApp } from './faq-support';

/*
 * Shared steps of the Gutachten / Auflagen / Fahrzeuge / Review bug tests (docs/qa/BUGS.md, GUTACHTEN-xx and
 * REVIEW-xx): /admin/gutachten, /admin/gutachten/neu, /admin/gutachten/{id}, /admin/auflagen, /admin/fahrzeuge,
 * /admin/review/rueckmeldungen and the feedback dialog.
 *
 * Nothing here writes to the database, and no seeded document, vehicle or Auflage is changed:
 *
 *   - `guardWrites` aborts, in the browser, every request under /admin/gutachten, /admin/auflagen,
 *     /admin/fahrzeuge, /admin/review and /admin/uploads that is not a GET — unless a test has put its own
 *     handler in front for exactly that request;
 *   - the searches and the preview are GETs and reach the server as they are.
 *
 * The five steps themselves write, on a draft of their own: e2e/gutachten-erfassung.spec.ts.
 *
 * Sign-in is the e2e helper of the FAQ tests (super-admin).
 */

export { focused, inertiaHeaders, isInertiaGet, pageInsteadOf, signIn, waitForApp };

/** Where the bug tests leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/gutachten';

export function isPhone(projectName: string): boolean {
    return projectName.startsWith('mobile');
}

/** Every write the page tried that `guardWrites` stopped, as `METHOD /path`. */
export interface WriteLog {
    stopped: string[];
}

const GUARDED = ['/admin/gutachten', '/admin/auflagen', '/admin/fahrzeuge', '/admin/review', '/admin/uploads'];

/** Aborts every non-GET request under the guarded paths that no later handler answers. */
export async function guardWrites(page: Page): Promise<WriteLog> {
    const log: WriteLog = { stopped: [] };

    await page.route(
        (url) => GUARDED.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`)),
        async (route) => {
            const request = route.request();

            if (request.method() === 'GET' || request.method() === 'HEAD') {
                await route.fallback();

                return;
            }

            log.stopped.push(`${request.method()} ${new URL(request.url()).pathname}`);
            await route.abort();
        },
    );

    return log;
}

/* ── Documents ─────────────────────────────────────────────────────────────────────────────────────── */

/**
 * Opens the Dokumente list and returns a released document with rows to work on: the one with the FEWEST
 * rows above zero, so its page stays quick — a document of 1.400 rows makes every step slow, not different.
 */
export async function busiestDocument(page: Page): Promise<number> {
    // The released ones, a page at a time: the list comes in pages of 50, a paper without its issue date first — and every
    // run of the suite releases its own papers without one (e2e/gutachten-erfassung.spec.ts, „E2E-…“). On a machine
    // that has run the suite many times they fill the first pages (the gate of 13.11.2026: 71 of them), so the seeded
    // papers are looked for on the pages after, up to ten.
    for (let seite = 1; seite <= 10; seite++) {
        await page.goto(`/admin/gutachten?status=published${seite > 1 ? `&seite=${seite}` : ''}`, { waitUntil: 'domcontentloaded' });
        await waitForApp(page);

        if (seite === 1) {
            await expect(page.locator('a.gd-link').first(), 'the Dokumente list shows no document (the dev DB should hold the seeded Gutachten)').toBeVisible();
        }

        const picked = await page.evaluate(() => {
            let best = { id: 0, rows: Number.POSITIVE_INFINITY, listed: 0 };

            for (const tr of Array.from(document.querySelectorAll('table.adm-table tbody tr'))) {
                best.listed++;

                // A paper the suite itself entered (e2e/gutachten-erfassung.spec.ts) is not what these specs are about.
                if ((tr.textContent ?? '').includes('E2E-')) {
                    continue;
                }

                const href = tr.querySelector('a.gd-link')?.getAttribute('href') ?? '';
                const id = Number(href.split('/').pop());
                // "N von M": N rows in the shop, M in all. Only a released document has rows in the shop — the
                // callers answer it in the browser as a draft and release it again; a real draft (QA-ENTWURF)
                // is not what they are about.
                const cell = tr.querySelector('td[data-label="Zeilen im Shop"]')?.textContent ?? '';
                const [, live = '0', total = '0'] = /([\d.]+)\s+von\s+([\d.]+)/.exec(cell) ?? [];
                const inShop = Number(live.replace(/\./g, ''));
                const rows = Number(total.replace(/\./g, ''));

                if (Number.isInteger(id) && id > 0 && inShop > 0 && rows > 0 && rows < best.rows) {
                    best = { id, rows, listed: best.listed };
                }
            }

            return best;
        });

        if (picked.id > 0) {
            return picked.id;
        }

        // A page shorter than 50 is the last one.
        if (picked.listed < 50) {
            break;
        }
    }

    expect(false, 'no document id on the Dokumente list').toBe(true);

    return 0;
}

/* ── Focus ─────────────────────────────────────────────────────────────────────────────────────────── */

/** Where the focus is, and whether it fell to the page itself. */
export async function focusFell(page: Page): Promise<{ fell: boolean; on: string }> {
    const on = await focused(page);

    return { fell: on === '<body>' || on.startsWith('<main#inhalt'), on };
}
