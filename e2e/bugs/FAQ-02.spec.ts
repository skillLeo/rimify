import { expect, test } from '@playwright/test';
import { SHOTS, listInsteadOf, openFaq, signIn } from './faq-support';

/*
 * FAQ-02 (S2) — the answer to an earlier Speichern closes the dialog the person is writing in
 * NOW, and what they typed there is gone (docs/qa/BUGS.md).
 *
 * save() in Admin/Faq/Index.vue sets `editing.value = null` in onSuccess without asking whether the
 * dialog still belongs to that request, and nothing stops Esc / Abbrechen / the scrim while a save
 * is on its way. On a slow line: Speichern on question A → Esc → open question B (or „Frage
 * anlegen") → type → A's answer arrives → B's dialog closes; reopening B starts from the stored
 * text. remove() does the same to a second „… löschen?" (onFinish nulls `deleting`). And if A's save
 * was refused (a field error), nobody is told: the dialog showing the error is already gone.
 *
 * Nothing is saved: A's PUT is held in the browser and answered with GET /admin/faq; B is left
 * with Esc.
 */
test('FAQ-02 a late answer to an earlier Speichern leaves the next question open, its words kept', async ({ page }) => {
    await signIn(page);
    await openFaq(page);

    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
        release = resolve;
    });

    await page.route(/\/admin\/faq\/\d+$/, async (route) => {
        if (route.request().method() !== 'PUT') {
            await route.continue();

            return;
        }

        await held;
        await route.fulfill({ response: await listInsteadOf(route) });
    });

    const questions = page.locator('.faq-adm__open');
    const dialog = page.getByRole('dialog');

    // 1 · Question A: Speichern, and the answer takes its time.
    await questions.nth(0).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Speichern' }).click();

    // 2 · The person does not wait: Esc, on to question B, and writes.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await questions.nth(1).click();
    await expect(dialog).toBeVisible();

    const typed = 'QA FAQ-02 – diese Antwort darf nicht verschwinden.';

    await page.locator('#faq-answer').fill(typed);

    // 3 · A's answer arrives.
    const answered = page.waitForResponse((r) => /\/admin\/faq\/\d+$/.test(new URL(r.url()).pathname) && r.request().method() === 'PUT');

    release();
    await answered;
    await page.waitForTimeout(1_000);
    await page.screenshot({ path: `${SHOTS}/faq-02-late-answer-${test.info().project.name}.png` });

    await expect(dialog, 'the answer to question A closed the dialog of question B').toBeVisible();
    await expect(page.locator('#faq-answer'), 'what was typed into question B').toHaveValue(typed);

    // Nothing is saved: B is left without Speichern.
    await page.keyboard.press('Escape');
});
