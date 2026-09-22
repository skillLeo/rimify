import { expect, test, type Page } from '@playwright/test';
import { consentGiven, open } from './support';

/*
 * The hero stage on a cold load (OVERHAUL.md §9): the photograph is the content from the first
 * byte and it is the largest contentful paint; under reduced motion no WebGL context is ever
 * created and the static poster is what the customer sees. The consent cookie is set so the sheet
 * — itself a large block of text — cannot be the LCP.
 */

test.beforeEach(async ({ context, baseURL }) => {
    await consentGiven(context, baseURL ?? 'http://127.0.0.1:8000');
});

/**
 * The last largest-contentful-paint entry: its resource URL (empty for text) and, when Chrome
 * still exposes it, its element. Chrome sometimes reports `element` as null for an image that is
 * plainly in the document, so the URL is what identifies an image candidate.
 */
async function lcpEntry(page: Page): Promise<{ url: string; tag: string | null; inHero: boolean | null } | null> {
    return page.evaluate(
        () =>
            new Promise((resolve) => {
                new PerformanceObserver((list) => {
                    const entry = list.getEntries().at(-1) as (PerformanceEntry & { url?: string; element?: Element | null }) | undefined;

                    if (entry === undefined) {
                        resolve(null);
                        return;
                    }

                    const element = entry.element ?? null;

                    resolve({
                        url: entry.url ?? '',
                        tag: element === null ? null : element.tagName.toLowerCase(),
                        inHero: element === null ? null : element.closest('#h2') !== null,
                    });
                }).observe({ type: 'largest-contentful-paint', buffered: true });
            }),
    );
}

test.describe('hero stage', () => {
    test('on a cold load the hero photograph is loaded first-class and the largest paint is the hero itself', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop-1440', 'the phone document is measured by the device lab');

        await open(page, '/');

        const poster = page.locator('#h2 img').first();
        await expect(poster).toBeVisible();
        await expect(poster).toHaveAttribute('loading', 'eager');
        await expect(poster).toHaveAttribute('fetchpriority', 'high');
        expect(await poster.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

        const lcp = await lcpEntry(page);
        expect(lcp, 'an LCP entry').not.toBeNull();

        // The wheel rolls in from past the viewport's edge, fading in, so the browser may rank the
        // headline as the largest paint rather than the photograph. Either way it is the hero: the
        // hero's own picture (by its file) or text in #h2, never something further down the page.
        const src = await poster.evaluate((img: HTMLImageElement) => img.currentSrc);

        if (lcp?.url !== '') {
            expect(lcp?.url).toBe(src);
        } else {
            expect(lcp?.inHero, `the largest paint is in the hero (${lcp?.tag})`).toBe(true);
        }
    });

    test('the wheel rolls in once, from past the right edge, and comes to rest without the page scrolling sideways', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop-1440', 'the phone frame clips the roll; measured by the device lab');

        await page.addInitScript(() => {
            const w = window as Window & { __rolls?: number }
            w.__rolls = 0
            document.addEventListener('animationstart', (e) => {
                if (e.animationName.startsWith('hero-travel')) {
                    w.__rolls = (w.__rolls ?? 0) + 1
                }
            }, true)
        });
        await open(page, '/');
        await page.waitForTimeout(2000);

        const result = await page.evaluate(() => ({
            rolls: (window as Window & { __rolls?: number }).__rolls,
            sideScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            // At rest the turn is none and the roll box sits where the layout put it.
            turn: getComputedStyle(document.querySelector('#h2 .hero__spin') as Element).transform,
        }));

        // Once: the server's page is hydrated, not thrown away and drawn again (app.ts, createSSRApp).
        expect(result.rolls).toBe(1);
        expect(result.sideScroll).toBe(false);
        expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(result.turn);
    });

    test('under reduced motion there is no WebGL, only the static poster', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await open(page, '/');

        // Give any deferred initialisation — idle callbacks, the observer — time to run.
        await page.waitForTimeout(1500);
        await page.mouse.move(700, 400);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await page.waitForTimeout(800);

        await expect(page.locator('canvas')).toHaveCount(0);

        await page.evaluate(() => window.scrollTo(0, 0));
        await expect(page.locator('#h2 img').first()).toBeVisible();
    });
});
