import { expect, test, type Page } from './fixtures';
import { waitForApp } from './bugs/faq-support';
import { SHOP } from './shop';

/*
 * The image rule (the operator's brief of 14.10.2026, §5; D-219):
 *
 *     No image inside the first viewport at either width carries loading="lazy",
 *     and no image outside it is preloaded.
 *
 * Found as finding 110: on the listing every tile's second photograph — the one that fades in under a mouse — sat
 * invisible on top of the first row and was fetched lazily there; on the product page the row of thumbnails beside
 * the photograph was lazy on the first screen. Both widths are the projects' own: 1440 × 900 and 390 × 844.
 *
 * „Inside“ is any of the picture in view, a single pixel of it: the phone hero's frame stands at the foot of a 844 px
 * screen, 6 px of it at rest and 23 while it rolls in, and it was lazy on the strength of „just below the first screen“
 * until this test. „Preloaded“ is a `<link rel="preload">` for it, or `fetchpriority="high"` on it.
 */

const SLIVER = 1;

interface Picture {
    file: string;
    inView: number;
    below: boolean;
    loading: string | null;
    priority: string | null;
}

interface Found {
    pictures: Picture[];
    preloads: string[];
}

/** Every picture a visitor could see, with how much of it the first screen shows, and every image preload. */
async function read(page: Page): Promise<Found> {
    await page.waitForLoadState('load');
    await page.evaluate(() => document.fonts.ready);
    // Pictures are read where they come to rest: the hero's wheels roll in after the load, the second a beat after the
    // first and standing off the screen until then. The first full run on release 13 — a quick one — read the Bronze
    // wheel during that beat and called its preload wrong. Every animation that ends is waited for, five seconds at most.
    await page.evaluate(() =>
        Promise.race([
            Promise.all(
                document
                    .getAnimations()
                    .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
                    .map((animation) => animation.finished.catch(() => undefined)),
            ),
            new Promise((resolve) => setTimeout(resolve, 5_000)),
        ]),
    );

    return page.evaluate(() => {
        const stem = (address: string): string => (address.split('/').pop() ?? '').replace(/-\d+\.[a-z0-9]+$/i, '');
        const pictures = [...document.querySelectorAll('img')].flatMap((img) => {
            const box = img.getBoundingClientRect();
            const style = getComputedStyle(img);

            if (box.width <= 1 || box.height <= 1 || style.display === 'none' || style.visibility === 'hidden') {
                return [];
            }

            const acrossTheScreen = box.left < window.innerWidth && box.right > 0;

            return [{
                file: stem(img.currentSrc || img.src),
                inView: acrossTheScreen ? Math.max(0, Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0)) : 0,
                below: box.top >= window.innerHeight,
                loading: img.getAttribute('loading'),
                priority: img.getAttribute('fetchpriority'),
            }];
        });
        const preloads = [...document.querySelectorAll('link[rel="preload"][as="image"]')].map((link) =>
            stem((link.getAttribute('imagesrcset') || link.getAttribute('href') || '').split(',')[0]!.trim().split(' ')[0]!));

        return { pictures, preloads };
    });
}

/** The rule, as the sentences a failing run prints. */
function broken(where: string, found: Found): string[] {
    const inside = found.pictures.filter((p) => p.inView >= SLIVER);
    const out: string[] = [];

    for (const picture of inside) {
        if (picture.loading === 'lazy') {
            out.push(`${where}: ${picture.file} is on the first screen (${Math.round(picture.inView)} px of it) and loads lazily`);
        }
    }

    for (const picture of found.pictures.filter((p) => p.below && p.priority === 'high')) {
        out.push(`${where}: ${picture.file} is below the first screen and asks for the first bytes (fetchpriority="high")`);
    }

    for (const preload of found.preloads) {
        if (!inside.some((p) => p.file === preload)) {
            out.push(`${where}: ${preload} is preloaded and is not a picture on the first screen`);
        }
    }

    return out;
}

test.use({ baseURL: SHOP });

/*
 * One test per page (the operator's brief „STOP SLEEPING“ §4, 16.10.2026): one walk of nine pages could run out of its
 * time on a loaded machine before it had found anything, and a failure now names its page. The pages that always show
 * a photograph on their first screen also prove the test tests something.
 */
