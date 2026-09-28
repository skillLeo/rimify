import { expect, test } from '../fixtures';
import { SHOTS, answerPhotoWrites, fakePhoto, focusFell, guardWrites, openFelgeWithPhotos, signIn } from './k2-support';

/*
 * K2-04 (S2) — keyboard on a colour's photos (FinishPhotos.vue): after three of its actions the focus falls
 * to `<body>`, and the next Tab starts again at „Zum Inhalt springen" (docs/qa/BUGS.md):
 *
 *   a) „Hochladen" — the form (and the button pressed) goes; `onSuccess` sends the focus to „Foto
 *      hinzufügen";
 *   b) Enter in „Was zeigt das Foto?" (a description saved) — the field goes; `onSuccess` sends the focus to
 *      the photo's „⋯";
 *   c) „Entfernen" in the photo's menu → the dialog's „Entfernen" — `onSuccess` sends the focus to „Foto
 *      hinzufügen".
 *
 * Each target is `:disabled="busy"`, and `busy` is only cleared in `onFinish`, which Inertia 3.7 calls
 * several microtasks after `onSuccess` (Response.process → Queue → Request.send's `.finally`), while
 * `focus()` runs at the next tick. A disabled button takes no focus: the call does nothing. The reorder
 * (`order()`) already does it right — it focuses in `onFinish`.
 *
 * Expected: the focus on „Foto hinzufügen", on the photo's „⋯", on „Foto hinzufügen" — anything but
 * `<body>`.
 *
 * Nothing is written. The photos exist only in the test's browser (the first draft Felge's first colour is
 * shown with them), and each write is answered in the browser with the Felge's page as the server would
 * have it afterwards; every other non-GET under /admin/felgen and /admin/katalog is aborted (guardWrites).
 */

const P1 = 2147480001;
const P2 = 2147480002;
const P3 = 2147480003;

function twoPhotos() {
    return [fakePhoto(P1, 'QA-Foto eins, Ansicht von vorn'), fakePhoto(P2, 'QA-Foto zwei, schräg von der Seite')];
}

test('K2-04a after „Hochladen" the focus stays with the photos', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const felge = await openFelgeWithPhotos(page, twoPhotos());

    await answerPhotoWrites(page, felge, (request, f) => {
        if (request.method() === 'POST') {
            f.photos = [...f.photos, fakePhoto(P3, 'QA-Foto drei, Detail der Speichen')];
        }
    });

    const box = page.locator('.fe-photos').first();
    const start = page.locator(`#fe-photo-${felge.finishId}-start`);

    await start.press('Enter');
    await page.locator(`#fe-photo-${felge.finishId}-file`).setInputFiles({ name: 'qa-k2-04.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('nur im Browser') });
    await box.getByLabel('Was zeigt das Foto?', { exact: true }).fill('QA-Foto drei, Detail der Speichen');
    await box.getByRole('button', { name: 'Hochladen' }).press('Enter');

    await expect(box.locator('.fe-photos__item')).toHaveCount(3);
    await expect(start).toBeEnabled();
    await page.waitForTimeout(300);

    const focus = await focusFell(page);
    await box.screenshot({ path: `${SHOTS}/k2-04a-after-hochladen-${info.project.name}.png` });

    expect(focus.fell, `after „Hochladen" the focus is on ${focus.on}`).toBe(false);
});

test('K2-04b after a description is saved with Enter the focus stays on the photo', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const felge = await openFelgeWithPhotos(page, twoPhotos());
    const text = 'QA-Foto eins, Ansicht von vorn, neu beschrieben';

    await answerPhotoWrites(page, felge, (request, f) => {
        if (request.method() === 'PUT') {
            const body = request.postDataJSON() as { alt?: string };
            const id = Number(new URL(request.url()).pathname.split('/').pop());

            f.photos = f.photos.map((p) => (p.id === id ? { ...p, alt: body.alt ?? p.alt } : p));
        }
    });

    const box = page.locator('.fe-photos').first();
    const more = page.locator(`[data-focus="fe-photo-${felge.finishId}-more-${P1}"]`);

    await more.press('Enter');
    await page.getByRole('menuitem', { name: 'Beschreibung ändern' }).press('Enter');

    const field = page.locator(`#fe-photo-${felge.finishId}-alt-${P1}`);

    await expect(field).toBeFocused();
    await field.fill(text);
    await field.press('Enter');

    await expect(box.getByText(text, { exact: true })).toBeVisible();
    await expect(more).toBeEnabled();
    await page.waitForTimeout(300);

    const focus = await focusFell(page);
    await box.screenshot({ path: `${SHOTS}/k2-04b-after-beschreibung-${info.project.name}.png` });

    expect(focus.fell, `after saving the description the focus is on ${focus.on}`).toBe(false);
});

test('K2-04c after a photo is removed from the keyboard the focus stays with the photos', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    const felge = await openFelgeWithPhotos(page, twoPhotos());

    await answerPhotoWrites(page, felge, (request, f) => {
        if (request.method() === 'DELETE') {
            const id = Number(new URL(request.url()).pathname.split('/').pop());

            f.photos = f.photos.filter((p) => p.id !== id);
        }
    });

    const box = page.locator('.fe-photos').first();
    const start = page.locator(`#fe-photo-${felge.finishId}-start`);

    await page.locator(`[data-focus="fe-photo-${felge.finishId}-more-${P1}"]`).press('Enter');
    await page.getByRole('menuitem', { name: 'Entfernen' }).press('Enter');

    const dialog = page.getByRole('dialog');

    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Entfernen', exact: true }).press('Enter');

    await expect(dialog).toBeHidden();
    await expect(box.locator('.fe-photos__item')).toHaveCount(1);
    await expect(start).toBeEnabled();
    await page.waitForTimeout(300);

    const focus = await focusFell(page);
    await box.screenshot({ path: `${SHOTS}/k2-04c-after-entfernen-${info.project.name}.png` });

    expect(focus.fell, `after removing a photo the focus is on ${focus.on}`).toBe(false);
});
