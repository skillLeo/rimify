import { expect, test } from '../fixtures';
import { PDP_BASE, SHOTS, openPdpWithCar, scrollPastBuyButton } from './pdp-support';

test.use({ baseURL: PDP_BASE });

/*
 * PDP-03 (S2) — at 320 px, with „Komplettrad“ chosen, the price bar's „für 4 Kompletträder“ runs under its button.
 *
 * `.pdp__sticky-price p { white-space: nowrap }` (a price never breaks) also holds the note, and the button beside it is
 * `flex: none` with a nowrap label. 320 − 2 × 16 px padding − 12 px gap − „In den Warenkorb“ (≈ 178 px) leaves
 * ≈ 98 px for the price column; „für 4 Kompletträder“ at 14 px needs ≈ 124 px. `min-width: 0` lets the column shrink,
 * the text overflows it, and the button (positioned, painted later) covers the end: „für 4 Komplettr…“.
 * The figures are computed, not measured; this spec measures the text itself (a Range, not the box it overflows).
 *
 * Expected: price and note end left of the button (the note wraps, shortens or stacks), nothing under it.
 * Writes nothing.
 *
 * The rule holds for every note the bar carries. The e2e shop offers no Komplettrad for its car (no tyre in a fitting
 * size on its shelf), so the bar is measured with the rims' note — the same element, the same rule.
 */

test('PDP-03 the price bar at 320 px keeps its note clear of the button', async ({ page }, info) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await openPdpWithCar(page);
    await scrollPastBuyButton(page);

    await page.locator('.pdp__sticky').screenshot({ path: `${SHOTS}/pdp-03-bar-320-${info.project.name}.png` });

    const under = await page.locator('.pdp__sticky').evaluate((bar) => {
        const button = bar.querySelector('.pdp__sticky-btn')?.getBoundingClientRect();

        if (!button) {
            return ['no button in the price bar'];
        }

        return [...bar.querySelectorAll<HTMLElement>('.pdp__sticky-price p')]
            .map((line) => {
                const range = document.createRange();
                range.selectNodeContents(line);

                return { text: (line.textContent ?? '').trim(), right: Math.round(range.getBoundingClientRect().right) };
            })
            .filter((line) => line.right > button.left + 0.5)
            .map((line) => `„${line.text}“ ends at ${line.right} px, under the button that starts at ${Math.round(button.left)} px`);
    });

    expect(under, 'text of the price bar runs under its button').toEqual([]);
});
