import { expect, test } from '../fixtures';
import { SHOP } from '../shop';
import { SHOTS, chooseCar, openProductWithPapers } from './c-support';

// A storefront spec: the shop with wheels in it (e2e/shop.ts).
test.use({ baseURL: SHOP });

/*
 * C-01 (S1 at ≤ 375 px, S2 above) — Block C review: the papers form pushes the purchase panel off the phone
 * and out of the RIMIFY-CHECK panel on a small laptop.
 *
 * PapersForm.vue: „Zulassungsbescheinigung fotografieren" is a `.btn` (white-space: nowrap) with a 20 px icon —
 * about 310–330 px that cannot wrap. On a phone `.pdp` is a single `auto` grid column, so that min-content
 * widens the whole purchase column (price, „In den Warenkorb", the verdict) past the screen, where
 * `body.is-mobile main { overflow-x: clip }` cuts it off. The form has 302 px at 390, 272 px at 360, 232 px at 320.
 * On the desktop layout (≥ 900 px, purchase column 5/12) `.pp__grid` puts 8.1, 8.2 and T in three columns of
 * ~86–140 px; the word „Höchstgeschwindigkeit" (~140–150 px) widens the T field's own grid track, so its label
 * and input run out of the form band (and, below ~1.100 px, out of the panel).
 *
 * Expected: nothing in the papers form ends right of the form band, and nothing on the product page ends right
 * of the screen — at 390, 360, 320 (phone) and 1440, 1024, 960 (desktop).
 *
 * Writes nothing: the car is chosen by key numbers (a cookie); the form is only looked at.
 */

const WIDTHS: Record<string, number[]> = {
    'desktop-1440': [1440, 1024, 960],
    'mobile-390': [390, 360, 320],
};

test('C-01 the papers form stays inside its band and the purchase column inside the screen', async ({ page }, info) => {
    test.slow();

    await chooseCar(page);
    await openProductWithPapers(page);
    await expect(page.locator('.pp__form')).toBeVisible();

    const problems: string[] = [];

    for (const width of WIDTHS[info.project.name] ?? [1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(250);

        const found = await page.evaluate(() => {
            const form = document.querySelector<HTMLElement>('.pp__form');
            const buy = document.querySelector<HTMLElement>('.pdp__buy');
            const screen = document.documentElement.clientWidth;
            const out: string[] = [];

            if (form === null || buy === null) {
                return ['the papers form or the purchase column is gone'];
            }

            const band = form.getBoundingClientRect().right;
            const limit = Math.min(band, screen);
            const name = (el: Element): string => {
                const text = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);

                return `<${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.classList.length ? `.${Array.from(el.classList).join('.')}` : ''}> „${text}"`;
            };

            for (const el of Array.from(form.querySelectorAll('*'))) {
                if (el.closest('svg') !== null && el.tagName.toLowerCase() !== 'svg') {
                    continue;
                }

                const r = el.getBoundingClientRect();

                if (r.width > 0 && r.right > limit + 0.5) {
                    out.push(`${name(el)} ends at ${Math.round(r.right)} px — the form band at ${Math.round(band)}, the screen at ${screen}`);
                }
            }

            const buyRight = buy.getBoundingClientRect().right;

            if (buyRight > screen + 0.5) {
                out.push(`the purchase column (.pdp__buy) ends at ${Math.round(buyRight)} px, right of the ${screen} px screen — its right edge is cut off`);
            }

            return out.slice(0, 6);
        });

        await page.locator('.pdp__buy').screenshot({ path: `${SHOTS}/c-01-papers-form-${width}-${info.project.name}.png` });

        problems.push(...found.map((line) => `${width} px: ${line}`));
    }

    expect(problems, problems.join('\n')).toEqual([]);
});
