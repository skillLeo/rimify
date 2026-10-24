import { expect, test, type Page, type Route } from './fixtures'
import { inertiaHeaders, isInertiaGet } from './bugs/bell-support'
import { signIn, waitForApp } from './bugs/faq-support'
import { onDemoDay } from './bugs/ueb-support'

/*
 * The Übersicht as the M1 proof shows it (docs/launch/STATUS.md): filled with the demo set at 1440
 * and 390, and on a shop's first day — the `dashboard-empty` baseline. The empty page is the real
 * page on the real client code: a visit whose answer carries a fresh database's props (the props
 * DashboardEmptyStateTest.php asserts), so nothing is hydrated against other markup.
 */

const SHOTS = 'docs/qa/shots/M1'

async function settle(page: Page): Promise<void> {
    // The charts arrive a moment after the page; the lines and bars grow in once (≤ 300 ms).
    await expect(page.locator('.widget[aria-busy="true"]')).toHaveCount(0, { timeout: 20_000 })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(500)
}

test('the Übersicht, filled with the demo set', async ({ page }, info) => {
    await signIn(page)
    // Filled on the demo set's last day, whatever the calendar says (D-337).
    await onDemoDay(page)
    await page.goto('/admin?zeitraum=30', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await settle(page)

    await expect(page.locator('.kpi__value').first()).toContainText('€')
    await expect(page.locator('.lc')).toBeVisible()
    await page.screenshot({ path: `${SHOTS}/dashboard-${info.project.name === 'mobile-390' ? '390' : '1440'}-filled.png`, fullPage: true })
})

/** A fresh shop's Übersicht, in the shape the server sends it (DashboardEmptyStateTest.php). */
function emptyProps(props: Record<string, unknown>): Record<string, unknown> {
    const kpi = (key: string, label: string, hint: string, value: number | null, unit: 'EUR' | null, text: string, kind: string) => ({
        key,
        label,
        hint,
        value,
        unit,
        sub: { text, kind, direction: null },
        series: [],
        href: null,
    })
    // A fresh shop is a healthy one: the development box runs no queue worker, and its stale queue is no
    // part of a first day. The period is pinned to the same day as `asOf`, not to the clock.
    const health = { state: 'ok', sentence: 'Alles in Ordnung', label: 'Alles in Ordnung', count: null, href: '/admin/system', banner: null }
    const admin = { ...(props.admin as Record<string, unknown>), demo: null, health }
    const period = {
        ...(props.period as Record<string, unknown>),
        von: '2026-08-29',
        bis: '2026-09-27',
        range: '29.08.–27.09.2026',
        previousRange: '30.07.–28.08.2026',
    }

    return {
        ...props,
        admin,
        period,
        asOf: '27.09.2026, 10:00 Uhr',
        demo: false,
        kpis: [
            kpi('umsatz', 'Umsatz', 'Summe der bezahlten, nicht erstatteten Bestellungen, nach Bestelldatum.', 0, 'EUR', 'Vorzeitraum ohne bezahlte Bestellung', 'reason'),
            kpi('bestellungen', 'Bestellungen', 'Bezahlte, nicht erstattete Bestellungen im Zeitraum.', 0, null, 'Vorzeitraum ohne bezahlte Bestellung', 'reason'),
            kpi('bestellwert', 'Ø Bestellwert', 'Umsatz geteilt durch die Zahl der Bestellungen.', null, 'EUR', 'noch keine bezahlte Bestellung', 'reason'),
            kpi('offen', 'Offene Bestellungen', 'Bezahlt oder in Bearbeitung, noch nicht versendet — Stand jetzt, unabhängig vom Zeitraum.', 0, null, 'alles versendet', 'note'),
        ],
        recentOrders: [],
        todo: [],
        today: [],
        activity: [],
        topWheels: [],
    }
}

const EMPTY_CHARTS = {
    revenue: null,
    verdicts: null,
    coverage: { sizes: [], rows: [], max: 0, summary: { fitments: '0', variants: '0', sentence: '' }, computedAt: '' },
    demand: { rows: [], counts: { offen: 0, beobachtet: 0, angefordert: 0, alle: 0 }, asks: 0, waiting: 0 },
    failed: [],
}

test('dashboard-empty: a shop\'s first day', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1440', 'The empty baseline is taken at 1440; the phone layout is covered by the filled shot.')

    await signIn(page)

    // Set before any page loads: the rail prefetches the Übersicht, and a prefetched answer is a cached one.
    await page.route(
        (url) => url.pathname === '/admin',
        async (route: Route) => {
            const request = route.request()

            if (!(await isInertiaGet(request))) {
                await route.fallback()

                return
            }

            const response = await route.fetch({ headers: await inertiaHeaders(request) })
            const body = (await response.json()) as { props: Record<string, unknown>; deferredProps?: unknown }
            const partial = (await request.headerValue('x-inertia-partial-data')) !== null

            // A partial answer holds only what was asked for: Inertia merges every prop it is sent.
            if (partial) {
                body.props = { errors: {}, charts: EMPTY_CHARTS }
                delete body.deferredProps
            } else {
                body.props = emptyProps(body.props)
            }
            await route.fulfill({ response, json: body })
        },
    )

    await page.goto('/admin/bestellungen', { waitUntil: 'networkidle' })
    await waitForApp(page)
    await page.getByRole('link', { name: 'Übersicht' }).first().click()
    await expect(page.getByRole('heading', { level: 1, name: 'Übersicht' })).toBeVisible()
    await settle(page)

    await expect(page.getByText('Noch kein Umsatz in diesem Zeitraum.')).toBeVisible()
    await page.screenshot({ path: `${SHOTS}/dashboard-1440-empty.png`, fullPage: true })
    // The rail and the bell count the development data (orders, feedback, conflicts); the first day is the Übersicht.
    await expect(page).toHaveScreenshot('dashboard-empty.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
        mask: [page.locator('.adm-rail'), page.locator('.adm-bell__count')],
    })
    // A prefetch still in flight must not outlive the test.
    await page.unrouteAll({ behavior: 'ignoreErrors' })
})
