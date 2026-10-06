import { expect, test, type Browser, type BrowserContextOptions } from './fixtures';
import { signIn } from './bugs/faq-support';
import { EMPTY_SHOP, SHOP } from './shop';

/*
 * The layout-shift budget across a page's load: CLS ≤ 0,02 (the operator's brief of 05.10.2026, §4) — at every width
 * a fault showed at, not only on the homepage, and not only at the project's own width.
 *
 * The web font is held back 1,5 s, so the swap happens well after the first paint: the case the fallback faces exist
 * for (fonts-fallback.css, per weight and width). On 05.10.2026 the phone homepage's headline lost a line to the swap
 * (0,033) — its box was measured in `ch`, the „0" of whichever font is drawing. Every page is also loaded under reduced
 * motion, where a global rule once started a transition on every element and the hero moved 54 px at 1024 (0,054).
 *
 * The shifts are read before anything else touches the page: a full-page screenshot resizes the viewport, and the
 * shifts that causes are the test's, not the page's (FAQ-06).
 */

const BUDGET = 0.02;
const FONT_DELAY_MS = 1_500;

/** Each project's widths: the phone at its own, the desktop down through the tablet widths the faults showed at. */
const WIDTHS: Record<string, number[]> = { 'mobile-390': [390], 'desktop-1440': [1440, 1280, 1024, 768] };

const STOREFRONT = [
    '/',
    '/felgen',
    '/warenkorb',
    '/faq',
    '/felgenrechner',
    '/kontakt',
    '/rechtliches/impressum',
];
const ADMIN_PAGES = ['/admin', '/admin/faq'];

type Motion = 'reduce' | 'no-preference';

interface Measured {
    cls: number;
    shifts: string[];
}

/** One fresh load of `url` at `width`, the font held back: the layout shifts across it, each with what moved. */
async function measure(
    browser: Browser,
    options: BrowserContextOptions,
    width: number,
    url: string,
    motion: Motion,
): Promise<Measured> {
    const context = await browser.newContext({
        ...options,
        viewport: { width, height: width < 768 ? 844 : 900 },
        reducedMotion: motion,
    });
    const page = await context.newPage();

    try {
        await page.route('**/fonts/*.woff2', async (route) => {
            await new Promise((resolve) => setTimeout(resolve, FONT_DELAY_MS));
            await route.continue().catch(() => undefined);
        });
        await page.addInitScript(() => {
            const w = window as unknown as { __shifts: Array<{ value: number; what: string }> };

            w.__shifts = [];
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries() as Array<
                    PerformanceEntry & {
                        value: number;
                        hadRecentInput: boolean;
                        sources?: Array<{ node?: Node | null }>;
                    }
                >) {
                    if (!entry.hadRecentInput) {
                        const what = (entry.sources ?? [])
                            .map((s) =>
                                s.node instanceof Element
                                    ? `${s.node.tagName.toLowerCase()}.${String(s.node.className).split(' ')[0]}`
                                    : 'text',
                            )
                            .join(', ');

                        w.__shifts.push({ value: entry.value, what });
                    }
                }
            }).observe({ type: 'layout-shift', buffered: true });
        });
        await page.goto(url, { waitUntil: 'load', timeout: 45_000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(600);

        const shifts = await page.evaluate(
            () => (window as unknown as { __shifts: Array<{ value: number; what: string }> }).__shifts,
        );

        return {
            cls: shifts.reduce((sum, s) => sum + s.value, 0),
            shifts: shifts.map((s) => `+${s.value.toFixed(4)} ${s.what}`),
        };
    } finally {
        await context.close();
    }
}

test.beforeEach(({ browserName }) => {
    test.skip(browserName !== 'chromium', 'layout-shift entries are Chromium’s');
});

test('the storefront stays within 0,02 while the font arrives late, under reduced motion', async ({
    browser,
}) => {
    test.setTimeout(240_000);
    const options = { ...test.info().project.use, baseURL: SHOP } as BrowserContextOptions;
    const over: string[] = [];

    for (const width of WIDTHS[test.info().project.name] ?? []) {
        for (const path of STOREFRONT) {
            const { cls, shifts } = await measure(browser, options, width, SHOP + path, 'reduce');

            if (cls > BUDGET) {
                over.push(`${width} px ${path}: ${cls.toFixed(4)} — ${shifts.join('; ')}`);
            }
        }
    }

    expect(over, over.join('\n')).toEqual([]);
});

/*
 * D-177: with the stylesheets in the document (InlineStyles), nothing else held a desktop page's first paint back, and a
 * footer painted half-built at the foot of a short page grew upwards as its last rows were parsed — /warenkorb 0,0238
 * and /rechtliches/impressum 0,0218 at 1440, one load in about thirty. The page now paints once the footer's last
 * element is parsed: that element must be there, last in the footer, and the head must wait for it.
 */
test('a desktop page waits for its footer’s last element before it paints', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'the phone paints at once: its first paint is its LCP');
    await page.goto(`${SHOP}/rechtliches/impressum`);

    await expect(page.locator('head link[rel="expect"][blocking="render"]')).toHaveAttribute('href', '#seitenende');
    await expect(page.locator('footer.footer > #seitenende:last-child'), 'the element the first paint waits for is not the footer’s last').toHaveCount(1);
});

test('the homepage stays within 0,02 with motion, in the shop and with the catalogue empty', async ({
    browser,
}) => {
    test.setTimeout(180_000);
    const options = test.info().project.use as BrowserContextOptions;
    const over: string[] = [];

    for (const width of WIDTHS[test.info().project.name] ?? []) {
        for (const base of [SHOP, EMPTY_SHOP]) {
            for (const motion of ['no-preference', 'reduce'] as const) {
                const { cls, shifts } = await measure(browser, options, width, `${base}/`, motion);

                if (cls > BUDGET) {
                    over.push(`${width} px ${base}/ (${motion}): ${cls.toFixed(4)} — ${shifts.join('; ')}`);
                }
            }
        }
    }

    expect(over, over.join('\n')).toEqual([]);
});

test('the admin’s Übersicht and FAQ stay within 0,02 while the font arrives late', async ({
    browser,
    page,
}) => {
    test.setTimeout(180_000);
    await signIn(page);
    const options = {
        ...test.info().project.use,
        storageState: await page.context().storageState(),
    } as BrowserContextOptions;
    const admin = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8000';
    const over: string[] = [];

    for (const width of WIDTHS[test.info().project.name] ?? []) {
        for (const path of ADMIN_PAGES) {
            const { cls, shifts } = await measure(browser, options, width, admin + path, 'reduce');

            if (cls > BUDGET) {
                over.push(`${width} px ${path}: ${cls.toFixed(4)} — ${shifts.join('; ')}`);
            }
        }
    }

    expect(over, over.join('\n')).toEqual([]);
});
