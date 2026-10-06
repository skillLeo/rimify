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

const SHOTS = 'docs/qa/shots/kundenliste'

/** The item's picture at this width: the element itself where one is given, never the whole page by default. */
export async function shot(target: Page | Locator, nr: number, info: TestInfo, options: { fullPage?: boolean } = {}): Promise<void> {
    mkdirSync(SHOTS, { recursive: true })
    const path = `${SHOTS}/${String(nr).padStart(2, '0')}-${breite(info)}.png`

    if ('scrollIntoViewIfNeeded' in target) {
        await target.scrollIntoViewIfNeeded()
        await target.screenshot({ path, animations: 'disabled' })
    } else {
        await target.screenshot({ path, animations: 'disabled', fullPage: options.fullPage ?? false })
    }

    await info.attach(`kunde-${String(nr).padStart(2, '0')}-${breite(info)}`, { path, contentType: 'image/png' })
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

/** Open a page and wait until the client has taken over the server's frame and the fonts are in. */
export async function open(page: Page, path: string): Promise<void> {
    await page.goto(path, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => (document.querySelector('#app') as (Element & { __vue_app__?: unknown }) | null)?.__vue_app__ !== undefined, null, {
        timeout: 20_000,
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
