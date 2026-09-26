import { expect, test, type Page } from '@playwright/test';
import {
    SHOTS,
    focused,
    isAdminUrl,
    isInertiaGet,
    openCentreFromBell,
    pageInsteadOf,
    signIn,
    syntheticAlert,
    waitForApp,
    type AlertItem,
    type InertiaPage,
} from './bell-support';

/*
 * BELL-03 (S2) — on /admin/benachrichtigungen, marking read from the keyboard drops focus to <body>
 * (docs/qa/BUGS.md).
 *
 * a) An unread alert's title is a button (open → POST …/gelesen). Every alert today has no page of
 *    its own (the targets admin.bestellungen.show, admin.konflikte.show and admin.warteschlange.index
 *    are not built), so the answer re-renders it as read, and a read alert without a page is drawn as
 *    a <p> (`v-if="item.href || !item.read"`): the focused button is removed. In the „Ungelesen"
 *    filter the whole row goes.
 * b) „Alle als gelesen markieren" sits in the #primary slot, drawn only while something is unread:
 *    after its own answer the button — and the header's action row — are removed.
 * Either way the next Tab starts again at „Zum Inhalt springen" — through the rail, the topbar and
 * the tabs — to reach the next alert. admin-shell.md §10: focus is never lost.
 *
 * Nothing is saved: the POSTs are held and answered with the page as it stands, the alert marked
 * read in the browser. The first alert on the page is made unread and without a page in the browser,
 * so the test does not depend on the dev database's alerts.
 */

interface State {
    read: Set<string>;
    allRead: boolean;
}

function patchCentre(json: InertiaPage, state: State): void {
    if (json.component !== 'Admin/Benachrichtigungen/Index') {
        return;
    }

    const source: AlertItem[] = Array.isArray(json.props.items) && json.props.items.length > 0 ? json.props.items : [syntheticAlert(0)];
    const items = source.map((item, index) => ({
        ...item,
        href: index === 0 ? null : item.href,
        read: state.allRead || state.read.has(item.id) ? true : index === 0 ? false : item.read,
    }));
    const unread = items.filter((item) => !item.read).length;

    json.props.items = items;
    json.props.counts = { unread, all: Math.max(json.props.counts?.all ?? 0, items.length) };

    if (json.props.admin?.notifications) {
        json.props.admin.notifications.unread = unread;
    }
}

async function holdCentre(page: Page, state: State): Promise<void> {
    await page.route(isAdminUrl, async (route) => {
        const request = route.request();

        if (!(await isInertiaGet(request))) {
            await route.fallback();

            return;
        }

        const response = await route.fetch();
        const json = (await response.json()) as InertiaPage;

        patchCentre(json, state);
        await route.fulfill({ response, json });
    });

    // One alert read (…/{uuid}/gelesen) or all of them (…/gelesen): held, answered with the page.
    await page.route(/\/admin\/benachrichtigungen\/(?:([0-9a-f-]{36})\/)?gelesen$/, async (route) => {
        const request = route.request();

        if (request.method() !== 'POST') {
            await route.fallback();

            return;
        }

        const id = /\/benachrichtigungen\/([0-9a-f-]{36})\/gelesen$/.exec(new URL(request.url()).pathname)?.[1];

        if (id) {
            state.read.add(id);
        } else {
            state.allRead = true;
        }

        const response = await pageInsteadOf(route, page.url());
        const json = (await response.json()) as InertiaPage;

        patchCentre(json, state);
        await route.fulfill({ response, json });
    });
}

test('BELL-03a Enter on an unread alert keeps the keyboard in the list', async ({ page }) => {
    const state: State = { read: new Set(), allRead: false };

    await signIn(page);
    await waitForApp(page);
    await holdCentre(page, state);
    await openCentreFromBell(page);

    const title = page.locator('.bn-item').first().locator('.bn-item__title--button');

    await expect(title).toBeVisible();
    await title.focus();

    const answered = page.waitForResponse((r) => /\/gelesen$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST');

    await page.keyboard.press('Enter');
    await answered;
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/bell-03a-focus-after-read-${test.info().project.name}.png`, fullPage: true });

    const onBody = await page.evaluate(() => document.activeElement === null || document.activeElement === document.body);

    expect(onBody, `after marking the alert read the focus is on ${await focused(page)}`).toBe(false);
});

test('BELL-03b Enter on „Alle als gelesen markieren" keeps the keyboard on the page', async ({ page }) => {
    const state: State = { read: new Set(), allRead: false };

    await signIn(page);
    await waitForApp(page);
    await holdCentre(page, state);
    await openCentreFromBell(page);

    const all = page.locator('.adm-page__actions').getByRole('button', { name: 'Alle als gelesen markieren' });

    await expect(all).toBeVisible();
    await all.focus();

    const answered = page.waitForResponse((r) => new URL(r.url()).pathname === '/admin/benachrichtigungen/gelesen' && r.request().method() === 'POST');

    await page.keyboard.press('Enter');
    await answered;
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/bell-03b-focus-after-read-all-${test.info().project.name}.png` });

    const onBody = await page.evaluate(() => document.activeElement === null || document.activeElement === document.body);

    expect(onBody, `after „Alle als gelesen markieren" the focus is on ${await focused(page)}`).toBe(false);
});
