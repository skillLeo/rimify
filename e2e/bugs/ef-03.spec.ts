import { expect, test } from '../fixtures';
import { open } from '../support';
import { DEV, SHOTS, chooseById, halves, norm, openEnded } from './ef-support';

// The cars typed from the Borbet documents live on the development shop.
test.use({ baseURL: DEV });

/*
 * EF-03 (S2) — Block E/F review: on a phone the chosen half of a car is named nowhere in the chrome.
 *
 * With BMW › 1er-Reihe 187 „ab *10" (or its twin „*00 bis *09") chosen, the desktop's vehicle bar says „Dein
 * Fahrzeug: BMW 1er-Reihe 187 · Feld K: e1*2001/116*0287, ab *10". Below 768 px:
 *
 *   - VehicleBar.vue hides `.vbar__meta` — the Feld K line — and shows the name alone („BMW 1er-Reihe 187");
 *   - the car button (`.sh__vicon`, „Dein Fahrzeug: BMW 1er-Reihe 187" for both halves) opens the vehicle sheet
 *     (AppLayout.vue line 90), which reads `buildWindow · keyNumbers` = „Bauzeitraum unbekannt · HSN/TSN noch
 *     nicht hinterlegt"; MobileLayout.vue line 179 (the phone homepage's sheet) is the same.
 *
 * The listing, the basket and the selector page are AppLayout pages on every device, so this is what a phone shows
 * after the choice: the two halves read alike wherever the customer looks to check which one they took.
 *
 * Expected: at 390, 375 and 320 px the page names the chosen car's Feld K line — in the bar, or in the vehicle
 * sheet its car button opens — on /warenkorb (white box) and /felgen-suchen (blue bar).
 *
 * Writes nothing: POST /fahrzeug sets only cookies (its redirect is not followed — an empty listing on the
 * development shop would write a catalogue-gap row), and the two pages read nothing into the database.
 */

const WIDTHS = [390, 375, 320];
const ROUTES = ['/warenkorb', '/felgen-suchen'];

test('EF-03 on a phone the page names the chosen half of a car by its Feld K line', async ({ page }, info) => {
    test.slow();

    const { split } = await halves(page);
    const car = openEnded(split);
    const line = norm(car.approval ?? '');
    const problems: string[] = [];

    await chooseById(page, car.id);

    for (const route of ROUTES) {
        for (const width of WIDTHS) {
            await page.setViewportSize({ width, height: 800 });
            await open(page, route);

            const bar = page.locator('.vbar');

            await expect(bar, `${route}: no vehicle bar`).toBeVisible();

            const inBar = norm(await bar.innerText());
            let inSheet = '';

            if (!inBar.includes(line)) {
                const button = page.locator('.sh__vicon');

                if (await button.isVisible()) {
                    await button.click();

                    const sheet = page.getByRole('dialog', { name: 'Dein Fahrzeug' });

                    await expect(sheet).toBeVisible();
                    await sheet.screenshot({ path: `${SHOTS}/ef-03-vehicle-sheet${route.replace(/\//g, '-')}-${width}-${info.project.name}.png` });
                    inSheet = norm(await sheet.innerText());
                    await page.keyboard.press('Escape');
                }
            }

            await page.locator('header').first().screenshot({ path: `${SHOTS}/ef-03-bar${route.replace(/\//g, '-')}-${width}-${info.project.name}.png` });

            if (!inBar.includes(line) && !inSheet.includes(line)) {
                problems.push(`${route} at ${width} px: the bar reads „${inBar}", the vehicle sheet „${inSheet.slice(0, 120)}" — no „${line}"`);
            }
        }
    }

    expect(problems, problems.join('\n')).toEqual([]);
});
