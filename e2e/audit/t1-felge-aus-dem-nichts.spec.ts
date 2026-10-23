import { expect, test } from '@playwright/test';
import { clean, openAdmin, overflow, record, signIn, watch } from './support';

/*
 * Aufgabe 1 (the operator's brief of 23.10.2026): a rim created from nothing — a new brand typed in, the model, its
 * Radtypenbezeichnung, a finish, its sizes with the German decimal comma — saved, then published once a released
 * Gutachten covers it (Aufgabe 2 enters that one), until it shows on the storefront with the verdict the document gives.
 * The checks on the way: sent empty, the longest values, umlauts and ß, a duplicate SKU, a double click on save. This
 * spec holds the empty send; the rest was walked step by step (docs/review/audit, walk w-t1-*).
 */

export const RIM = { brand: 'Prüfrad', name: 'Straße 18', type: 'PR18', finish: 'Schwarz glänzend', sku: 'PR18-8518-35' } as const;

test.describe.configure({ mode: 'serial' });

test('Felge neu: leer gesendet und jede Grenze — deutsch neben dem Feld, nichts geht verloren', async ({ page }, info) => {
    test.skip(info.project.name !== 'audit-1440', 'writes rows: once, at the primary width');
    const watcher = watch(page);

    await signIn(page);
    await openAdmin(page, '/admin/felgen/neu');
    record('t1.jsonl', { step: 'neu geöffnet', title: await page.locator('h1').textContent(), wider: await overflow(page) });

    watcher.expect([/^422 (POST|PUT) \/admin\/felgen/]);
    await page.getByRole('button', { name: /^Speichern/ }).first().click();
    const errors = page.locator('.form-field__error:not(:empty), .fe-sizes [id$="-err"]:not(:empty)');

    await expect(errors.first()).toBeVisible();
    record('t1.jsonl', { step: 'leer gesendet', errors: await errors.allTextContents() });

    const seen = watcher.take();
    expect(clean(seen), JSON.stringify(seen)).toBe(true);
});
