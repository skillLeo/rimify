import { expect, test } from '../fixtures';
import { SHOTS, signIn, waitForApp } from './bell-support';

/*
 * BELL-05 (S2) — the new tab rows are scroll boxes with 1 px to scroll: on Windows (Chrome, Edge,
 * Firefox — classic scrollbars) a vertical scrollbar stands at the end of the row, and the current
 * tab's 2 px underline is cut to 1 px everywhere (docs/qa/BUGS.md).
 *
 * admin.css: `.adm-tabs { overflow-x: auto; border-bottom: 1px }` and `.adm-tabs__item
 * { margin-bottom: -1px; border-bottom: 2px }`. `overflow-x: auto` turns `overflow-y` into `auto`
 * as well (CSS Overflow 3), and each tab's border box reaches 1 px below the row's padding box — the
 * negative margin that lays the underline over the hairline. So the row scrolls vertically by
 * 1 px: a scrollbar where scrollbars are drawn, a wheel over the row nudges the tabs by a pixel,
 * and the lower half of the underline is clipped. Same row on Zubehörpreise (both tabs) and on
 * Benachrichtigungen („Alle" / „Ungelesen").
 *
 * Playwright's headless Chromium hides scrollbars, so the screenshot cannot show the bar itself —
 * the measurement is the evidence; open the page in Edge on Windows to see it.
 */
const ROWS = [
    { path: '/admin/zubehoerpreise/wuchtgewichte', nav: 'Zubehörpreise' },
    { path: '/admin/zubehoerpreise/rdks', nav: 'Zubehörpreise' },
    { path: '/admin/benachrichtigungen', nav: 'Anzeigen' },
] as const;

test('BELL-05 a tab row has nothing to scroll vertically', async ({ page }) => {
    await signIn(page);

    const found: string[] = [];

    for (const row of ROWS) {
        await page.goto(row.path, { waitUntil: 'networkidle' });
        await waitForApp(page);

        const nav = page.getByRole('navigation', { name: row.nav, exact: true });

        // „Anzeigen" is drawn only when the account has alerts at all.
        if (row.nav === 'Anzeigen' && (await nav.count()) === 0) {
            continue;
        }

        await expect(nav, `${row.path}: no tab row „${row.nav}"`).toBeVisible();

        const box = await nav.evaluate((el) => ({ scroll: el.scrollHeight, client: el.clientHeight }));
        const slug = row.path.split('/').pop();

        await nav.screenshot({ path: `${SHOTS}/bell-05-tabs-${slug}-${test.info().project.name}.png` });

        if (box.scroll > box.client) {
            found.push(`${row.path}: scrollHeight ${box.scroll} > clientHeight ${box.client}`);
        }
    }

    expect(found, 'tab rows that scroll vertically').toEqual([]);
});
