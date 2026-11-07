import { expect, test, type Locator, type Page } from './fixtures';
import { consentGiven, expectNoHorizontalOverflow, open } from './support';
import { SHOP } from './shop';

// A storefront spec: the shop with wheels in it (e2e/shop.ts).
test.use({ baseURL: SHOP });

/*
 * The listing, and the three things the client's Storefront 2.0 doc still marks open (the operator's brief of 07.11.2026, §7).
 *
 * #24: „When completely scrolled down, the filtering section can't be fully scrolled up.“ Every step here is a real wheel at a
 * real mouse position, because that is the one thing the old test could not see: it set `scrollTop` by script, at page position
 * 300, so `overscroll-behavior: contain` on a column already at its start could never show.
 * #31: „Still not done.“ The rim dropdown of the desktop's menu, in the phone's menu too — not the filter sheet on the listing.
 * #32: „It's still somewhat bland.“ The home page's alternation of the pale blue band and white, on this page.
 */

const BAND = 'rgb(235, 240, 247)';
const WHITE = 'rgb(255, 255, 255)';

const isPhone = (name: string): boolean => name.includes('390');

test.beforeEach(async ({ context }) => {
    await consentGiven(context, SHOP);
});

type Read = { pageY: number; pageMax: number; top: number; scrollTop: number; scrollMax: number; headerBottom: number };

const readColumn = (page: Page): Promise<Read> =>
    page.evaluate(() => {
        const column = document.querySelector('.plp__side') as HTMLElement;
        const header = document.querySelector('header.site-header') as HTMLElement;

        return {
            pageY: Math.round(window.scrollY),
            pageMax: Math.round(document.documentElement.scrollHeight - window.innerHeight),
            top: Math.round(column.getBoundingClientRect().top),
            scrollTop: Math.round(column.scrollTop),
            scrollMax: column.scrollHeight - column.clientHeight,
            headerBottom: Math.round(header.getBoundingClientRect().bottom),
        };
    });

/** Whole notches of a mouse wheel at the mouse's place, one after another, as a hand turns it. */
async function wheel(page: Page, notches: number, deltaY: number): Promise<void> {
    for (let i = 0; i < notches; i++) {
        await page.mouse.wheel(0, deltaY);
        await page.waitForTimeout(40);
    }

    await page.waitForTimeout(250);
}

/** The mouse over the part of the column that is on screen. */
async function overColumn(page: Page, column: Locator): Promise<void> {
    const box = await column.boundingBox();
    const visibleTop = Math.max(box?.y ?? 0, 120);
    await page.mouse.move((box?.x ?? 0) + (box?.width ?? 0) / 2, visibleTop + 60);
}

test('#24: from the page\'s very end the wheel over the filter column brings its first filter back', { tag: '@kunde-24' }, async ({ page }, info) => {
    test.skip(isPhone(info.project.name), 'below 1200 px the filters live in the sheet');

    await open(page, '/felgen');
    const column = page.locator('.plp__side');

    // Over the results, down to the end of the page, as a person gets there.
    await page.mouse.move(1000, 450);
    await expect
        .poll(async () => {
            await wheel(page, 10, 400);
            const now = await readColumn(page);

            return now.pageY >= now.pageMax;
        }, { timeout: 30_000 })
        .toBe(true);

    // The state the client describes, or this test proves nothing: the column's start lies above the window, at its own 0.
    const atEnd = await readColumn(page);
    expect(atEnd.top, 'the column is not pushed up at the end of the page').toBeLessThan(atEnd.headerBottom);
    expect(atEnd.scrollTop).toBe(0);

    await overColumn(page, column);
    await wheel(page, 20, -100);

    const back = await readColumn(page);
    expect(back.pageY, 'the wheel over the column moved nothing').toBeLessThan(atEnd.pageY);
    expect(back.top, 'the column\'s start is still out of reach').toBeGreaterThanOrEqual(back.headerBottom);

    const first = await column.locator('label, button').first().boundingBox();
    expect(first?.y ?? 0, 'the first filter is not on screen').toBeGreaterThanOrEqual(back.headerBottom);
    expect((first?.y ?? 0) + (first?.height ?? 0)).toBeLessThanOrEqual(900);
});

