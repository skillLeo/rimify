import { devices, expect, test, type BrowserContext, type Page } from '../fixtures';
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

/*
 * WebKit for Windows sometimes draws no frame at all for minutes in a long suite run — 03.10.2026, run D: 66 steps at
 * 0,3 s, then one took 158 s and the next never returned (the 180 s timeout); yesterday's run 1 the same. Never alone
 * (4 of 4 at ≈ 41 s, the machine idle too), and nothing of the page's is involved: the loop is the browser's own
 * scrolling and frames. Every step is therefore given 15 s; one that takes longer is a stalled browser, not a page that
 * jumped: it is said in the run's output and the whole sequence starts again on a fresh page, twice at most. A jump
 * still fails the test. A browser that stalls every time measured nothing: it ends the test with that sentence, as a
 * `rig:` — not a timeout, and not a fail (the operator's three states, his brief of 17.10.2026 §5). Every call into the
 * page goes through the guard, the first load of the homepage too: on 17.10.2026 that load took 11½ minutes, WebKit drew
 * nothing, and not even the test's own 5 minutes could end it (its trace). A load is given a minute — on a loaded
 * machine the server alone may take seconds — and a stalled one starts again on a fresh page like a stalled step.
 */
const STALL_MS = 15_000;
const LOAD_MS = 60_000;

class Stalled extends Error {}

function withinStall<T>(work: Promise<T>, what: string, ms: number = STALL_MS): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;

    return Promise.race([
        work,
        new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Stalled(`rig: WebKit drew no frame for ${ms / 1000} s (${what})`)), ms);
        }),
    ]).finally(() => clearTimeout(timer));
}

async function settle(page: Page): Promise<void> {
    await withinStall(page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 300))))), 'settling');
}

/** To the bottom in one fling, then back up a thumb's scroll at a time; every step that moved the content more than it scrolled. */
async function flingDownThenUp(page: Page, phase: string): Promise<string[]> {
    const jumps: string[] = [];

    await withinStall(page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)), `${phase}, the fling to the bottom`);
    await settle(page);

    for (let i = 0; i < 120; i++) {
        const step = await withinStall(page.evaluate(async (dy) => {
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
        }, STEP), `${phase}, step ${i + 1}`);

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

/** Portrait, turned, turned back: every step that moved the page under the finger. */
async function measure(page: Page): Promise<string[]> {
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

    return jumps;
}

test('EF-05 the phone homepage does not jump while scrolling back up after the phone was turned', async ({ page, context, browser }, info) => {
    test.skip(info.project.name !== 'mobile-390', 'one WebKit run is enough');
    // ≈ 41 s a run; room for the two fresh starts a stalled browser may need.
    test.setTimeout(300_000);

    await consentGiven(context, SHOP);

    let current = page;
    let jumps: string[] | null = null;
    const fresh: BrowserContext[] = [];

    try {
        for (let attempt = 1; jumps === null; attempt++) {
            try {
                await withinStall(open(current, '/'), 'loading the homepage', LOAD_MS);

                const contentVisibility = await withinStall(current.evaluate(() => CSS.supports('content-visibility', 'auto')), 'asking for content-visibility');

                test.skip(!contentVisibility, 'this WebKit build has no content-visibility: the placeholders never apply');

                jumps = await measure(current);
            } catch (error) {
                if (!(error instanceof Stalled) || attempt === 3) {
                    throw error;
                }

                // Said, never silent: in the run's output and on the test.
                console.log(`EF-05: ${error.message} — attempt ${attempt} of 3, starting again on a fresh page`);
                info.annotations.push({ type: 'webkit-stall', description: error.message });

                const next = await browser.newContext({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch, reducedMotion: 'reduce', baseURL: SHOP });
                fresh.push(next);
                await consentGiven(next, SHOP);
                current = await next.newPage();
            }
        }
    } finally {
        // A stalled browser's context may not answer its close: it is not waited for longer than a stall.
        await Promise.all(fresh.map((c) => withinStall(c.close(), 'closing').catch(() => undefined)));
    }

    // The loop ends with a measurement or throws; this only tells the compiler.
    if (jumps === null) {
        throw new Error('EF-05 ended without a measurement');
    }

    expect(jumps, `${jumps.length} steps moved the page under the finger:\n${jumps.join('\n')}`).toEqual([]);
});
