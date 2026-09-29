import { expect, test } from './fixtures';
import { SHOTS, busiestDocument, guardWrites, signIn, waitForApp } from './bugs/gutachten-support';

/*
 * The Gutachten model after the corrections memo §1–§3, in the browser: each document's own
 * Auflagenverzeichnis on its page, the read-only Auflagen index of every document's list, and the Konflikte
 * page where a disagreement between documents waits for a person. Nothing is written: every write under
 * /admin/gutachten, /admin/auflagen and /admin/konflikte is aborted in the browser (guardWrites).
 */

test('a Gutachten shows its own Auflagenverzeichnis, and each row its codes with their sentences', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const id = await busiestDocument(page);

    await page.goto(`/admin/gutachten/${id}`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    const list = page.locator('section[aria-labelledby="gs-conditions-h"]');
    await expect(list.getByRole('heading', { name: 'Auflagenverzeichnis' })).toBeVisible();
    await expect(list.locator('table.adm-table tbody tr').first(), 'the document has no Auflagenverzeichnis').toBeVisible();

    // A row names its codes with the document's own sentence, never a bare code (R-15).
    const codes = page.locator('.gs-table td[data-label="Auflagen"] .gs-line');

    if ((await codes.count()) > 0) {
        await expect(codes.first().locator('.gs-code')).toBeVisible();
        expect(((await codes.first().textContent()) ?? '').trim().length).toBeGreaterThan(8);
    }

    await list.screenshot({ path: `${SHOTS}/auflagenverzeichnis-${info.project.name}.png` });

    // What the document states beside its codes (the corrections memo §4): its own section, read-only here.
    const extras = page.locator('section[aria-labelledby="gs-extras-h"]');
    await expect(extras.getByRole('heading', { name: 'Befestigung und Hinweise' })).toBeVisible();
    await expect(extras.getByRole('heading', { name: 'Befestigungsmittel' })).toBeVisible();
    await expect(extras.getByRole('heading', { name: 'Pflichthinweise' })).toBeVisible();
    await expect(extras.getByRole('button', { name: /hinzufügen/ }), 'a released document takes no entries').toHaveCount(0);
});

test('the Auflagen page lists every document’s own list, read-only', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);
    await page.goto('/admin/auflagen', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    await expect(page.locator('.adm-page__title')).toHaveText('Auflagen');
    await expect(page.locator('section.al-doc').first()).toBeVisible();
    // Nothing to write here: no button that adds, changes or removes.
    await expect(page.getByRole('button', { name: /hinzufügen|Neue Auflage|Löschen|Entfernen/ })).toHaveCount(0);

    await page.screenshot({ path: `${SHOTS}/auflagen-index-${info.project.name}.png`, fullPage: false });
});

test('the Konflikte page shows both sides and asks for the decision with its reason', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);
    await page.goto('/admin/konflikte', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    await expect(page.locator('.adm-page__title')).toHaveText('Konflikte');

    const pair = page.locator('section.kf-pair').first();

    if ((await pair.count()) === 0) {
        await expect(page.getByText('Kein Konflikt offen.', { exact: false })).toBeVisible();
    } else {
        await expect(pair.locator('.kf-side')).toHaveCount(2);
        await expect(pair.getByRole('radio')).toHaveCount(3);
        await expect(pair.getByLabel('Warum?')).toBeVisible();

        // No horizontal scroll at this width: the two sides stack on a phone.
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
    }

    await page.screenshot({ path: `${SHOTS}/konflikte-${info.project.name}.png`, fullPage: true });
});
