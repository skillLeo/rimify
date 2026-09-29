import { expect, test, type Locator, type Page } from '../fixtures';
import { SHOTS, chartsSettled, isPhone, openUebersicht, signIn, widget } from './m1-support';

/*
 * M1-03 (S2) — Phone: a finger that scrolls the page across the Umsatz or the Verdikte chart leaves
 * the chart's tip pinned on screen — and the Verdikte chart greyed out but for one week
 * (docs/qa/BUGS.md).
 *
 * LineChart.vue and StackedBar.vue read the point under the finger on `pointerdown` (tap to pin) and
 * clear it on `pointerleave` for a mouse only („a finger lifting leaves it where it was read“). A
 * scroll that starts on a chart is a pointerdown too: the chart sets its crosshair and tip; the
 * browser then takes the gesture for the page (`touch-action: pan-y`), sends pointercancel and
 * pointerleave — both ignored for touch. Nothing was tapped, so the chart never got the focus whose
 * blur would clear it: the tip stays over the chart until the chart itself is tapped and then left,
 * and in Verdikte every other week stays dimmed to 45 %. The charts span the phone's width, so
 * scrolling the Übersicht with a thumb does this on almost every visit — a stuck hover state.
 *
 * Expected: a scroll reads nothing — after it no tip, no crosshair, no dimmed columns. A tap still pins.
 *
 * The gesture is a real touch scroll (Chromium's Input.synthesizeScrollGesture). Should the headless
 * browser not deliver it to the chart, the test says so and replays the exact pointer sequence a
 * browser sends for a scroll (pointerdown, pointercancel, pointerout, pointerleave — all `touch`).
 *
 * Nothing is written.
 */

interface Chart {
    title: string;
    plot: string;
    tip: string;
    dimmed?: string;
}

const CHARTS: Chart[] = [
    { title: 'Umsatz über die Zeit', plot: '.lc__svg', tip: '.lc__tip' },
    { title: 'Verdikte der Prüfungen', plot: '.sb__svg', tip: '.sb__tip', dimmed: '.sb__column--dim' },
];

async function listen(plot: Locator): Promise<void> {
    await plot.evaluate((el) => {
        const log: string[] = [];

        (window as unknown as { __m1Pointer: string[] }).__m1Pointer = log;

        for (const type of ['pointerdown', 'pointercancel', 'pointerup', 'pointerleave']) {
            el.addEventListener(type, (event) => log.push(`${event.type}:${(event as PointerEvent).pointerType}`));
        }
    });
}

async function heard(page: Page): Promise<string[]> {
    return page.evaluate(() => (window as unknown as { __m1Pointer?: string[] }).__m1Pointer ?? []);
}

test('M1-03 a thumb scrolling past a chart leaves no tip behind', async ({ page, browserName }, info) => {
    test.skip(!isPhone(info.project.name), 'A touch screen.');
    test.skip(browserName !== 'chromium', 'The touch scroll is driven through the Chromium DevTools protocol.');

    await signIn(page);
    await openUebersicht(page);
    await chartsSettled(page);

    const cdp = await page.context().newCDPSession(page);
    let checked = 0;

    for (const chart of CHARTS) {
        const card = widget(page, chart.title);
        const plot = card.locator(chart.plot);

        if ((await plot.count()) === 0) {
            continue; // Nothing drawn in this period (the card is its sentence).
        }

        await plot.evaluate((el) => el.scrollIntoView({ block: 'center' }));
        await page.waitForTimeout(200);
        await listen(plot);

        const box = await plot.boundingBox();

        expect(box, `rig: ${chart.title} has no box`).not.toBeNull();

        const at = { x: Math.round(box!.x + box!.width * 0.6), y: Math.round(box!.y + box!.height * 0.5) };
        const scrollBefore = await page.evaluate(() => window.scrollY);

        await cdp.send('Input.synthesizeScrollGesture', {
            x: at.x,
            y: at.y,
            xDistance: 0,
            yDistance: -220,
            gestureSourceType: 'touch',
            speed: 800,
        });
        await page.waitForTimeout(400);

        let log = await heard(page);
        const scrolled = (await page.evaluate(() => window.scrollY)) - scrollBefore;
        let how = `a touch scroll of ${scrolled} px`;

        // A gesture that did not reach the chart, or that did not move the page, was no scroll: a
        // headless browser may deliver it as a tap (down and up on one spot), and a tap pins by design.
        if (!log.some((entry) => entry.startsWith('pointerdown')) || scrolled === 0) {
            // The sequence a browser sends for a scroll that starts on the chart, replayed on it.
            const now = await plot.boundingBox();
            const point = { x: now!.x + now!.width * 0.6, y: now!.y + now!.height * 0.5 };

            await plot.evaluate((el, p) => {
                const init = { bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: p.x, clientY: p.y };

                el.dispatchEvent(new PointerEvent('pointerdown', init));
                el.dispatchEvent(new PointerEvent('pointercancel', init));
                el.dispatchEvent(new PointerEvent('pointerout', init));
                el.dispatchEvent(new PointerEvent('pointerleave', { ...init, bubbles: false }));
            }, point);
            await page.waitForTimeout(200);
            log = await heard(page);
            how = 'the pointer sequence of a touch scroll (replayed: the synthetic gesture did not reach the chart)';
        }

        checked++;
        await card.screenshot({ path: `${SHOTS}/m1-03-after-scroll-${chart.plot.slice(1, 3)}-${info.project.name}.png` });

        await expect
            .soft(card.locator(chart.tip), `${chart.title}: after ${how} (${log.join(', ')}) the tip is still on screen`)
            .toHaveCount(0);

        if (chart.dimmed) {
            await expect
                .soft(card.locator(chart.dimmed), `${chart.title}: after the scroll the other weeks are still dimmed`)
                .toHaveCount(0);
        }

        // A tap still reads the chart and pins what it read.
        await plot.tap({ position: { x: Math.round(box!.width * 0.3), y: Math.round(box!.height * 0.5) } });
        await expect.soft(card.locator(chart.tip), `${chart.title}: a tap pins the tip`).toBeVisible();
    }

    expect(checked, 'neither chart has anything drawn in this period').toBeGreaterThan(0);
});
