// G6 · axe-core on every route at 390 and 1440, WCAG 2.0 A/AA, 2.1 AA and 2.2 AA: zero violations.
//
//   node scripts/qa/axe.mjs [--routes /,/felgen] [--vehicle]
import AxeBuilder from '@axe-core/playwright'
import { chromium } from '@playwright/test'
import { BASE, VIEWPORTS, chooseVehicle, newContext, parseArgs, render, resolveRoutes, routesFrom } from './lib.mjs'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']

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
