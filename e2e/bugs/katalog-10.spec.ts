import { expect, test, type Page } from '../fixtures';
import { SHOTS, guardWrites, isPhone, openFelgenPatched, signIn } from './katalog-support';

/*
 * KATALOG-10 (S2) — „Freigaben noch nicht hinterlegt", the state of every Felge until its Gutachten is
 * entered (every new one, every imported one), is a tag that never wraps (`.adm-tag { white-space: nowrap }`,
 * ≈ 190 px at 12 px). At 320 px the card's value column is 156 px (admin.css: 288 px − 120 px label − 12 px
 * gap): the tag runs out of the card and the list scrolls sideways. From 768 px up to ≈ 870 px (by
 * reading; iPad portrait 834 likely included) the table's narrowest possible width (≈ 760 px) is wider than
 * the page (664 px at 768): the Freigaben column lies beyond the right edge (docs/qa/BUGS.md).
 *
 * Expected: no sideways scroll and nothing cut at 320 and at 768–1023 (DIRECTION / the responsive rule:
 * stack before squeezing, never truncate a meaningful column).
 *
 * The rows are the server's own; only their Freigaben state is set in the browser to the one a real,
 * newly created Felge has. Nothing is written.
 */

const NOT_YET = { label: 'Freigaben noch nicht hinterlegt', tone: 'warn' };

async function overflow(page: Page): Promise<{ scroll: number; client: number; tagRight: number; width: number }> {
    return page.evaluate(() => {
        const panel = document.querySelector('table.fg-table')?.closest('.adm-panel') as HTMLElement | null;
        const tag = document.querySelector('table.fg-table tbody .adm-tag--warn') as HTMLElement | null;

        return {
            scroll: panel?.scrollWidth ?? 0,
            client: panel?.clientWidth ?? 0,
            tagRight: Math.round(tag?.getBoundingClientRect().right ?? 0),
            width: document.documentElement.clientWidth,
        };
    });
}

for (const width of [320, 768]) {
    test(`KATALOG-10 at ${width} px the Felgen list fits without sideways scroll`, async ({ page }, info) => {
        test.skip(width >= 768 && isPhone(info.project.name), 'The table widths are the desk project’s.');

        await page.setViewportSize({ width, height: width < 768 ? 800 : 1024 });
        await signIn(page);
        await guardWrites(page);
        await openFelgenPatched(page, (props) => {
            for (const wheel of props.wheels as Array<Record<string, unknown>>) {
                wheel.coverage = { ...NOT_YET };
            }
        });

        await expect(page.locator('table.fg-table tbody .adm-tag--warn').first()).toBeVisible();

        const m = await overflow(page);
        await page.screenshot({ path: `${SHOTS}/katalog-10-list-${width}-${info.project.name}.png` });

        expect(
            m.scroll - m.client,
            `at ${width} px the list is ${m.scroll} px wide in a ${m.client} px panel; the tag ends at x=${m.tagRight} of ${m.width}`,
        ).toBeLessThanOrEqual(1);
    });
}
