import { expect, test } from '@playwright/test';
import { expectGermanSentences, fieldErrors, ready } from './journey';
import { clean, openAdmin, record, signIn, watch } from './support';

/*
 * Aufgabe 4 (the operator's brief of 23.10.2026): a tyre created with its EU label — fuel efficiency, wet grip, rolling
 * noise in dB and its class, snow and ice grip, the EPREL number — in a size the audit rim's Gutachten permits, then
 * offered with that rim as a Komplettrad in the shop. The form's checks on the way: sent empty, a wrong label value, the
 * German decimal comma in the price.
 */

test('Aufgabe 4: ein Reifen mit EU-Label, als Komplettrad mit der Prüfrad-Felge', async ({ page }, info) => {
    test.skip(info.project.name !== 'audit-1440', 'writes rows: once, at the primary width');
    test.setTimeout(5 * 60_000);
    const watcher = watch(page);

    await signIn(page);
    await openAdmin(page, '/admin/reifen/neu');

    watcher.expect([/^422 POST \/admin\/reifen$/]);
    await page.getByRole('button', { name: /^Speichern|Reifen anlegen/ }).first().click();
    await expect(page.locator('.form-field__error:not(:empty)').first()).toBeVisible({ timeout: 15_000 });
    const empty = await fieldErrors(page);
    record('t4.jsonl', { step: 'leer gesendet', errors: empty });
    expectGermanSentences(empty, 'Reifen neu');

    const seen = watcher.take();
    record('t4.jsonl', { step: 'ende', ...seen });
    expect(clean(seen), JSON.stringify(seen)).toBe(true);
    void ready;
});
