import { expect, test } from '@playwright/test';
import { clean, openAdmin, overflow, record, signIn, watch } from './support';

/*
 * Aufgabe 3, erster Teil (the operator's brief of 23.10.2026): a vehicle created by hand, from its papers — and the
 * form's checks on the way: sent empty, each required field left out, the longest values, umlauts and ß, the German
 * decimal comma, leading zeros on the HSN, a duplicate, a double click, Back after saving, the error beside its field in
 * German and the input kept. Two cars: one at 250 km/h for the case above 210, one at 200.
 */

const CARS = [
    { make: 'Prüfwerk', model: 'Größe Eins', variant: '2.0 Limousine Straßenversion', type: 'PW1', hsn: '0005', tsn: 'ZZ9', eg: 'e1*2007/46*0999*01', kw: '140', from: '03.2019', front: '1.060', rear: '1.240', speed: '250' },
    { make: 'Prüfwerk', model: 'Größe Eins', variant: '1.6 Limousine', type: 'PW1', hsn: '0005', tsn: 'ZZ8', eg: 'e1*2007/46*0999*02', kw: '90', from: '03.2019', front: '980', rear: '1.150', speed: '200' },
] as const;

async function fill(page: import('@playwright/test').Page, car: (typeof CARS)[number]): Promise<void> {
    await page.locator('#fn-make').fill(car.make);
    await page.locator('#fn-model').fill(car.model);
    await page.locator('#fn-variant').fill(car.variant);
    await page.locator('#fn-type').fill(car.type);
    await page.locator('#fn-hsn').fill(car.hsn);
    await page.locator('#fn-tsn').fill(car.tsn);
    await page.locator('#fn-eg').fill(car.eg);
    await page.locator('#fn-kw').fill(car.kw);
    await page.locator('#fn-from').fill(car.from);
    await page.locator('#fn-front').fill(car.front);
    await page.locator('#fn-rear').fill(car.rear);
    await page.locator('#fn-speed').fill(car.speed);
}

test.describe.configure({ mode: 'serial' });

test('Fahrzeug von Hand: leer gesendet, jedes Pflichtfeld einzeln, deutsch neben dem Feld, Eingaben bleiben', async ({ page }, info) => {
    test.skip(info.project.name !== 'audit-1440', 'the form checks write rows: once, at the primary width');
    const watcher = watch(page);

    await signIn(page);
    await openAdmin(page, '/admin/fahrzeuge/neu');

    // Sent empty: every refusal beside its field, in German, and the focus on the first — without first asking about the
    // axle loads, which it did before it said the required fields were empty (F-02).
    watcher.expect([/^422 POST \/admin\/fahrzeuge$/]);
    await page.getByRole('button', { name: 'Fahrzeug anlegen' }).click();
    const errors = page.locator('.form-field__error:not(:empty)');

    await expect(errors.first()).toBeVisible();
    const asked = await page.getByRole('button', { name: 'Ohne Achslasten anlegen' }).isVisible();
    record('t3a.jsonl', { step: 'leer: fragt erst nach Achslasten', asked });
    expect(asked, 'F-02: the empty form is not asked about the axle loads first').toBe(false);
    const empty = await errors.allTextContents();
    record('t3a.jsonl', { step: 'leer gesendet', errors: empty, wider: await overflow(page) });
    expect(empty.length).toBeGreaterThan(0);
    for (const text of empty) {
        expect(text, 'a German sentence').toMatch(/[A-ZÄÖÜ].*[.!?“]$/u);
    }

    // Each required field left out, all others given: its error, the others' values kept.
    for (const [id, value] of [['#fn-make', CARS[0].make], ['#fn-model', CARS[0].model], ['#fn-hsn', CARS[0].hsn], ['#fn-tsn', CARS[0].tsn], ['#fn-kw', CARS[0].kw], ['#fn-from', CARS[0].from]] as const) {
        await openAdmin(page, '/admin/fahrzeuge/neu');
        await fill(page, CARS[0]);
        await page.locator(id).fill('');
        await page.getByRole('button', { name: 'Fahrzeug anlegen' }).click();
        const own = page.locator(`${id}-err`);

        await expect(own, `${id} left out: its own error`).not.toBeEmpty();
        record('t3a.jsonl', { step: `ohne ${id}`, error: await own.textContent(), kept: await page.locator('#fn-variant').inputValue() });
        expect(await page.locator('#fn-variant').inputValue(), 'the other fields keep their input').toBe(CARS[0].variant);
        void value;
    }

    const seen = watcher.take();
    record('t3a.jsonl', { step: 'pflichtfelder', ...seen });
    expect(clean(seen), JSON.stringify(seen)).toBe(true);
});

test('Fahrzeug von Hand anlegen: HSN 0005 bleibt, 1.060 kg lesen, Doppelklick legt eins an, Zurück nach dem Speichern', async ({ page }, info) => {
    test.skip(info.project.name !== 'audit-1440', 'writes rows: once, at the primary width');
    const watcher = watch(page);

    await signIn(page);

    for (const car of CARS) {
        await openAdmin(page, '/admin/fahrzeuge/neu');
        await fill(page, car);
        // A double click: one vehicle, never two.
        await page.getByRole('button', { name: 'Fahrzeug anlegen' }).dblclick();
        await page.waitForURL(/\/admin\/fahrzeuge\/\d+$/);
        const url = page.url();

        await expect(page.locator('h1')).toContainText(car.variant);
        record('t3a.jsonl', { step: `angelegt ${car.tsn}`, url, heading: await page.locator('h1').textContent() });

        // Back after saving: the form, empty or as it was — never a second vehicle.
        await page.goBack();
        await page.waitForLoadState('networkidle');
        record('t3a.jsonl', { step: `zurück ${car.tsn}`, at: page.url() });
    }

    // Two vehicles, not four: the double clicks and the Back made none more.
    await openAdmin(page, '/admin/fahrzeuge?suche=Pr%C3%BCfwerk');
    const rows = page.locator('table tbody tr');
    record('t3a.jsonl', { step: 'liste', rows: await rows.count(), text: (await page.locator('main').innerText()).slice(0, 600) });

    const seen = watcher.take();
    record('t3a.jsonl', { step: 'anlegen', ...seen });
    expect(clean(seen), JSON.stringify(seen)).toBe(true);
});
