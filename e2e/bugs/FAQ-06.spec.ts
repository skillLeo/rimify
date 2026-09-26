import { expect, test } from '@playwright/test';
import { SHOTS, signIn, waitForApp } from './faq-support';

/*
 * FAQ-06 (S2) — on a phone the row the server renders is not the row the page keeps: the moves
 * („nach oben" / „nach unten") are drawn beside every question in the first frame and removed after
 * hydration, so every question re-wraps and the list jumps (docs/qa/BUGS.md).
 *
 * Admin/Faq/Index.vue decides `narrow` with window.matchMedia('(max-width: 767px)') in onMounted.
 * The server cannot know it, so SSR renders the desktop row (three 44 px buttons on touch, the
 * question squeezed to ≈200 px at 390), and the client swaps it for the one-button row after the
 * JavaScript has loaded. ssr.ts: „the first frame the server renders is the frame the client
 * hydrates to — nothing here may consult `window`."
 *
 * This needs the SSR server (CLAUDE.md §4: SSR is a requirement). Without it the first response
 * holds no rows at all and the test says so rather than passing.
 */
test('FAQ-06 the phone row the server renders is the row the page keeps', async ({ page }) => {
    await page.addInitScript(() => {
        const w = window as unknown as { __cls: number };

        w.__cls = 0;
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
                if (!entry.hadRecentInput) {
                    w.__cls += entry.value;
                }
            }
        }).observe({ type: 'layout-shift', buffered: true });
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);

    const response = await page.goto('/admin/faq', { waitUntil: 'commit' });
    const html = (await response?.text()) ?? '';

    await waitForApp(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1_000);
    await page.screenshot({ path: `${SHOTS}/faq-06-after-hydration-390-${test.info().project.name}.png`, fullPage: true });

    const ssr = html.includes('faq-adm__entry');
    const firstFrame = (html.match(/id="faq-up-\d+"/g) ?? []).length;
    const hydrated = await page.locator('[id^="faq-up-"]').count();
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);

    expect(ssr, 'the first response holds no server-rendered rows: SSR is a requirement (CLAUDE.md §4) — start it and run again').toBe(true);
    expect(hydrated, `the server drew ${firstFrame} „nach oben" buttons at 390 px, the hydrated page keeps ${hydrated} (CLS ${cls.toFixed(3)})`).toBe(firstFrame);
    expect(cls, 'layout shift across load at 390 px').toBeLessThanOrEqual(0.02);
});
