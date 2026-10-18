import { expect, test } from '../fixtures';
import { SHOTS, openEditor, sections, signIn } from './seiten-support';

/*
 * SEI-25 (S2) — the publish dialog does not name a block that was removed when a block of another kind now stands at its
 * place (docs/qa/BUGS.md, review SEI-BLOCKS-2026-10-19).
 *
 * content.ts diff() (and PageSchema::diff(), which writes the Protokoll) compare position by position and take the type
 * from the new block; where the old block at that place is of another kind it says only „<new> (neu)" — the old one's
 * removal is never listed, and the labels after it are counted wrong. Here: the article's last text section is removed
 * and a quote is added, so „Zitat 1 (neu)" takes the removed section's place and „Abschnitt 6 (entfernt)" is missing.
 * The server's half is tests/Feature/Admin/SeitenBugsTest.php (SEI-25).
 *
 * Nothing is saved or published: the dialog is closed with Abbrechen.
 */
test('SEI-25 the publish dialog names a removed section, also where a quote now stands at its place', async ({ page }) => {
    await signIn(page);
    await openEditor(page, 'HSN und TSN finden');

    // The dialog compares the shop with the form: a saved draft would change what it has to say.
    await expect(page.getByText(/^\s*Entwurf vom/), 'rig: no draft on the page, the form is what the shop shows').toHaveCount(0);

    const all = sections(page);
    const count = await all.count();
    const label = ((await all.nth(count - 1).locator('h2').textContent()) ?? '').trim();

    expect(label, 'rig: the article ends with a text section').toMatch(/^Abschnitt \d+$/);

    await page.getByRole('button', { name: `${label} entfernen`, exact: true }).click();
    await expect(all).toHaveCount(count - 1);

    await page.locator('#pg-add-quote').click();
    await expect(all).toHaveCount(count);
    await all.nth(count - 1).locator('textarea[id$="-data-text"]').fill('QA SEI-25 Zitat');

    await page.locator('.adm-page__actions').getByRole('button', { name: 'Veröffentlichen' }).click();

    const dialog = page.getByRole('dialog');

    await expect(dialog).toContainText(/Zitat \d+ \(neu\)/);

    const said = await dialog.innerText();

    await page.screenshot({ path: `${SHOTS}/sei-25-dialog-${test.info().project.name}.png` });
    await dialog.getByRole('button', { name: 'Abbrechen' }).click();

    expect(said, 'the dialog lists what changes in the shop: the removed section belongs to it').toContain(`${label} (entfernt)`);
});
