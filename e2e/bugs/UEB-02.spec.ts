import { expect, test } from '@playwright/test';
import { SHOTS, holdCharts, layoutShiftSince, openUebersicht, recordLayoutShifts, signIn, widget } from './ueb-support';

/*
 * UEB-02 (S2) — the chart skeletons are not the size of the charts: every widget jumps when the
 * charts land, and again on every change of the Zeitraum (docs/qa/BUGS.md).
 *
 * DashWidget's loading state draws `skeletonRows` bars of 20 px with 12 px between them; the pages
 * ask for 6 / 6 / 6 / 8 / 5 rows. What replaces them is not that tall:
 *
 *   Umsatz über die Zeit      6 rows = 180 px  →  LineChart 240 px (+ 24 px legend with Vorperiode)
 *   Verdikte der Prüfungen    6 rows = 180 px  →  legend + 240 px plot + „Gezählt seit …"
 *   Top-Felgen                6 rows = 180 px  →  n × 28 px + (n − 1) × 8 px (8 bars: 280 px)
 *   Abdeckung                 8 rows = 244 px  →  the matrix: one 44 px row per make (+ head, foot)
 *   Nachfrage-Lücken          5 rows = 148 px  →  a lead line + one ≥ 44 px row per gap
 *
 * Everything under a chart moves down when it arrives. A period change (7 / 30 / 90) is a new visit,
 * so the charts go back to their skeletons and grow again — with preserveScroll, under the reader.
 *
 * Expected (brief: „skeletons match the final layout", CLS ≤ 0.02): each widget keeps its height
 * (± 8 px) from skeleton to content, and the arrival adds no layout shift. A widget that ends empty
 * (its one sentence) is not measured.
 *
 * Nothing is written: the charts' request is only held for a moment.
 */

const CHARTS = ['Umsatz über die Zeit', 'Verdikte der Prüfungen', 'Top-Felgen nach Bestellungen', 'Abdeckung', 'Nachfrage-Lücken'];

test('UEB-02 the chart skeletons have the size of what replaces them', async ({ page }) => {
    const project = test.info().project.name;

    await signIn(page);
    await recordLayoutShifts(page);

    const held = await holdCharts(page);

    await openUebersicht(page);
    await held.arrived;
    await page.waitForTimeout(300);

    const skeleton = new Map<string, number>();

    for (const title of CHARTS) {
        const box = widget(page, title);

        if ((await box.count()) === 1) {
            skeleton.set(title, (await box.boundingBox())?.height ?? 0);
        }
    }

    expect(skeleton.size, 'no chart skeleton on the Übersicht').toBeGreaterThan(0);
    await page.screenshot({ path: `${SHOTS}/ueb-02-skeletons-${project}.png`, fullPage: true });

    const since = await page.evaluate(() => performance.now());

    held.release();
    await expect(page.locator('section.widget[aria-busy="true"]')).toHaveCount(0, { timeout: 15_000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SHOTS}/ueb-02-charts-${project}.png`, fullPage: true });

    let measured = 0;

    for (const [title, before] of skeleton) {
        const box = widget(page, title);

        // Not for this role after all, or empty: one sentence where the chart would be.
        if ((await box.count()) !== 1 || (await box.locator('.widget__state').count()) > 0) {
            continue;
        }

        const after = (await box.boundingBox())?.height ?? 0;

        measured++;
        expect
            .soft(Math.abs(after - before), `${title}: skeleton ${Math.round(before)} px, content ${Math.round(after)} px`)
            .toBeLessThanOrEqual(8);
    }

    expect(measured, 'every chart ended empty: nothing to compare').toBeGreaterThan(0);

    const shift = await layoutShiftSince(page, since);

    expect.soft(shift, `layout shift while the charts replace their skeletons: ${shift.toFixed(3)}`).toBeLessThanOrEqual(0.02);
});
