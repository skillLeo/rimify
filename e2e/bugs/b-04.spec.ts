import { expect, test } from '../fixtures';
import { SHOTS, guardWrites, isPhone, signIn, waitForApp } from './gutachten-support';

/*
 * B-04 (S2) — Block B review: on an iPhone „Gültig ab Fertigungsdatum" cannot be typed (the UEB-04 pattern).
 *
 * RecordFields.vue gives the month field `inputmode="numeric"` and the placeholder „03.2021". On iOS that
 * brings up the digits-only number pad — no full stop, no slash, no minus — while
 * ApprovalDocumentRequest::month() reads a month only with a separator (`03.2021`, `3.2021`, `03/2021`,
 * `2021-03`): „032021", all the pad can produce, is refused with „Den Monat können wir nicht lesen. Schreib ihn
 * bitte so: 03.2021." — on the new-document form and in „Angaben ändern". (DateField, used for Prüfdatum and
 * Stand in the same section, shares the keypad; it predates Block B.)
 *
 * The test reads the keypad the field asks for and sends what that keypad can produce — digits only for
 * numeric / decimal / tel, the dotted month otherwise — and expects the server not to refuse the month.
 *
 * Nothing is written: the request is POST /admin/gutachten as JSON with an `upload_key` that cannot pass its
 * rule (`pending/<26>.pdf`), so ApprovalDocumentRequest refuses the whole request with 422 and the controller
 * never runs; the test checks that 422 before it reads anything else.
 */

test('B-04 the production month can be typed with the keypad its field asks for', async ({ page }, info) => {
    test.skip(!isPhone(info.project.name), 'The phone keypad.');

    await signIn(page);
    await guardWrites(page);
    await page.goto('/admin/gutachten/neu', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    await page.locator('.rsf-more__summary').click();

    const field = page.locator('#gn-production');
    await expect(field).toBeVisible();

    const mode = (await field.getAttribute('inputmode')) ?? 'text';
    const digitsOnly = ['numeric', 'decimal', 'tel'].includes(mode);
    const typed = digitsOnly ? '032021' : '03.2021';

    await field.fill(typed);
    await page.screenshot({ path: `${SHOTS}/b-04-month-keypad-${info.project.name}.png` });

    const cookie = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN');

    expect(cookie, 'no XSRF-TOKEN cookie after signing in').toBeDefined();

    const response = await page.request.post('/admin/gutachten', {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': decodeURIComponent(cookie?.value ?? '') },
        data: {
            // Cannot pass `regex:#^pending/[0-9a-z]{26}\.pdf$#`: the request is refused as a whole, nothing is stored.
            upload_key: 'qa-b04-never-a-key',
            kind: 'NACHTRAG',
            kba_number: 'QA-B04',
            supplement_to_id: null,
            supplement_to_number: 'ABE 00000',
            valid_from_production: typed,
        },
    });

    const body = (await response.json().catch(() => ({}))) as { errors?: Record<string, string[]> };

    expect(response.status(), 'guard: the request must be refused as a whole (422), or it might have stored a document').toBe(422);
    expect(Object.keys(body.errors ?? {}), 'guard: the refusal must include the upload key').toContain('upload_key');
    expect(
        body.errors?.valid_from_production?.[0] ?? '',
        `inputmode="${mode}" brings up a keypad without „." or „/"; what it can type, „${typed}", is refused`,
    ).toBe('');
});
