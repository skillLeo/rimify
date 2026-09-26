import { expect, test } from '@playwright/test';
import { SHOTS, openEditor, signIn } from './seiten-support';

/*
 * SEI-02 (S1) — a Speichern the server answers with a failure page throws the editor away: the
 * shop's own error page (storefront header, no admin rail) replaces it, the address bar shows the
 * PUT-only URL /admin/seiten/{id}/entwurf, and everything typed is gone (docs/qa/BUGS.md).
 *
 * The case run here is the everyday one: the session ran out while the person was writing. The
 * browser still holds its XSRF cookie, so the CSRF check answers 419. AdminErrorPage::handles()
 * only takes a failure when the admin guard still has somebody — after an expiry it has nobody —
 * so ErrorPage renders the shop's Inertia page "Fehler/Index", and Inertia swaps it in because
 * the response carries X-Inertia. A 500, and a 403 after a role change, take the same road.
 *
 * AdminErrorPage's own promise for exactly this: "the person goes back to the form they were
 * filling, what they typed kept, with one sentence saying what happened". admin-shell.md §9.4:
 * "A mutation failure is a toast plus the field errors, because the page … is still valid."
 *
 * Nothing is saved: the request is refused before any controller runs.
 */
test('SEI-02 Speichern after the session ran out keeps the editor and the words', async ({ page, context }) => {
    await signIn(page);
    await openEditor(page, 'Impressum');

    const editorUrl = page.url();
    const typed = 'Impressum QA SEI-02';

    await page.locator('#pg-title').fill(typed);

    // The session ends (idle past SESSION_LIFETIME, a cleared session store, a server restart with
    // file sessions): the session cookie is gone, the XSRF cookie is still there.
    // Laravel's session cookie: named `<app>-session` unless SESSION_COOKIE says otherwise, and the
    // only HttpOnly cookie besides a remember-me one (the sign-in here does not tick it).
    const cookies = await context.cookies();
    const session =
        cookies.find((cookie) => /(^|[-_])session$/i.test(cookie.name)) ??
        cookies.find((cookie) => cookie.httpOnly && cookie.name !== 'XSRF-TOKEN' && !cookie.name.startsWith('remember_'));

    expect(session, 'a session cookie after signing in').toBeDefined();
    await context.clearCookies({ name: session!.name });

    const answer = page.waitForResponse((r) => r.url().includes('/entwurf') && r.request().method() === 'PUT');

    await page.locator('.adm-savebar__save').click();

    const response = await answer;

    await page.waitForTimeout(1_500);
    await page.screenshot({ path: `${SHOTS}/sei-02-expired-${test.info().project.name}.png`, fullPage: true });

    expect(page.url(), `the server answered ${response.status()}; the browser left the editor for ${page.url()}`).toBe(editorUrl);
    await expect(page.locator('#pg-title'), 'the typed title is still in its field').toHaveValue(typed);
});
