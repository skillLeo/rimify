import { expect, test } from '../fixtures';
import { CHECK_BASE, SHOTS, WHEEL, carStep, openCheck } from './check-support';

test.use({ baseURL: CHECK_BASE });

/*
 * CHECK-10 (S2) — from 900 px the car and the wheel stand side by side (`.chk__pick`), and the vehicle selector inside
 * the car's half still lays itself out for a whole page: its own media query (`min-width: 900px`, VehicleSelector.vue)
 * puts the guided route, „oder“ and the key numbers in three columns. In half a page that leaves each route ≈ 146 px at
 * 900 px, ≈ 175 px at 1024 and ≈ 240 px at 1280–1440 (computed from the tokens). The chooser for 1860 / AAS (R-01) then
 * has no room: „Das ist meins“ (`flex: none`, nowrap, ≈ 125 px) leaves the car's name ≈ 0 px at 900 — the button runs
 * out of its row — and ≈ 12 px at 1024, where „RS 4 Avant Quattro“ breaks into a column of letter pairs. At 1280–1440
 * the name takes three lines and „Höchstgeschwindigkeit:“ breaks inside the word.
 *
 * Expected: the chooser's rows read like rows at every width: the button inside its row, the name beside it on at most
 * two lines (e.g. the selector stacks its routes when its container, not the viewport, is narrow).
 * Writes nothing: the chooser is only shown.
 */

for (const width of [900, 1024]) {
    test(`CHECK-10 the key-number chooser fits the car step at ${width} px`, async ({ page }, info) => {
        await page.setViewportSize({ width, height: 900 });
        await openCheck(page, { felge: WHEEL });

        const step = carStep(page);

        await step.getByLabel('HSN', { exact: true }).fill('1860');
        await step.getByLabel('TSN', { exact: true }).fill('AAS');
        await step.getByRole('button', { name: 'Fahrzeug wählen' }).click();

        const rows = step.locator('.vsel__candidate');

        await expect(rows, 'precondition: 1860 / AAS opens no chooser').toHaveCount(2);
        await rows.first().scrollIntoViewIfNeeded();
        await step.screenshot({ path: `${SHOTS}/check-10-chooser-${width}-${info.project.name}.png` });

        const faults = await rows.evaluateAll((buttons) =>
            buttons.flatMap((row) => {
                const box = row.getBoundingClientRect();
                const cta = row.querySelector('.vsel__candidate-cta')?.getBoundingClientRect();
                const name = row.querySelector('.vsel__candidate-name');

                if (cta === undefined || name === null) {
                    return ['a chooser row without its name or „Das ist meins“'];
                }

                const range = document.createRange();

                range.selectNodeContents(name);

                const ink = range.getBoundingClientRect();
                const lines = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
                const label = (name.textContent ?? '').trim();
                const found: string[] = [];

                if (cta.right > box.right + 0.5) {
                    found.push(`„Das ist meins“ ends ${Math.round(cta.right - box.right)} px outside its row`);
                }

                if (ink.right > cta.left + 0.5) {
                    found.push(`„${label}“ runs ${Math.round(ink.right - cta.left)} px under „Das ist meins“`);
                }

                if (lines > 2) {
                    found.push(`„${label}“ breaks into ${lines} lines`);
                }

                return found;
            }),
        );

        expect(faults, `at ${width} px the chooser's rows do not fit the car step`).toEqual([]);
    });
}
