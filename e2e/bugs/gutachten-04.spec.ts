import { expect, test } from '@playwright/test';
import { SHOTS, answerWithDocument, asDraft, busiestDocument, chooseOneEach, composer, guardWrites, openAsDraft, signIn, waitForApp } from './gutachten-support';

/*
 * GUTACHTEN-04 (S2) — „Vorschau im Shop" can show one vehicle's verdicts as another's, and on a new
 * document its button does nothing (docs/qa/BUGS.md). Show.vue keeps its own `previewVehicle` ref, copied
 * from the prop once, at setup:
 *
 *   a) choosing another vehicle leaves the previous vehicle's verdicts on screen, under the sentence „So
 *      antwortet der Shop … für dieses Fahrzeug" and a select that names the new one; nothing says whom the
 *      list is about. The preview is the release check („Prüf sie vorher in der Vorschau unten").
 *   b) a document without rows has no vehicles, so the ref is null. After the first „Zeilen anlegen" the POST
 *      keeps the page (Inertia `preserveState`), the section appears — and the select stands empty (no option
 *      has the value null) and „Vorschau zeigen" returns at `if (previewVehicle.value === null)`: no request,
 *      no sentence. Every new document meets this at its first preview.
 *
 * Expected: (a) the list goes, or says which vehicle it was computed for, once another is chosen; (b) the
 * select shows a vehicle and „Vorschau zeigen" loads its preview.
 *
 * Nothing is written: (a) reads a released document's preview (GETs); in (b) the document is answered in
 * the browser as a draft without rows, and „Zeilen anlegen" is answered in the browser with the document as
 * it stands — the POST never reaches the application.
 */

test('GUTACHTEN-04a choosing another vehicle does not leave the previous verdicts standing as its own', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    // A document that names at least two vehicles, lightest first (a page of 1.400 rows is only slower).
    await busiestDocument(page);
    const hrefs = await page.locator('table.adm-table tbody tr').evaluateAll((rows) =>
        rows
            .map((tr) => ({
                href: tr.querySelector('a.gd-link')?.getAttribute('href') ?? '',
                rows: Number((/von\s+([\d.]+)/.exec(tr.querySelector('td[data-label="Zeilen im Shop"]')?.textContent ?? '')?.[1] ?? '0').replace(/\./g, '')),
            }))
            .filter((row) => row.rows > 1)
            .sort((a, b) => a.rows - b.rows)
            .map((row) => row.href),
    );

    const select = page.locator('#gs-preview-vehicle');
    const options = select.locator('option');

    for (const href of hrefs) {
        await page.goto(href, { waitUntil: 'domcontentloaded' });
        await waitForApp(page);

        if ((await options.count()) >= 2) {
            break;
        }
    }

    await expect(select).toBeVisible();
    expect(await options.count(), 'the document names fewer than two vehicles').toBeGreaterThanOrEqual(2);

    await select.selectOption({ index: 0 });

    const loaded = page.waitForResponse((response) => response.url().includes('fahrzeug='));
    await page.getByRole('button', { name: 'Vorschau zeigen' }).click();
    await loaded;
    await expect(page.locator('.gs-verdicts')).toBeVisible();

    const shown = ((await options.nth(0).textContent()) ?? '').trim();
    const chosen = ((await options.nth(1).textContent()) ?? '').trim();

    await select.selectOption({ index: 1 });
    await page.waitForTimeout(300);

    const state = await page.evaluate((computedFor) => {
        const section = document.getElementById('gs-preview-h')?.closest('section');

        if (!section) {
            return { listed: false, named: false };
        }

        const copy = section.cloneNode(true) as HTMLElement;
        copy.querySelectorAll('select').forEach((s) => s.remove());

        return { listed: section.querySelector('.gs-verdicts') !== null, named: (copy.textContent ?? '').includes(computedFor) };
    }, shown);

    await page.locator('#gs-preview-h').locator('xpath=ancestor::section[1]').screenshot({ path: `${SHOTS}/gutachten-04a-preview-${info.project.name}.png` });

    expect(
        !state.listed || state.named,
        `the select says „${chosen}"; the verdicts below were computed for „${shown}" and nothing on the section says so`,
    ).toBe(true);
});

test('GUTACHTEN-04b after the first rows of a new document the preview can be shown', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const id = await busiestDocument(page);

    // A new document: no rows yet, hence no vehicle to preview.
    await openAsDraft(page, id, (props) => {
        props.rows = [];
        props.vehicles = [];
        props.previewVehicle = null;
    });
    await expect(page.locator('#gs-preview-vehicle')).toHaveCount(0);

    // „Zeilen anlegen" — answered with the document as it stands (its rows, its vehicles).
    await page.route(
        (url) => url.pathname === `/admin/gutachten/${id}/zeilen`,
        async (route) => {
            if (route.request().method() !== 'POST') {
                await route.fallback();

                return;
            }

            await answerWithDocument(route, id, asDraft);
        },
    );

    await chooseOneEach(page);
    await page.locator('#rc-size-0').fill('225/40 R18');
    await composer(page).submit.click();

    const select = page.locator('#gs-preview-vehicle');
    await expect(select, 'the preview did not appear after the rows came back').toBeVisible();

    const selectedIndex = await select.evaluate((s) => (s as HTMLSelectElement).selectedIndex);
    const requests: string[] = [];

    page.on('request', (request) => {
        if (request.url().includes('fahrzeug=')) {
            requests.push(request.url());
        }
    });

    await page.getByRole('button', { name: 'Vorschau zeigen' }).click();
    await page.waitForTimeout(1_500);
    await page.locator('#gs-preview-h').locator('xpath=ancestor::section[1]').screenshot({ path: `${SHOTS}/gutachten-04b-preview-${info.project.name}.png` });

    expect(
        { vehicleShown: selectedIndex >= 0, previewAsked: requests.length > 0 },
        `the select's selectedIndex is ${selectedIndex}; „Vorschau zeigen" sent ${requests.length} request(s)`,
    ).toEqual({ vehicleShown: true, previewAsked: true });
});
