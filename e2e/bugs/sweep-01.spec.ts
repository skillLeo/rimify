import type { Locator } from '@playwright/test';
import { expect, test } from '../fixtures';
import {
    ENTRY_BY_SIZE,
    FINE_LINK_CHAINS,
    NO_CHAINS,
    SHOTS,
    SIZES_19,
    SWEEP,
    chooseCar,
    listsWithBothChainSentences,
    norm,
    openNineteen,
    times,
} from './sweep-support';

test.use({ baseURL: SWEEP });

/*
 * SWEEP-01 (S2) — storefront sweep of 01.10.2026: on the product page „alle Auflagen im Wortlaut“ (#auflagen,
 * FitmentDetail) still reads the blended list. 52f4a627 gave every other surface the groups — „Für jede zulässige
 * Reifengröße“ once, then „Nur mit 235/45 R19“, „Nur mit 245/40 R19“, „Nur mit 255/40 R19“, each with its own
 * Auflagen (ConditionGroups.vue) — but the product page never renders them for an approved wheel:
 *
 *   - FitmentPanel shows ConditionGroups only `v-else-if="!detail"`, and FelgenController::verdictFor() sends `detail`
 *     for every PERMITTED and CONDITIONAL answer, so the panel shows the overview and the link instead;
 *   - FitmentDetail::for() builds its sections from `$verdict->conditions` — the blend FitmentVerdict says no surface
 *     may show — sorted by kind, each size-bound sentence tagged „Nur bei …“. A10 („… nur feingliedrige …
 *     Schneeketten …“) and A12 („Die Verwendung von Schneeketten ist nicht zulässig.“) are both kind `verbot`, so
 *     both stand in the one „Hinweise“ list, in the quiet side column; „Für jede zulässige Reifengröße“ heads the
 *     first common sentence of each section that has size-bound ones (Reifen and Hinweise: twice); „Nur bei
 *     255/40 R19“ stands four times (Abnahme, two Arbeiten, Hinweise).
 *
 * Expected (the brief for 52f4a627, „check the same in alle Auflagen im Wortlaut“): no list holds both snow-chain
 * sentences. The Wortlaut stays ordered by what there is to do (Abnahme, Arbeiten, Reifen, Hinweise — D-097), so
 * within each section a size-bound sentence stands in a list of its own under its „Nur bei …“: A10 under „Nur bei
 * 235/45 R19 und 245/40 R19“, A12 under „Nur bei 255/40 R19“, each once.
 * Writes nothing: POST /fahrzeug sets only cookies.
 */

/** Every list of the Wortlaut with the „Nur bei …“ / „Für jede …“ line standing right above it, if any. */
async function headedLists(detail: Locator): Promise<{ label: string | null; text: string }[]> {
    const lists = await detail.locator('ul.fdt__list').evaluateAll((uls) =>
        uls.map((ul) => {
            const before = ul.previousElementSibling;

            return { label: before?.classList.contains('fdt__for') ? (before.textContent ?? '') : null, text: ul.textContent ?? '' };
        }),
    );

    return lists.map((list) => ({ label: list.label === null ? null : norm(list.label), text: norm(list.text) }));
}

test('SWEEP-01 „alle Auflagen im Wortlaut“ keeps each tyre size’s Auflagen with that size (BMW X3 X83, 19″)', async ({ page }, info) => {
    await chooseCar(page, 'BMW', 'X3', 'X83');

    const panel = await openNineteen(page);

    // The papers line is per size (holds by reading) — asserted so that a regression shows here as well.
    await expect.poll(async () => norm((await panel.locator('.fit__entry').first().textContent()) ?? '')).toBe(ENTRY_BY_SIZE);

    await panel.getByRole('link', { name: 'alle Auflagen im Wortlaut' }).click();

    const detail = page.locator('#auflagen');

    await expect(detail).toBeVisible();
    await detail.screenshot({ path: `${SHOTS}/sweep-01-wortlaut-${info.project.name}.png` });

    const problems: string[] = [];
    const text = norm(await detail.innerText());
    const mixed = await listsWithBothChainSentences(detail);

    for (const list of mixed) {
        problems.push(`one list holds „feingliedrige … Schneeketten“ and „Schneeketten … nicht zulässig“: „${list.slice(0, 220)}…“`);
    }

    const lists = await headedLists(detail);
    const [first, second, third] = SIZES_19;
    const heads = {
        [FINE_LINK_CHAINS]: `Nur bei ${first} und ${second}`,
        [NO_CHAINS]: `Nur bei ${third}`,
    };

    for (const [sentence, head] of Object.entries(heads)) {
        const holding = lists.filter((list) => list.text.includes(sentence));

        if (times(text, sentence) !== 1) {
            problems.push(`„${sentence}“ stands ${times(text, sentence)} times, not once`);
        }

        for (const list of holding) {
            if (list.label !== head) {
                problems.push(`„${sentence}“ stands under „${list.label ?? 'no heading'}“, not under „${head}“`);
            }
        }
    }

    // A size-bound heading names only the sizes this car may carry on the 19″.
    for (const list of lists.filter((l) => l.label?.startsWith('Nur bei '))) {
        const named = SIZES_19.filter((size) => list.label?.includes(size));

        if (named.length === 0) {
            problems.push(`„${list.label}“ names none of ${SIZES_19.join(', ')}`);
        }
    }

    expect(problems, problems.join('\n')).toEqual([]);
});
