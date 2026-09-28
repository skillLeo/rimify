import { expect, test, type Locator, type Page } from '../fixtures';
import { SHOTS, busiestDocument, focused, guardWrites, openAsDraft, signIn, waitForApp } from './gutachten-support';

/*
 * B-01 (S2) — Block B review: a folded section the person opened snaps shut under the cursor.
 *
 * RecordFields.vue („Weitere Angaben von Seite 1") and RowFields.vue („Grenzen aus dem Gutachten") bind
 * `<details :open="hasHeader">` / `:open="hasLimits">` — true while a field in it is filled (or refused).
 * Opened by hand, the DOM says open while Vue's last value is still false. Typing one character makes the
 * value true; emptying the field again (Backspace, to retype it) makes it false, and Vue writes
 * `details.open = false`: the section closes while the person is typing in it, and the field they are in
 * disappears from under the keyboard.
 *
 * Expected: a section the person opened stays open until they close it; the binding may open it (a filled
 * or refused field), never close it.
 *
 * Nothing is written: (a) types into /admin/gutachten/neu without sending; (b) types into „Zeilen
 * hinzufügen" of a released document answered in the browser as a draft (openAsDraft). guardWrites stops
 * any non-GET.
 */

async function typeAndErase(page: Page, field: Locator, char: string): Promise<void> {
    await field.click();
    await page.keyboard.type(char);
    await page.keyboard.press('Backspace');
    // Vue writes the binding in the microtask after the input event; give it a frame or two.
    await page.waitForTimeout(200);
}

async function isOpen(details: Locator): Promise<boolean> {
    return details.evaluate((d) => (d as HTMLDetailsElement).open);
}

test('B-01a „Weitere Angaben von Seite 1" stays open when a field in it is emptied again', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);
    await page.goto('/admin/gutachten/neu', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    const details = page.locator('details.rsf-more');
    await page.locator('.rsf-more__summary').click();
    expect(await isOpen(details), 'precondition: the summary opens the section').toBe(true);

    const annex = page.locator('#gn-annex');
    await typeAndErase(page, annex, 'A');

    const open = await isOpen(details);
    const on = await focused(page);

    await page.screenshot({ path: `${SHOTS}/b-01a-header-after-erase-${info.project.name}.png` });

    expect(open, `„Anlage": typed „A", erased it — the section the person opened closed under the cursor (focus: ${on})`).toBe(true);
    expect(await page.evaluate(() => document.activeElement?.id), `the keyboard left the field it was typing in (focus: ${on})`).toBe('gn-annex');
});

test('B-01b „Grenzen aus dem Gutachten" stays open when a field in it is emptied again', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const id = await busiestDocument(page);
    await openAsDraft(page, id);

    const details = page.locator('.rc details.rf-more');
    await page.locator('.rc .rf-more__summary').click();
    expect(await isOpen(details), 'precondition: the summary opens the section').toBe(true);

    const widthMin = page.locator('#rc-wmin');
    await typeAndErase(page, widthMin, '8');

    const open = await isOpen(details);
    const on = await focused(page);

    await page.locator('.rc').screenshot({ path: `${SHOTS}/b-01b-limits-after-erase-${info.project.name}.png` });

    expect(open, `„Breite von": typed „8", erased it — the section the person opened closed under the cursor (focus: ${on})`).toBe(true);
    expect(await page.evaluate(() => document.activeElement?.id), `the keyboard left the field it was typing in (focus: ${on})`).toBe('rc-wmin');
});
