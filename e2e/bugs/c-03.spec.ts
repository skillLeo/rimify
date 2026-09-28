import { expect, test } from '../fixtures';
import { busiestDocument, focused, guardWrites, openAsDraft, signIn } from './gutachten-support';
import { SHOTS } from './c-support';

/*
 * C-03 (S2) — Block C review: „Fahrzeug anlegen" drops the keyboard to <body>.
 *
 * VehicleFromDocument.vue save(): on a 201 it empties the form, sets `open = false` and emits `created` —
 * no focus request. The form, and the field or button the person pressed Enter in, is unmounted; RowComposer's
 * adopt() puts the car at the head of the list and ticks it, but moves no focus either. Every other exit of
 * this form asks for the focus (show → Hersteller, Abbrechen → the opener, a refusal → the first refused
 * field); only success does not. A keyboard-only person lands at the top of the admin and has to tab back
 * through the rail and the whole document to the car they just made.
 *
 * Expected: after „Fahrzeug anlegen" the keyboard stays in „Zeilen hinzufügen" — on the new car's box at the
 * head of the list (or the opener), never on <body>.
 *
 * Nothing is written: a released document is answered in the browser as a draft (openAsDraft); the POST to
 * /admin/gutachten/{id}/fahrzeuge is answered in the browser with the controller's 201 shape.
 */

const CREATED = {
    id: 990_701,
    label: 'QA-Hersteller QA-Modell 3C · HSN/TSN noch nicht hinterlegt',
    window: 'Bauzeitraum unbekannt',
    needsReview: true,
};

test('C-03 after „Fahrzeug anlegen" the keyboard stays in „Zeilen hinzufügen"', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const id = await busiestDocument(page);
    const sent: string[] = [];

    await page.route(
        (url) => url.pathname === `/admin/gutachten/${id}/fahrzeuge`,
        async (route) => {
            if (route.request().method() !== 'POST') {
                await route.fallback();

                return;
            }

            sent.push(route.request().postData() ?? '');
            await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(CREATED) });
        },
    );

    await openAsDraft(page, id);

    // Keyboard only: the opener, the fields, Enter.
    await page.locator('#vfd-open').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#vfd-make'), '„Fahrzeug aus diesem Gutachten anlegen" did not put the keyboard on Hersteller').toBeFocused();

    await page.keyboard.type('QA-Hersteller');
    await page.locator('#vfd-model').fill('QA-Modell');
    await page.locator('#vfd-type-designation').fill('3C');
    await page.locator('#vfd-eg-number').fill('e1*2007/46*0316*..');
    await page.locator('#vfd-source-page').fill('3');
    await page.locator('#vfd-source-page').press('Enter');

    const vehicles = page.locator('section[aria-labelledby="rc-h-vehicles"]');

    await expect(vehicles.locator('.rc-hits .rc-hit__label').first(), 'the new car does not head the list').toHaveText(CREATED.label);
    await expect(vehicles.locator('.rc-hits input[type="checkbox"]').first(), 'the new car is not chosen').toBeChecked();
    await page.waitForTimeout(400);

    const on = await focused(page);

    await vehicles.screenshot({ path: `${SHOTS}/c-03-after-fahrzeug-anlegen-${info.project.name}.png` });

    expect(sent.length, 'one POST per „Fahrzeug anlegen"').toBe(1);
    expect(on, 'after „Fahrzeug anlegen" the keyboard fell to <body>').not.toBe('<body>');
});
