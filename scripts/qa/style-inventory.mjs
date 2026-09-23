// G1 · The style inventory. Loads every route at 390 and 1440, reads the computed style of every
// visible element and fails on any value the design system does not define: a colour that is not a
// token, a radius other than 0/4/8 (or fully round on a small dot or badge), a shadow other than the
// three elevations, a family other than the system stack, a font size off the scale, a gradient not
// on the allowlist, backdrop-filter, background-clip: text, or spaced-out capitals.
//
// The allowed values are not written here: they are resolved from resources/css/tokens.css inside
// the page, so a token change is never contradicted by this script.
//
//   node scripts/qa/style-inventory.mjs                # every route, exits 1 on any finding
//   node scripts/qa/style-inventory.mjs --routes /,/felgen --report   # never fails, just lists
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { BASE, VIEWPORTS, newContext, describeNode, parseArgs, render, resolveRoutes, routesFrom } from './lib.mjs'

const args = parseArgs()
const routes = routesFrom(args)
const widths = args.width ? [Number(args.width)] : [390, 1440]
const out = args.out ?? 'docs/qa/style-inventory.json'

/* Elements that may carry a gradient: photo scrims only. Two entries, as the system allows. */
// The two photo scrims, the hero's three studio-light layers and the Gutachten story's marker
// (docs/design/sections/home.md §0.6). Nothing else on the site carries a gradient.
const GRADIENT_ALLOWLIST = ['.photo-scrim', '.band-scrim', '.hero-studio', '.hero-contact', '.hero-sweep', '.marker']

/* Token names, by role, straight from the stylesheet. */
const tokens = readFileSync('resources/css/tokens.css', 'utf8')
const names = [...new Set([...tokens.matchAll(/--([a-z0-9-]+)\s*:/g)].map((m) => m[1]))]
const byPrefix = (prefix) => names.filter((n) => n.startsWith(prefix))
const TOKENS = {
    colours: byPrefix('c-'),
    shadows: byPrefix('e-'),
    sizes: byPrefix('fs-'),
    radii: byPrefix('r-'),
    families: byPrefix('font-'),
}

const browser = await chromium.launch()
const findings = []

