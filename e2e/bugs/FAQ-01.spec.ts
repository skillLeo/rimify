import { expect, test } from '@playwright/test';
import { SHOTS, openFaqWith, signIn } from './faq-support';

/*
 * FAQ-01 (S2) — for a role without „Inhalte · Veröffentlichen" (the Inhalte role with that one cell
 * switched off in Rollen, exactly FaqTest's faqWithoutPublish()), every VISIBLE question shows an
 * „Aktionen für …" button whose menu is empty (docs/qa/BUGS.md).
 *
 * Admin/Faq/Index.vue renders the menu when `mayEdit(entry) || can.delete || (narrow && can.publish)`,
 * but every item inside needs more: Bearbeiten needs mayEdit (false: visible, no publish), the
 * show/hide item and the moves need publish, and Löschen of a visible entry needs publish too.
 * So `can.delete` alone opens a 240 px white box with nothing in it — on 7 of the 8 seeded rows.
 *
 * The rights are set in the browser (the page's props), so no role is changed in the database.
 */
test('FAQ-01 a role without the right to publish never gets an empty action menu', async ({ page }) => {
    await signIn(page);
    await openFaqWith(page, (props) => {
        props.can = { create: true, edit: true, delete: true, publish: false };
    });

    const visibleRows = page.locator('.faq-adm__entry').filter({ hasNot: page.locator('.adm-tag') });
    const count = await visibleRows.count();

    expect(count, 'visible questions on the page').toBeGreaterThan(0);

    const empty: string[] = [];
    let shot = false;

    for (let i = 0; i < count; i++) {
        const row = visibleRows.nth(i);
        const trigger = row.getByRole('button', { name: /^Aktionen für / });

        if ((await trigger.count()) === 0) {
            continue;
        }

        await trigger.click();

        const menu = page.getByRole('menu');

        await expect(menu).toBeVisible();

        if ((await menu.getByRole('menuitem').count()) === 0) {
            empty.push((await row.locator('.faq-adm__question').textContent())?.trim() ?? `row ${i + 1}`);
        }

        if (!shot) {
            await page.screenshot({ path: `${SHOTS}/faq-01-empty-menu-${test.info().project.name}.png` });
            shot = true;
        }

        await page.keyboard.press('Escape');
        await expect(menu).toBeHidden();
    }

    expect(empty, 'rows whose „Aktionen" button opens a menu with nothing in it').toEqual([]);
});
