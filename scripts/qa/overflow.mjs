// G4 · No horizontal overflow at any width, on any route. Also counts the h1 and, on the phone
// document, lists tap targets under 44px — the two cheapest "self-made" tells to catch by machine.
//
//   node scripts/qa/overflow.mjs [--routes /,/felgen]
import { chromium } from '@playwright/test'
import { BASE, newContext, describeNode, parseArgs, resolveRoutes, routesFrom } from './lib.mjs'

const WIDTHS = [320, 360, 375, 390, 414, 430, 768, 834, 1024, 1280, 1440, 1920]

const args = parseArgs()
const routes = routesFrom(args)
const browser = await chromium.launch()
const problems = []

for (const width of WIDTHS) {
    const phone = width < 640
    const context = await newContext(browser, width, phone ? 800 : 900, phone)
    const resolved = await resolveRoutes(context, routes)

    for (const route of resolved) {
        const page = await context.newPage()
        await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60_000 }).catch(() => {})

        const r = await page.evaluate(
            ({ phone, describe }) => {
                const describeNode = new Function('return ' + describe)()
                const vw = document.documentElement.clientWidth
                const over = document.documentElement.scrollWidth - vw
                let culprit = ''

                if (over > 1) {
                    for (const el of document.querySelectorAll('body *')) {
                        const b = el.getBoundingClientRect()
                        if (b.right > vw + 1 && getComputedStyle(el).position !== 'fixed') {
                            culprit = describeNode(el)
                            break
                        }
                    }
                }

                // A checkbox or radio is tapped through its label, and a link stretched over its
                // tile by an absolutely positioned ::after is tapped anywhere on that tile, so the
                // measured target is the whole clickable area (WCAG 2.5.8), not the element's own box.
                const targetOf = (el) => {
                    if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
                        return el.closest('label') ?? el
                    }

                    const after = getComputedStyle(el, '::after')

                    if (el instanceof HTMLAnchorElement && after.position === 'absolute' && after.content !== 'none' && el.offsetParent) {
                        return el.offsetParent
                    }

                    return el
                }

                // WCAG 2.5.8's inline exception, as DIRECTION §6 records it: a link inside a run of
                // text takes its height from the sentence around it, and padding it out to 44px
                // would break that paragraph. Narrow on purpose — the parent must hold text of its
                // own beside the link. A link that is the only thing in its container is a target.
                const inlineInSentence = (el) => {
                    const parent = el.parentElement

                    if (parent === null || getComputedStyle(el).display !== 'inline') {
                        return false
                    }

                    return [...parent.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== '')
                }

                const small = phone
                    ? [...document.querySelectorAll('main a, main button, main input, main select, header a, header button, nav a, nav button')]
                          .filter((el) => {
                              const b = targetOf(el).getBoundingClientRect()
                              const cs = getComputedStyle(el)
                              return (
                                  b.width > 0 &&
                                  b.height > 0 &&
                                  cs.visibility !== 'hidden' &&
                                  (b.height < 43.5 || b.width < 43.5) &&
                                  !el.closest('.visually-hidden') &&
                                  !inlineInSentence(el)
                              )
                          })
                          .map((el) => `${describeNode(el)} ${Math.round(targetOf(el).getBoundingClientRect().width)}×${Math.round(targetOf(el).getBoundingClientRect().height)}`)
                    : []

                return { over, culprit, h1: document.querySelectorAll('h1').length, small: [...new Set(small)].slice(0, 5) }
            },
            { phone, describe: describeNode }
        )

        const found = []
        if (r.over > 1) found.push(`overflow ${r.over}px (${r.culprit})`)
        if (r.h1 !== 1) found.push(`h1×${r.h1}`)
        if (r.small.length) found.push(`small targets: ${r.small.join(', ')}`)
        if (found.length) problems.push(`${String(width).padStart(4)} ${route.padEnd(34)} ${found.join(' · ')}`)

        await page.close()
    }

    await context.close()
}

await browser.close()

if (problems.length === 0) {
    console.log(`every route clean at ${WIDTHS.length} widths`)
    process.exit(0)
}

console.log(problems.join('\n'))
process.exit(1)
