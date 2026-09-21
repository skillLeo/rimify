// Shared pieces of the QA scripts: the routes every gate walks, the two documents (phone and
// desktop) and the small argument parser. Every script in this folder runs against a server that is
// already up — the production build with SSR on, by default at http://127.0.0.1:8000.
import { chromium, firefox, webkit } from '@playwright/test'

export const BASE = process.env.QA_BASE_URL ?? 'http://127.0.0.1:8000'

export const MOBILE_UA =
    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'

/** Every public route plus the admin login and the 404, in the order a customer meets them. */
export const ROUTES = [
    '/',
    '/felgen-suchen',
    '/felgen',
    '/felgen/{product}',
    '/rimify-check',
    '/warenkorb',
    '/kasse',
    '/bestellung/RMF-2026-1001',
    '/faq',
    '/kontakt',
    '/rechtliches',
    '/admin/anmelden',
    '/gibt-es-nicht',
]

/** The three review viewports. The phone document is decided by the User-Agent on the server. */
export const VIEWPORTS = {
    390: { width: 390, height: 844, mobile: true },
    768: { width: 768, height: 1024, mobile: false },
    1440: { width: 1440, height: 900, mobile: false },
}

export const BROWSERS = { chromium, firefox, webkit }

/**
 * `--key value` and `--flag` into an object; bare words into `_`. Small on purpose: the scripts
 * take at most a handful of options and a dependency for that would be one more thing to audit.
 */
export function parseArgs(argv = process.argv.slice(2)) {
    const out = { _: [] }

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]

        if (!arg.startsWith('--')) {
            out._.push(arg)
            continue
        }

        const key = arg.slice(2)
        const next = argv[i + 1]

        if (next === undefined || next.startsWith('--')) {
            out[key] = true
        } else {
            out[key] = next
            i++
        }
    }

    return out
}

/** Comma-separated routes from `--routes`, else every route. */
export function routesFrom(args) {
    return typeof args.routes === 'string' ? args.routes.split(',').map((r) => r.trim()) : ROUTES
}

export function contextOptions(width, height, mobile) {
    return mobile
        ? { viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: MOBILE_UA, locale: 'de-DE' }
        : { viewport: { width, height }, locale: 'de-DE' }
}

/**
 * A context with the cookie choice already made, so the consent sheet does not sit over whatever
 * a gate is measuring. Pass `{ consent: false }` to a script that tests the sheet itself.
 */
export async function newContext(browser, width, height, mobile, { consent = true } = {}) {
    const context = await browser.newContext(contextOptions(width, height, mobile))

    if (consent) {
        await context.addCookies([
            {
                name: 'rmf_consent',
                value: encodeURIComponent(JSON.stringify({ necessary: true, statistics: false, decidedAt: '2026-01-01T00:00:00.000Z' })),
                url: BASE,
            },
        ])
    }

    return context
}

/**
 * The first product the listing links to, so a script never hard-codes a slug that a re-seed may
 * have renamed. Resolved once per run.
 */
export async function resolveRoutes(context, routes) {
    if (!routes.some((r) => r.includes('{product}'))) {
        return routes
    }

    const page = await context.newPage()
    await page.goto(BASE + '/felgen', { waitUntil: 'networkidle' })
    const href = await page.locator('a[href^="/felgen/"]').first().getAttribute('href')
    await page.close()

    return routes.map((r) => r.replace('{product}', (href ?? '/felgen/unbekannt').replace('/felgen/', '')))
}

/**
 * Open a route and wait until the client has taken over the server-rendered page: network idle
 * is not enough, because a form filled before hydration is a form the client re-renders empty.
 */
export async function open(page, route) {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60_000 })
    await page.waitForFunction(() => document.querySelector('#app')?.__vue_app__ !== undefined, null, { timeout: 15_000 }).catch(() => {})
    await page.evaluate(() => document.fonts.ready)
}

/** Choose the seeded BMW by its key numbers, so the vehicle-aware states can be captured. */
export async function chooseVehicle(context, hsn = '0005', tsn = '582') {
    const page = await context.newPage()
    await open(page, '/felgen-suchen')
    await page.fill('input[id^=hsn]', hsn)
    await page.fill('input[id^=tsn]', tsn)
    // The header chip is also named "Fahrzeug wählen"; the submit button of the key-number form is
    // the one that posts. POST → 302 → SSR takes a few seconds here, so the URL is what is awaited.
    await page.locator('form:has(input[id^=hsn]) button[type=submit]').first().click()
    await page.waitForURL('**/felgen', { timeout: 20_000 })
    await page.waitForLoadState('networkidle')
    await page.close()
}

/** A safe file-name fragment for a route. */
export function slug(route) {
    return route === '/' ? 'start' : route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
}

/** `tag.first-class` for a node — enough to find it again, short enough to print. */
export const describeNode = `(el) => {
    const cls = typeof el.className === 'string' ? el.className.split(/\\s+/).filter(Boolean)[0] : ''
    const id = el.id ? '#' + el.id : ''
    return el.tagName.toLowerCase() + id + (cls ? '.' + cls : '')
}`
