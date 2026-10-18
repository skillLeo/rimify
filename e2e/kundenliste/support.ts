import { mkdirSync } from 'node:fs'
import { expect, type BrowserContext, type Locator, type Page, type TestInfo } from '@playwright/test'
import { CONSENT_COOKIE } from '../support'

/*
 * The client's list as a suite (the operator's brief „THE 34“ §0). Every test carries its item's tag — `@kunde-01` …
 * `@kunde-34` — and leaves one picture per item and width of exactly the thing the item is about:
 * docs/qa/shots/kundenliste/<nr>-<breite>.png, written again on every run. `npm run kundenliste` runs only these tests
 * and writes docs/review/KUNDENLISTE.md from their results (scripts/kundenliste/run.mjs).
 */

/** The acceptance shop: the preview's empty start plus `rimify:demo --abnahme` (KundenlisteShopSeeder). */
export const ABNAHME = process.env.E2E_ABNAHME_URL ?? 'http://127.0.0.1:8014'

export const ABNAHME_DB = {
    DB_PORT: process.env.E2E_SHOP_DB_PORT ?? '3308',
    DB_DATABASE: 'rimify_wf_abnahme_e2e',
}

/** The acceptance set's three demo cars, as an address names them (VehicleKey; the client's #8). */
export const CARS = {
    e90: { key: '0005-Z90-00001', label: '320i Limousine (Demo)', model: '3er (E90)', tsn: 'Z90' },
    e46: { key: '0005-Z46-00001', label: '320i Limousine (Demo)', model: '3er (E46)', tsn: 'Z46' },
    x3: { key: '0005-Z83-00001', label: '2.0d (Demo)', model: 'X3 (E83)', tsn: 'Z83' },
} as const

export const PRODUCT = '/felgen/borbet-db8gt2'

/** `1440` or `390`: the width a project's pictures are named after. */
export function breite(info: TestInfo): '1440' | '390' {
    return info.project.name.includes('390') ? '390' : '1440'
}

export function isPhone(info: TestInfo): boolean {
    return breite(info) === '390'
}

/** Where an item's pictures go: his storefront list's (1–34), or his admin list's (201–218, `npm run adminliste`). */
function shotsFor(nr: number): { dir: string; name: string } {
    return nr >= 200 ? { dir: 'docs/qa/shots/adminliste', name: `admin-${nr}` } : { dir: 'docs/qa/shots/kundenliste', name: `kunde-${String(nr).padStart(2, '0')}` }
}

function shotPath(nr: number, info: TestInfo): string {
    const { dir } = shotsFor(nr)
    mkdirSync(dir, { recursive: true })

    return `${dir}/${String(nr).padStart(2, '0')}-${breite(info)}.png`
}

/** The item's picture at this width: the element itself where one is given, never the whole page by default. */
export async function shot(target: Page | Locator, nr: number, info: TestInfo, options: { fullPage?: boolean } = {}): Promise<void> {
    if ('scrollIntoViewIfNeeded' in target) {
        await shotAround(target.page(), [target], nr, info, 0)

        return
    }

    const path = shotPath(nr, info)

    await target.screenshot({ path, animations: 'disabled', fullPage: options.fullPage ?? false })
    await info.attach(`${shotsFor(nr).name}-${breite(info)}`, { path, contentType: 'image/png' })
}

/** The union of the targets' boxes, in the window's coordinates. */
async function union(targets: Locator[]): Promise<{ x: number; y: number; width: number; height: number }> {
    const boxes = await Promise.all(targets.map((t) => box(t)))
    const x = Math.min(...boxes.map((b) => b.x))
    const y = Math.min(...boxes.map((b) => b.y))

    return { x, y, width: Math.max(...boxes.map((b) => b.x + b.width)) - x, height: Math.max(...boxes.map((b) => b.y + b.height)) - y }
}

/**
 * The bars that stay put while the page scrolls — the header and the vehicle bar at the top, a price bar at the bottom:
 * how far they reach into the window from each edge. A picture of one of them is not covered by itself.
 */
async function bars(target: Locator): Promise<{ top: number; bottom: number }> {
    return target.evaluate((el) => {
        const edge = (e: Element): 'top' | 'bottom' | null => {
            if (!['fixed', 'sticky'].includes(getComputedStyle(e).position)) {
                return null
            }

            const r = e.getBoundingClientRect()

            return r.top <= 5 ? 'top' : r.bottom >= window.innerHeight - 5 ? 'bottom' : null
        }
        const own = new Set<string>()

        for (let e: Element | null = el; e !== null; e = e.parentElement) {
            const at = edge(e)

            if (at !== null) {
                own.add(at)
            }
        }

        let top = 0
        let bottom = 0

        for (const e of document.querySelectorAll('body *')) {
            const r = e.getBoundingClientRect()

            if (r.height === 0 || r.height >= window.innerHeight / 2 || r.bottom <= 0 || r.top >= window.innerHeight) {
                continue
            }

            const at = edge(e)

            if (at === 'top' && !own.has('top')) {
                top = Math.max(top, r.bottom)
            } else if (at === 'bottom' && !own.has('bottom')) {
                bottom = Math.max(bottom, window.innerHeight - r.top)
            }
        }

        return { top, bottom }
    })
}

/**
 * The item's picture around one element or several at once — a heading and the line under it, a row and the note about
 * it — `pad` pixels round them, taken inside the window: scrolled to stand just under the header and the vehicle bar
 * (which would otherwise cover its top), and the window made taller first where it does not fit. A full-page capture is
 * not used: it enlarges the window as it takes the picture, and a page that sizes by the window's height (the product
 * photograph, 56vh on a phone) then lies elsewhere than where it was measured.
 */
