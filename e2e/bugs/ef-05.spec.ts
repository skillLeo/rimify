import { devices, expect, test, type Page } from '../fixtures';
import { SHOP } from '../shop';
import { consentGiven, open } from '../support';
import { SHOTS } from './ef-support';

/*
 * EF-05 (S2) — Block E/F review: on an iPhone the homepage still jumps under the finger once the phone has been
 * turned.
 *
 * Startseite/Mobile.vue lays every `.home-below` section out once after mount so that `contain-intrinsic-size:
 * auto` remembers its real height, then lets the sections skip their layout again until they come near. The size
 * remembered is the one of that moment's width. Turn the phone and every section that is not near the viewport
 * keeps its portrait height (H4 ≈ 1.440 px, H6 ≈ 1.310, H8 ≈ 1.330 at 393 px) until it scrolls near again, then
 * takes its landscape height. Scrolling back up, each section above the viewport changes height while the reader
 * looks at the one below it: WebKit has no scroll anchoring (the code's own comment says so), so the content moves
 * by the difference — and a tap on the popular row's tabs or a FAQ question lands on whatever moved there. The same
 * happens after a reload or a deep link (/#h11) at any width but 393: the scroll position is restored against the
 * placeholders, then the mount-time pass resizes the sections above it (EF-07, S3).
 *
 * The test scrolls the way a thumb does, 240 px at a time, and follows the element at the centre of the screen:
 * after each step it must have moved by the 240 px scrolled and not a pixel more. Portrait first (the Block E/F
 * fix — expected to hold), then landscape, then portrait again.
 *
 * WebKit only (Safari is where there is no scroll anchoring); it needs `npx playwright install webkit`. Runs once,
 * under the mobile-390 project. Writes nothing.
 */

const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices['iPhone 16'];

// Reduced motion: no reveal or transition moves anything between two measurements — only layout can.
test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch, browserName: 'webkit', baseURL: SHOP, reducedMotion: 'reduce' });

const STEP = 240;

async function settle(page: Page): Promise<void> {
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 300)))));
}

/** To the bottom in one fling, then back up a thumb's scroll at a time; every step that moved the content more than it scrolled. */
async function flingDownThenUp(page: Page, phase: string): Promise<string[]> {
    const jumps: string[] = [];

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await settle(page);

    for (let i = 0; i < 120; i++) {
        const step = await page.evaluate(async (dy) => {
            const frame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()));
            const y0 = window.scrollY;

            if (y0 <= 0) {
                return null;
            }

            // The section under the centre of the screen: its top moves only when something above it changes
            // height — a reveal animation inside it does not count.
            const hit = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
            const anchor = hit?.closest('section[data-section]') ?? hit;

            if (anchor === null || anchor === undefined) {
                return null;
            }

            const top0 = anchor.getBoundingClientRect().top;

            window.scrollTo(0, Math.max(0, y0 - dy));

            const scrolled = y0 - window.scrollY;

            await frame();
            await frame();
            await new Promise((resolve) => setTimeout(resolve, 200));
            await frame();

            const cls = typeof anchor.className === 'string' ? anchor.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';

            return {
                jump: Math.round(anchor.getBoundingClientRect().top - top0 - scrolled),
                y: Math.round(window.scrollY),
                anchor: `<${anchor.tagName.toLowerCase()}${cls ? `.${cls}` : ''}> in #${anchor.closest('section[id]')?.id ?? '?'}`,
            };
        }, STEP);

        if (step === null) {
            break;
        }

        if (Math.abs(step.jump) > 2) {
            jumps.push(`${phase}: scrolled ${STEP} px up to y = ${step.y}, and ${step.anchor} moved ${step.jump > 0 ? '+' : ''}${step.jump} px more`);

            // The first jump of each phase, as the reader sees it right after.
            if (jumps.length === 1) {
                await page.screenshot({ path: `${SHOTS}/ef-05-jump-${phase.replace(/[^a-z0-9]+/gi, '-').replace(/-+$/, '').toLowerCase()}.png` });
            }
        }
    }

    return jumps;
}

test('EF-05 the phone homepage does not jump while scrolling back up after the phone was turned', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'mobile-390', 'one WebKit run is enough');
    test.slow();

    await consentGiven(context, SHOP);
    await open(page, '/');

    const contentVisibility = await page.evaluate(() => CSS.supports('content-visibility', 'auto'));

    test.skip(!contentVisibility, 'this WebKit build has no content-visibility: the placeholders never apply');

    await expect(page.locator('#h4.home-below'), 'the phone document (Startseite/Mobile) was not served').toHaveCount(1);
    await settle(page);

    const jumps: string[] = [];

    jumps.push(...(await flingDownThenUp(page, 'portrait 393×852 (never turned)')));

    await page.setViewportSize({ width: 852, height: 393 });
    await settle(page);
    jumps.push(...(await flingDownThenUp(page, 'landscape 852×393 (turned)')));

    await page.setViewportSize({ width: 393, height: 852 });
    await settle(page);
    jumps.push(...(await flingDownThenUp(page, 'portrait 393×852 (turned back)')));

    expect(jumps, `${jumps.length} steps moved the page under the finger:\n${jumps.join('\n')}`).toEqual([]);
});
