import sharp from 'sharp';
import { expect, test } from '../fixtures';
import { SHOTS, brandMenu, brandRow, createBrand, dropBrands, settled, signIn, waitForApp } from './k2-support';

/*
 * K2-02 (S2) — Katalog › Marken takes a logo that paints a solid block on the homepage's brand wall
 * (docs/qa/BUGS.md).
 *
 * The brand wall draws a logo as a CSS mask filled with the shop's ink (BrandWall.vue `mask-image`), so only
 * the logo's transparent pixels leave the ground showing. BrandLogoStore says „a raster without
 * transparency is refused, because it would paint a solid block" — but BrandLogos::pngSize() only reads the
 * PNG's colour type: an RGBA file whose every pixel is opaque (a logo exported „with alpha" on a white
 * ground, a screenshot) passes, is stored, and the page says „Logo gespeichert. Die Markenwand zeigt es ab
 * jetzt." The row's preview is a plain <img>, so the admin sees a normal logo; the wall shows an ink
 * rectangle. The same holds for a WebP with the alpha flag set, and for an SVG with a background rectangle.
 *
 * Expected: the opaque file refused in its row with BrandLogoStore::OPAQUE, as an RGB PNG already is.
 *
 * Writes: one brand of its own („QA K2-02 …", not on the brand wall). If the logo is stored, it is taken off
 * again („Logo entfernen" deletes the file), then the brand is removed (soft-deleted, R-04) — in the afterEach,
 * by request, never through the page (e2e/teardown.ts, D-263).
 */

const NAME = 'QA K2-02 Weisser Grund';

test.afterEach(async ({ context }) => {
    await dropBrands(context, [NAME]);
});

/** A 400 × 100 logo on a white ground, saved as RGBA — every pixel opaque. */
async function opaqueRgbaPng(): Promise<Buffer> {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100"><rect width="400" height="100" fill="#ffffff"/><path d="M20 20h60v60H20zM100 20h60v60h-60zM180 20h200v60H180z" fill="#111111"/></svg>';

    return sharp(Buffer.from(svg)).ensureAlpha(1).png().toBuffer();
}

test('K2-02 a PNG whose every pixel is opaque is refused like an RGB one — on the brand wall it would be a solid block', async ({ page }, info) => {
    const png = await opaqueRgbaPng();

    // IHDR's colour type (byte 25): 6 is RGBA. Without it this test would prove nothing.
    expect(png[25], 'the test file is not an RGBA PNG').toBe(6);

    await signIn(page);

    // A run that stopped half-way left its brand: it goes first, by request, so this run starts clean.
    await dropBrands(page.context(), [NAME]);

    await page.goto('/admin/marken', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    await createBrand(page, NAME);

    const row = brandRow(page, NAME);

    await Promise.all([
        page.waitForResponse((r) => r.request().method() === 'POST' && /^\/admin\/marken\/\d+\/logo$/.test(new URL(r.url()).pathname)),
        row.locator('input[type="file"]').setInputFiles({ name: 'logo-weisser-grund.png', mimeType: 'image/png', buffer: png }),
    ]);
    // The answer is read once the page has finished the upload's round trip and put the keyboard back on
    // the row's „⋯" (K2-37) — not at a fixed time after the POST, which a loaded machine outruns (as K2-01's
    // did, 30.09.2026).
    await settled(page, brandMenu(page, NAME));

    const alert = row.getByRole('alert');
    const refusal = (await alert.count()) > 0 ? ((await alert.textContent()) ?? '').trim() : '';
    const stored = (await row.getByRole('img', { name: `Logo ${NAME}` }).count()) > 0;

    await row.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${SHOTS}/k2-02-opaque-png-row-${info.project.name}.png` });

    if (stored) {
        // Evidence of what the wall does with it: the same file as the wall's mask, filled with ink.
        const url = (await row.getByRole('img', { name: `Logo ${NAME}` }).getAttribute('src')) ?? '';

        await page.evaluate((src) => {
            const frame = document.createElement('div');
            const mark = document.createElement('div');

            frame.id = 'qa-k2-02-wall';
            frame.style.cssText = 'position:fixed;left:16px;top:16px;z-index:2147483647;padding:16px;background:#fff;border:1px solid #ccc';
            mark.style.cssText = `width:240px;height:60px;background:#1f2328;-webkit-mask:url("${src}") center / contain no-repeat;mask:url("${src}") center / contain no-repeat`;
            frame.append(mark);
            document.body.append(frame);
        }, url);
        await page.waitForTimeout(500);
        await page.locator('#qa-k2-02-wall').screenshot({ path: `${SHOTS}/k2-02-opaque-png-as-wall-mask-${info.project.name}.png` });
    }

    expect(
        { stored, refusal: refusal.includes('keinen transparenten Hintergrund') },
        `an RGBA PNG with no transparent pixel was ${stored ? 'stored as the logo' : 'not stored'}; the row said „${refusal}"`,
    ).toEqual({ stored: false, refusal: true });
});
