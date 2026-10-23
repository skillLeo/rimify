import { expect, test } from '@playwright/test';
import { expectGermanSentences, fieldErrors, ready } from './journey';
import { clean, confirmPassword, openAdmin, record, signIn, watch } from './support';

/*
 * Aufgabe 8 (the operator's brief of 23.10.2026): an Auflage's level set (the client's „Farbe“ of an Auflage, his #23 —
 * a level, not a colour switch), the reviews worked (they are written by buyers only, D-103: the admin hides and
 * answers), and the company data filled in Einstellungen › Verkäufer & Versand — with the form's checks: umlauts, the
 * German decimal comma, leading zeros, the tax number with spaces, a value and „Entfällt“ at once, the same page in two
 * tabs.
 */

test('Aufgabe 8c: Firmendaten — jede Angabe, deutsche Fehler neben dem Feld, zwei Tabs', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'audit-1440', 'writes settings: once, at the primary width');
    const watcher = watch(page);

    await signIn(page);
    await confirmPassword(page);
    await openAdmin(page, '/admin/einstellungen/verkaeufer-versand');

    // Wrong forms first: each refused beside its field, in German, the input kept.
    watcher.expect([/^422 PUT \/admin\/einstellungen\/verkaeufer-versand$/]);
    await page.locator('#vv-zip').fill('1067');
    await page.locator('#vv-vat_id').fill('DE12');
    await page.locator('#vv-phone').fill('ruf an');
    await page.locator('#vv-na-phone').check();
    await page.locator('#vv-cost-DE').fill('vier Euro');
    await page.keyboard.press('Control+s');
    await expect(page.locator('#vv-zip-error')).not.toBeEmpty();
    const errors = await fieldErrors(page);
    record('t8.jsonl', { step: 'falsche Werte', errors, zipKept: await page.locator('#vv-zip').inputValue() });
    expectGermanSentences(errors, 'Verkäufer & Versand');
    expect(await page.locator('#vv-zip').inputValue()).toBe('1067');

    // The company, typed as on paper.
    const values: Record<string, string> = {
        '#vv-name': 'Prüfwerk Räder GmbH',
        '#vv-legal_form': 'GmbH',
        '#vv-managing_director': 'Jürgen Größmann, Ute Weiß',
        '#vv-street': 'Mühlenstraße 12a',
        '#vv-zip': '01067',
        '#vv-city': 'Dresden',
        '#vv-register_court': 'Amtsgericht Dresden',
        '#vv-register_number': 'HRB 12345',
        '#vv-vat_id': 'DE 123 456 789',
        '#vv-email': 'info@pruefwerk.test',
        '#vv-phone': '',
        '#vv-cost-DE': '4,90',
        '#vv-free-DE': '500,00',
        '#vv-min-days': '3',
        '#vv-max-days': '5',
    };

    for (const [selector, value] of Object.entries(values)) {
        await page.locator(selector).fill(value);
    }

    await page.keyboard.press('Control+s');
    await expect(page.locator('#vv-zip-error')).toBeEmpty({ timeout: 15_000 });
    await page.reload({ waitUntil: 'networkidle' });
    await ready(page);
    record('t8.jsonl', {
        step: 'gespeichert',
        zip: await page.locator('#vv-zip').inputValue(),
        vat: await page.locator('#vv-vat_id').inputValue(),
        cost: await page.locator('#vv-cost-DE').inputValue(),
        name: await page.locator('#vv-name').inputValue(),
    });
    expect(await page.locator('#vv-zip').inputValue(), 'leading zero kept').toBe('01067');

    // The same page in two tabs: the second save must not silently undo the first.
    const other = await context.newPage();
    await openAdmin(other, '/admin/einstellungen/verkaeufer-versand');
    await page.locator('#vv-city').fill('Dresden-Neustadt');
    await page.keyboard.press('Control+s');
    await page.waitForLoadState('networkidle');
    await other.locator('#vv-street').fill('Mühlenstraße 14');
    await other.keyboard.press('Control+s');
    await other.waitForLoadState('networkidle');
    await page.reload({ waitUntil: 'networkidle' });
    record('t8.jsonl', { step: 'zwei Tabs', city: await page.locator('#vv-city').inputValue(), street: await page.locator('#vv-street').inputValue() });

    const seen = watcher.take();
    record('t8.jsonl', { step: 'firmendaten', ...seen });
    expect(clean(seen), JSON.stringify(seen)).toBe(true);
});
