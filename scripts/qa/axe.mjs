// G6 · axe-core on every route at 390 and 1440, WCAG 2.0 A/AA, 2.1 AA and 2.2 AA: zero violations.
// And what axe has no rule for (WCAG 1.3.2, 2.4.3): at 390, on every route that shows the vehicle selector, the order
// Tab walks it in is the order it is read in — top to bottom, and left to right within a row.
//
//   node scripts/qa/axe.mjs [--routes /,/felgen] [--vehicle]
import AxeBuilder from '@axe-core/playwright'
import { chromium } from '@playwright/test'
import { BASE, VIEWPORTS, chooseVehicle, newContext, parseArgs, render, resolveRoutes, routesFrom } from './lib.mjs'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']

/** Pixels two focus stops may differ by and still count as one row (a field beside a field). */
const ROW = 6

/**
 * Tab through the vehicle selector from its first control until the focus leaves it, and name every stop that is
 * reached before something that is read before it: a stop above the previous one, or left of it in the same row.
 */
async function focusOrderProblems(page) {
    const started = await page.evaluate(() => {
        const root = document.querySelector('.vsel')
        const focusable = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        const first = root === null ? undefined : [...root.querySelectorAll(focusable)].find((el) => el.getClientRects().length > 0)

        first?.focus()

        return first !== undefined
    })

    if (!started) {
        return []
    }

    // Mark each stop as Tab reaches it; measure them all afterwards in one layout, every scroller back at its start — the
    // make list scrolls itself as the focus moves down it, and a stop measured mid-scroll stands where it is shown.
    let count = 0

    for (; count < 120; count++) {
        const inside = await page.evaluate((index) => {
            const el = document.activeElement
            const root = document.querySelector('.vsel')

            if (el === null || root === null || !root.contains(el) || el.dataset.focusStop !== undefined) {
                return false
            }

            el.dataset.focusStop = String(index)

            return true
        }, count)

        if (!inside) {
            break
        }

        await page.keyboard.press('Tab')
    }

    const stops = await page.evaluate((total) => {
        const root = document.querySelector('.vsel')

        for (const el of root?.querySelectorAll('*') ?? []) {
            if (el.scrollTop !== 0) {
                el.scrollTop = 0
            }
        }

        window.scrollTo(0, 0)

        return Array.from({ length: total }, (_, index) => {
            const el = document.querySelector(`[data-focus-stop="${index}"]`)
            const box = el.getBoundingClientRect()
            const name = (el.getAttribute('aria-label') ?? el.textContent ?? el.getAttribute('placeholder') ?? el.id ?? el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40)

            delete el.dataset.focusStop

            return { top: Math.round(box.top), left: Math.round(box.left), name: `${el.tagName.toLowerCase()} „${name}“` }
        })
    }, count)

    const problems = []

    for (let i = 1; i < stops.length; i++) {
        const [before, after] = [stops[i - 1], stops[i]]
        const sameRow = Math.abs(after.top - before.top) <= ROW

        if ((!sameRow && after.top < before.top) || (sameRow && after.left < before.left - ROW)) {
            problems.push(`focus order: ${after.name} (y ${after.top}) is reached after ${before.name} (y ${before.top}) but read before it`)
        }
    }

    return problems
}

const args = parseArgs()
const routes = routesFrom(args)
const widths = args.width ? [Number(args.width)] : [390, 1440]
const browser = await chromium.launch()
const problems = []

for (const width of widths) {
    const { height, mobile } = VIEWPORTS[width]
    const context = await newContext(browser, width, height, mobile)

    if (args.vehicle) {
        await chooseVehicle(context)
    }

    const resolved = await resolveRoutes(context, routes)

    for (const route of resolved) {
        const page = await context.newPage()
        await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60_000 }).catch(() => {})
        await render(page)

        const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()

        for (const v of results.violations) {
            const nodes = v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')
            problems.push(`${String(width).padStart(4)} ${route.padEnd(30)} ${v.impact?.padEnd(8) ?? ''} ${v.id}: ${v.help} — ${nodes}${v.nodes.length > 3 ? ` (+${v.nodes.length - 3})` : ''}`)
        }

        // One column at 390: reading order is top to bottom, so Tab must be too (CSS `order` once made it not).
        if (width === 390) {
            for (const problem of await focusOrderProblems(page)) {
                problems.push(`${String(width).padStart(4)} ${route.padEnd(30)} ${problem}`)
            }
        }

        await page.close()
    }

    await context.close()
}

await browser.close()

if (problems.length === 0) {
    console.log('axe: zero violations on every route')
    process.exit(0)
}

console.log(problems.join('\n'))
process.exit(1)
