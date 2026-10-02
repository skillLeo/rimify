import { expect, test } from '../fixtures';
import { CHECK_BASE, SHOTS, carStep, openAnswer } from './check-support';

test.use({ baseURL: CHECK_BASE });

/*
 * CHECK-02 (S2) — with a car chosen, „Ändern“ opens the selector, but every way back to its first step closes it:
 * „Zurück“ on the model step (and, after a key-number miss, „Stattdessen Marke wählen“) shows the old car again instead
 * of the makes. The visitor has to press „Ändern“ a second time to get where the button said it would take them.
 *
 * Both are GET visits to the page without `marke` (VehicleSelector `back()` → `router.get(basePath, drill({}))`, and the
 * `restartHref` Link), so the page re-mounts (`preserveState` false): `changing` (Check/Index.vue) is back to false,
 * `selectedMake` is null, a car is in the cookie — `choosingVehicle` is false and the selector is gone.
 *
 * Expected: „Zurück“ from the models shows the makes, inside the selector the visitor opened.
 * Writes nothing. („Stattdessen Marke wählen“ is not driven here: a miss records a catalogue-gap row.)
 */

test('CHECK-02 „Zurück“ in the selector opened by „Ändern“ goes back to the makes', async ({ page }, info) => {
    await openAnswer(page);

    const step = carStep(page);
    const title = step.locator('#vsel-drill-title');

    await step.getByRole('button', { name: /^Ändern/ }).click();
    await expect(title, 'precondition: „Ändern“ opens no make list').toHaveText('Marke wählen');

    await step.locator('.vsel__rows .row-item').first().click();
    await expect(title, 'precondition: a make opens no model step').toHaveText('Modell wählen');

    await step.locator('.vsel__back').click();
    await page.waitForURL((url) => !url.searchParams.has('marke'));
    await page.screenshot({ path: `${SHOTS}/check-02-after-zurueck-${info.project.name}.png`, fullPage: true });

    await expect(title, '„Zurück“ closed the selector and brought the old car back instead of the makes').toHaveText('Marke wählen');
});