// Which first screens always show a photograph: the listing's and the product page's on every device, the homepage's
// on the desktop only — on the phone its first screen is the vehicle panel (the run of 16.10.2026 found that out).
const PAGES: Array<[string, 'everywhere' | 'desktop' | false]> = [
    ['/', 'desktop'], ['/felgen', 'everywhere'], ['/felgen?zoll=18', false], ['a product page', 'everywhere'], ['/vergleich', false],
    ['/check', false], ['/felgen-suchen', false], ['/warenkorb', false], ['/kontakt', false],
];

for (const [name, shows] of PAGES) {
    test(`${name}: no picture on the first screen loads lazily, and none outside it is preloaded @bild-regel`, async ({ page }, testInfo) => {
        const pictured = shows === 'everywhere' || (shows === 'desktop' && testInfo.project.name === 'desktop-1440');
        let path = name;

        if (name === 'a product page') {
            // The product page of the listing's first wheel: found, not written down, so a reseeded shop is still tested.
            await page.goto('/felgen');
            const product = await page.locator('.tile a[href^="/felgen/"]').first().getAttribute('href');
            expect(product, 'the listing shows no wheel: nothing to test').not.toBeNull();
            path = product!;
        }

        await page.goto(path);
        const found = await read(page);
        const faults = broken(`${testInfo.project.name} ${path}`, found);

        if (pictured) {
            expect(found.pictures.filter((p) => p.inView >= SLIVER).length, `no picture stood on the first screen of ${path}`).toBeGreaterThan(0);
        }

        expect(faults, faults.join('\n')).toEqual([]);
    });
}

test('the listing loads its first screen at once and everything after it lazily @bild-regel', async ({ page }) => {
    await page.goto('/felgen');
    const { pictures } = await read(page);
    const tiles = await page.locator('.tile .tile__picture img').evaluateAll((imgs) => imgs.map((img) => ({
        loading: img.getAttribute('loading'),
        priority: img.getAttribute('fetchpriority'),
        below: img.getBoundingClientRect().top >= window.innerHeight,
    })));

    expect(pictures.length).toBeGreaterThan(0);
    // One picture asks for the first bytes: the first tile's, the page's largest paint.
    expect(tiles.filter((t) => t.priority === 'high')).toHaveLength(Math.min(1, tiles.length));
    expect(tiles[0]?.priority).toBe('high');

    // Further down than two screens nothing is fetched before the visitor comes near.
    const far = await page.locator('.tile .tile__picture img').evaluateAll((imgs) =>
        imgs.filter((img) => img.getBoundingClientRect().top >= window.innerHeight * 2).map((img) => img.getAttribute('loading')));

    expect(far.filter((loading) => loading !== 'lazy')).toEqual([]);
});

test('a tile fetches its second photograph when a mouse comes over it, not with the page — and never for a finger @bild-regel', async ({ page }, testInfo) => {
    await page.goto('/felgen');
    await read(page);
    // A tile listens for the mouse once the page is hydrated — on a remote shop that is after the load event (14.10.).
    await waitForApp(page);

    // The tiles of wheels photographed from two angles carry both in their data; none is in the document yet.
    await expect(page.locator('.tile__media--alt')).toHaveCount(0);

    if (testInfo.project.name !== 'desktop-1440') {
        // A finger does not hover: touched and scrolled, the page still holds no second photograph.
        await page.locator('.tile').first().dispatchEvent('pointerenter', { pointerType: 'touch' });
        await page.mouse.wheel(0, 600);
        await expect(page.locator('.tile__media--alt')).toHaveCount(0);

        return;
    }

    const tiles = page.locator('.tile');
    const count = await tiles.count();
    let appeared = false;

    for (let i = 0; i < Math.min(count, 8) && !appeared; i++) {
        await tiles.nth(i).hover();
        // Given the moment Vue takes to draw it; a tile without a second angle stays without.
        appeared = await tiles.nth(i).locator('.tile__media--alt img').waitFor({ timeout: 1_500 }).then(() => true, () => false);

        if (appeared) {
            await expect(tiles.nth(i).locator('.tile__media--alt img')).toHaveAttribute('loading', 'eager');
        }
    }

    expect(appeared, 'no wheel on the first screen of the e2e shop has a second photograph: nothing was tested').toBe(true);
});
