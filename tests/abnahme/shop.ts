import { expect, type Locator, type Page } from '@playwright/test'
import { open } from './fixtures'

/*
 * The acceptance set as the shop shows it (`rimify:demo --abnahme`, seeded on the preview on 14.10.2026 beside the
 * client's own wheels): the BORBET DB8GT2 at 18 Zoll for 229,00 € and at 19 Zoll for 269,00 €, on its two Gutachten, for
 * three demo cars. Every one of its rows is born demo; it may be put in a basket on the preview, never bought there.
 */

/** The three demo cars, as an address names them (VehicleKey; the client's #8). */
export const CARS = {
    e90: { key: '0005-Z90-00001', label: '320i Limousine (Demo)', model: '3er (E90)', tsn: 'Z90' },
    e46: { key: '0005-Z46-00001', label: '320i Limousine (Demo)', model: '3er (E46)', tsn: 'Z46' },
    x3: { key: '0005-Z83-00001', label: '2.0d (Demo)', model: 'X3 (E83)', tsn: 'Z83' },
} as const

export const PRODUCT = '/felgen/borbet-db8gt2'

/** The 18-inch rim's price in cents. */
export const RIM = 22_900

/** `1.145,00 €` — as the shop writes money (R-10), the narrow no-break space before the sign. */
export function euro(cents: number): string {
    return `${new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)} €`
}

/** The page with the car chosen through its address: the server takes it and keeps it. */
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

type Config = { id: number; diameterIn: number; finishId: number }

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

/** The layout box of an element; throws when it has none. */
export async function box(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
    const b = await locator.boundingBox()

    if (!b) {
        throw new Error('the element has no box')
    }

    return b
}

/** The stepper beside the price, set to `n` from wherever it stands. */
export async function amount(page: Page, n: number): Promise<void> {
    const shown = page.locator('.pdp__amount output')
    const now = Number(await shown.textContent())
    const step = page.getByRole('button', { name: n > now ? 'Anzahl erhöhen' : 'Anzahl verringern' })

    for (let i = 0; i < Math.abs(n - now); i++) {
        await step.click()
    }

    await expect(shown).toHaveText(String(n))
}

/** The page's basket button, pressed, and back once the server has answered and the panel is up. A basket, never an order. */
export async function add(page: Page, button: Locator = page.locator('button.pdp__add')): Promise<void> {
    await button.scrollIntoViewIfNeeded()
    await Promise.all([page.waitForResponse((r) => new URL(r.url()).pathname === '/warenkorb' && r.request().method() === 'POST'), button.click()])
    await expect(page.locator('.addp')).toBeVisible()
}

export async function mode(page: Page, which: 'Nur Felgen' | 'Komplettrad'): Promise<void> {
    await page.locator('.pdp__mode .bmc-tile', { hasText: which === 'Nur Felgen' ? 'Nur Felgen' : 'Kompletträder' }).click()
    await expect(page.locator(`.pdp__mode input[value="${which === 'Nur Felgen' ? 'felgen' : 'komplettrad'}"]`)).toBeChecked()
}

type Answer = { combination: string[]; chosen: string | null; entry: boolean | null }
type Tyre = { id: number; sizeLabel: string; answer?: Answer }
type Pair = { front: string; rear: string; minSentence: string }

export type ShownConfig = {
    id: number
    verdict: { status: string; tyreSizesFront?: string[]; tyreSizesRear?: string[]; detail?: { original?: { text: string }[] } } | null
    komplettrad: { tyres: Tyre[]; refusalCode: string | null }
    mischbereifung: { pairs: Pair[] } | null
}

/** The size on screen, as the page's own props hold it. */
export async function onScreen(page: Page): Promise<ShownConfig> {
    const props = await pageProps<{ configs: ShownConfig[] }>(page)
    const id = Number(new URL(page.url()).searchParams.get('groesse'))
    const config = props.configs.find((c) => c.id === id)

    if (!config) {
        throw new Error(`size ${id} is not on the page`)
    }

    return config
}
