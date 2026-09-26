import { expect, test } from '@playwright/test';
import { SHOTS, focused, openEditor, sections, signIn } from './seiten-support';

/*
 * SEI-04 (S2) — keyboard: moving a section (or a Versprechen) to the first or the last place leaves
 * focus on the button of the OTHER block, the one that was pushed aside. A second Enter moves that
 * one back, undoing the move (docs/qa/BUGS.md).
 *
 * Bearbeiten.vue moveSection()/moveItem() send focus to the same-direction button of the target
 * place (`pg-move-up-{target}`); at the first place that button is disabled, focus() does nothing,
 * and focus stays where it was — on a DOM node keyed by position, now showing the other block.
 *
 * Nothing is saved: the moves stay in the form.
 */
test('SEI-04a moving a section to the top keeps keyboard focus with the moved section', async ({ page }) => {
    await signIn(page);
    await openEditor(page, 'Impressum');

    const all = sections(page);

    if ((await all.count()) < 2) {
        await page.locator('#pg-add-section').click();
        await expect(all).toHaveCount(2);
    }

    const marker = 'QA SEI-04 bewegt';

    await all.nth(1).locator('input[id$="-data-heading"]').fill(marker);
    await all.nth(1).getByRole('button', { name: /nach oben$/ }).focus();
    await page.keyboard.press('Enter');

    // The move itself happened …
    await expect(all.nth(0).locator('input[id$="-data-heading"]')).toHaveValue(marker);
    await page.waitForTimeout(100);

    // … and focus should have travelled with it.
    const movedId = await all.nth(0).getAttribute('id');
    const focusSection = await page.evaluate(() => document.activeElement?.closest('section[id^="pg-section-"]')?.id ?? null);
    const where = await focused(page);

    await page.screenshot({ path: `${SHOTS}/sei-04a-section-${test.info().project.name}.png` });

    expect(focusSection, `after the move focus is on ${where}`).toBe(movedId);
});

test('SEI-04b moving a Versprechen to the top keeps keyboard focus with it', async ({ page }) => {
    await signIn(page);
    await openEditor(page, 'Startseite');

    const promises = page.locator('fieldset.pg__item');

    await expect(promises.nth(1)).toBeVisible();

    const marker = 'QA SEI-04 bewegt';

    await promises.nth(1).locator('input[id$="-title"]').fill(marker);
    await promises.nth(1).getByRole('button', { name: /nach oben$/ }).focus();
    await page.keyboard.press('Enter');

    await expect(promises.nth(0).locator('input[id$="-title"]')).toHaveValue(marker);
    await page.waitForTimeout(100);

    const inMoved = await promises.nth(0).evaluate((fieldset) => fieldset.contains(document.activeElement));
    const where = await focused(page);

    await page.screenshot({ path: `${SHOTS}/sei-04b-versprechen-${test.info().project.name}.png` });

    expect(inMoved, `after the move focus is on ${where}`).toBe(true);
});
