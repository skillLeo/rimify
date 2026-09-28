import { expect, test } from '../fixtures';
import { SHOTS, firstWheelId, guardWrites, openFelge, pressSave, signIn } from './katalog-support';

/*
 * KATALOG-04 (S2) — „Verwerfen" after a refused save puts the saved values back but keeps every red
 * sentence: „Bitte gib den Namen des Modells ein." under the model's restored name, „Eine Angabe muss noch
 * korrigiert werden." above the form — while the save bar says „Keine Änderungen" (docs/qa/BUGS.md).
 *
 * Edit.vue shows `{ ...page.props.errors, ...form.errors }`. `discard()` (useDirtyForm) resets the form and
 * clears `form.errors`; the page's own `props.errors`, which Inertia keeps until the next answer, stay.
 *
 * Expected: after „Verwerfen" the form is as it was before the save — no error on any field.
 *
 * Nothing is written: the save sent has an empty Modell, which WheelModelRequest refuses (`name` required);
 * any other save is stopped in the browser.
 */

test('KATALOG-04 „Verwerfen" after a refused save clears the refusal', async ({ page }, info) => {
    await signIn(page);

    const id = await firstWheelId(page);
    await guardWrites(page);

    // Only a save with an empty Modell may reach the server.
    await page.route(
        (url) => url.pathname === `/admin/felgen/${id}`,
        async (route) => {
            const request = route.request();

            if (request.method() !== 'PUT') {
                await route.fallback();

                return;
            }

            const body = JSON.parse(request.postData() ?? '{}') as { name?: unknown };

            if (typeof body.name === 'string' && body.name.trim() === '') {
                await route.continue();
            } else {
                await route.abort();
            }
        },
    );

    await openFelge(page, id);

    const name = page.locator('#fe-name');
    const saved = await name.inputValue();

    await name.fill('');
    await pressSave(page);
    await expect(name).toHaveAttribute('aria-invalid', 'true');

    await page.getByRole('button', { name: 'Verwerfen' }).click();
    await expect(name).toHaveValue(saved);
    await expect(page.locator('.adm-savebar__status')).toHaveText('Keine Änderungen');

    await page.screenshot({ path: `${SHOTS}/katalog-04-after-discard-${info.project.name}.png` });

    const left = await page.evaluate(() => ({
        invalid: document.querySelector('#fe-name')?.getAttribute('aria-invalid') ?? null,
        under: document.querySelector('#fe-name-err')?.textContent?.trim() ?? '',
        summary: [...document.querySelectorAll('.adm-alert')].map((el) => el.textContent?.trim() ?? '').filter((t) => t.includes('korrigiert')),
    }));

    expect(
        left.invalid === 'true' || left.under !== '' || left.summary.length > 0,
        `after „Verwerfen" the restored name „${saved}" still reads „${left.under}"; above the form: ${left.summary.join(' | ') || '–'}`,
    ).toBe(false);
});
