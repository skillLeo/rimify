import { expect, test } from '../fixtures';
import { SHOTS, answerWithDocument, asDraft, busiestDocument, focused, guardWrites, openAsDraft, signIn, waitForApp } from './gutachten-support';

/*
 * GUTACHTEN-10 (S2) — after a refused „Gutachten anlegen" or a refused Auflage the focus stays on the
 * button, and nothing is announced (docs/qa/BUGS.md). The admin's forms move the focus to the first
 * refused field (useDirtyForm, the FAQ and Navigation dialogs: `[aria-invalid="true"]`); the new pages do
 * not — Neu.vue, FactsDialog.vue, RowComposer.vue, the row dialog in Show.vue, Auflagen/Index.vue,
 * Fahrzeuge/Show.vue. On a phone the sentence under „PDF des Gutachtens" is above the fold when
 * „Gutachten anlegen" is pressed at the end of the form: the press seems to do nothing; a screen reader
 * hears nothing either (the sentence is no live region, the file field's `aria-invalid` sits on the hidden
 * input).
 *
 * Expected: the focus moves to the first refused field (which brings it into view), as elsewhere in the admin.
 *
 * Nothing is written: (a) is refused in the browser before anything is sent; in (b) the POST of the new
 * Auflage is answered in the browser with the server's refusal of an empty Wortlaut.
 */

test('GUTACHTEN-10a „Gutachten anlegen" without a PDF moves the focus to the PDF field', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);
    await page.goto('/admin/gutachten/neu', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    await page.locator('#gn-number').fill('QA-NIE-GESPEICHERT');

    const submit = page.getByRole('button', { name: 'Gutachten anlegen' });
    await submit.focus();
    await page.keyboard.press('Enter');

    const error = page.locator('#gn-pdf-err');
    await expect(error).toHaveText('Bitte wähl das PDF des Gutachtens aus.');

    const onPdf = await page.evaluate(() => {
        const el = document.activeElement;

        return el !== null && (el.id === 'gn-pdf' || el.getAttribute('for') === 'gn-pdf');
    });
    const inView = await error.evaluate((p) => {
        const r = p.getBoundingClientRect();

        return r.top >= 0 && r.bottom <= window.innerHeight;
    });

    await page.screenshot({ path: `${SHOTS}/gutachten-10a-neu-refused-${info.project.name}.png` });

    expect(onPdf, `the focus is on ${await focused(page)}; the sentence is ${inView ? 'in view' : 'out of view'}`).toBe(true);
});

test('GUTACHTEN-10b a refused new code of the Auflagenverzeichnis moves the focus to its sentence', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const id = await busiestDocument(page);
    const refusal = 'Bitte den Satz aus dem Gutachten, so wie ihn eine Kundin oder ein Kunde lesen soll.';

    // The save, answered as the server answers an empty sentence (DocumentConditionRequest: text_de required).
    await page.route(
        (url) => url.pathname === `/admin/gutachten/${id}/auflagen`,
        async (route) => {
            if (route.request().method() !== 'POST') {
                await route.fallback();

                return;
            }

            // The Auflagenverzeichnis reads its own error bag (errorBag: 'auflagen').
            await answerWithDocument(route, id, asDraft, { auflagen: { text_de: refusal } });
        },
    );

    await openAsDraft(page, id);
    await page.locator('#av-new').click();
    await page.locator('#av-code').fill('QA9');
    await page.locator('#av-kind').selectOption('hinweis');

    await page.getByRole('button', { name: 'Code speichern' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#av-text-err')).toHaveText(refusal);
    await page.waitForTimeout(300);

    const on = await focused(page);
    const onText = await page.evaluate(() => document.activeElement?.id === 'av-text');

    await page.locator('.av__form').screenshot({ path: `${SHOTS}/gutachten-10b-auflage-refused-${info.project.name}.png` });

    expect(onText, `after the refusal the focus is on ${on}`).toBe(true);
});
