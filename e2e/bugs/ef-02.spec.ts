import { expect, test } from '../fixtures';
import { consentGiven, open } from '../support';
import { DEV, SHOTS, chooseById, halves, heroOptions, namesVariant, norm, openEnded } from './ef-support';

// The cars typed from the Borbet documents live on the development shop.
test.use({ baseURL: DEV });

/*
 * EF-02 (S2) — Block E/F review: the desktop homepage never names Feld K. Block E/F put the Feld K line into
 * /felgen-suchen, the phone panel and the vehicle bar, but not into the desktop hero (HeroSelector.vue):
 *
 *   - its Fahrzeug list builds each row from variant, kW and build window only (`variantLabel`), so the two halves
 *     of one car read the same — „187 · Bauzeitraum unbekannt (unvollständige Daten)" twice, 1K2 twice, 1K4 twice;
 *   - with a car chosen, its panel says „HSN/TSN noch nicht hinterlegt · Bauzeitraum unbekannt" (line 520), where
 *     the phone panel says „Feld K: e1*2001/116*0287, ab *10".
 *
 * The halves carry different Gutachten rows — different bolt sets (VehicleTree::variants) — so two rows that read
 * alike are a coin toss between two answers. (Today both are also greyed out: EF-01.)
 *
 * Expected: in the hero's list, every row of a split car carries its own Feld K range, and no two rows read alike;
 * with a car chosen, the hero panel names its Feld K line. Writes nothing: POST /fahrzeug sets only cookies.
 */

test('EF-02 the desktop hero tells apart the halves of a car by Feld K, before and after the choice', async ({ page, isMobile }, info) => {
    test.skip(isMobile, 'the hero selector is the desktop document\'s (the phone panel is EF-01)');

    const { split } = await halves(page);
    const problems: string[] = [];

    await consentGiven(page.context(), DEV);
    await open(page, '/');

    const options = await heroOptions(page);

    await page.screenshot({ path: `${SHOTS}/ef-02-hero-list-${info.project.name}.png` });

    for (const group of split) {
        const variant = group[0]!.variant;
        const rows = options.filter((o) => namesVariant(o.text, variant));
        const texts = rows.map((o) => norm(o.text));

        if (rows.length < group.length) {
            problems.push(`${variant}: ${group.length} cars, ${rows.length} rows in the list`);
        }

        if (new Set(texts).size < texts.length) {
            problems.push(`${variant}: ${texts.length} rows read alike — ${texts.map((t) => `„${t}"`).join(', ')}`);
        }

        for (const text of texts.filter((t) => !t.includes('Feld K'))) {
            problems.push(`${variant}: „${text}" names no Feld K range`);
        }
    }

    // With a car chosen: the panel that replaces the fields names it.
    const car = openEnded(split);

    await page.keyboard.press('Escape');
    await chooseById(page, car.id);
    await open(page, '/');

    const panel = page.locator('.hero__panel');

    await expect(panel).toContainText('Dein Fahrzeug');
    await panel.screenshot({ path: `${SHOTS}/ef-02-hero-chosen-${info.project.name}.png` });

    const said = norm(await panel.innerText());

    if (!said.includes(norm(car.approval ?? ''))) {
        problems.push(`with ${car.variant} (${norm(car.approval ?? '')}) chosen, the hero panel reads „${said.slice(0, 160)}…" — no Feld K`);
    }

    expect(problems, problems.join('\n')).toEqual([]);
});
