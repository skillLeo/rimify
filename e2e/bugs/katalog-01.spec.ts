import { expect, test } from '../fixtures';
import { SHOTS, answerCreateWith, firstWheelId, guardWrites, openNeu, pressSave, signIn } from './katalog-support';

/*
 * KATALOG-01 (S1) — after „Neue Felge" is saved once, every later save on the same page is a POST to
 * /admin/felgen/{id}: the server answers 405, the page says „Das hat auf unserer Seite nicht geklappt …
 * Versuch es gleich noch einmal." — and so it does forever, until the page is reloaded (docs/qa/BUGS.md).
 *
 * Edit.vue builds its form once: `useDirtyForm(fromProps(), { method: props.model ? 'put' : 'post', url: () => … })`.
 * The url is a function and follows the new model; the method is a value, fixed at 'post' on /neu. The
 * create is a POST, which Inertia 3 sends with `preserveState: true`, so the redirect to /admin/felgen/{id}
 * keeps this very component (its own `watch(() => props.model?.id, sync)` relies on that). There is no
 * POST route for /admin/felgen/{model} — only GET and PUT.
 *
 * Expected: the second save of the new Felge is a PUT to /admin/felgen/{id}.
 *
 * Nothing is written: the first save is answered in the browser with an existing model's page (as the
 * redirect would end), the second is stopped in the browser and only its method is read.
 */

test('KATALOG-01 the second save of a Felge just created is a PUT, not a POST to /admin/felgen/{id}', async ({ page }, info) => {
    await signIn(page);

    const id = await firstWheelId(page);
    const writes = await guardWrites(page);
    const create = await answerCreateWith(page, id);

    await openNeu(page);

    // The first save — the create.
    await page.locator('#fe-name').fill('QA KATALOG-01 nie gespeichert');
    await pressSave(page);
    await create.posted;
    await page.waitForURL(new RegExp(`/admin/felgen/${id}$`));
    await expect(page.locator('.adm-page__title')).not.toHaveText('Neue Felge');

    // Keep working on it, and save again.
    const description = page.locator('#fe-desc');
    await description.fill(`${await description.inputValue()} QA`);
    await pressSave(page);

    await expect
        .poll(() => writes.stopped.length, { message: 'the second save was never sent' })
        .toBeGreaterThan(0);

    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/katalog-01-second-save-${info.project.name}.png` });

    expect(writes.stopped[0], `the second save went out as „${writes.stopped[0]}"`).toBe(`PUT /admin/felgen/${id}`);
});