test('#24: where the column is longer than the window the wheel reaches its last filter, and back to its first', { tag: '@kunde-24' }, async ({ page }, info) => {
    test.skip(isPhone(info.project.name), 'below 1200 px the filters live in the sheet');

    // Low enough that the column has to scroll with the shop's few wheels.
    await page.setViewportSize({ width: 1440, height: 560 });
    await open(page, '/felgen');
    const column = page.locator('.plp__side');

    // Pinned under the header first: the column's own scrolling is what this is about.
    await page.mouse.move(1000, 300);
    await wheel(page, 6, 100);
    const pinned = await readColumn(page);
    expect(pinned.scrollMax, 'the column does not have to scroll at this height').toBeGreaterThan(0);

    await overColumn(page, column);
    await wheel(page, Math.ceil(pinned.scrollMax / 100) + 2, 100);
    const down = await readColumn(page);
    expect(down.scrollTop, 'the wheel did not reach the column\'s end').toBeGreaterThanOrEqual(down.scrollMax - 1);

    const box = await column.boundingBox();
    const last = await column.locator('label, button').last().boundingBox();
    expect((last?.y ?? 0) + (last?.height ?? 0), 'the last filter stands under the column\'s edge').toBeLessThanOrEqual((box?.y ?? 0) + (box?.height ?? 0) + 1);

    await overColumn(page, column);
    await wheel(page, Math.ceil(pinned.scrollMax / 100) + 2, -100);
    expect((await readColumn(page)).scrollTop).toBe(0);
});

test('#31: the phone\'s menu opens „Felgen“ on the groups of the desktop\'s dropdown, and a group\'s entry leads to its listing', { tag: '@kunde-31' }, async ({ page, browser }, info) => {
    test.skip(!isPhone(info.project.name), 'the phone\'s menu; the desktop has its dropdown');

    // What the desktop's dropdown holds, read from it, so the two can never be compared with a list typed here.
    const wide = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await consentGiven(wide, SHOP);
    const desktop = await wide.newPage();
    await open(desktop, `${SHOP}/`);
    await desktop.locator('.nav__trigger').click();
    const panel = desktop.locator('.mega');
    await expect(panel).toBeVisible();
    const labels = await panel.locator('.label').allTextContents();
    const entries = (await panel.locator('.mega__link').evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? '')));
    await wide.close();

    expect(labels.length, 'the desktop\'s dropdown has no groups in this shop').toBeGreaterThan(1);
    expect(entries.length).toBeGreaterThan(1);

    await open(page, '/');
    await page.getByRole('button', { name: /^Menü/ }).click();

    const menu = page.locator('.mainmenu');
    await expect(menu).toBeVisible();
    const felgen = menu.getByRole('menuitem', { name: 'Felgen', exact: true });
    await expect(felgen).toHaveAttribute('aria-expanded', 'false');
    await expect(menu.getByText(labels[0] ?? '', { exact: true })).toHaveCount(0);

    await felgen.click();

    // The press opens it in place and leaves the page where it was: it is no link to the listing any more.
    await expect(felgen).toHaveAttribute('aria-expanded', 'true');
    await expect(page).toHaveURL(`${SHOP}/`);

    for (const label of labels) {
        await expect(menu.getByText(label, { exact: true })).toBeVisible();
    }

    expect(await menu.locator('.mainmenu__sub a').evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''))).toEqual(expect.arrayContaining(entries));
    await expect(menu.getByRole('menuitem', { name: /Alle Felgen ansehen/ })).toHaveAttribute('href', '/felgen');

    // Everything in it fits the window and is reachable: its own scroll, never the page sideways.
    const box = await menu.boundingBox();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(844);
    await expectNoHorizontalOverflow(page);

    const last = menu.locator('.mainmenu__sub a').last();
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport();

    // A brand, as the desktop has it, leads to that brand's listing.
    const brand = menu.locator('.mainmenu__sub a[href*="marke"]').first();
    const href = (await brand.getAttribute('href')) ?? '';
    expect(href, 'no brand in the menu').not.toBe('');
    await brand.click();
    await expect(page).toHaveURL(new RegExp(`${href.replace(/[?]/g, '\\?')}$`));
    await expect(menu).toHaveCount(0);
});

test('the interaction review of 07.11.2026: closing the phone\'s menu leaves the page where it is, Back closes it, and Esc closes the filter sheet', async ({ page }, info) => {
    test.skip(!isPhone(info.project.name), 'the phone\'s menu and sheet');

    await open(page, '/felgen');
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(200);
    const before = await page.evaluate(() => window.scrollY);
    expect(before, 'the page is too short to tell').toBeGreaterThan(400);

    const menu = page.getByRole('button', { name: /^Menü/ });
    await menu.click();
    await expect(page.locator('.mainmenu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.mainmenu')).toHaveCount(0);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.scrollY), 'closing the menu moved the page').toBe(before);

    // Back with the menu open: it goes with the page it was opened on.
    await page.getByRole('link', { name: /Details ansehen/ }).first().click();
    await page.waitForURL(/\/felgen\/.+/);
    await menu.click();
    await expect(page.locator('.mainmenu')).toBeVisible();
    await page.goBack();
    await page.waitForURL(/\/felgen$/);
    await expect(page.locator('.mainmenu')).toHaveCount(0);

    await page.locator('.plp__bar-btn').click();
    await expect(page.locator('.plp__sheet')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.plp__sheet')).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('the interaction review of 07.11.2026: a filter that shortens the list never leaves only the footer on screen', async ({ page }, info) => {
    await open(page, '/felgen');
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(200);

    const narrow = isPhone(info.project.name)
        ? page.locator('.plp__chip', { hasText: 'BORBET' })
        : page.locator('.plp__side label', { hasText: 'BORBET' });
    await narrow.first().click();
    await expect(page).toHaveURL(/marke/);

    await expect(page.locator('.plp__results .tile').first()).toBeInViewport();
});

