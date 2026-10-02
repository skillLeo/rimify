import { devices, expect, test } from '../fixtures';
import { CHECK_BASE, SHOTS, WHEEL, openCheck, sizes } from './check-support';

/*
 * CHECK-05 (S2) — on a phone the chosen size cannot be read in its own select: „Ausführung und Größe“ shows the finish
 * and the start of the size, and the rest — the diameter, the ET — is cut off at the arrow.
 *
 * Each entry is the finish and the size in one line („Schwarz Klarlack · 8,5J × 19 · ET 45“, CheckController::index
 * `wheelSizes`), ≈ 260–270 px of 16 px Archivo. A closed <select> shows one line and clips it. The text room is the
 * viewport − 2 × 16 (`.wrap`) − 2 × 24 (`.chk__step` padding) − 12 − 40 (`select.input` padding) − 2 (border): ≈ 186 px
 * at 320, 226 at 360, 241 at 375, 256 at 390. The figures are computed; this spec measures them.
 *
 * Expected: the chosen entry reads in full at every phone width (the size is the meaningful part: e.g. the finish as
 * <optgroup> and the size alone as the option, or a select of its own for the finish).
 * Writes nothing; no car needed.
 */

const phone = devices['Pixel 7'];

test.use({
    baseURL: CHECK_BASE,
    userAgent: phone.userAgent,
    deviceScaleFactor: phone.deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
});

for (const width of [320, 360, 375, 390]) {
    test(`CHECK-05 the chosen size reads in full in its select at ${width} px`, async ({ page }, info) => {
        await page.setViewportSize({ width, height: 800 });
        await openCheck(page, { felge: WHEEL });

        const offered = await sizes(page);

        expect(offered.length, `precondition: ${WHEEL} offers no size`).toBeGreaterThan(0);

        const longest = offered.reduce((a, b) => (b.label.length > a.label.length ? b : a));

        await openCheck(page, { felge: WHEEL, groesse: longest.id });

        const select = page.locator('#chk-size');

        await expect(select, 'precondition: the size of the address is not chosen').toHaveValue(longest.id);
        await select.scrollIntoViewIfNeeded();
        await select.screenshot({ path: `${SHOTS}/check-05-size-select-${width}-${info.project.name}.png` });

        const fit = await select.evaluate((element) => {
            const field = element as HTMLSelectElement;
            const style = getComputedStyle(field);
            const probe = document.createElement('span');

            for (const property of ['font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch', 'letter-spacing', 'font-feature-settings', 'font-variation-settings']) {
                probe.style.setProperty(property, style.getPropertyValue(property));
            }

            probe.style.position = 'absolute';
            probe.style.visibility = 'hidden';
            probe.style.whiteSpace = 'pre';
            probe.textContent = field.selectedOptions[0]?.textContent?.trim() ?? '';
            document.body.append(probe);

            const needed = probe.getBoundingClientRect().width;

            probe.remove();

            return {
                label: probe.textContent,
                needed: Math.ceil(needed),
                room: Math.floor(field.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)),
            };
        });

        expect(fit.needed, `„${fit.label}“ needs ${fit.needed} px; the select shows ${fit.room} px of it at ${width} px`).toBeLessThanOrEqual(fit.room);
    });
}
