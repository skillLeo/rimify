import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import { confirm, cookiesAway, ready } from './journey';
import { clean, confirmPassword, openAdmin, record, signIn, watch } from './support';

/*
 * Aufgabe 6 (the operator's brief of 23.10.2026): a test order placed in the shop — Warenkorb, Kasse, Testzahlung —
 * then worked in the admin: found by its number, opened, marked as sent with a tracking number, as delivered, refunded
 * in part; every mail it sends read from the audit server's log (mails go to the log there). The confirmation, the
 * shipping mail (new, F-14) and the refund; the review invitation follows delivery by days (rimify:bewertungen-einladen).
 */

const LOG = 'storage/logs/laravel.log';

/** The mails written to the log since `from` bytes, by subject — the log's bytes, not its characters (umlauts are two). */
function mailsSince(from: number): string[] {
    const text = fs.existsSync(LOG) ? fs.readFileSync(LOG).subarray(from).toString('utf8') : '';

    return [...text.matchAll(/^Subject: (.+)$/gm)].map((m) => m[1]!.trim());
}

test('Aufgabe 6: eine Testbestellung, im Admin gefunden, versendet, zugestellt, erstattet — jede Mail gelesen', async ({ page }, info) => {
    test.skip(info.project.name !== 'audit-1440', 'writes an order: once, at the primary width');
    test.setTimeout(6 * 60_000);
    const watcher = watch(page);
    const logStart = fs.existsSync(LOG) ? fs.statSync(LOG).size : 0;

    // The shop: the 1.6 Limousine chosen by its key numbers, the audit's own rim (Aufgabe 1) in the basket.
    await page.goto('/', { waitUntil: 'networkidle' });
    await ready(page);
    await cookiesAway(page);
    await page.getByRole('tab', { name: 'HSN/TSN' }).click();
    await page.getByLabel('HSN (Feld 2.1)').fill('0005');
    await page.getByLabel('TSN (Feld 2.2)').fill('ZZ8');
    await page.locator('.sel__go').click();
    await page.waitForURL(/\/felgen\?fahrzeug=/, { timeout: 20_000 });
    await ready(page);
    const card = page.locator('article.tile', { hasText: 'Prüfrad' }).first().locator('a.tile__cta');
    await expect(card, 'the audit rim is in the shop').toBeVisible({ timeout: 20_000 });
    await card.click();
    await page.waitForURL(/\/felgen\/[^/?]+/);
    await ready(page);
    await page.getByRole('button', { name: 'In den Warenkorb' }).first().click();
    await expect(page.getByText('Zum Warenkorb hinzugefügt.').first()).toBeVisible({ timeout: 20_000 });

    await page.goto('/kasse', { waitUntil: 'networkidle' });
    await ready(page);
    await page.locator('#ko-mail').fill('audit-kunde@beispiel.test');
    await page.locator('#ko-name').fill('Jürgen Größmann');
    await page.locator('#ko-street').fill('Mühlenstraße');
    await page.locator('#ko-nr').fill('12a');
    await page.locator('#ko-zip').fill('01067');
    await page.locator('#ko-city').fill('Dresden');
    await page.getByRole('button', { name: 'Weiter zu Optionen & Versand' }).click();
    await page.getByRole('button', { name: 'Weiter zur Zahlung' }).click();
    await page.getByRole('button', { name: 'Zahlungspflichtig bestellen' }).click();
    await page.waitForURL(/\/kasse\/testzahlung\//, { timeout: 30_000 });
    await ready(page);
    await page.getByRole('button', { name: 'Zahlung erfolgreich' }).click();
    await page.waitForURL(/\/bestellung\/[0-9a-f]{8}-[0-9a-f]{4}-4/, { timeout: 30_000 });
    // The address carries the order's public id (D-354); its number stands on the page.
    const number = (await page.locator('.ord__number').first().innerText()).trim();
    record('t6.jsonl', { step: 'bestellt', number, mails: mailsSince(logStart) });

    // The admin: found by its number, opened.
    await signIn(page);
    await openAdmin(page, `/admin/bestellungen?q=${encodeURIComponent(number)}`);
    await page.locator('.ob-number', { hasText: number }).first().click();
    await page.waitForURL(/\/admin\/bestellungen\/\d+$/);
    await ready(page);
    record('t6.jsonl', { step: 'geöffnet', text: (await page.locator('main').innerText()).slice(0, 1500) });

    // Sent, with a tracking number; delivered.
    await page.locator('#bs-tracking').fill('00340434 1234 5678');
    await page.getByRole('button', { name: 'Als versendet markieren' }).click();
    await expect(page.getByText(/als versendet markiert/).first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Als zugestellt markieren' }).click();
    await expect(page.getByText(/als zugestellt markiert/).first()).toBeVisible({ timeout: 20_000 });

    // Refunded in part, with a reason — the password once more first, as the panel asks before money moves.
    await confirmPassword(page);
    await page.locator('#bs-refund-amount').fill('10,00');
    await page.locator('#bs-refund-reason').fill('Kratzer an einer Felge – Teilerstattung aus Kulanz.');
    await page.getByRole('button', { name: 'Erstatten …' }).click();
    // The refund's own answer, then the page it leads to: a load state reached once never waits for this request, and
    // the mails were once read before the refund had written its own (a precondition, docs/dev/TEST-SMELLS.md §3).
    const refunded = page.waitForResponse((r) => r.request().method() === 'POST' && /\/erstattung$/.test(new URL(r.url()).pathname));
    await confirm(page, '10,00 € erstatten');
    expect((await refunded).status(), 'the refund is answered with a redirect').toBeLessThan(400);
    await expect(page.getByText('Teilweise erstattet').first(), 'the order shows the refund').toBeVisible({ timeout: 20_000 });
    const mails = mailsSince(logStart);
    record('t6.jsonl', { step: 'bearbeitet', text: (await page.locator('main').innerText()).slice(0, 2000), mails });

    // Every mail the order sends, each once (F-14: the shipping mail with its tracking number is new).
    expect(mails.filter((s) => s.includes(number)), JSON.stringify(mails)).toEqual(
        expect.arrayContaining([expect.stringContaining('Bestellung'), `Deine Bestellung ${number} ist unterwegs`, `Erstattung zu deiner Bestellung ${number}`]),
    );

    const seen = watcher.take();
    record('t6.jsonl', { step: 'ende', ...seen });
    expect(clean(seen), JSON.stringify(seen)).toBe(true);
});
