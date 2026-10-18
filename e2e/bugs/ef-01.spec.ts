import { expect, test } from '../fixtures';
import { consentGiven, open } from '../support';
import { DEV, MAKE, MODEL, SHOTS, halves, heroOptions, namesVariant, panelOptions } from './ef-support';

// The cars typed from the Borbet documents live on the development shop.
test.use({ baseURL: DEV });

/*
 * EF-01 (S1) — Block E/F review: on the homepage no car typed from a Gutachten can be chosen. The phone panel's
 * Fahrzeug select and the desktop hero's Fahrzeug list grey out every one of them — BMW › 1er-Reihe 187, 1K2
 * and 1K4, both halves each, and every other car of the two Borbet documents — as „(unvollständige Daten)".
 *
 * GutachtenFahrzeugController::store creates every such car with `needs_review = true` (no axle loads and no top
 * speed are ever in a Gutachten), and both homepage selectors disable a row that needs review:
 * VehiclePanel.vue `<option :disabled="v.needsReview">`, HeroSelector.vue `<ComboboxItem :disabled="v.needsReview">`.
 * Since the R-03 amendment of 2026-09-28 the wheel answer of such a car rests on the document alone and the tyre
 * answer waits for the car's papers („Noch nicht bestätigt“ since D-286) — /felgen-suchen (VehicleSelector.vue) offers the same rows and POST /fahrzeug takes
 * them. The Feld K range Block E/F put into the phone select stands on options nobody can pick. (The unit test
 * VehiclePanel.test.ts builds its halves with `needsReview: false`, which no car from a Gutachten has.)
 *
 * Expected: every row with a Feld K line can be chosen on the homepage, on the phone and on the desktop.
 * Writes nothing: the lists are only opened and read.
 */

test('EF-01 a car typed from a Gutachten can be chosen in the homepage selector', async ({ page }, info) => {
    const { fromDocument } = await halves(page);

    await consentGiven(page.context(), DEV);
    await open(page, '/');

    const phone = info.project.name === 'mobile-390';
    const options = phone ? await panelOptions(page) : await heroOptions(page);

    await page.screenshot({ path: `${SHOTS}/ef-01-homepage-selector-${info.project.name}.png`, fullPage: false });

    const refused = phone
        ? options.filter((o) => fromDocument.some((row) => String(row.id) === o.value) && o.disabled)
        : options.filter((o) => fromDocument.some((row) => namesVariant(o.text, row.variant)) && o.disabled);
    const offered = phone
        ? options.filter((o) => fromDocument.some((row) => String(row.id) === o.value))
        : options.filter((o) => fromDocument.some((row) => namesVariant(o.text, row.variant)));

    expect(offered.length, `the ${phone ? 'phone panel' : 'desktop hero'} does not list the cars from a Gutachten under ${MAKE} › ${MODEL} at all`).toBeGreaterThan(0);
    expect(
        refused.map((o) => `„${o.text}"`),
        `${refused.length} of ${offered.length} cars typed from a Gutachten are greyed out and cannot be chosen in the ${phone ? 'phone panel (#h2 › Fahrzeug)' : 'desktop hero (Fahrzeug)'}`,
    ).toEqual([]);
});
