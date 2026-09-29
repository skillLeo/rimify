import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { expect, test } from '../fixtures';
import { SHOTS, fakePhoto, guardWrites, openFelgeWithPhotos, signIn } from './k2-support';

/*
 * K2-29 (S2) — a colour's photo (FinishPhotos.vue, FilePick.vue): a file that changed on disk after it was
 * chosen cannot be uploaded, and the page says the connection is gone (docs/qa/BUGS.md, re-review of
 * 2026-09-28).
 *
 * The server's own refusal leads there: „Das Bild ist größer als 10 MB. Verkleinere es bitte und lad es noch
 * einmal hoch." A person shrinks the photo and saves it over itself (Paint, Vorschau …). The form still holds
 * the File chosen before — FilePick keeps it and never empties its input, so choosing the same file again in
 * the picker fires no `change` and changes nothing. FilePick read the file's size for its line („… · 14,2 MB"),
 * so the browser holds its snapshot; the upload of a file whose modification time moved since is refused by
 * Chromium's network stack (net::ERR_UPLOAD_FILE_CHANGED). Inertia reports a network error and the admin
 * says „Keine Verbindung zum Server … Prüf die Verbindung" — on every retry, until the person cancels the
 * form or renames the file.
 *
 * Expected: the new file is taken, or the form asks for the file again in a sentence — never a claim that
 * the connection is gone.
 *
 * Nothing is written. The photos exist only in the test's browser (k2-support). The upload is let through to
 * the network — the file must really be read for the defect to show — but to an address that does not exist
 * (`/admin/qa-k2-29-nicht-vorhanden`, answered 404), so nothing is stored whatever happens. Every other write
 * under /admin/felgen and /admin/katalog is aborted (guardWrites). The photo file is written to the test's
 * own output folder and removed at the end.
 *
 * If this test passes on the code it was written against, the defect does not reproduce in Chromium and
 * K2-29 is to be closed, not the test changed.
 */

const P1 = 2147480291;

async function jpeg(side: number, shade: number): Promise<Buffer> {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}"><rect width="${side}" height="${side}" fill="#e9ebee"/><circle cx="${side / 2}" cy="${side / 2}" r="${side / 3}" fill="rgb(${shade},${shade + 4},${shade + 10})"/></svg>`;

    return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}

test('K2-29 a photo saved anew after it was chosen is uploaded or asked for again — never „Keine Verbindung"', async ({ page }, info) => {
    const file = info.outputPath('qa-k2-29-foto.jpg');

    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, await jpeg(1800, 60));

    const failed: string[] = [];

    page.on('requestfailed', (request) => failed.push(`${request.method()} ${new URL(request.url()).pathname}: ${request.failure()?.errorText ?? '?'}`));

    try {
        await signIn(page);
        await guardWrites(page);

        const felge = await openFelgeWithPhotos(page, [fakePhoto(P1, 'QA-Foto eins, Ansicht von vorn')]);
        const upload = `/admin/felgen/${felge.modelId}/ausfuehrungen/${felge.finishId}/foto`;

        // The upload goes out — its file is read and sent — but to an address that stores nothing.
        await page.route(
            (url) => url.pathname === upload,
            async (route) => {
                if (route.request().method() !== 'POST') {
                    await route.fallback();

                    return;
                }

                await route.continue({ url: new URL('/admin/qa-k2-29-nicht-vorhanden', route.request().url()).toString() });
            },
        );

        const box = page.locator('.fe-photos').first();

        await page.locator(`#fe-photo-${felge.finishId}-start`).press('Enter');
        await page.locator(`#fe-photo-${felge.finishId}-file`).setInputFiles(file);
        await expect(box.locator('.adm-filepick__name')).toContainText('qa-k2-29-foto.jpg');
        await box.getByLabel('Was zeigt das Foto?', { exact: true }).fill('QA-Foto zwei, schräg von der Seite');

        // „Verkleinere es bitte“: the same photo, made smaller and saved over itself.
        fs.writeFileSync(file, await jpeg(900, 80));
        const later = new Date(Date.now() + 10_000);
        fs.utimesSync(file, later, later);

        await box.getByRole('button', { name: 'Hochladen' }).press('Enter');
        await page.waitForTimeout(3000);

        const offline = await page.getByText('Keine Verbindung zum Server', { exact: false }).count();
        const changed = failed.filter((line) => line.includes('UPLOAD_FILE_CHANGED'));

        await page.screenshot({ path: `${SHOTS}/k2-29-changed-file-${info.project.name}.png` });

        expect(
            { uploadRefusedByBrowser: changed, saysNoConnection: offline > 0 },
            `after the chosen photo was saved anew: failed requests ${JSON.stringify(failed)}`,
        ).toEqual({ uploadRefusedByBrowser: [], saysNoConnection: false });
    } finally {
        fs.rmSync(file, { force: true });
    }
});
