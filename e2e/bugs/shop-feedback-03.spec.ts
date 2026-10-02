import { expect, test } from '../fixtures';
import { consentGiven } from '../support';
import { SHOP_FEEDBACK_BASE, SHOTS, fmt, guardSends, openShop, signIn, topmostAt } from './shop-feedback-support';

test.use({ baseURL: SHOP_FEEDBACK_BASE });

/*
 * SHOP-FEEDBACK-03 (S2) — with the compare tray open, the feedback button sits on the tray; on a phone it covers the
 * right end of „Vergleichen (n)“ (docs/qa/BUGS.md).
 *
 * The button rides above a page's price bar only: `:root:has(.stickybar, .msticky) .shop-fb` (ShopFeedback.vue). The
 * compare tray holds the same bottom edge — `.tray`, fixed, bottom 0, --stickybar-h (64 px; ≈ 128 px when it wraps
 * below 768 px), z-index --z-sticky (100) — and announces itself with `html[data-tray="open"]`, which the toast and the
 * page's padding already obey. The button (z-index 200) ignores it: at 1440 it hangs 40 px into the tray's band; on a
 * phone the 44 px bubble lies on the tray's primary „Vergleichen (n)“ (`.tray__go`, at the right edge in both the
 * desktop anatomy at < 768 px and the phone's), so a tap on its right end opens the feedback instead of the comparison.
 *
 * Expected: as over the price bar, the button rides above the tray, and the tray's primary is free.
 * The compare list is the browser's own (`rmf_compare`); two stand-in wheels are put there before the page loads.
 * Nothing reaches the server; writes nothing.
 */

const COMPARE = {
    v: 1,
    items: [
        { modelId: 900_001, finishId: 1, slug: 'qa-eins', brandName: 'QA', modelName: 'Eins', finishName: 'Silber', image: null, fromPriceCents: 19_900 },
        { modelId: 900_002, finishId: 1, slug: 'qa-zwei', brandName: 'QA', modelName: 'Zwei', finishName: 'Schwarz', image: null, fromPriceCents: 24_900 },
    ],
};

test('SHOP-FEEDBACK-03 the feedback button rides above the compare tray and leaves „Vergleichen“ free', async ({ page }, info) => {
    await page.addInitScript((list) => {
        try {
            window.localStorage.setItem('rmf_compare', list);
        } catch {
            // about:blank has no storage.
        }
    }, JSON.stringify(COMPARE));

    await consentGiven(page.context(), SHOP_FEEDBACK_BASE);
    await signIn(page);
    await guardSends(page);

    const button = await openShop(page, '/kontakt');
    const tray = page.locator('section.tray');

    await expect(tray, 'precondition: no compare tray with two wheels in the list').toBeVisible();
    // The tray slides in over --d-3.
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${SHOTS}/shop-feedback-03-compare-tray-${info.project.name}.png` });

    const trayBox = await tray.boundingBox();
    const buttonBox = await button.boundingBox();
    const go = tray.locator('.tray__go').first();
    const goEnd = await topmostAt(go, 'right');

    expect(trayBox, 'the tray has no box').not.toBeNull();
    expect(buttonBox, 'the feedback button has no box').not.toBeNull();

    const above = buttonBox !== null && trayBox !== null && buttonBox.y + buttonBox.height <= trayBox.y + 0.5;

    expect(
        { above, compareFree: goEnd.inside },
        `button ${buttonBox ? fmt(buttonBox) : '–'}, tray ${trayBox ? fmt(trayBox) : '–'}; the right end of „Vergleichen“ shows ${goEnd.what}`,
    ).toEqual({ above: true, compareFree: true });
});
