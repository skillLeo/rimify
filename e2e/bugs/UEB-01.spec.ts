import { expect, test, type Route } from '../fixtures';
import { SHOTS, inertiaHeaders, openUebersicht, routeCharts, signIn, widget } from './ueb-support';

/*
 * UEB-01 (S1) — when the charts' request fails, the Übersicht either disappears or keeps five
 * skeletons for good (docs/qa/BUGS.md).
 *
 * The charts come a moment after the page, as one deferred prop (`Inertia::defer`, no `rescue`), and
 * neither Uebersicht/Index.vue nor CoverageRow.vue gives <Deferred> a `#rescue` slot or uses
 * DashWidget's own `error` state („Erneut versuchen"). So:
 *
 *   app-500  — a chart query that throws is answered by bootstrap/app.php → ErrorPage with the SHOP's
 *              Inertia page `Fehler/Index` (status 500, X-Inertia). Inertia 3 swaps an async answer of
 *              another component in (Response::shouldSetPage), and AdminLayout lets every answer with
 *              X-Inertia through: the whole Übersicht — figures, tables, rail — is replaced by the
 *              storefront's error page, under the address /admin.
 *   bare-500 — a 500 without Inertia (proxy, PHP fatal): a toast „Die Seite konnte nicht geladen
 *              werden. Versuch es gleich noch einmal." and the skeletons stay, aria-busy="true", for good.
 *   offline  — the connection drops: the same, with the offline toast.
 *
 * Expected: the page stays; each chart widget says it could not load and offers „Erneut versuchen"
 * (DashWidget's designed error state, BRIEF: every widget has four states).
 *
 * Nothing is written: the charts' GET is answered in the browser. For app-500 the answer is the
 * app's own error page, fetched from the running app for an address that does not exist
 * (`/qa-ueb-01-…`, a 404 with the same Inertia headers) and sent back with status 500 — exactly what
 * ErrorPage::page() returns for a failing query.
 */

async function answerLikeTheApp(route: Route): Promise<void> {
    const request = route.request();
    const asked = new URL(request.url());
    const probe = await route.fetch({
        url: new URL('/qa-ueb-01-diese-seite-gibt-es-nicht', asked).toString(),
        method: 'GET',
        headers: await inertiaHeaders(request),
    });
    const headers = probe.headers();

    if (headers['x-inertia'] === undefined) {
        throw new Error(`the shop's error page did not come back as an Inertia page (HTTP ${probe.status()})`);
    }

    const page = (await probe.json()) as { url: string; props: Record<string, unknown> };

    page.props.status = 500;
    page.url = `${asked.pathname}${asked.search}`;

    await route.fulfill({
        status: 500,
        headers: Object.fromEntries(
            Object.entries(headers).filter(([name]) => !['content-length', 'content-encoding', 'transfer-encoding'].includes(name)),
        ),
        body: JSON.stringify(page),
    });
}

for (const failure of ['app-500', 'bare-500', 'offline'] as const) {
    test(`UEB-01 the charts fail to load (${failure}): the Übersicht stays and each chart offers a retry`, async ({ page }) => {
        await signIn(page);

        let rigError: string | null = null;
        let settle: () => void = () => undefined;
        const answered = new Promise<void>((resolve) => {
            settle = () => resolve();
        });

        await routeCharts(page, async (route) => {
            try {
                if (failure === 'offline') {
                    await route.abort('internetdisconnected');
                } else if (failure === 'bare-500') {
                    await route.fulfill({
                        status: 500,
                        contentType: 'text/html; charset=utf-8',
                        body: '<!doctype html><title>500 Internal Server Error</title><h1>Internal Server Error</h1>',
                    });
                } else {
                    await answerLikeTheApp(route);
                }
            } catch (error) {
                rigError = String(error);
                await route.abort('failed').catch(() => undefined);
            }

            settle();
        });

        await openUebersicht(page);
        await answered;
        expect(rigError, 'test rig').toBeNull();

        await page.waitForTimeout(1_500);
        await page.screenshot({ path: `${SHOTS}/ueb-01-${failure}-${test.info().project.name}.png` });

        await expect(page, 'the address left the Übersicht').toHaveURL(/\/admin(\?|$)/);
        await expect(
            page.getByRole('heading', { level: 1, name: 'Übersicht' }),
            "the Übersicht was replaced by another page (the shop's error page)",
        ).toBeVisible();
        await expect(page.locator('.kpi').first(), 'the figures that had arrived are gone').toBeVisible();

        const umsatz = widget(page, 'Umsatz über die Zeit');

        await expect(umsatz, 'the Umsatz widget is gone').toHaveCount(1);
        await expect(
            umsatz.getByRole('button', { name: /erneut versuchen/i }),
            'no error state with a retry: the skeleton stays on screen for good',
        ).toBeVisible({ timeout: 5_000 });
        await expect(umsatz, 'still announced as loading').not.toHaveAttribute('aria-busy', 'true');
    });
}
