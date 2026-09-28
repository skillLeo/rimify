import { expect, test, type Page } from '../fixtures';
import { SHOTS, answerWithDocument, asDraft, busiestDocument, focused, guardWrites, openAsDraft, signIn } from './gutachten-support';

/*
 * B-03 (S2) — Block B review: a refused pasted legend („Legende einfügen" → „N Codes speichern").
 *
 * Auflagenverzeichnis.vue saveSplit() has no onError: the button was disabled for the round trip, so the
 * keyboard is left on <body> (or on the button), never on the refused entry — unlike the single-code form,
 * whose onError sends it to the first refused field. And splitError(index, …) reads `entries.<index>.*` by
 * the entry's CURRENT place: after „Diese Zeile weglassen" on an entry above the refused one, the sentence
 * moves to the entry below it — another code is told „Diesen Code gibt es in diesem Gutachten schon." and the
 * refused one says nothing (the sentences carry no id either, and no field gets aria-invalid for the text).
 *
 * Expected: (a) the focus goes to the first refused field of the batch; (b) a sentence stays with the entry
 * it is about, or goes — it never lands on another entry.
 *
 * Nothing is written: a released document is answered in the browser as a draft (openAsDraft); the batch POST
 * is answered in the browser with the server's refusal of a code the document already has
 * (DocumentConditionBatchRequest: entries.*.code unique).
 */

const REFUSAL = 'Diesen Code gibt es in diesem Gutachten schon.';

async function refusedBatch(page: Page): Promise<void> {
    await guardWrites(page);

    const id = await busiestDocument(page);

    await page.route(
        (url) => url.pathname === `/admin/gutachten/${id}/auflagen/stapel`,
        async (route) => {
            if (route.request().method() !== 'POST') {
                await route.fallback();

                return;
            }

            // As the server answers it: the Auflagenverzeichnis sends its own error bag (errorBag: 'auflagen').
            await answerWithDocument(route, id, asDraft, { auflagen: { 'entries.1.code': REFUSAL } });
        },
    );

    await openAsDraft(page, id);

    await page.getByRole('button', { name: 'Legende einfügen' }).click();
    await page.locator('#av-paste').fill('QA1 Erster Satz der Prüfung.\nQA2 Zweiter Satz der Prüfung.\nQA3 Dritter Satz der Prüfung.');
    await page.getByRole('button', { name: 'Aufteilen' }).click();

    for (const i of [0, 1, 2]) {
        await page.locator(`#av-split-kind-${i}`).selectOption('hinweis');
    }

    await page.getByRole('button', { name: '3 Codes speichern' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.av__split-item').nth(1).locator('.form-field__error', { hasText: REFUSAL })).toBeVisible();
    await page.waitForTimeout(400);
}

test('B-03a a refused pasted legend moves the focus to the first refused entry', async ({ page }, info) => {
    await signIn(page);
    await refusedBatch(page);

    const on = await focused(page);
    const onField = await page.evaluate(() => document.activeElement?.id === 'av-split-code-1');

    await page.locator('.av__split').screenshot({ path: `${SHOTS}/b-03a-legend-refused-${info.project.name}.png` });

    expect(onField, `the second code was refused; the focus is on ${on}`).toBe(true);
});

test('B-03b a refusal of a pasted legend stays with its entry when another is left out', async ({ page }, info) => {
    await signIn(page);
    await refusedBatch(page);

    // Leave out the first entry: QA2 (refused) moves to place 0, QA3 to place 1.
    await page.locator('.av__split-item').nth(0).getByRole('button', { name: 'Diese Zeile weglassen' }).click();
    await expect(page.locator('#av-split-code-0')).toHaveValue('QA2');
    await expect(page.locator('#av-split-code-1')).toHaveValue('QA3');
    await page.waitForTimeout(200);

    const onQa3 = ((await page.locator('.av__split-item').nth(1).textContent()) ?? '').includes(REFUSAL);

    await page.locator('.av__split').screenshot({ path: `${SHOTS}/b-03b-legend-stale-sentence-${info.project.name}.png` });

    expect(onQa3, `QA3 now shows „${REFUSAL}" — the sentence the server said about QA2`).toBe(false);
});
