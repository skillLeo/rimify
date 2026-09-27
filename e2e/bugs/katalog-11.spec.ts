import { expect, test } from '@playwright/test';
import { SHOTS, fulfillSynthetic, guardWrites, inertiaHeaders, isInertiaGet, signIn, waitForApp } from './katalog-support';

/*
 * KATALOG-11 (S2) — Katalog-Import: „Importieren" refused with „Der Katalog hat sich seit dem Probelauf
 * geändert. Mach bitte einen neuen Probelauf, bevor du importierst." — and the page offers no way to make
 * one. „Neu prüfen" is disabled while the mapping is unchanged (`:disabled="!mappingForm.isDirty …"`); the
 * file is already on the server (`source`), yet the only road is back to the Import page and the same file
 * uploaded again — if it is still at hand (docs/qa/BUGS.md). A rolled-back run is the same dead end: its
 * mapping is locked (`can.remap` only while `previewed`), though the rollback exists „so the same file can
 * be imported again once its mapping is right" (CatalogueImporter::rollback).
 *
 * Expected: next to that sentence, a way to run the Probelauf again on the same file (e.g. „Neu prüfen"
 * enabled, or „Probelauf wiederholen").
 *
 * The run exists only in this test's browser: the Import page is answered with the server's own list plus
 * one stand-in run, the run's page is built from the Import page's shared props, and „Importieren" is
 * answered in the browser with the server's refusal. Nothing reaches the application but GETs.
 */

test.skip(({ isMobile }) => isMobile, 'The same page at every width; run once, at the desk.');

const RUN_ID = 987654321;
const RUN_URL = `/admin/katalog/import/${RUN_ID}`;
const REFUSAL = 'Der Katalog hat sich seit dem Probelauf geändert. Mach bitte einen neuen Probelauf, bevor du importierst.';

const run = {
    id: RUN_ID,
    file: 'qa-katalog-11-nur-im-browser.csv',
    format: 'CSV',
    status: 'previewed',
    statusLabel: 'Probelauf',
    summary: { create: 1, update: 0, unchanged: 0, refused: 0, brands: 1, models: 1, finishes: 1 },
    by: 'QA',
    at: '27.09.2026, 10:00 Uhr',
    href: RUN_URL,
};

const headers = ['SKU', 'Marke', 'Modell', 'Ausführung', 'Durchmesser', 'Breite', 'ET', 'Lochkreis', 'Mittenloch', 'Preis'];
const example = ['QA-KAT-11-18', 'QA Testmarke', 'Muster', 'Graphit matt', '18', '8', '35', '5x112', '66,6', '189,00'];

function runProps(fields: unknown, errors: Record<string, string>): Record<string, unknown> {
    return {
        run: { ...run, decimal: 'komma', rowCount: 1, appliedAt: null, rolledBackAt: null },
        fields,
        headers,
        examples: Object.fromEntries(headers.map((h, i) => [h, example[i]])),
        mapping: {
            sku: 'SKU',
            marke: 'Marke',
            modell: 'Modell',
            ausfuehrung: 'Ausführung',
            durchmesser: 'Durchmesser',
            breite: 'Breite',
            et: 'ET',
            lochkreis: 'Lochkreis',
            mittenloch: 'Mittenloch',
            preis: 'Preis',
        },
        missing: [],
        rows: [
            {
                line: 2,
                sku: 'QA-KAT-11-18',
                action: 'create',
                label: 'QA Testmarke Muster · Graphit matt · 8J × 18 ET35 · 5×112',
                changes: [],
                reasons: [],
                new: { brand: true, model: true, finish: true },
            },
        ],
        hiddenRows: 0,
        can: { remap: true, apply: true, rollback: false },
        errors,
    };
}

test('KATALOG-11 after „Der Katalog hat sich … geändert" the run can be checked again on the spot', async ({ page }) => {
    await signIn(page);
    await guardWrites(page);

    let fields: unknown = [];

    // The Import page: the server's own, with the stand-in run on top.
    await page.route(
        (url) => url.pathname === '/admin/katalog/import',
        async (route) => {
            const request = route.request();

            if (!(await isInertiaGet(request))) {
                await route.fallback();

                return;
            }

            const response = await route.fetch({ headers: await inertiaHeaders(request) });
            const json = (await response.json()) as { props: { imports: unknown[]; fields: unknown } };

            fields = json.props.fields;
            json.props.imports = [run, ...json.props.imports];
            await route.fulfill({ response, json });
        },
    );

    // The run's page, and the refusal of its import — both built in the browser.
    await page.route(
        (url) => url.pathname === RUN_URL || url.pathname === `${RUN_URL}/importieren`,
        async (route) => {
            const request = route.request();
            const importing = request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/importieren');

            if (!importing && !(await isInertiaGet(request))) {
                await route.fallback();

                return;
            }

            await fulfillSynthetic(route, '/admin/katalog/import', 'Admin/Katalog/ImportRun', RUN_URL, runProps(fields, importing ? { import: REFUSAL } : {}), ['imports']);
        },
    );

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.locator('a[href$="/admin/katalog/import"]').first().evaluate((link) => (link as HTMLElement).click());
    await page.waitForURL(/\/admin\/katalog\/import$/);

    await page.getByRole('link', { name: run.file }).click();
    await page.waitForURL(new RegExp(`${RUN_URL}$`));
    await expect(page.locator('.adm-page__title')).toHaveText(run.file);

    await page.locator('.adm-page__actions').getByRole('button', { name: 'Importieren' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Importieren' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'seit dem Probelauf geändert' })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/katalog-11-refused-desktop-1440.png`, fullPage: true });

    const again = page.getByRole('button', { name: /Neu prüfen|Probelauf/ });
    const offers = await again.evaluateAll((buttons) =>
        buttons.map((b) => ({ name: b.textContent?.trim() ?? '', enabled: !(b as HTMLButtonElement).disabled && b.getAttribute('aria-disabled') !== 'true' })),
    );

    expect(
        offers.some((b) => b.enabled),
        `the page asks for a new Probelauf; what it offers: ${offers.map((b) => `„${b.name}" ${b.enabled ? 'enabled' : 'disabled'}`).join(', ') || 'nothing'}`,
    ).toBe(true);
});
