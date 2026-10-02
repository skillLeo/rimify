import { expect, test } from '../fixtures';
import { consentGiven } from '../support';
import { SHOP_FEEDBACK_BASE, SHOTS, feedbackDialog, guardSends, magentaPixels, openShop, signIn } from './shop-feedback-support';

test.use({ baseURL: SHOP_FEEDBACK_BASE });

/*
 * SHOP-FEEDBACK-05 (S2) — the screenshot a shop page sends has no photographs in it (docs/qa/BUGS.md).
 *
 * Every photograph of the shop is Picture.vue: `<picture>` with `<source type="image/avif|webp" srcset="/images/…">`
 * before the `<img>`. html-to-image 1.11.13 (useFeedback.ts → toCanvas) inlines only `<img src>` (embedImageNode: the
 * fetched file as a data URL, `srcset` emptied) and CSS backgrounds; a `<source>` is cloned as it is, its `srcset` still a
 * path. The clone is drawn as an SVG image, which loads nothing from outside and resolves no path against its data: URL;
 * inside `<picture>` the `<source>` wins over the img's data URL, so every photograph comes out broken — the blurred
 * placeholder behind a JPEG, nothing at all behind a transparent cut-out (the wheels). A point about a photo, or about a
 * product page, arrives with a picture of the page without its products.
 *
 * The test puts one photograph on /kontakt with exactly Picture.vue's markup (a `<source>` and an `<img>` of the same
 * magenta file, served in the browser), presses R and counts the magenta in the screenshot the dialog shows.
 *
 * Expected: at least half the photograph's area is magenta in the screenshot. Writes nothing: the dialog is closed with
 * Esc; `guardSends` would stop a send in the browser.
 */

test('SHOP-FEEDBACK-05 the screenshot keeps the page’s photographs', async ({ page }, info) => {
    // Drawing the page into a picture takes a few seconds on a slow machine.
    test.setTimeout(90_000);

    await consentGiven(page.context(), SHOP_FEEDBACK_BASE);
    await signIn(page);
    await guardSends(page);

    let png: Buffer | null = null;

    await page.route(
        (url) => url.pathname.startsWith('/qa-shop-feedback/'),
        async (route) => {
            const body = png;

            if (body === null) {
                await route.abort();

                return;
            }

            await route.fulfill({ status: 200, contentType: 'image/png', body, headers: { 'Cache-Control': 'no-store' } });
        },
    );

    await openShop(page, '/kontakt');

    const magentaFile = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;

        const context = canvas.getContext('2d');

        if (context !== null) {
            context.fillStyle = '#ff00ff';
            context.fillRect(0, 0, 600, 400);
        }

        return canvas.toDataURL('image/png');
    });

    png = Buffer.from(magentaFile.split(',')[1] ?? '', 'base64');

    // Picture.vue's markup: a <source> first, then the <img> with its own srcset and src.
    const shown = await page.evaluate(async () => {
        const picture = document.createElement('picture');
        picture.id = 'qa-shop-feedback-05';
        picture.style.cssText = 'display:block;width:300px;height:200px;margin:24px auto;overflow:hidden;';

        const source = document.createElement('source');
        source.type = 'image/png';
        source.srcset = '/qa-shop-feedback/magenta-600.png 600w';
        source.sizes = '300px';

        const img = document.createElement('img');
        img.alt = '';
        img.width = 300;
        img.height = 200;
        img.sizes = '300px';
        img.srcset = '/qa-shop-feedback/magenta-600.png 600w';
        img.src = '/qa-shop-feedback/magenta-600.png';
        img.style.cssText = 'display:block;width:100%;height:100%;object-fit:cover;';

        picture.append(source, img);
        document.querySelector('main#inhalt')?.prepend(picture);
        await img.decode().catch(() => undefined);
        window.scrollTo(0, 0);
        await new Promise((resolve) => setTimeout(resolve, 300));

        const r = picture.getBoundingClientRect();
        const width = Math.max(0, Math.min(window.innerWidth, r.right) - Math.max(0, r.left));
        const height = Math.max(0, Math.min(window.innerHeight, r.bottom) - Math.max(0, r.top));

        return { area: Math.round(width * height), painted: img.complete && img.naturalWidth > 0 };
    });

    expect(shown.painted, 'precondition: the test photograph did not load on the page').toBe(true);
    expect(shown.area, 'precondition: the test photograph is not on screen').toBeGreaterThan(20_000);

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('r');

    const dialog = feedbackDialog(page);

    await expect(dialog, 'R did not open the feedback dialog').toBeVisible({ timeout: 30_000 });

    const shot = dialog.locator('img.fb-shot');
    const src = (await shot.count()) > 0 ? await shot.getAttribute('src') : null;

    await page.screenshot({ path: `${SHOTS}/shop-feedback-05-dialog-${info.project.name}.png` });

    expect(src, 'no screenshot was taken at all („Ein Bildschirmfoto ließ sich hier nicht machen.“)').not.toBeNull();

    const magenta = await magentaPixels(page, src ?? '');

    await page.keyboard.press('Escape');

    expect(
        magenta,
        `a ${shown.area} px² photograph on screen; the screenshot holds ${magenta} of its magenta pixels — the <source> of the <picture> was not inlined`,
    ).toBeGreaterThan(shown.area * 0.5);
});
