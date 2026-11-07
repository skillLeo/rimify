import { expect, test } from '../fixtures';
import { chooseFirstWheel, freshNumber, newPaper, searchCars } from '../gutachten-erfassung-support';
import { SHOTS, focused, guardWrites, signIn, waitForApp } from './gutachten-support';

/*
 * GUTACHTEN-10 (S2) — after a refused „Gutachten anlegen" or a refused Auflage the focus stays on the
 * button, and nothing is announced (docs/qa/BUGS.md). The admin's forms move the focus to the first
 * refused field (useDirtyForm, the FAQ and Navigation dialogs: `[aria-invalid="true"]`). On a phone the sentence under „PDF des Gutachtens" is above the fold when
 * „Gutachten anlegen" is pressed at the end of the form: the press seems to do nothing; a screen reader
 * hears nothing either (the sentence is no live region, the file field's `aria-invalid` sits on the hidden
 * input).
 *
 * Expected: the focus moves to the first refused field (which brings it into view), as elsewhere in the admin.
 *
 * (a) is refused in the browser before anything is sent; (b) is a draft of its own, and the server refuses an empty Wortlaut.
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

test('GUTACHTEN-10b a refused new code moves the focus to its sentence', async ({ page }, info) => {
    await signIn(page);
    await newPaper(page, freshNumber('E2E-CODE'));
    await chooseFirstWheel(page);
    await page.getByRole('button', { name: 'Weiter: Fahrzeuge' }).click();
    await searchCars(page, 'BMW');
    await page.locator('.ef-hit input').first().check();
    await expect(page.locator('.ef-chosen__car')).toHaveCount(1);
    await page.getByRole('button', { name: 'Weiter: Reifen' }).click();
    await page.getByRole('tab', { name: /Auflagen/ }).click();
    await page.getByRole('button', { name: 'Code hinzufügen' }).click();
    await page.locator('#ef-new-code-code').fill('QA9');
    await page.locator('#ef-new-code-kind').selectOption('hinweis');

    await page.locator('.ef-define').getByRole('button', { name: 'Speichern' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#ef-new-code-text')).toHaveAttribute('aria-invalid', 'true');
    await page.waitForTimeout(300);

    const on = await focused(page);
    const onText = await page.evaluate(() => document.activeElement?.id === 'ef-new-code-text');

    await page.locator('.ef-define').screenshot({ path: `${SHOTS}/gutachten-10b-auflage-refused-${info.project.name}.png` });

    expect(onText, `after the refusal the focus is on ${on}`).toBe(true);
});
