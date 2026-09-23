// G5 · A clean console in every browser: no errors, no warnings, no hydration messages and no
// failed requests on any route, at 390 and 1440. A hydration mismatch is the one message that is
// always a defect, so it is named separately even though it is also a warning.
//
//   node scripts/qa/console.mjs [--browsers chromium,webkit,firefox] [--routes /,/felgen]
import { BASE, BROWSERS, VIEWPORTS, newContext, parseArgs, resolveRoutes, routesFrom } from './lib.mjs'

const args = parseArgs()
const routes = routesFrom(args)
const browsers = (typeof args.browsers === 'string' ? args.browsers : 'chromium,webkit,firefox').split(',')
const widths = args.width ? [Number(args.width)] : [390, 1440]
const problems = []

for (const name of browsers) {
    const engine = BROWSERS[name]

    if (!engine) {
        console.log(`unknown browser ${name}`)
        continue
    }

    let browser

    try {
        browser = await engine.launch()
    } catch (error) {
        problems.push(`${name}: could not launch (${String(error.message).split('\n')[0]}) — run npx playwright install ${name}`)
        continue
    }

    for (const width of widths) {
        const { height, mobile } = VIEWPORTS[width]
        const context = await newContext(browser, width, height, mobile)
        const resolved = await resolveRoutes(context, routes)

        for (const route of resolved) {
            const page = await context.newPage()
            const messages = []

            /*
             * The 404 route is meant to answer 404, and Chromium logs the document's own status
             * as a console error — "Failed to load resource: the server responded with a status
             * of 404" — with no URL to tell it apart from a broken asset. On that one route that
             * one line is the expected answer, not a defect; every other message still counts,
             * including a genuinely missing asset, which names its own URL.
             */
            const expectedStatusLine = (text) => route === '/gibt-es-nicht' && /Failed to load resource.*404/i.test(text)

            page.on('console', (m) => {
                if ((m.type() === 'error' || m.type() === 'warning') && !expectedStatusLine(m.text())) {
                    messages.push(`${m.type()}: ${m.text().slice(0, 160)}`)
                }
            })
            page.on('pageerror', (e) => messages.push(`pageerror: ${String(e.message).slice(0, 160)}`))
            page.on('requestfailed', (r) => messages.push(`requestfailed: ${r.url()} (${r.failure()?.errorText})`))
            page.on('response', (r) => {
                // The 404 route is meant to answer 404. Anything else that fails is a broken asset.
                if (r.status() >= 400 && !(route === '/gibt-es-nicht' && r.url().endsWith(route))) {
                    messages.push(`http ${r.status()}: ${r.url()}`)
                }
            })

            await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60_000 }).catch((e) => messages.push(`navigation: ${e.message.slice(0, 120)}`))
            // Hydration happens after load; give the client a moment and touch the page once.
            await page.waitForTimeout(600)
            await page.mouse.wheel(0, 400).catch(() => {})
            await page.waitForTimeout(200)

            for (const m of messages) {
                const hydration = /hydration/i.test(m) ? ' [HYDRATION]' : ''
                problems.push(`${name.padEnd(8)} ${String(width).padStart(4)} ${route.padEnd(30)} ${m}${hydration}`)
            }

            await page.close()
        }

        await context.close()
    }

    await browser.close()
}

if (problems.length === 0) {
    console.log(`console clean in ${browsers.join(', ')}`)
    process.exit(0)
}

console.log(problems.join('\n'))
process.exit(1)
