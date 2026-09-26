import { expect, test } from '@playwright/test';
import { SHOTS, bell, isAdminUrl, isInertiaGet, openCentreFromBell, pageInsteadOf, signIn, waitForApp, type AlertItem, type InertiaPage } from './bell-support';

/*
 * BELL-02 (S2) — after reading alerts, the browser's Back shows the old unread count again
 * (docs/qa/BUGS.md).
 *
 * The count is a shared prop (`admin.notifications.unread`) and Inertia 3 answers `popstate` from
 * its history copy of the page (EventHandler.handlePopstateEvent → page.setQuietly) — no request.
 * Nothing in the admin asks the server again. So: a page with 3 unread → Benachrichtigungen →
 * „Alle als gelesen markieren" (bell empty) → Back → the bell says „3" again, the menu offers „Alle
 * als gelesen markieren" once more, and the page stays wrong until the next visit. Forward, and Back
 * after reading one alert from the bell, do the same. The docblock of BenachrichtigungenController::
 * read(): „so the count never lags behind what the reader has seen".
 *
 * Nothing is saved. Every Inertia answer is given 3 unread until the (held) „Alle als gelesen
 * markieren" and 0 after it — including any reload a fix may send on Back — so the test depends
 * neither on the dev database's alerts nor on changing them.
 */
const UNREAD = 3;

test('BELL-02 Back after „Alle als gelesen markieren" does not bring the old count back', async ({ page }) => {
    await signIn(page);
    await waitForApp(page);

    let allRead = false;

    function patch(json: InertiaPage): void {
        const unread = allRead ? 0 : UNREAD;
        const admin = json.props.admin;

        if (admin && typeof admin === 'object') {
            admin.notifications = { ...(admin.notifications ?? {}), unread, offered: true };
        }

        if (json.component === 'Admin/Benachrichtigungen/Index') {
            const items = (json.props.items ?? []).map((item: AlertItem) => ({ ...item, read: allRead ? true : item.read }));

            json.props.items = items;
            json.props.counts = { unread, all: Math.max(json.props.counts?.all ?? 0, UNREAD) };
        }
    }

    // Every page visit and the bell's list, as the server would answer them before and after.
    await page.route(isAdminUrl, async (route) => {
        const request = route.request();
        const url = new URL(request.url());

        if (request.method() === 'GET' && url.pathname === '/admin/benachrichtigungen/neueste') {
            const response = await route.fetch();
            const json = (await response.json()) as { unread?: number; items?: AlertItem[] };

            await route.fulfill({
                response,
                json: { ...json, unread: allRead ? 0 : UNREAD, items: (json.items ?? []).map((i) => ({ ...i, read: allRead ? true : i.read })) },
            });

            return;
        }

        if (!(await isInertiaGet(request))) {
            await route.fallback();

            return;
        }

        const response = await route.fetch();
        const json = (await response.json()) as InertiaPage;

        patch(json);
        await route.fulfill({ response, json });
    });

    // „Alle als gelesen markieren": held, and answered with the page it was sent from, all read.
    await page.route('**/admin/benachrichtigungen/gelesen', async (route) => {
        if (route.request().method() !== 'POST') {
            await route.fallback();

            return;
        }

        allRead = true;

        const response = await pageInsteadOf(route, page.url());
        const json = (await response.json()) as InertiaPage;

        patch(json);
        await route.fulfill({ response, json });
    });

    // 1 · A page with 3 unread (Verkauf › Anfragen), reached the way a click reaches it.
    await page.locator('a[href$="/admin/anfragen"]').first().evaluate((link) => (link as HTMLElement).click());
    await page.waitForURL(/\/admin\/anfragen$/);
    await expect(bell(page)).toHaveAttribute('aria-label', `Benachrichtigungen, ${UNREAD} ungelesen`);

    // 2 · On to Benachrichtigungen, and everything read.
    await openCentreFromBell(page);
    await page.locator('.adm-page__actions').getByRole('button', { name: 'Alle als gelesen markieren' }).click();
    await expect(bell(page)).toHaveAttribute('aria-label', 'Benachrichtigungen');

    // 3 · Back.
    await page.goBack({ waitUntil: 'commit' }).catch(() => null);
    await page.waitForURL(/\/admin\/anfragen$/);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SHOTS}/bell-02-back-${test.info().project.name}.png` });

    await expect(bell(page), 'after Back the bell counts alerts that were read').toHaveAttribute('aria-label', 'Benachrichtigungen');
    await expect(bell(page).locator('.adm-bell__count')).toHaveCount(0);
});