test('the interaction review of 07.11.2026: a long answer on a tile wraps inside it at every phone width', async ({ page }, info) => {
    test.skip(!isPhone(info.project.name), 'phone widths');

    for (const width of [320, 360, 375, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await open(page, '/felgen?fahrzeug=14');
        const overrun = await page.locator('main .tile').evaluateAll((tiles) => tiles.map((tile) => {
            const badge = tile.querySelector('.verdict');

            return badge === null ? 0 : badge.getBoundingClientRect().right - tile.getBoundingClientRect().right;
        }));

        expect(overrun.length, 'no tile on this car').toBeGreaterThan(0);
        expect(Math.max(...overrun), `a badge runs past its tile at ${width}`).toBeLessThanOrEqual(0);
    }
});

test('the interaction review of 07.11.2026: the home page does not scroll sideways on a narrow window', async ({ page }) => {
    for (const width of [320, 360]) {
        await page.setViewportSize({ width, height: 800 });
        await open(page, '/');
        await expectNoHorizontalOverflow(page);
    }
});

test('#32: the listing\'s head stands on the pale blue band, the results on white, and a band closes the page above the footer', { tag: '@kunde-32' }, async ({ page }) => {
    await open(page, '/felgen');

    const background = (locator: Locator): Promise<string> => locator.evaluate((el) => getComputedStyle(el).backgroundColor);
    const head = page.locator('.plp__top');
    const results = page.locator('.plp__body');
    const closing = page.locator('.plp__closing');

    await expect(head).toBeVisible();
    expect(await background(head)).toBe(BAND);
    await expect(head.locator('h1')).toBeVisible();
    expect(await background(results)).not.toBe(BAND);
    expect(await background(closing)).toBe(BAND);

    // Edge to edge, as the home page's bands: a band that stops at the text column is a box. The page's width, not the
    // window's: a classic scrollbar takes its 15 px from the window and no band can stand under it (D-428).
    // At most a scrollbar narrower than the window, at every width the suite runs.
    const width = await page.evaluate(() => document.documentElement.clientWidth);
    expect(width).toBeGreaterThan((page.viewportSize()?.width ?? 0) - 20);
    for (const band of [head, closing]) {
        const box = await band.boundingBox();
        expect(Math.round(box?.x ?? -1)).toBe(0);
        expect(Math.round(box?.width ?? 0)).toBe(width);
    }

    // The notice without a car reads as the home page's selector does on its band: white on blue, its button the page's accent.
    const notice = head.locator('.plp__notice');
    await expect(notice).toBeVisible();
    expect(await background(notice)).toBe(WHITE);
    await expect(notice.locator('.btn--primary')).toBeVisible();

    // The way on, in the closing band, real and said in full.
    await expect(closing.getByRole('link', { name: 'Zum RIMIFY-Check' })).toHaveAttribute('href', '/rimify-check');
    await expectNoHorizontalOverflow(page);
});

test('#32: the sizes stand as tiles on the band, a press filters and shows it, and sizes are no chips any more', { tag: '@kunde-32' }, async ({ page }) => {
    await open(page, '/felgen');

    const tiles = page.locator('.plp__top .plp__size');
    await expect(tiles.first()).toBeVisible();
    expect(await tiles.count()).toBeGreaterThan(1);
    await expect(tiles.first()).toHaveAttribute('aria-pressed', 'false');

    await tiles.first().click();

    await expect(page).toHaveURL(/zoll/);
    await expect(page.locator('.plp__top .plp__size[aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator('.plp__size[aria-pressed="true"] svg')).toBeVisible();
    await expect(page.locator('.plp__chip', { hasText: 'Zoll' })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
});

test('#32: with a car the notice goes, the band stays, and the answers stand on white below it', { tag: '@kunde-32' }, async ({ page }) => {
    // With a car the notice goes; the band stays, and a tile's answer stands where it stood.
    // The seed's BMW 330i Limousine (e2e/bugs/check-support.ts).
    await open(page, '/felgen?fahrzeug=14');
    const head = page.locator('.plp__top');
    await expect(head).toBeVisible();
    await expect(head.locator('.plp__notice')).toHaveCount(0);
    await expect(page.locator('.plp__body .tile').first()).toBeVisible();
    // A question to us is what is left to ask once the list is the car's own.
    const closing = page.locator('.plp__closing');
    await expect(closing).toContainText('Frage zu einer dieser Felgen?');
    await expect(closing.getByRole('link', { name: 'Zum RIMIFY-Check' })).toHaveCount(0);
    await expect(closing.getByRole('link', { name: 'Schreib uns' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
});
