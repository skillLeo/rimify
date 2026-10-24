import { expect, test } from '@playwright/test';
import { send } from '../teardown';
import { clean, OUT, openAdmin, overflow, patternOf, record, signIn, SUPER_ADMIN, watch } from './support';

/*
 * The admin audit's sweep (docs/review/ADMIN-AUDIT.md › Seiten): every admin page a person can reach from the rail,
 * the palette's targets and each page's own links — found by following them, never from a list typed here — opened at
 * this project's width. Each kind of page twice at most (two different rows of a list). For each: its status, what the
 * console and the network said, whether the document is wider than the window, how long it took, and a picture.
 */

/** Addresses the sweep does not open as pages: files, data answers, and what only a form sends. */
const NOT_PAGES = [/\/export(\?|$)/, /\.(csv|xlsx|pdf|png|jpe?g|webp)(\?|$)/, /\/bild$/, /\/vergleich$/, /\/neueste$/, /\/puls$/, /\/suche\//, /\/abmelden$/, /\/wiederherstellen$/];

test('every admin page a person can reach opens clean at this width', async ({ page, baseURL }, info) => {
    test.setTimeout(45 * 60_000);

    const width = info.project.name;
    const watcher = watch(page);
    const base = new URL(baseURL ?? '');
    const queue: string[] = ['/admin'];
    const visits = new Map<string, number>();
    const problems: string[] = [];
    let sudo = false;

    await signIn(page);

    while (queue.length > 0) {
        const href = queue.shift() ?? '';
        const url = new URL(href, base);
        const pattern = patternOf(url.pathname);

        if (url.origin !== base.origin || !url.pathname.startsWith('/admin') || NOT_PAGES.some((re) => re.test(url.pathname)) || (visits.get(pattern) ?? 0) >= 2) {
            continue;
        }

        visits.set(pattern, (visits.get(pattern) ?? 0) + 1);

        const started = Date.now();
        let status = await openAdmin(page, url.pathname);

        // The settings ask for the password once more (EnsureSudo): given once per run, by request, then the page again.
        if (!sudo && new URL(page.url()).pathname === '/admin/bestaetigen') {
            expect(await send(page.context(), 'POST', '/admin/bestaetigen', { password: SUPER_ADMIN.password }), 'the password is confirmed').toBeLessThan(400);
            sudo = true;
            status = await openAdmin(page, url.pathname);
        }

        const ms = Date.now() - started;
        const seen = watcher.take();
        const wider = await overflow(page);
        const title = (await page.locator('h1').first().textContent({ timeout: 2_000 }).catch(() => null))?.trim() ?? '';
        const shot = `${OUT}/shots/${width}/${pattern.replace(/^\/admin\/?/, '').replace(/[/{}]+/g, '_') || 'uebersicht'}-${visits.get(pattern)}.png`;

        await page.screenshot({ path: shot });
        record(`sweep-${width}.jsonl`, { url: url.pathname, pattern, status, ms, title, wider, ...seen, shot });

        if (status >= 400 || !clean(seen) || wider > 0) {
            problems.push(`${url.pathname} — status ${status}${wider > 0 ? `, ${wider}px wider than the window` : ''}${clean(seen) ? '' : `, ${JSON.stringify(seen)}`}`);
        }

        const links = await page.$$eval('a[href]', (anchors) => anchors.map((a) => (a as HTMLAnchorElement).href));

        for (const link of links) {
            const next = new URL(link, base);

            if (next.origin === base.origin && next.pathname.startsWith('/admin') && (visits.get(patternOf(next.pathname)) ?? 0) < 2) {
                queue.push(next.pathname);
            }
        }
    }

    record(`sweep-${width}.jsonl`, { summary: true, patterns: [...visits.keys()].sort(), visited: [...visits.values()].reduce((a, b) => a + b, 0) });

    expect(problems, `pages that did not open clean at ${width}`).toEqual([]);
});
