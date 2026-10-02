import { expect, test } from '../fixtures';
import { PDP_BASE, SHOTS, openPdpWithCar, scrollPastBuyButton } from './pdp-support';

test.use({ baseURL: PDP_BASE });

/*
 * PDP-02 (S2) — on a phone, with a wheel in the compare list, the compare tray covers the product page's price bar and
 * its „In den Warenkorb“.
 *
 * Both are fixed to the bottom edge and 64 px tall: `.tray` (z-index `--z-sticky`, 100; components.css) and the page's
 * `.stickybar.pdp__sticky` (z-index 45; legacy.css). CompareTray steps aside only through its `hidden` prop („never
 * while a sticky action bar owns that edge“), which MobileLayout passes and AppLayout — the product page's layout —
 * does not; `felgen.show` is not among its HIDDEN_ROUTES either. Below 900 px the bar shows once the main button has
 * left the screen, and the tray lies over it.
 *
 * Expected: the price bar's button is what a tap at its centre reaches. Writes nothing (the compare list is the
 * browser's own localStorage).
 *
 * Fixed (D-133) the way the tray's contract says: the page's price bar claims the bottom edge and the tray steps aside in
 * both layouts. So the tray is looked for where it belongs — with the main button on screen and no bar.
 */

const COMPARED = JSON.stringify({
    v: 1,
    items: [
        {
            modelId: 990001,
            finishId: 1,
            slug: 'beispiel-felge',
            brandName: 'BEISPIEL',
            modelName: 'Vergleichsrad',
            finishName: 'Silber',
            image: null,
            fromPriceCents: 19_900,
        },
    ],
});

test('PDP-02 the phone price bar is not under the compare tray', async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript((value) => window.localStorage.setItem('rmf_compare', value), COMPARED);
    await openPdpWithCar(page);

    await page.locator('.pdp__add').scrollIntoViewIfNeeded();
    await expect(page.locator('.pdp__sticky'), 'precondition: the price bar shows while the main button is on screen').toHaveCount(0);
    await expect(page.locator('.tray'), 'precondition: the compare tray shows one wheel').toBeVisible();

    await scrollPastBuyButton(page);
    await expect(page.locator('.tray'), 'the compare tray stays at the bottom edge under the price bar').toHaveCount(0);
    await page.screenshot({ path: `${SHOTS}/pdp-02-bar-under-tray-${info.project.name}.png` });

    const covering = await page.locator('.pdp__sticky-btn').evaluate((button) => {
        const box = button.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);

        return hit === null || hit === button || button.contains(hit)
            ? null
            : `${hit.tagName.toLowerCase()}.${[...hit.classList].join('.')} inside ${hit.closest('section, div[class]')?.className ?? '?'}`;
    });

    expect(covering, 'a tap on „In den Warenkorb“ in the price bar reaches another element').toBeNull();
});
