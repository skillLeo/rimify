import { expect, test } from '../fixtures';
import { CHECK_BASE, SHOTS, WHEEL, carStep, openCheck } from './check-support';

test.use({ baseURL: CHECK_BASE });

/*
 * CHECK-03 (S2) — a double-click on a model (or a make) in the car selector acts twice: the first press opens the next
 * step, and when the server answers inside the double-click — a quick connection does — the second press lands on the
 * row that has just appeared under the pointer. On a model that row is a variant: the car is chosen (POST /fahrzeug)
 * without the visitor having read the variants, and the page answers for that variant, e.g. „316i“ for a 330d driver.
 *
 * VehicleSelector.vue: the rows are disabled only while a variant is being posted (`choice.processing`); a drill step
 * (`router.get`) neither disables them nor ignores a click whose `detail` is 2.
 *
 * The spec makes the timing explicit: first press, the variants on screen, then the second press of the same
 * double-click (`clickCount: 2`) at the same point.
 * Expected: no car is chosen by the second press of a double-click. Writes nothing (the car would be a cookie).
 */

test('CHECK-03 a double-click on a model does not choose the variant that appears under the pointer', async ({ page }, info) => {
    await openCheck(page, { felge: WHEEL });

    const step = carStep(page);
    const title = step.locator('#vsel-drill-title');
    const posts: string[] = [];

    await expect(title, 'precondition: no car selector on the page (a car already in the cookie?)').toHaveText('Marke wählen');
    page.on('request', (request) => {
        if (request.method() === 'POST' && new URL(request.url()).pathname === '/fahrzeug') {
            posts.push(request.postData() ?? '');
        }
    });

    await step.locator('.vsel__rows .row-item').first().click();
    await expect(title, 'precondition: a make opens no model step').toHaveText('Modell wählen');

    const model = step.locator('.vsel__rows .row-item').first();

    await model.scrollIntoViewIfNeeded();

    const box = await model.boundingBox();

    expect(box, 'precondition: the first model has no box').not.toBeNull();

    const x = box!.x + box!.width / 2;
    const y = box!.y + Math.min(box!.height / 2, 20);

    // The first press of the double-click opens the model …
    await page.mouse.click(x, y);
    // … its variants arrive before the second press, as they do on a quick connection …
    await expect(title, 'precondition: the model opens no variant step').toHaveText('Variante wählen');
    // … and the second press of the same double-click lands where the model was.
    await page.mouse.down({ clickCount: 2 });
    await page.mouse.up({ clickCount: 2 });
    await page.waitForTimeout(1_500);

    await page.screenshot({ path: `${SHOTS}/check-03-after-double-click-${info.project.name}.png`, fullPage: true });

    expect(posts, 'the second press of a double-click chose a car from a list the visitor never saw').toEqual([]);
    expect(new URL(page.url()).searchParams.has('fahrzeug'), 'a car is in the address after a double-click on a model').toBe(false);
});
