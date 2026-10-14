import { expect, test, type Browser, type BrowserContextOptions } from './fixtures';
import { devices } from '@playwright/test';
import { SHOP } from './shop';

/*
 * No page is wider than its window, from 320 to 1920 px and in the short windows of a laptop (the operator's brief of
 * 14.10.2026, §5). Found by the sweep that day: between 1024 and 1279 px the header held the wordmark, four links, the
 * search, the car and the basket in 21 px more than the window had — „Warenkorb“ was cut off at the right edge and the
 * page scrolled sideways (D-220). A phone width is served the phone's document, as the server decides it from the
 * User-Agent; every other width the desktop's.
 */

const SIZES: Array<[number, number]> = [[320, 640], [390, 844], [480, 844], [768, 1024], [1024, 768], [1024, 900], [1180, 820], [1280, 620], [1440, 720], [1920, 1080]];

async function overflow(browser: Browser, width: number, height: number, paths: string[]): Promise<string[]> {
    const use = (width <= 480 ? devices['Pixel 7'] : devices['Desktop Chrome']) as BrowserContextOptions;
    const context = await browser.newContext({ ...use, viewport: { width, height }, baseURL: SHOP });
    const page = await context.newPage();
    const out: string[] = [];

    try {
        for (const path of paths) {
            await page.goto(path, { waitUntil: 'load' });
            await page.evaluate(() => document.fonts.ready);

            const found = await page.evaluate(() => {
                const over = document.documentElement.scrollWidth - window.innerWidth;
                const culprit = [...document.body.querySelectorAll('header *, main *, footer *')].find((el) => {
                    const box = el.getBoundingClientRect();

                    return box.width > 0 && box.right > window.innerWidth + 1 && getComputedStyle(el).position !== 'fixed';
                });

                return { over, culprit: culprit ? `${culprit.tagName.toLowerCase()}.${String(culprit.className).split(' ')[0]}` : null };
            });

            if (found.over > 1) {
                out.push(`${width} × ${height} ${path}: ${found.over} px wider than the window (${found.culprit ?? 'no single element'})`);
            }
        }
    } finally {
        await context.close();
    }

    return out;
}

test('no page is wider than its window, from 320 to 1920 px and in short windows @breiten', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'it opens its own windows at every size; once is enough');
    test.setTimeout(240_000);

    // A product the shop holds, found in its own listing.
    const probe = await browser.newPage({ baseURL: SHOP });
    await probe.goto('/felgen');
    const product = await probe.locator('.tile a[href^="/felgen/"]').first().getAttribute('href');
    await probe.close();
    expect(product, 'the listing shows no wheel: nothing to test').not.toBeNull();

    const paths = ['/', '/felgen', product!, '/felgen-suchen', '/rimify-check', '/warenkorb', '/kontakt', '/faq'];
    const faults: string[] = [];

    for (const [width, height] of SIZES) {
        faults.push(...(await overflow(browser, width, height, paths)));
    }

    expect(faults, faults.join('\n')).toEqual([]);
});
