import { expect, test } from '@playwright/test';
import { SHOTS, busiestDocument, composer, guardWrites, openAsDraft, signIn } from './gutachten-support';

/*
 * GUTACHTEN-06 (S2) — the vehicle search of „Zeilen hinzufügen" can show the answer to an older search
 * (docs/qa/BUGS.md). RowComposer.vue debounces by 250 ms, but every answer that arrives is written to
 * `vehicleHits` — nothing checks that it belongs to the latest term. On a slow line „a" can answer after
 * „audi": the list shows every vehicle with an „a" under the word „audi", and the next tick lands on a car
 * that was never searched for. The same holds for the size search.
 *
 * Expected: the list always answers the term in the field.
 *
 * Nothing is written: the document is a released one answered in the browser as a draft; the two searches
 * are answered in the browser with stand-in hits (ids no vehicle has), the first one late.
 */

function hit(id: number, term: string): { id: number; label: string; window: string; needsReview: boolean } {
    return { id, label: `QA-Treffer für „${term}“`, window: 'nur im Browser dieses Tests', needsReview: false };
}

test('GUTACHTEN-06 a late answer to an older vehicle search does not replace the newer one', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const id = await busiestDocument(page);

    await page.route(
        (url) => url.pathname === '/admin/gutachten/suche/fahrzeuge',
        async (route) => {
            const term = new URL(route.request().url()).searchParams.get('q') ?? '';

            if (term === 'a') {
                await new Promise((resolve) => setTimeout(resolve, 1_500));
                await route.fulfill({ json: { items: [hit(2_147_000_001, 'a')], more: false } });

                return;
            }

            if (term === 'audi') {
                await route.fulfill({ json: { items: [hit(2_147_000_002, 'audi')], more: false } });

                return;
            }

            await route.fallback();
        },
    );

    await openAsDraft(page, id);

    const c = composer(page);
    await expect(c.vehicles.first()).toBeVisible({ timeout: 15_000 });

    await c.vehicleSearch.pressSequentially('a');
    // The debounce (250 ms) has sent „a"; its answer is on its way.
    await page.waitForTimeout(500);
    await c.vehicleSearch.pressSequentially('udi', { delay: 60 });
    await page.waitForTimeout(2_500);

    const labels = await c.vehicleLabels.allTextContents();

    await page.locator('section[aria-labelledby="rc-h-vehicles"]').screenshot({ path: `${SHOTS}/gutachten-06-search-${info.project.name}.png` });

    expect(labels.map((l) => l.trim()), `the field says „${await c.vehicleSearch.inputValue()}"`).toEqual(['QA-Treffer für „audi“']);
});
