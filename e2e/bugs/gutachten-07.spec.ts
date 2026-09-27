import { expect, test } from '@playwright/test';
import { SHOTS, busiestDocument, composer, guardWrites, openAsDraft, signIn } from './gutachten-support';

/*
 * GUTACHTEN-07 (S2) — „Zeilen hinzufügen": the size list has no bound, so the row fields and „Zeilen anlegen"
 * sit thousands of pixels below the searches (docs/qa/BUGS.md). The composer loads every size before
 * anything is typed (up to 200, GutachtenZeilenController::wheels); the vehicle hits are held in a 280 px
 * scroll box, but `.rc-hits--sizes { max-height: none }` and the model groups are not boxed at all. With the
 * demo catalogue (≈ 20 models × sizes × finishes) the Reifengrößen field starts some 5.000 px down on a desk
 * and further on a phone, where every hit is 44 px — and the keyboard crosses one check box per size and
 * model on the way. „Thirty rows in fifteen minutes" is the screen's own goal.
 *
 * Expected: the size list is bounded like the vehicle list (or folded per model), so the row fields stay
 * within reach — here: the first tyre size field starts within two screen heights of the size search.
 *
 * Nothing is written: the document is a released one answered in the browser as a draft; only the two
 * searches (GETs) reach the server.
 */

test('GUTACHTEN-07 the row fields stay within reach of the size search', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const id = await busiestDocument(page);
    await openAsDraft(page, id);

    const c = composer(page);
    await expect(c.sizes.first(), 'the size search lists nothing').toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(500);

    const measured = await page.evaluate(() => {
        const search = document.querySelector('#rc-wheel-q')?.getBoundingClientRect();
        const field = document.querySelector('#rc-size-0')?.getBoundingClientRect();
        const boxes = document.querySelectorAll('section[aria-labelledby="rc-h-sizes"] input[type="checkbox"]').length;
        const sizes = document.querySelectorAll('section[aria-labelledby="rc-h-sizes"] .rc-hits--sizes input[type="checkbox"]').length;

        return { gap: search && field ? Math.round(field.top - search.bottom) : -1, boxes, sizes };
    });

    const screen = page.viewportSize()?.height ?? 900;

    await page.screenshot({ path: `${SHOTS}/gutachten-07-composer-${info.project.name}.png`, fullPage: true });

    expect(
        measured.gap,
        `${measured.sizes} sizes listed (${measured.boxes} check boxes on the way for the keyboard); the first Reifengröße field starts ${measured.gap} px below the size search — ${Math.round(measured.gap / screen)} screen heights`,
    ).toBeLessThanOrEqual(2 * screen);
});
