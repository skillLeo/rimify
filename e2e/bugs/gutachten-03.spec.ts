import { expect, test } from '../fixtures';
import { SHOTS, busiestDocument, guardWrites, signIn, waitForApp } from './gutachten-support';

/*
 * GUTACHTEN-03 (S2) — „Weitere Aktionen" › „PDF öffnen" on a document does not open the PDF. AdminPage.vue
 * draws every `href` action as an Inertia `<Link>`: the click becomes an XHR visit with `X-Inertia` to the
 * PDF's address. On the bucket (another origin) or with APP_URL's host (http://localhost:8000 here, the page
 * on 127.0.0.1) it fails like a lost connection — „Keine Verbindung zum Server. Prüf die Verbindung …"; on
 * the same origin Inertia receives bytes that are no page and shows them in its error overlay. No tab
 * opens; the same PDF behind „PDF öffnen" in Angaben (a plain `<a target="_blank">`) works
 * (docs/qa/BUGS.md).
 *
 * Expected: the PDF opens in a new tab, as from Angaben; no Inertia visit to it.
 *
 * Nothing is written: a released document is opened and a menu item clicked.
 */

test('GUTACHTEN-03 „PDF öffnen" in Weitere Aktionen opens the PDF in a new tab', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    // A document whose PDF is in the storage: the list's documents, in turn, until one offers it.
    await busiestDocument(page);
    // Lightest first: a document of 1.400 rows is slow to open and says nothing more about the menu.
    const hrefs = await page.locator('table.adm-table tbody tr').evaluateAll((rows) =>
        rows
            .map((tr) => ({
                href: tr.querySelector('a.gd-link')?.getAttribute('href') ?? '',
                rows: Number((/von\s+([\d.]+)/.exec(tr.querySelector('td[data-label="Zeilen im Shop"]')?.textContent ?? '')?.[1] ?? '0').replace(/\./g, '')),
            }))
            .sort((a, b) => a.rows - b.rows)
            .map((row) => row.href),
    );

    for (const href of hrefs) {
        await page.goto(href, { waitUntil: 'domcontentloaded' });
        await waitForApp(page);

        if ((await page.locator('.gs-facts a[target="_blank"]').count()) > 0) {
            break;
        }
    }

    const inFacts = await page.locator('.gs-facts a[target="_blank"]').first().getAttribute('href');

    expect(inFacts, 'the document has no PDF, so the menu offers no „PDF öffnen"').not.toBeNull();

    const inertiaVisits: string[] = [];

    page.on('request', (request) => {
        if (request.headers()['x-inertia'] !== undefined && /\.pdf([?#]|$)/i.test(request.url())) {
            inertiaVisits.push(request.url());
        }
    });

    await page.locator('.adm-page__more').click();

    const item = page.getByRole('menuitem', { name: 'PDF öffnen' });
    await expect(item).toBeVisible();

    const popup = page
        .context()
        .waitForEvent('page', { timeout: 5_000 })
        .catch(() => null);

    await item.click();

    const opened = await popup;
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SHOTS}/gutachten-03-pdf-menu-${info.project.name}.png` });

    expect(
        { newTab: opened !== null, inertiaVisits },
        `„PDF öffnen" (${inFacts ?? '–'}) opened ${opened === null ? 'no tab' : opened.url()}; Inertia visits to the PDF: ${inertiaVisits.join(', ') || 'none seen'}`,
    ).toEqual({ newTab: true, inertiaVisits: [] });

    await opened?.close();
});
