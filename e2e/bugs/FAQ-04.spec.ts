import { expect, test } from '../fixtures';
import { SHOTS, waitForApp } from './faq-support';

/*
 * FAQ-04 (S2) — the admin's answer field promises „Steht im Shop genau so, wie du sie hier
 * schreibst." and FaqEntryRequest keeps line breaks (it only normalises \r\n to \n), but the shop
 * collapses them: an answer written in two paragraphs is one run-on paragraph on /faq and in the
 * homepage's five (docs/qa/BUGS.md).
 *
 * /faq renders `{{ entry.answer }}` into `.acc__body` (legacy.css) and the homepage into
 * `.accordion__body` (components.css, Components/Ui/Accordion.vue); neither sets
 * `white-space: pre-line`.
 *
 * Read-only: the text of one rendered answer is replaced in the browser, nothing is stored.
 */
function keepsBreaks(value: { whiteSpace: string; collapse: string }): boolean {
    return ['pre-line', 'pre-wrap', 'break-spaces'].includes(value.whiteSpace) || ['preserve', 'preserve-breaks', 'break-spaces'].includes(value.collapse);
}

test('FAQ-04 a line break in an answer reaches the shop', async ({ page }) => {
    await page.goto('/faq', { waitUntil: 'networkidle' });
    await waitForApp(page);

    const head = page.locator('.acc__head').first();
    const body = page.locator('.acc__body').first();

    await head.click();
    await expect(body).toBeVisible();

    // Exactly what a stored answer with two paragraphs renders as: one text node holding "\n\n".
    await body.evaluate((el) => {
        el.textContent = 'Erster Absatz: So prüfst du die Freigabe.\n\nZweiter Absatz: So lässt du sie eintragen.';
    });
    await page.screenshot({ path: `${SHOTS}/faq-04-paragraphs-${test.info().project.name}.png` });

    const faq = await body.evaluate((el) => {
        const style = getComputedStyle(el);

        return { whiteSpace: style.whiteSpace, collapse: style.getPropertyValue('white-space-collapse') };
    });

    // The homepage's accordion body, read from the same stylesheet the homepage uses.
    const home = await page.evaluate(() => {
        const probe = document.createElement('div');

        probe.className = 'accordion__body';
        document.body.append(probe);

        const style = getComputedStyle(probe);
        const value = { whiteSpace: style.whiteSpace, collapse: style.getPropertyValue('white-space-collapse') };

        probe.remove();

        return value;
    });

    expect(keepsBreaks(faq), `/faq answer: white-space ${JSON.stringify(faq)}`).toBe(true);
    expect(keepsBreaks(home), `homepage answer: white-space ${JSON.stringify(home)}`).toBe(true);
});
