import { expect, test } from '@playwright/test';
import { confirm, ready } from './journey';
import { clean, openAdmin, record, signIn, watch } from './support';

/*
 * Aufgabe 3, zweiter Teil (the operator's brief of 23.10.2026): the demo file imported through the Probelauf — the
 * import page's own sample file, fetched from its link — then the mapping read, the gaps and the implausible counted,
 * and the file imported. A wrong file first: one that is no table, one too big.
 */

test('Aufgabe 3b: die Beispieldatei durch den Probelauf importiert', async ({ page }, info) => {
    test.skip(info.project.name !== 'audit-1440', 'writes rows: once, at the primary width');
    test.setTimeout(5 * 60_000);
    const watcher = watch(page);

    await signIn(page);
    await openAdmin(page, '/admin/fahrzeuge/import');

    // The sample, as a person downloads it from the page.
    const sample = await page.request.get('/admin/fahrzeuge/import/beispiel.csv');
    expect(sample.status()).toBe(200);
    const csv = await sample.body();
    record('t3b.jsonl', { step: 'beispiel', bytes: csv.length, head: csv.toString('utf8').split('\n').slice(0, 3) });

    // A file that is no table: refused beside the field, in German.
    watcher.expect([/^422 POST \/admin\/fahrzeuge\/import\/probelauf$/]);
    await page.locator('#fi-file').setInputFiles({ name: 'kein-csv.txt', mimeType: 'text/plain', buffer: Buffer.from('das ist keine Tabelle') });
    await page.locator('#fi-source').selectOption({ label: 'KBA-Typdaten' });
    await page.getByRole('button', { name: /^Probelauf/ }).click();
    await expect(page.locator('#fi-file-err')).not.toBeEmpty({ timeout: 15_000 });
    record('t3b.jsonl', { step: 'falsche datei', error: await page.locator('#fi-file-err').textContent() });

    // The sample: Probelauf, its counts, then Importieren.
    await openAdmin(page, '/admin/fahrzeuge/import');
    await page.locator('#fi-file').setInputFiles({ name: 'beispiel.csv', mimeType: 'text/csv', buffer: csv });
    await page.locator('#fi-source').selectOption({ label: 'KBA-Typdaten' });
    await page.getByRole('button', { name: /^Probelauf/ }).click();
    await page.waitForURL(/\/admin\/fahrzeuge\/import\/\d+$/, { timeout: 60_000 });
    await ready(page);
    record('t3b.jsonl', { step: 'probelauf', text: (await page.locator('main').innerText()).slice(0, 3000) });

    await page.getByRole('button', { name: 'Importieren', exact: true }).click();
    await confirm(page, 'Importieren');
    await expect(page.locator('#fr-h-result')).toHaveText('Ergebnis', { timeout: 60_000 });
    record('t3b.jsonl', { step: 'importiert', text: (await page.locator('main').innerText()).slice(0, 2000) });

    const seen = watcher.take();
    record('t3b.jsonl', { step: 'ende', ...seen });
    expect(clean(seen), JSON.stringify(seen)).toBe(true);
});
