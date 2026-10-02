import { expect, test } from '../fixtures';
import { consentGiven } from '../support';
import { CAR, CHECK_BASE, SHOTS, WHEEL, checkPath } from './check-support';

/*
 * CHECK-04 (S2) — the first frame of the shared link shows another wheel and another size than the answer under it.
 *
 * The three selects are bound with `:value` (Check/Index.vue), not `v-model`. Vue's server renderer writes `selected`
 * on an option only for `v-model` (compiler-ssr `ssrTransformModel`); for `:value` it writes a `value="…"` attribute on
 * the <select>, which HTML ignores. No option is selected, so every browser selects the first option that is not
 * disabled: Hersteller shows the alphabetically first brand, Felge the brand's first wheel (KR-10, not the KR-9), Größe
 * the first size — while the answer below names the KR-9 in the size of the address. Hydration then patches the value
 * (Vue 3.5 hydrates dynamic props), so with JavaScript the wrong frame lasts until the bundle has run: a second or more on
 * a phone on 4G, for good where the script fails. With nothing chosen, „Hersteller wählen“ is never in the first frame.
 *
 * Measured with JavaScript off, i.e. the first frame as the server sends it (the way e2e/ssr-nojs.spec.ts proves SSR).
 * Expected: the server-rendered selects show exactly what the address chose, and the placeholder where it chose nothing.
 * Writes nothing.
 */

test.use({ baseURL: CHECK_BASE, javaScriptEnabled: false });

test('CHECK-04 the first frame of a shared answer shows the wheel and the size of the address', async ({ page }, info) => {
    await consentGiven(page.context(), CHECK_BASE);
    await page.goto(checkPath({ felge: WHEEL, fahrzeug: CAR }), { waitUntil: 'domcontentloaded' });

    const options = page.locator('#chk-size option:not([disabled])');

    expect(await options.count(), `precondition: ${WHEEL} offers fewer than two sizes`).toBeGreaterThan(1);

    // The last size, so the first selectable one is not it.
    const size = await options.last().getAttribute('value');

    await page.goto(checkPath({ felge: WHEEL, groesse: size!, fahrzeug: CAR }), { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#antwort .chk__pair'), 'precondition: the server rendered no answer').toBeVisible();
    await page.screenshot({ path: `${SHOTS}/check-04-first-frame-${info.project.name}.png`, fullPage: true });

    await expect(page.locator('#chk-size'), '„Ausführung und Größe“ shows another size than the answer under it').toHaveValue(size!);
    await expect(page.locator('#chk-wheel'), '„Felge“ shows another wheel than the answer under it').toHaveValue(WHEEL);
    await expect(page.locator('#chk-brand'), '„Hersteller“ shows another brand than the wheel’s').toHaveValue('kraftrad');
});

test('CHECK-04 with nothing chosen, the first frame asks for the Hersteller', async ({ page }, info) => {
    await consentGiven(page.context(), CHECK_BASE);
    await page.goto(checkPath(), { waitUntil: 'domcontentloaded' });
    await page.locator('#chk-brand').screenshot({ path: `${SHOTS}/check-04-empty-brand-${info.project.name}.png` });

    await expect(page.locator('#chk-brand'), 'the first frame names a brand nobody chose').toHaveValue('');
});