for (const width of widths) {
    const { height, mobile } = VIEWPORTS[width]
    const context = await newContext(browser, width, height, mobile)
    const resolved = await resolveRoutes(context, routes)

    for (const route of resolved) {
        const page = await context.newPage()
        await page.goto(BASE + route, { waitUntil: 'networkidle' }).catch(() => {})
        // Below-the-fold sections are style-skipped until they are scrolled to; see render().
        await render(page)
        await page.evaluate(() => document.fonts.ready)

        const result = await page.evaluate(
            ({ TOKENS, GRADIENT_ALLOWLIST, describe }) => {
                const describeNode = new Function('return ' + describe)()
                const probe = document.createElement('span')
                document.body.appendChild(probe)

                // Each token is resolved the way the page resolves it: set on a probe element,
                // read back computed. `property` is the CSS name, `read` the computed-style key.
                const resolve = (property, read, token) => {
                    probe.style.cssText = `${property}: var(--${token})`
                    return getComputedStyle(probe)[read]
                }

                const allowed = {
                    colours: new Set(['rgba(0, 0, 0, 0)', 'transparent', ...TOKENS.colours.map((t) => resolve('color', 'color', t))]),
                    shadows: new Set(['none', ...TOKENS.shadows.map((t) => resolve('box-shadow', 'boxShadow', t))]),
                    sizes: new Set(TOKENS.sizes.map((t) => resolve('font-size', 'fontSize', t))),
                    radii: new Set(['0px', ...TOKENS.radii.map((t) => resolve('border-radius', 'borderRadius', t))]),
                    families: new Set(TOKENS.families.map((t) => resolve('font-family', 'fontFamily', t))),
                }
                probe.remove()

                // A colour with any alpha of an allowed colour is that colour: a scrim is ink at 40 %.
                const rgbOf = (c) => c.replace(/^rgba?\(([^)]+)\)$/, '$1').split(',').slice(0, 3).map((v) => v.trim()).join(', ')
                const allowedRgb = new Set([...allowed.colours].map(rgbOf))
                const colourOk = (c) => allowed.colours.has(c) || allowedRgb.has(rgbOf(c))

                const found = []
                const note = (kind, el, value) => found.push({ kind, node: describeNode(el), value })

                for (const el of document.body.querySelectorAll('*')) {
                    if (el.closest('svg') !== null && el.tagName.toLowerCase() !== 'svg') continue
                    if (el.closest('[data-qa-ignore]')) continue
                    if (['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT'].includes(el.tagName)) continue

                    const box = el.getBoundingClientRect()
                    const cs = getComputedStyle(el)
                    if (box.width === 0 || box.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') continue

                    if (!colourOk(cs.color)) note('colour', el, cs.color)
                    if (!colourOk(cs.backgroundColor)) note('background', el, cs.backgroundColor)
                    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
                        if (parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== 'none' && !colourOk(cs[`border${side}Color`])) {
                            note('border-colour', el, cs[`border${side}Color`])
                            break
                        }
                    }

                    if (!allowed.shadows.has(cs.boxShadow)) note('shadow', el, cs.boxShadow)

                    const corners = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius']
                    for (const corner of corners) {
                        const r = cs[corner]
                        if (allowed.radii.has(r)) continue
                        // Fully round is fine on a dot, a radio or a count badge — never on a container.
                        const px = parseFloat(r)
                        const round = r.endsWith('%') ? parseFloat(r) >= 50 : px >= Math.min(box.width, box.height) / 2
                        if (round && Math.min(box.width, box.height) <= 32) continue
                        note('radius', el, r)
                        break
                    }

                    if (!allowed.families.has(cs.fontFamily) && el.textContent.trim() !== '') note('font-family', el, cs.fontFamily)
                    if (!allowed.sizes.has(cs.fontSize) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== '')) {
                        note('font-size', el, cs.fontSize)
                    }

                    if (cs.backgroundImage.includes('gradient(') && !GRADIENT_ALLOWLIST.some((s) => el.matches(s))) {
                        note('gradient', el, cs.backgroundImage.slice(0, 60))
                    }
                    const backdrop = cs.backdropFilter || cs.webkitBackdropFilter
                    if (backdrop && backdrop !== 'none') note('backdrop-filter', el, backdrop)
                    if ((cs.webkitBackgroundClip || cs.backgroundClip) === 'text') note('background-clip', el, 'text')

                    /*
                     * DIRECTION §3 bans the tracked-out capital LABEL. A field the visitor types a
                     * code into is not a label: HSN and TSN are set in the Zulassungsbescheinigung
                     * as spaced mono capitals, and a field that matches the paper is a field people
                     * copy correctly. So form controls are exempt, and nothing else is.
                     */
                    const control = ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)

                    if (!control && cs.textTransform === 'uppercase' && parseFloat(cs.letterSpacing) > 0.02 * parseFloat(cs.fontSize)) {
                        note('spaced-capitals', el, `${cs.letterSpacing} at ${cs.fontSize}`)
                    }
                }

                return { found, allowed: Object.fromEntries(Object.entries(allowed).map(([k, v]) => [k, [...v]])) }
            },
            { TOKENS, GRADIENT_ALLOWLIST, describe: describeNode }
        )

        for (const f of result.found) {
            findings.push({ route, width, ...f })
        }

        await page.close()
    }

    await context.close()
}

await browser.close()

/* One line per distinct (kind, value, node), with a count, so a repeated card reads as one finding. */
const grouped = new Map()
for (const f of findings) {
    const key = `${f.kind}|${f.value}|${f.node}`
    const entry = grouped.get(key) ?? { ...f, count: 0, routes: new Set() }
    entry.count++
    entry.routes.add(`${f.route}@${f.width}`)
    grouped.set(key, entry)
}

const rows = [...grouped.values()].sort((a, b) => a.kind.localeCompare(b.kind) || b.count - a.count)
mkdirSync(out.replace(/[\\/][^\\/]+$/, ''), { recursive: true })
writeFileSync(out, JSON.stringify(rows.map((r) => ({ ...r, routes: [...r.routes] })), null, 2))

if (rows.length === 0) {
    console.log('style inventory clean: every computed value resolves to a token')
    process.exit(0)
}

const byKind = {}
for (const r of rows) byKind[r.kind] = (byKind[r.kind] ?? 0) + r.count
console.log(Object.entries(byKind).map(([k, n]) => `${k} ${n}`).join(' · '))

for (const r of rows.slice(0, Number(args.limit ?? 60))) {
    console.log(`${r.kind.padEnd(16)} ${String(r.count).padStart(4)}×  ${r.node.padEnd(36)} ${r.value}   (${[...r.routes].slice(0, 3).join(', ')})`)
}

if (rows.length > 60 && !args.limit) console.log(`… ${rows.length - 60} more in ${out}`)
process.exit(args.report ? 0 : 1)
