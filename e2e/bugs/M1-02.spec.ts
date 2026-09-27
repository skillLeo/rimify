import { expect, test } from '@playwright/test';
import { SHOTS, focusStop, guardDemoData, isPhone, openUebersicht, signIn, type FocusStop } from './m1-support';

/*
 * M1-02 (S2) — Collapsed rail (768–1023 px always; 1024 px and up to ≈ 1190 px when the window has no
 * room for the rail): the keyboard lands on an invisible „entfernen“ (docs/qa/BUGS.md).
 *
 * AdminRailFoot.vue puts the purge button inside `.adm-foot__demo-text`. Collapsed, admin.css hides
 * that text the visually-hidden way — `position: absolute; width: 1px; height: 1px; overflow: hidden;
 * clip-path: inset(50%)` — which hides it from the eye but not from the keyboard: the `<button>` stays
 * in the tab order. Tab walks from the dot (the collapsed strip's own stop, tabindex 0) onto a control
 * nobody can see — its focus ring is clipped away with it — and Enter there opens „Demodaten
 * entfernen“, the one destructive question in the shell, from nowhere.
 *
 * Expected: every Tab stop can be seen (brief: focus always visible) — in the collapsed rail
 * „entfernen“ is either out of the tab order or shown.
 *
 * Nothing is written: the test only presses Tab. No key that could activate anything is pressed, and
 * any write under /admin/demodaten would be aborted in the browser (guardDemoData).
 */

test('M1-02 collapsed rail: „entfernen“ is never an invisible stop for the keyboard', async ({ page }, info) => {
    test.skip(isPhone(info.project.name), 'The rail: from 768 px (the phone has none; its foot is in „Mehr“).');

    const stopped = await guardDemoData(page);

    await page.setViewportSize({ width: 1024, height: 800 });
    await signIn(page);

    let widths = 0;

    for (const width of [1024, 768]) {
        await page.setViewportSize({ width, height: 800 });
        await openUebersicht(page);

        const purge = page.locator('.adm-foot__demo-purge');

        test.skip((await purge.count()) === 0, 'No demo data on this database (or no right to remove them): nothing to reach.');

        const rail = (await page.locator('.adm').getAttribute('data-rail')) ?? '?';
        let reached: FocusStop | null = null;

        for (let i = 0; i < 80 && reached === null; i++) {
            await page.keyboard.press('Tab');

            if (await purge.evaluate((el) => el === document.activeElement)) {
                reached = await focusStop(page);
            }
        }

        widths++;

        if (reached !== null) {
            await page.screenshot({ path: `${SHOTS}/m1-02-invisible-focus-${width}.png` });
            expect
                .soft(reached.seen, `at ${width} px (rail ${rail}) Tab lands on ${reached.what}, which cannot be seen: its words and its focus ring are clipped to a 1 px box`)
                .toBe(true);
        }
    }

    expect(widths).toBe(2);
    expect(stopped, 'no write under /admin/demodaten may be sent').toEqual([]);
});
