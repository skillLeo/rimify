import { expect, test } from '../fixtures';
import { PDP_BASE, SHOTS, openPdpWithCar, settled } from './pdp-support';

test.use({ baseURL: PDP_BASE });

/*
 * PDP-01 (S2) — the panel after an add (#16) is wider than a small phone: its close button, the line's price, the
 * subtotal and „Zum Warenkorb“ stand outside the card, and at 320 px outside the screen.
 *
 * `.addp__go` is `grid-template-columns: 1fr 1fr` holding two `.btn` — `white-space: nowrap`, 20 px padding a side,
 * not `.btn--block` (the class whose labels wrap). „Weiter einkaufen“ and „Zum Warenkorb“ at 16 px need ≈ 330 px
 * side by side. The card's content box is 264 px at 320 (296 − 2 × 16), 304 at 360 and 319 at 375. `.addp` is a grid
 * with one implicit `auto` column, so the column grows to the buttons' min-content and every row grows with it:
 * the × (last in `.addp__head`), the price (`.addp__line`'s `auto` column) and the subtotal move right with it.
 * The figures above are computed, not measured; this spec measures them.
 *
 * Expected: everything in the panel inside the card and on the screen, at every width (the buttons wrap or stack).
 * Writes four rims into the session's basket per width; nothing else.
 */

for (const width of [320, 360, 375]) {
    test(`PDP-01 the panel after an add fits a ${width} px screen`, async ({ page }, info) => {
        await page.setViewportSize({ width, height: 740 });
        await openPdpWithCar(page);

        await page.locator('button.pdp__add').click();

        const panel = page.locator('.addp');

        await expect(panel, 'the add brought no panel').toBeVisible();
        await settled(page, '.addp-viewport');
        await page.screenshot({ path: `${SHOTS}/pdp-01-panel-${width}-${info.project.name}.png` });

        const outside = await panel.evaluate((card) => {
            const box = card.getBoundingClientRect();
            const edge = Math.min(box.right, window.innerWidth);
            const parts = card.querySelectorAll<HTMLElement>('.addp__close, .addp__price, .addp__sum-value, .addp__btn');

            return [...parts]
                .map((part) => ({
                    name: part.getAttribute('aria-label') ?? (part.textContent ?? '').trim(),
                    right: Math.round(part.getBoundingClientRect().right),
                }))
                .filter((part) => part.right > edge + 0.5)
                .map((part) => `„${part.name}“ ends at ${part.right} px; the card ends at ${Math.round(box.right)} px, the screen at ${window.innerWidth} px`);
        });

        expect(outside, `at ${width} px parts of the panel stand outside the card or the screen`).toEqual([]);
    });
}
