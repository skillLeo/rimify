// G8 · The live shop asks no third party for anything at runtime (the brief „AFTER CI“, §6): every request a page makes
// — the document, scripts, styles, fonts, images, fetches, frames — goes to the shop's own origin. Two exceptions, each
// named: the media bucket the page itself names in its Content-Security-Policy, and Stripe on the checkout — its script,
// its frames, and whatever its own frames ask for. Any other cross-origin request fails the gate, with the URL, the
// route and the frame that asked.
//
// It proves itself first (`--self-test`, also run by `npm run qa`): a page with a third-party image must fail it, and a
// clean one must pass — a gate that cannot fail is no gate.
//
//   node scripts/qa/third-party.mjs [--routes /,/felgen] [--browsers chromium,firefox] [--self-test]
import { createServer } from 'node:http'
import { BASE, BROWSERS, VIEWPORTS, newContext, parseArgs, render, resolveRoutes, routesFrom } from './lib.mjs'

/** Stripe's own origins, as it publishes them (docs.stripe.com/security/guide) — never a wildcard of stripe.com. */
const STRIPE = [/^https:\/\/js\.stripe\.com$/, /^https:\/\/[a-z0-9-]+\.js\.stripe\.com$/, /^https:\/\/hooks\.stripe\.com$/, /^https:\/\/api\.stripe\.com$/]

const isStripe = (origin) => STRIPE.some((pattern) => pattern.test(origin))

/** The https origins a page's own policy names for images and fetches: the bucket in force, nothing else. */
async function bucketOrigins(page) {
    const policy = await page.evaluate(() => document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') ?? '')
    const origins = new Set()

    for (const directive of policy.split(';')) {
        const [name, ...values] = directive.trim().split(/\s+/)

        if (name === 'img-src' || name === 'connect-src') {
            for (const value of values) {
                if (/^https:\/\/[^*]+$/.test(value) && !isStripe(value)) {
                    origins.add(new URL(value).origin)
                }
            }
        }
    }

    return origins
}

/**
 * Whether one request may leave the shop's origin. `frameOrigin` is the origin of the frame that asked; a frame of
 * Stripe's asks for its own things, on the checkout only.
 */
export function allowed({ url, own, frameOrigin, route, bucket }) {
    const target = new URL(url)

    if (['data:', 'blob:', 'about:', 'chrome-extension:'].includes(target.protocol) || target.origin === own) {
        return true
    }

    if (bucket.has(target.origin)) {
        return true
    }

    const checkout = route === '/kasse' || route.startsWith('/kasse?')

    return checkout && (isStripe(target.origin) || isStripe(frameOrigin))
}

/** Every cross-origin request the routes make that is not allowed, as lines to print. */
async function sweep(browserNames, routes, base) {
    const problems = []
    const own = new URL(base).origin

    for (const name of browserNames) {
        const engine = BROWSERS[name]

        if (!engine) {
            problems.push(`unknown browser ${name}`)
            continue
        }

        const browser = await engine.launch()

        for (const width of [390, 1440]) {
            const { height, mobile } = VIEWPORTS[width]
            const context = await newContext(browser, width, height, mobile)
            const resolved = base === BASE ? await resolveRoutes(context, routes) : routes

            for (const route of resolved) {
                const page = await context.newPage()
                const seen = []

                page.on('request', (request) => {
                    let frameOrigin = ''

                    try {
                        frameOrigin = new URL(request.frame().url()).origin
                    } catch {
                        // A service worker's request has no frame: it is judged by its own target.
                    }

                    seen.push({ url: request.url(), frameOrigin })
                })

                await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60_000 }).catch((e) => problems.push(`${name} ${width} ${route} navigation: ${String(e.message).slice(0, 120)}`))
                await render(page).catch(() => {})
                await page.waitForLoadState('networkidle').catch(() => {})

                const bucket = await bucketOrigins(page).catch(() => new Set())

                for (const request of seen) {
                    if (!allowed({ url: request.url, own, frameOrigin: request.frameOrigin, route, bucket })) {
                        problems.push(`${name.padEnd(8)} ${String(width).padStart(4)} ${route.padEnd(28)} ${request.url.slice(0, 140)}${request.frameOrigin && request.frameOrigin !== own ? ` (asked by ${request.frameOrigin})` : ''}`)
                    }
                }

                await page.close()
            }

            await context.close()
        }

        await browser.close()
    }

    return [...new Set(problems)]
}

/** Two pages on a local server: one that asks a third party for an image, one that asks nobody. */
async function selfTest() {
    const server = createServer((request, response) => {
        const body = request.url === '/fremd'
            ? '<!doctype html><title>fremd</title><img src="https://example.org/pixel.png" alt="">'
            : '<!doctype html><title>sauber</title><img src="/pixel.png" alt="">'

        response.writeHead(request.url === '/pixel.png' ? 404 : 200, { 'content-type': 'text/html; charset=utf-8' })
        response.end(request.url === '/pixel.png' ? '' : body)
    })

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const base = `http://127.0.0.1:${server.address().port}`

    try {
        const dirty = await sweep(['chromium'], ['/fremd'], base)
        const clean = await sweep(['chromium'], ['/sauber'], base)

        if (dirty.length === 0 || !dirty.every((line) => line.includes('https://example.org/pixel.png'))) {
            throw new Error(`self-test: a page asking example.org was not caught (${dirty.join(' | ') || 'nothing reported'})`)
        }

        if (clean.length !== 0) {
            throw new Error(`self-test: a clean page was failed (${clean.join(' | ')})`)
        }
    } finally {
        server.close()
    }
}

const args = parseArgs()

await selfTest()
console.log('third-party gate: self-test passed (a third-party image fails it, a clean page passes)')

if (args['self-test'] === true) {
    process.exit(0)
}

const browsers = (typeof args.browsers === 'string' ? args.browsers : 'chromium').split(',')
const problems = await sweep(browsers, routesFrom(args), BASE)

if (problems.length === 0) {
    console.log(`no third-party request on ${BASE} (${browsers.join(', ')}, 390 and 1440)`)
    process.exit(0)
}

console.log(`third-party requests on ${BASE}:\n${problems.join('\n')}`)
process.exit(1)
