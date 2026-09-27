import { expect, test, type Page } from '@playwright/test';
import { SHOTS, chartsSettled, guardDemoData, isPhone, openUebersicht, signIn } from './m1-support';

/*
 * M1-05 (S2) — Windows (classic scrollbars): opening a chart's „…“ menu or „Demodaten entfernen“
 * narrows the whole admin by the scrollbar's width; the cards reflow and the charts redraw, and
 * everything jumps back on close (docs/qa/BUGS.md).
 *
 * reka's modal menus and dialogs lock the page's scroll (useBodyScrollLock): they measure the
 * scrollbar as `innerWidth − documentElement.clientWidth` (15 px in Chrome and Edge on Windows),
 * set `overflow: hidden` on <body> and add that width as `padding-right` to <body> — to make up
 * for the scrollbar they expect to disappear. base.css gives <html> `scrollbar-gutter: stable`: the
 * gutter stays when the scrollbar goes, so the padding comes on top of it. `.adm` loses 15 px while
 * the overlay is open: the work area narrows, the Übersicht's grid reflows, every chart re-measures and
 * redraws, and the rail's fit (measured on `.adm`) can give way or collapse near its threshold. The
 * same for every modal menu and dialog in the admin — Zeitraum „…“, Neu, account, row menus.
 *
 * Expected: nothing behind an open menu or dialog moves (brief: no scroll jump on open/close).
 *
 * Classic scrollbars as Windows draws them: Playwright's `--hide-scrollbars` is dropped, as in
 * admin-rail-scrollbars.spec.ts. Nothing is written: the dialog is opened from the keyboard and put
 * away with Esc; „Entfernen“ is never touched, and any write under /admin/demodaten would be aborted.
 */

test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

interface Frame {
    work: number;
    dash: number;
    bodyPadding: string;
}

async function frame(page: Page): Promise<Frame> {
    return page.evaluate(() => {
        const width = (selector: string): number => Math.round((document.querySelector(selector)?.getBoundingClientRect().width ?? -1) * 10) / 10;

        return { work: width('.adm-work'), dash: width('.dash'), bodyPadding: getComputedStyle(document.body).paddingRight };
    });
}

test('M1-05 an open menu or dialog does not narrow the page by the scrollbar', async ({ page }, info) => {
    test.skip(isPhone(info.project.name), 'Classic scrollbars: a desktop browser.');

    const stopped = await guardDemoData(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page);
    await openUebersicht(page);
    await chartsSettled(page);

    const scrollbar = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth);

    expect(scrollbar, 'rig: a classic scrollbar takes width').toBeGreaterThan(0);

    const before = await frame(page);

    // 1 · The Umsatz chart's „…“.
    const trigger = page.getByRole('button', { name: 'Menü: Umsatz über die Zeit' });

    test.skip((await trigger.count()) === 0, 'No Umsatz in the period: the chart has no menu.');
    await trigger.click();
    await expect(page.getByRole('menu')).toBeVisible();

    const withMenu = await frame(page);

    await page.screenshot({ path: `${SHOTS}/m1-05-chart-menu-open-${info.project.name}.png` });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);

    expect.soft(withMenu, `with the chart menu open (scrollbar ${scrollbar} px): the page before was ${JSON.stringify(before)}`).toEqual(before);

    // 2 · „Demodaten entfernen“, opened with Enter on „entfernen“, put away with Esc.
    const purge = page.locator('.adm-foot__demo-purge');

    if ((await purge.count()) > 0) {
        await purge.focus();
        await page.keyboard.press('Enter');

        const dialog = page.getByRole('dialog', { name: 'Demodaten entfernen' });

        await expect(dialog).toBeVisible();

        const withDialog = await frame(page);

        await page.screenshot({ path: `${SHOTS}/m1-05-confirm-open-${info.project.name}.png` });
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);

        expect.soft(withDialog, `with „Demodaten entfernen“ open (scrollbar ${scrollbar} px)`).toEqual(before);
    }

    expect(stopped, 'no write under /admin/demodaten may be sent').toEqual([]);
});
