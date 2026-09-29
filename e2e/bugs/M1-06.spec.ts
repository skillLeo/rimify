import { expect, test } from '../fixtures';
import { SHOTS, heightOf, holdCharts, isPhone, openUebersicht, pageTop, signIn, widget } from './m1-support';

/*
 * M1-06 (S2) — Top-Felgen: the skeleton is seven one-line rows (300 px); the ranking that replaces
 * it is taller wherever a Felge's name wraps — at 1280 px nearly every one does — so the card, its
 * row and everything under it jump when the charts land, and again on every Zeitraum change
 * (docs/qa/BUGS.md; UEB-02's fix, incomplete).
 *
 * Uebersicht/Index.vue gives the skeleton `TOP_HEIGHT = 7 × 36 + 6 × 8`. BarChart.vue's row is
 * `min-height: 36px` — the name on one line, the size under it — but the name is allowed to wrap
 * (`overflow-wrap: anywhere`) in a label column of (card − 12) × 11/20: ≈ 166 px at 1440 („Demo
 * Siebenspeiche S-04“ wraps — docs/qa/shots/M1/dashboard-1440-filled.png), ≈ 136 px at 1280 with
 * the rail open (the demo's „Demo Zehnspeiche Z-07“, „Demo Fünfspeiche F-01“, „MOTEC MCR4 Ultimate“
 * wrap), ≈ 167 px on a 390 px phone. Each wrapped name adds 20 px; at 1280 the card outgrows
 * Verdikte beside it and the whole row grows. (A period with fewer than seven Felgen ends shorter
 * than its skeleton instead.)
 *
 * Expected: the skeleton is the size of what replaces it, ± 8 px (brief: skeletons match the final
 * layout, CLS ≤ 0.02) — as UEB-02 measures it.
 *
 * Nothing is written: the charts' request is only held for a moment.
 */

const TITLE = 'Top-Felgen nach Bestellungen';

test('M1-06 Top-Felgen: its skeleton is the size of the ranking that replaces it', async ({ page }, info) => {
    await signIn(page);

    const widths = isPhone(info.project.name) ? [0] : [1280, 1440];
    let measured = 0;

    for (const width of widths) {
        if (width > 0) {
            await page.setViewportSize({ width, height: 900 });
        }

        await page.unrouteAll({ behavior: 'ignoreErrors' });

        const held = await holdCharts(page);

        await openUebersicht(page);
        await held.arrived;
        await page.waitForTimeout(300);

        const card = widget(page, TITLE);

        if ((await card.count()) !== 1) {
            held.release();
            continue;
        }

        const skeleton = await heightOf(card);
        const nextCard = widget(page, 'Abdeckung');
        const nextBefore = (await nextCard.count()) === 1 ? await pageTop(nextCard) : null;

        held.release();
        await expect(page.locator('section.widget[aria-busy="true"]')).toHaveCount(0, { timeout: 20_000 });
        await page.waitForTimeout(600);

        // Empty (its one sentence) or failed: nothing to compare.
        if ((await card.locator('.widget__state').count()) > 0) {
            continue;
        }

        const content = await heightOf(card);
        const rows = await card.locator('.bc__row').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));
        const nextAfter = nextBefore === null ? null : await pageTop(nextCard);
        const label = width > 0 ? `${width} px` : info.project.name;

        measured++;
        await card.screenshot({ path: `${SHOTS}/m1-06-top-felgen-${width > 0 ? width : info.project.name}.png` });

        expect
            .soft(
                Math.abs(content - skeleton),
                `at ${label}: skeleton ${skeleton} px, ranking ${content} px — rows ${rows.join(' / ')} px where the skeleton assumes 7 × 36` +
                    (nextBefore !== null && nextAfter !== null ? `; „Abdeckung“ moved ${nextAfter - nextBefore} px` : ''),
            )
            .toBeLessThanOrEqual(8);
    }

    expect(measured, 'Top-Felgen ended empty at every width: nothing to compare').toBeGreaterThan(0);
});
