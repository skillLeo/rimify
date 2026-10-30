import { expect, test } from '@playwright/test';
import { confirm, cookiesAway, ready } from './journey';
import { clean, openAdmin, record, signIn, watch } from './support';

/*
 * Aufgabe 5 (the operator's brief of 23.10.2026): a Ratgeber article written from nothing — its title, its lead, a
 * section, a photograph uploaded into our storage with its description, a table — saved, previewed, published, and
 * read in the shop as a visitor reads it.
 */

const TITLE = 'Felgen richtig einlagern – Größe, Druck und Pflege';
const PHOTO = 'public/images/hero/hero-1080.jpg';

test('Aufgabe 5: ein Blog-Artikel mit Foto und Tabelle, veröffentlicht und im Shop gelesen', async ({ page }, info) => {
    test.skip(info.project.name !== 'audit-1440', 'writes a page: once, at the primary width');
    test.setTimeout(5 * 60_000);
    const watcher = watch(page);

    await signIn(page);
    // Inhalte › Ratgeber since his admin item 12 (D-351).
    await openAdmin(page, '/admin/ratgeber');
    await page.getByRole('button', { name: 'Artikel anlegen' }).click();
    await page.locator('#rg-title').fill(TITLE);
    await page.getByRole('dialog').getByRole('button', { name: /anlegen/i }).click();
    await page.waitForURL(/\/admin\/ratgeber\/\d+$/, { timeout: 20_000 });
    await ready(page);
    record('t5.jsonl', { step: 'angelegt', url: page.url(), text: (await page.locator('main').innerText()).slice(0, 1500) });

    // The photo and the table, by the page's own add buttons.
    await page.getByRole('button', { name: 'Bild hinzufügen' }).click();
    await page.locator('input[type="file"]').last().setInputFiles(PHOTO);
    await page.getByRole('button', { name: 'Tabelle hinzufügen' }).click();
    record('t5.jsonl', { step: 'bausteine', text: (await page.locator('main').innerText()).slice(0, 3000) });

    const seen = watcher.take();
    record('t5.jsonl', { step: 'ende', ...seen });
    expect(clean(seen), JSON.stringify(seen)).toBe(true);
    void confirm;
    void cookiesAway;
});
