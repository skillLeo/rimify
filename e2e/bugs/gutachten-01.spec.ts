import { expect, test, type Page } from '../fixtures';
import { signIn, waitForApp } from './gutachten-support';

/*
 * GUTACHTEN-01 (S2) — a row whose „Breite von" is larger than „Breite bis" (or „ET von" larger than „ET bis")
 * is not refused with a sentence: FitmentRowsRequest checks each bound on its own (4–14 Zoll, −99…99 mm) but
 * never that the pair is in order, and the insert then breaks the table's CHECK constraints
 * (`chk_fitment_width_range`, `chk_fitment_et_range`, Constraints::range). The page gets a 500 and says
 * „Das hat auf unserer Seite nicht geklappt … Versuch es gleich noch einmal." — again on every retry, with
 * nothing pointing at the two fields (docs/qa/BUGS.md). The same holds for „Zeile ändern" (PUT).
 *
 * Expected: 422 with a sentence under „Breite bis" / „ET bis" (or „… von"), like `build_to.after_or_equal`.
 *
 * Precondition: one draft Gutachten in the dev database. None is seeded (ApprovalSeeder releases every
 * document); create one through /admin/gutachten/neu before running this test. The test fails with that
 * sentence when there is none.
 *
 * Nothing can be stored: the request is sent as JSON for REAR-axle rows and carries two tyre sizes that
 * FitmentRowsRequest's duplicate check reads as different (`+225` and `225`) but that are the same size in
 * the database — should the range ever be accepted, the second tyre size breaks `uq_fitment_tyre_size` and
 * the whole transaction (rows, sizes, audit entry) is rolled back.
 */

async function firstDraftId(page: Page): Promise<number | null> {
    await page.goto('/admin/gutachten', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    return page.evaluate(() => {
        for (const tr of Array.from(document.querySelectorAll('table.adm-table tbody tr'))) {
            const status = tr.querySelector('td[data-label="Status"]')?.textContent ?? '';
            const href = tr.querySelector('a.gd-link')?.getAttribute('href') ?? '';
            const id = Number(href.split('/').pop());

            if (status.includes('Entwurf') && Number.isInteger(id) && id > 0) {
                return id;
            }
        }

        return null;
    });
}

test('GUTACHTEN-01 an inverted Breite or ET range is refused with a sentence, not a server fault', async ({ page }) => {
    await signIn(page);

    const id = await firstDraftId(page);

    expect(id, 'precondition: no draft Gutachten in the dev DB — create one via /admin/gutachten/neu (e.g. report number „QA-ENTWURF"), then run again').not.toBeNull();

    const cookie = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN');

    expect(cookie, 'no XSRF-TOKEN cookie after signing in').toBeDefined();

    const headers = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': decodeURIComponent(cookie?.value ?? ''),
    };

    const vehicles = (await (await page.request.get('/admin/gutachten/suche/fahrzeuge?q=', { headers })).json()) as { items: Array<{ id: number }> };
    const wheels = (await (await page.request.get('/admin/gutachten/suche/felgen?q=', { headers })).json()) as { groups: Array<{ sizes: Array<{ id: number }> }> };
    const vehicleIds = vehicles.items.slice(0, 5).map((v) => v.id);
    const configIds = wheels.groups.flatMap((g) => g.sizes).slice(0, 5).map((s) => s.id);

    expect(vehicleIds.length > 0 && configIds.length > 0, 'the searches of „Zeilen hinzufügen" found no vehicle or no size').toBe(true);

    const row = {
        vehicle_ids: vehicleIds,
        config_ids: configIds,
        axle: 'REAR',
        entry_override: null,
        entry_note: '',
        source_page: null,
        build_from: null,
        build_to: null,
        width_min: '',
        width_max: '',
        et_min: '',
        et_max: '',
        centre_bore: '',
        // The rollback guard: one size to the database, two to the duplicate check (see the header).
        tyre_sizes: [
            { width_mm: 225, aspect: 40, diameter: 18, min_load_index: null, min_speed_symbol: '', axle: 'ALL' },
            { width_mm: '+225', aspect: 40, diameter: 18, min_load_index: null, min_speed_symbol: '', axle: 'ALL' },
        ],
        conditions: [],
    };

    const answers: Array<{ what: string; status: number; fields: string[]; body: string }> = [];

    for (const [what, range] of [
        ['Breite 9 bis 8', { width_min: '9', width_max: '8' }],
        ['ET 45 bis 30', { et_min: '45', et_max: '30' }],
    ] as const) {
        const response = await page.request.post(`/admin/gutachten/${id}/zeilen`, { headers, data: { ...row, ...range } });
        const body = await response.text();
        let fields: string[];

        try {
            fields = Object.keys((JSON.parse(body) as { errors?: Record<string, unknown> }).errors ?? {});
        } catch {
            fields = [];
        }

        answers.push({ what, status: response.status(), fields, body: body.slice(0, 240) });
    }

    const refusedWell = answers.every((a) => a.status === 422 && a.fields.some((f) => /^(width|et)_(min|max)$/.test(f)));

    expect(
        refusedWell,
        answers.map((a) => `${a.what}: HTTP ${a.status}, fields ${a.fields.join(', ') || '–'} — ${a.body}`).join(' | '),
    ).toBe(true);
});
