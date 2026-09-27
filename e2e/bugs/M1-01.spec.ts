import { expect, test } from '@playwright/test';
import { SHOTS, isPhone, openUebersicht, signIn } from './m1-support';

/*
 * M1-01 (S2) — Phone and touch: „Mit dem Vorzeitraum vergleichen“, switched on, is a 48 × 44 px blue
 * blob instead of a 32 × 20 px switch (docs/qa/BUGS.md).
 *
 * PeriodSwitcher.vue grows the switch to a finger's 44 px with padding and keeps the track 32 × 20 by
 * painting the content box only — `@media (pointer: coarse), (max-width: 767px) { .period__switch {
 * box-sizing: content-box; padding: 12px 8px; background-clip: content-box } }`. The checked state
 * is `.period__switch[data-state='checked'] { background: var(--c-blue) }`: the `background`
 * shorthand resets `background-clip` to `border-box`, and with the extra attribute it outranks the
 * media rule. Switched on, the whole 48 × 44 box is painted blue with `border-radius: 999px` — a blue
 * disc with a small white dot in its corner. The comparison is remembered on the account and was on
 * in the M1 proof shot (docs/qa/shots/M1/dashboard-390-filled.png): every phone and every touch
 * tablet sees it on every visit.
 *
 * Expected: switched on, only the 32 × 20 track is blue (the padding stays a transparent hit area).
 *
 * Nothing is written: the switch is read as the account has it; if the account compares off, the
 * switch is shown „on“ in this browser only (its data-state attribute) — no request is sent.
 */

test('M1-01 the comparison switch, on, paints its track — not its whole touch target', async ({ page }, info) => {
    if (!isPhone(info.project.name)) {
        // The phone's rule is also a width rule (max-width: 767px): a desktop browser at 390 px shows it too.
        await page.setViewportSize({ width: 390, height: 844 });
    }

    await signIn(page);
    await openUebersicht(page);

    const sw = page.locator('.period__switch');

    await expect(sw).toBeVisible();

    const state = await sw.getAttribute('data-state');

    if (state !== 'checked') {
        await sw.evaluate((el) => el.setAttribute('data-state', 'checked'));
    }

    const paint = await sw.evaluate((el) => {
        const style = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        const padding = ['Top', 'Right', 'Bottom', 'Left'].reduce(
            (sum, side) => sum + (parseFloat(style.getPropertyValue(`padding-${side.toLowerCase()}`)) || 0),
            0,
        );
        const transparent = style.backgroundColor === 'transparent' || /rgba\(.*,\s*0\)$/.test(style.backgroundColor);

        return {
            clip: style.backgroundClip,
            colour: style.backgroundColor,
            padding,
            transparent,
            width: Math.round(box.width),
            height: Math.round(box.height),
        };
    });

    await page.locator('.period__compare').screenshot({ path: `${SHOTS}/m1-01-compare-switch-${info.project.name}.png` });

    const paintsPadding = !paint.transparent && paint.padding > 0 && paint.clip !== 'content-box';

    expect(
        paintsPadding,
        `switched on (account: ${state ?? 'none'}), the switch paints its whole ${paint.width} × ${paint.height} px box ` +
            `in ${paint.colour} (background-clip: ${paint.clip}, ${paint.padding} px of padding), not its 32 × 20 px track`,
    ).toBe(false);
});
