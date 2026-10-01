import { expect, test, type Locator, type Page } from './fixtures'
import { signIn, waitForApp } from './bugs/faq-support'
import { resetRail, storeRail } from './bugs/rail-support'
import { openNachfrage, patchCharts } from './bugs/ueb-support'

/*
 * Every menu in the admin opens where it can be read: fully inside the window, with the rail at its
 * narrowest (232 px), at its default (260) and at its widest (400).
 *
 * Why: a tooltip and a menu on one trigger share reka's popper anchor, and the menu then opened
 * nowhere — parked off the screen, never positioned (RAIL-10: „Neu“ and the account menu in the
 * rail's foot). This walks every menu there is: the foot's two, the top bar's Hilfe and bell, the
 * Übersicht's period „…“, its own-range popover and the chart menus, the row menus of Benutzer,
 * Rollen, Navigation, FAQ and Nachfrage, the Bestellungen export and Spalten, and a page's „…“ (Seiten). The
 * admin has no bulk-action or breadcrumb menus yet; add them here when it does.
 *
 * The rail's width is stored on the account; every test puts back the default, 260 px, open. The
 * charts and the Nachfrage gaps are put into the server's answers; nothing else is written.
 */

test.skip(({ isMobile }) => isMobile, 'The rail is resized from 1024 px up.')

interface Menu {
    name: string
    trigger: (page: Page) => Locator
    /** The panel it opens: reka's menu, unless said otherwise. */
    panel?: (page: Page) => Locator
}

interface Stop {
    open: (page: Page) => Promise<void>
    menus: Menu[]
}

const byName = (name: string | RegExp) => (page: Page) => page.getByRole('button', { name }).first()

async function visit(page: Page, path: string): Promise<void> {
    await page.goto(path, { waitUntil: 'networkidle' })
    await waitForApp(page)
}

const STOPS: Stop[] = [
    {
        open: async (page) => {
            await patchCharts(page, (charts) => {
                charts.revenue = {
                    points: Array.from({ length: 30 }, (_, i) => ({ key: `d${i}`, label: `${String(i + 1).padStart(2, '0')}.09.2026`, value: 10_000 + i * 900, text: `${100 + i * 9},00 €` })),
                    previous: null,
                    total: '4.215,00 €',
                }
                charts.verdicts = {
                    series: [{ key: 'PERMITTED', label: 'Zulässig' }],
                    weeks: Array.from({ length: 4 }, (_, i) => ({ key: `w${i}`, label: `KW ${36 + i}`, range: '', values: { PERMITTED: 20 + i }, total: 20 + i })),
                    since: '01.09.2026',
                }
            })
            await visit(page, '/admin?zeitraum=30')
            await expect(page.getByRole('button', { name: /^Menü: / }).first()).toBeVisible()
        },
        menus: [
            { name: 'Neu (rail foot)', trigger: (page) => page.locator('.adm-foot__new') },
            { name: 'account (rail foot)', trigger: (page) => page.locator('.adm-foot__profile') },
            { name: 'Hilfe (top bar)', trigger: byName('Hilfe') },
            { name: 'bell (top bar)', trigger: (page) => page.locator('.adm-topbar .adm-bell') },
            { name: 'period „…“', trigger: (page) => page.locator('.period').getByRole('button', { name: 'Weitere Aktionen' }) },
            { name: 'own range', trigger: (page) => page.locator('.period__custom'), panel: (page) => page.locator('.period__popover') },
            { name: 'chart menu: Umsatz', trigger: byName('Menü: Umsatz über die Zeit') },
            { name: 'chart menu: Verdikte', trigger: byName('Menü: Ergebnisse der Prüfungen') },
            { name: 'chart menu: Top-Felgen', trigger: byName('Menü: Meistbestellte Felgen') },
        ],
    },
    { open: (page) => visit(page, '/admin/benutzer'), menus: [{ name: 'Benutzer row', trigger: byName(/^Aktionen für /) }] },
    { open: (page) => visit(page, '/admin/rollen'), menus: [{ name: 'Rollen „…“', trigger: (page) => page.locator('.rol__more').first() }] },
    { open: (page) => visit(page, '/admin/navigation'), menus: [{ name: 'Navigation row', trigger: (page) => page.locator('[data-focus^="nav-more-"]').first() }] },
    { open: (page) => visit(page, '/admin/faq'), menus: [{ name: 'FAQ row', trigger: (page) => page.locator('[data-focus^="faq-more-"]').first() }] },
    { open: async (page) => void (await openNachfrage(page, 1)), menus: [{ name: 'Nachfrage row', trigger: byName(/^Weitere Aktionen für /) }] },
    {
        open: (page) => visit(page, '/admin/bestellungen'),
        menus: [
            { name: 'Bestellungen export', trigger: (page) => page.locator('.ob-export') },
            { name: 'Bestellungen Spalten', trigger: byName('Spalten') },
        ],
    },
    {
        open: async (page) => {
            await visit(page, '/admin/seiten')
            const href = await page.locator('a[href^="/admin/seiten/"]').first().getAttribute('href')

            expect(href, 'rig: Seiten lists a page to open').not.toBeNull()
            await visit(page, href ?? '/admin/seiten')
        },
        menus: [{ name: 'page „…“ (Seiten)', trigger: (page) => page.locator('.adm-page__more') }],
    },
]

async function insideWindow(page: Page, menu: Menu, rail: number): Promise<void> {
    const trigger = menu.trigger(page)

    await expect(trigger, `rig: ${menu.name} is on the page`).toBeVisible()
    await trigger.click()

    const panel = menu.panel ? menu.panel(page) : page.getByRole('menu')

    await expect(panel, `${menu.name} opens`).toBeVisible()
    // Positioned: reka parks an unanchored panel at translate(0, -200%) — let the frame settle first.
    await page.waitForTimeout(150)

    const box = await panel.boundingBox()
    const view = page.viewportSize()

    expect(box && view, `${menu.name}: a panel and a window`).toBeTruthy()

    if (box && view) {
        const where = `${menu.name} at a ${rail} px rail: ${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}×${Math.round(box.height)} in ${view.width}×${view.height}`

        expect(box.x, where).toBeGreaterThanOrEqual(0)
        expect(box.y, where).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width, where).toBeLessThanOrEqual(view.width + 0.5)
        expect(box.y + box.height, where).toBeLessThanOrEqual(view.height + 0.5)
    }

    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
}

test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
})

test.afterEach(async ({ page, isMobile }) => {
    if (!isMobile && !page.isClosed()) {
        await resetRail(page)
    }
})

for (const rail of [232, 260, 400]) {
    test(`every menu opens fully inside the window with the rail at ${rail} px`, async ({ page }) => {
        test.setTimeout(240_000)
        await visit(page, '/admin')
        expect(await storeRail(page, { rail: 'open', width: rail }), 'rig: the width is stored').toBeLessThan(300)

        for (const stop of STOPS) {
            await stop.open(page)
            await expect(page.locator('.adm-rail'), 'rig: the rail at the width stored').toHaveJSProperty('offsetWidth', rail)

            for (const menu of stop.menus) {
                await insideWindow(page, menu, rail)
            }
        }
    })
}
