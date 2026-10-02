import { expect, test, type Page } from '../fixtures';
import { consentGiven } from '../support';
import { SHOP_FEEDBACK_BASE, SHOTS, feedbackDialog, guardSends, openFeedback, openShop, signIn } from './shop-feedback-support';

test.use({ baseURL: SHOP_FEEDBACK_BASE });

/*
 * SHOP-FEEDBACK-01 (S1) — a send that fails puts Inertia's developer error over the shop; without a connection nothing
 * is said at all (docs/qa/BUGS.md).
 *
 * „Senden“ posts to /admin/review/rueckmeldungen. Every failure there — the page open longer than the session (419), the
 * sign-in gone (401), 30 points a minute (429), a server error (500) — is answered by AdminErrorPage::formFailure() with
 * JSON `{ message }` and no X-Inertia header, because the request is an Inertia write under /admin. In the admin,
 * AdminLayout catches that (`httpException` → a toast with the server's sentence; `networkError` → „Keine Verbindung …“).
 * On the shop's pages nobody does: FeedbackDialog passes no `onHttpException`/`onNetworkError` and AppLayout/MobileLayout
 * register no handler, so @inertiajs/core 3.7.1 (`handleNonInertiaResponse` → `dialog_default.show`) opens its own modal:
 * „All Inertia requests must receive a valid Inertia response, however a plain JSON response was received.“ followed by
 * the raw JSON — in English, over the shop and over the feedback dialog. Offline, the request rejects unhandled, „Senden“
 * comes back and nothing on screen says the point did not arrive.
 *
 * Expected: the feedback dialog stays open with the sentence, and says the point was not sent (the server's own sentence
 * is there for it); no developer dialog. Writes nothing: the POST is answered in the browser — with exactly the JSON the
 * server sends for a 500 — or aborted.
 */

const SENTENCE = 'QA SHOP-FEEDBACK-01: ein Satz nur in diesem Test.';
const SERVER_FAILURE = 'Das hat auf unserer Seite nicht geklappt. Es wurde nichts gespeichert, deine Eingaben sind noch da. Versuch es gleich noch einmal.';
const SAID = /nicht geklappt|nicht gesendet|nicht angekommen|nichts? gespeichert|keine verbindung|offline/i;

async function failureSaid(page: Page): Promise<boolean> {
    const places = page.locator('[role="dialog"], .toast-viewport, [role="alert"]').filter({ hasText: SAID }).filter({ visible: true });

    return (await places.count()) > 0;
}

async function prepare(page: Page): Promise<void> {
    await consentGiven(page.context(), SHOP_FEEDBACK_BASE);
    await signIn(page);
    await guardSends(page);
    await openShop(page, '/kontakt');

    const dialog = await openFeedback(page);

    await dialog.locator('#fb-sentence').fill(SENTENCE);
}

test('SHOP-FEEDBACK-01a a send the server refuses is said in the dialog, never as a developer error', async ({ page }, info) => {
    test.setTimeout(90_000);
    await prepare(page);

    await page.route(
        (url) => url.pathname === '/admin/review/rueckmeldungen',
        async (route) => {
            if (route.request().method() !== 'POST') {
                await route.fallback();

                return;
            }

            // What AdminErrorPage::formFailure(500) answers an Inertia write under /admin.
            await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: SERVER_FAILURE }) });
        },
    );

    const dialog = feedbackDialog(page);

    await dialog.getByRole('button', { name: 'Senden' }).click();
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: `${SHOTS}/shop-feedback-01a-server-failure-${info.project.name}.png` });

    const developerDialog = await page.locator('dialog#inertia-error-dialog').count();
    const stillOpen = await dialog.isVisible();
    const kept = stillOpen ? await dialog.locator('#fb-sentence').inputValue() : null;
    const said = await failureSaid(page);

    expect(
        { developerDialog, stillOpen, kept, said },
        'after a refused send: Inertia\'s own error dialog (dialog#inertia-error-dialog) over the shop, and nothing in the shop\'s words',
    ).toEqual({ developerDialog: 0, stillOpen: true, kept: SENTENCE, said: true });
});

test('SHOP-FEEDBACK-01b a send without a connection says it did not arrive', async ({ page }, info) => {
    test.setTimeout(90_000);
    await prepare(page);

    const unhandled: string[] = [];

    page.on('pageerror', (error) => unhandled.push(error.message));

    await page.route(
        (url) => url.pathname === '/admin/review/rueckmeldungen',
        async (route) => {
            if (route.request().method() !== 'POST') {
                await route.fallback();

                return;
            }

            await route.abort('internetdisconnected');
        },
    );

    const dialog = feedbackDialog(page);

    await dialog.getByRole('button', { name: 'Senden' }).click();
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: `${SHOTS}/shop-feedback-01b-offline-${info.project.name}.png` });

    const stillOpen = await dialog.isVisible();
    const kept = stillOpen ? await dialog.locator('#fb-sentence').inputValue() : null;
    const said = await failureSaid(page);

    expect(
        { stillOpen, kept, said },
        `offline: „Senden“ comes back and nothing says the point did not arrive${unhandled.length > 0 ? ` (unhandled in the page: ${unhandled.join(' | ')})` : ''}`,
    ).toEqual({ stillOpen: true, kept: SENTENCE, said: true });
});