export async function shotAround(page: Page, targets: Locator[], nr: number, info: TestInfo, pad = 16): Promise<void> {
    const path = shotPath(nr, info)
    const view = page.viewportSize() ?? { width: 1440, height: 900 }
    const first = targets[0]

    if (first === undefined) {
        throw new Error('a picture of nothing')
    }

    await first.scrollIntoViewIfNeeded()
    let chrome = await bars(first)
    let area = await union(targets)
    // Room for a price bar that appears only once the page has scrolled (the product page's, on a phone).
    const reserve = 160
    const needed = Math.ceil(area.height + 2 * pad + chrome.top + Math.max(chrome.bottom, reserve))
    const taller = needed > view.height

    if (taller) {
        await page.setViewportSize({ width: view.width, height: needed })
        await page.waitForTimeout(200)
        area = await union(targets)
    }

    // Just under the bars at the top, then measured again where it now stands — and the bars with it, since a price
    // bar comes and goes with the scroll.
    await page.evaluate((by) => window.scrollBy(0, by), area.y - chrome.top - pad)
    await page.waitForTimeout(150)
    area = await union(targets)
    chrome = await bars(first)

    const height = (page.viewportSize() ?? view).height
    const x = Math.max(0, area.x - pad)
    const y = Math.max(chrome.top, area.y - pad)
    const clip = { x, y, width: Math.min(view.width, area.x + area.width + pad) - x, height: Math.min(height - chrome.bottom, area.y + area.height + pad) - y }

    await page.screenshot({ path, animations: 'disabled', clip })

    if (taller) {
        await page.setViewportSize(view)
    }

    await info.attach(`${shotsFor(nr).name}-${breite(info)}`, { path, contentType: 'image/png' })
}

/** The choice a returning visitor has already made, so the cookie sheet stays out of the picture. */
export async function consent(context: BrowserContext, baseURL: string): Promise<void> {
    await context.addCookies([
        {
            name: CONSENT_COOKIE,
            value: encodeURIComponent(JSON.stringify({ necessary: true, statistics: false, decidedAt: '2026-01-01T00:00:00.000Z' })),
            url: baseURL,
        },
    ])
}

/**
 * A new visitor in the same window: off the page first, then the cookies gone and the consent given again. A page's
 * answer still on its way would otherwise set its session cookie again after the cookies were cleared — the basket or
 * the car of the round before comes back (review-roles, 17.10.2026: the next sign-in landed in the account before).
 * Leaving the page ends every request it had.
 */
export async function newVisitor(page: Page, context: BrowserContext): Promise<void> {
    await page.goto('about:blank')
    await context.clearCookies()
    await consent(context, ABNAHME)
}

/** Open a page and wait until the client has taken over the server's frame and the fonts are in. */
export async function open(page: Page, path: string): Promise<void> {
    await page.goto(path, { waitUntil: 'networkidle' })
    // A full catalogue's homepage on a busy machine can take its time to hydrate; a minute, not twenty seconds.
    await page.waitForFunction(() => (document.querySelector('#app') as (Element & { __vue_app__?: unknown }) | null)?.__vue_app__ !== undefined, null, {
        timeout: 60_000,
    })
    await page.evaluate(() => document.fonts.ready)
}

/** The page with the car chosen through its address (the client's #8): the server takes it and keeps it. */
export async function withCar(page: Page, car: keyof typeof CARS, path = '/felgen'): Promise<void> {
    await open(page, `${path}${path.includes('?') ? '&' : '?'}fahrzeug=${CARS[car].key}`)
}

/** The current page's props as Inertia holds them: the history entry's after a visit, the server's frame before one. */
export async function pageProps<T = Record<string, unknown>>(page: Page): Promise<T> {
    return page.evaluate(() => {
        const state = (window.history.state as { page?: { props?: unknown } } | null)?.page?.props
        const frame = JSON.parse((document.getElementById('app') as HTMLElement | null)?.dataset.page ?? '{}') as { props?: unknown }

        return (state ?? frame.props ?? {}) as never
    })
}

type Config = { id: number; diameterIn: number; finishId: number; verdict: { status: string; sellable: boolean } | null }

/** The product page on one size: its diameter and finish, as the page's own props name them. */
export async function onSize(page: Page, inch: number, finish: 'Schwarz matt' | 'Bronze matt'): Promise<number> {
    const props = await pageProps<{ configs: Config[]; finishes: { id: number; name: string }[] }>(page)
    const finishId = props.finishes.find((f) => f.name === finish)?.id
    const config = props.configs.find((c) => c.diameterIn === inch && c.finishId === finishId)

    if (!config) {
        throw new Error(`no ${inch}-inch ${finish} size on this page`)
    }

    const url = new URL(page.url())
    url.searchParams.set('groesse', String(config.id))
    url.searchParams.set('ausfuehrung', String(finishId))
    await open(page, url.pathname + url.search)

    return config.id
}

/**
 * Into the basket from the product page as a customer does it: the button beside the price — and back only once the
 * server has answered the add, so a navigation right after it cannot cut the request off.
 */
export async function addToBasket(page: Page): Promise<void> {
    const button = page.locator('main').getByRole('button', { name: /In den Warenkorb/ }).first()
    await button.scrollIntoViewIfNeeded()
    await Promise.all([
        page.waitForResponse((r) => new URL(r.url()).pathname === '/warenkorb' && r.request().method() === 'POST'),
        button.click(),
    ])
    await expect(page.getByText('Zum Warenkorb hinzugefügt.').first()).toBeVisible()
}

/** The layout box of an element, for comparing positions; throws when it has none. */
export async function box(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
    const b = await locator.boundingBox()

    if (!b) {
        throw new Error('the element has no box')
    }

    return b
}
