import { expect, test, type Page } from '../fixtures';
import { CAR, CHECK_BASE, SHOTS, carStep, openAnswer } from './check-support';

test.use({ baseURL: CHECK_BASE });

/*
 * CHECK-01 (S2) — a car change with an answer on screen: after „Ändern“, a car chosen by its key numbers — straight
 * away, or through the chooser two cars open (R-01) — leaves step 1 in the selector. The new car is chosen and the
 * answer below is already its own („… für Audi RS 4 …“), but step 1 still shows the make list and the numbers typed,
 * never the car: it looks as if the choice did nothing.
 *
 * `changing` (resources/js/Pages/Check/Index.vue) is set by „Ändern“ and never cleared. A drill step is a GET visit and
 * re-mounts the page (`preserveState` false), which is why the guided route recovers. The key-number form and the
 * chooser post (`useForm().post` → `router.post`, `preserveState: true` by default in @inertiajs/core 3.7.1), the
 * server redirects back to the question (FahrzeugController::adopt), the page keeps its state — and `changing` with it.
 *
 * Expected: once the car is chosen, step 1 shows it with „Ändern“, whichever way it was chosen.
 * Writes nothing: the car is a cookie.
 */

async function changeByKeys(page: Page, hsn: string, tsn: string): Promise<void> {
    const step = carStep(page);

    await step.getByRole('button', { name: /^Ändern/ }).click();
    await step.getByLabel('HSN', { exact: true }).fill(hsn);
    await step.getByLabel('TSN', { exact: true }).fill(tsn);
    await step.getByRole('button', { name: 'Fahrzeug wählen' }).click();
}

async function waitForAnotherCar(page: Page): Promise<void> {
    await page.waitForURL((url) => url.searchParams.has('fahrzeug') && url.searchParams.get('fahrzeug') !== String(CAR));
}

test('CHECK-01 a car chosen through the chooser after „Ändern“ stands in step 1', async ({ page }, info) => {
    await openAnswer(page);
    await changeByKeys(page, '1860', 'AAS');

    const candidates = carStep(page).locator('.vsel__candidate');

    await expect(candidates, 'precondition: 1860 / AAS opens no chooser').toHaveCount(2);
    await candidates.first().click();
    await waitForAnotherCar(page);
    await expect(page.locator('#antwort .chk__for'), 'precondition: the answer is not the RS 4’s').toContainText('RS 4');

    await page.screenshot({ path: `${SHOTS}/check-01-after-chooser-${info.project.name}.png`, fullPage: true });

    await expect(carStep(page).locator('.vsel'), 'step 1 is still the vehicle selector after the car was chosen').toHaveCount(0);
    await expect(carStep(page).locator('.chk__vehicle'), 'step 1 does not name the car just chosen').toContainText('RS 4');
});

test('CHECK-01 a car chosen by unique key numbers after „Ändern“ stands in step 1', async ({ page }, info) => {
    await openAnswer(page);
    await changeByKeys(page, '0005', '582');

    await waitForAnotherCar(page).catch(() => {
        throw new Error('precondition: 0005 / 582 chose no car — not exactly one car behind it in this shop?');
    });
    await expect(page.locator('#antwort .chk__for'), 'precondition: the answer is not the 3er Coupé’s').toContainText('3er');

    await page.screenshot({ path: `${SHOTS}/check-01-after-keys-${info.project.name}.png`, fullPage: true });

    await expect(carStep(page).locator('.vsel'), 'step 1 is still the vehicle selector after the car was chosen').toHaveCount(0);
    await expect(carStep(page).locator('.chk__vehicle'), 'step 1 does not name the car just chosen').toContainText('3er');
});
