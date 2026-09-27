import { expect, test } from '@playwright/test';
import type { TopWheel } from '../../resources/js/types/admin/uebersicht';
import { SHOTS, openUebersichtWith, signIn, widget } from './ueb-support';

/*
 * UEB-03 (S2) — Top-Felgen nach Bestellungen: the bars are not to scale (docs/qa/BUGS.md).
 *
 * BarChart.vue gives each bar `width: <value / max>%` of its track and, so the figure fits beside it,
 * `max-width: calc(100% - 96px)`. The leader is therefore clamped to track − 96 px while the others
 * keep their share of the full track: with a ≈ 183 px track (1440, four columns; 390, full width) every
 * bar at ≥ 48 % of the leader is drawn exactly as long as the leader — 5 orders look like 10. On a
 * wider track the error is smaller but still there (400 px: 5 against 10 drawn as 200 : 304).
 * A ranking chart that draws unequal figures as equal is confidently wrong.
 *
 * Expected: bar lengths in proportion to the figures (10 : 5 : 1).
 *
 * Nothing is written: the page's answer is the server's own, with its Top-Felgen replaced in the
 * browser by three stand-in bars of known size.
 */

const BARS: TopWheel[] = [
    { key: 'qa-a', label: 'QA Felge A', brand: 'QA', name: 'Felge A', size: '8,5J × 19', value: 10 },
    { key: 'qa-b', label: 'QA Felge B', brand: 'QA', name: 'Felge B', size: '8J × 18', value: 5 },
    { key: 'qa-c', label: 'QA Felge C', brand: 'QA', name: 'Felge C', size: null, value: 1 },
];

test('UEB-03 Top-Felgen: every bar is as long as its figure says', async ({ page }) => {
    await signIn(page);
    // Top-Felgen comes with the page (M1-06), not with the charts.
    await openUebersichtWith(page, (props) => {
        props.topWheels = BARS;
    });

    const box = widget(page, 'Top-Felgen nach Bestellungen');
    const bars = box.locator('.bc__bar');

    await expect(bars).toHaveCount(3, { timeout: 15_000 });
    await box.scrollIntoViewIfNeeded();
    // The bars grow in (240 ms); offsetWidth ignores the transform anyway.
    await page.waitForTimeout(600);

    const [a = 0, b = 0, c = 0] = await bars.evaluateAll((els) => els.map((el) => (el as HTMLElement).offsetWidth));
    const track = await box.locator('.bc__track').first().evaluate((el) => (el as HTMLElement).clientWidth);

    await box.screenshot({ path: `${SHOTS}/ueb-03-top-felgen-${test.info().project.name}.png` });

    expect.soft(b / a, `5 against 10 drawn as ${b} px against ${a} px (track ${track} px)`).toBeCloseTo(0.5, 1);
    expect.soft(c / a, `1 against 10 drawn as ${c} px against ${a} px (track ${track} px)`).toBeCloseTo(0.1, 1);
});
