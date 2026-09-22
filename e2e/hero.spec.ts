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

/** The element behind the last largest-contentful-paint entry, described. */
async function lcpElement(page: Page): Promise<{ tag: string; inHero: boolean; src: string } | null> {
    return page.evaluate(
        () =>
            new Promise((resolve) => {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries() as (PerformanceEntry & { element?: Element | null })[];
                    const element = entries.at(-1)?.element ?? null;

                    resolve(
                        element === null
                            ? null
                            : {
                                  tag: element.tagName.toLowerCase(),
                                  inHero: element.closest('#h2') !== null,
                                  src: (element as HTMLImageElement).currentSrc ?? '',
                              },
                    );
                }).observe({ type: 'largest-contentful-paint', buffered: true });
            }),
    );
}

test.describe('hero stage', () => {
    test('on a cold load the hero photograph is painted and is the LCP element', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop-1440', 'the phone document is measured by the device lab');

        await open(page, '/');

        const poster = page.locator('#h2 img').first();
        await expect(poster).toBeVisible();
        await expect(poster).toHaveAttribute('loading', 'eager');
        await expect(poster).toHaveAttribute('fetchpriority', 'high');
        expect(await poster.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

        const lcp = await lcpElement(page);
        expect(lcp, 'an LCP entry with an element').not.toBeNull();
        expect(lcp?.tag).toBe('img');
        expect(lcp?.inHero).toBe(true);
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
