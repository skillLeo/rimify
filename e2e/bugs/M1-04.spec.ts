import { expect, test } from '../fixtures';
import { SHOTS, chartsSettled, focusStop, isPhone, openUebersicht, pageTop, signIn, widget } from './m1-support';

/*
 * M1-04 (S2) — Below 900 px (tablet portrait, phone) the keyboard reaches „Heute“ after the Umsatz
 * chart although it stands above it (docs/qa/BUGS.md).
 *
 * admin.css moves Heute up with `order: -1` below 900 px (`.dash__grid > .dash__today`), so on a
 * tablet and a phone it sits straight under the figures. `order` moves boxes, not the tab order:
 * Uebersicht/Index.vue writes Heute after the Umsatz widget, so Tab goes figures → the Umsatz
 * chart's „…“ and the chart itself (further down) → back up to Heute's button → down again past the
 * Umsatz chart to Verdikte. The focus jumps against the reading direction twice.
 *
 * Expected: Tab order follows the visual order (brief: „Tab order matches the visual order“) — of the
 * two cards, the keyboard reaches first the one drawn first. (Fixed by drawing the one column in the
 * page's order: no `order` lift, so Heute now stands after the Umsatz card below 900 px.)
 *
 * Nothing is written: the test only presses Tab.
 */

const HEUTE = 'Heute';
const UMSATZ = 'Umsatz über die Zeit';

test('M1-04 below 900 px the keyboard reaches Heute and the Umsatz chart in the order they are drawn', async ({ page }, info) => {
    if (!isPhone(info.project.name)) {
        await page.setViewportSize({ width: 768, height: 1024 });
    }

    await signIn(page);
    await openUebersicht(page);
    await chartsSettled(page);

    const heute = widget(page, HEUTE);
    const umsatz = widget(page, UMSATZ);

    test.skip((await heute.locator('a, button').count()) === 0, 'Heute has nothing to do today: no control of its own to reach.');
    test.skip((await umsatz.locator('.lc__svg').count()) === 0, 'No Umsatz in the period: no chart to reach.');

    const heuteTop = await pageTop(heute);
    const umsatzTop = await pageTop(umsatz);
    const drawnFirst = heuteTop < umsatzTop ? HEUTE : UMSATZ;
    const drawnSecond = drawnFirst === HEUTE ? UMSATZ : HEUTE;

    const cards: string[] = [];

    for (let i = 0; i < 150 && !(cards.includes(HEUTE) && cards.includes(UMSATZ)); i++) {
        await page.keyboard.press('Tab');

        const stop = await focusStop(page);

        if (stop.card === HEUTE || stop.card === UMSATZ) {
            cards.push(stop.card);
        }
    }

    await page.screenshot({ path: `${SHOTS}/m1-04-focus-order-${info.project.name}.png` });

    const first = { drawnFirst: cards.indexOf(drawnFirst), drawnSecond: cards.indexOf(drawnSecond) };

    expect(first.drawnFirst, `Tab never reached ${drawnFirst} (${cards.join(' → ')})`).toBeGreaterThanOrEqual(0);
    expect(
        first.drawnFirst,
        `Heute is drawn at y ${heuteTop}, the Umsatz chart at y ${umsatzTop}; the keyboard visits ${cards.join(' → ')}`,
    ).toBeLessThan(first.drawnSecond === -1 ? Number.POSITIVE_INFINITY : first.drawnSecond);
    // And once past a card, the keyboard does not come back up to it.
    expect(cards.lastIndexOf(drawnFirst), `the keyboard returns to ${drawnFirst} after ${drawnSecond}: ${cards.join(' → ')}`).toBeLessThan(
        first.drawnSecond === -1 ? Number.POSITIVE_INFINITY : first.drawnSecond,
    );
});
