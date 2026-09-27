import { expect, test } from '@playwright/test';
import type { DashboardOrderRow } from '../../resources/js/types/admin/uebersicht';
import { SHOTS, isInertiaGet, isPhone, signIn, waitForApp, widget } from './ueb-support';

/*
 * UEB-08 (S2) — „Neueste Bestellungen" at 1280 px: the table is wider than its widget; Versand and
 * Alter are cut off at the right edge (docs/qa/BUGS.md).
 *
 * At 1280 px the widget spans 7 of 12 columns: ≈ 546 px for the table with the rail open
 * (1280 − 260 rail − 2 × 32 page padding; 7/12 of the grid; ± the widget's padding). Its six
 * columns are `white-space: nowrap` — number, customer, amount, two state chips, age — and need
 * ≈ 630 px with ordinary data. RecentOrders.vue caps the customer with `max-width: 16ch` on the
 * `<td>`, which table layout does not apply to a cell, so a long name or an e-mail address (the
 * fallback when an order has no name) widens it further. `.dt-wrap { overflow-x: auto }` then scrolls
 * the table inside the widget with no sign that there is more: the reader sees neither the shipping
 * state nor how old the order is.
 *
 * Expected: at 1280 px every column is in view (the customer truncated with an ellipsis if need be).
 *
 * Nothing is written: the page is opened with an Inertia visit (the rail's Übersicht) whose answer
 * gets a long customer name and a 9.999,00 € order in the browser (content extremes).
 */

const LONG = 'Maximiliane Mustermann-Schmidt-Leutheusser';

test('UEB-08 Neueste Bestellungen: at 1280 px every column is in view', async ({ page }, info) => {
    test.skip(isPhone(info.project.name), 'A laptop width.');

    await page.setViewportSize({ width: 1280, height: 900 });
    await signIn(page);
    await page.goto('/admin?zeitraum=30', { waitUntil: 'networkidle' });
    await waitForApp(page);

    await page.route(
        (url) => url.pathname === '/admin',
        async (route) => {
            const request = route.request();

            if (!(await isInertiaGet(request)) || (await request.headerValue('x-inertia-partial-data')) !== null) {
                await route.fallback();

                return;
            }

            const response = await route.fetch();
            const json = (await response.json()) as { props: { recentOrders?: DashboardOrderRow[] | null } };
            const orders = json.props.recentOrders;
            const first = Array.isArray(orders) ? orders[0] : undefined;

            if (first) {
                first.customer = LONG;
                first.total = 999_900;
            } else {
                json.props.recentOrders = [
                    {
                        id: 990001,
                        number: 'QA-2026-099001',
                        customer: LONG,
                        total: 999_900,
                        payment: { label: 'Bezahlt', tone: 'plain' },
                        fulfilment: { label: 'In Bearbeitung', tone: 'warn' },
                        ago: 'vor 12 Tagen',
                        iso: null,
                        demo: false,
                        href: '/admin/bestellungen?q=QA-2026-099001',
        customerHref: null,
                    },
                ];
            }

            await route.fulfill({ response, json });
        },
    );

    // The rail's own „Übersicht": an Inertia visit to the page as it stands (no Zeitraum is asked for).
    await page.locator('a.adm-rail__item[href="/admin"]').evaluate((link) => (link as HTMLElement).click());
    await expect(page.locator('.dt').getByText(LONG)).toBeVisible();

    const rail = await page.locator('.adm').getAttribute('data-rail');
    const wrap = page.locator('.dt-wrap');
    const hidden = await wrap.evaluate((el) => el.scrollWidth - el.clientWidth);

    await widget(page, 'Neueste Bestellungen').screenshot({ path: `${SHOTS}/ueb-08-neueste-bestellungen-1280-${info.project.name}.png` });

    expect(hidden, `the table is ${hidden} px wider than its widget (rail ${rail}): the columns on the right are cut off`).toBeLessThanOrEqual(1);
});
