// Shared pieces of the /__design probes: a browser launcher that knows Firefox has no `isMobile`,
// a console collector, the in-page layout inspector (overflow, spill, clipping, overlap) and the
// shot folder. Every probe runs against the server that is already up (see ../lib.mjs).
import { mkdirSync } from 'node:fs'
import { BASE, BROWSERS, MOBILE_UA } from '../lib.mjs'

export { BASE }

export const ROUTE = '/__design'
export const SHOTS = 'docs/qa/shots/design-system'
mkdirSync(SHOTS, { recursive: true })

export const PHONE_WIDTHS = [320, 360, 375, 390, 414, 430]
export const WIDE_WIDTHS = [768, 834, 1024, 1280, 1440, 1920]
export const ALL_WIDTHS = [...PHONE_WIDTHS, ...WIDE_WIDTHS]

/** Phone heights that pair with the widths above (portrait). */
export const PHONE_HEIGHTS = { 320: 568, 360: 800, 375: 812, 390: 844, 414: 896, 430: 932 }

export async function launch(name) {
    const engine = BROWSERS[name]
    if (!engine) throw new Error(`unknown browser ${name}`)
    return engine.launch()
}

/**
 * Context options for a width. Phones get touch, the mobile UA and a 2× DPR; Firefox refuses
 * `isMobile`, so it gets everything else. `landscape` swaps the phone's sides.
 */
export function options(browserName, width, { mobile = width < 640, landscape = false, height } = {}) {
    const h = height ?? (mobile ? PHONE_HEIGHTS[width] ?? 800 : 900)
    const viewport = landscape ? { width: h, height: width } : { width, height: h }

    if (!mobile) return { viewport, locale: 'de-DE', timezoneId: 'Europe/Berlin' }

    const base = { viewport, hasTouch: true, deviceScaleFactor: 2, userAgent: MOBILE_UA, locale: 'de-DE', timezoneId: 'Europe/Berlin' }
    return browserName === 'firefox' ? base : { ...base, isMobile: true }
}

/** Collects everything the console gate would fail on, for the whole life of a page. */
export function watchConsole(page, label = '') {
    const messages = []
    page.on('console', (m) => {
        if (m.type() === 'error' || m.type() === 'warning') messages.push(`${label} ${m.type()}: ${m.text().slice(0, 200)}`)
    })
    page.on('pageerror', (e) => messages.push(`${label} pageerror: ${String(e.message).slice(0, 200)}`))
    page.on('requestfailed', (r) => messages.push(`${label} requestfailed: ${r.url()} (${r.failure()?.errorText})`))
    page.on('response', (r) => {
        if (r.status() >= 400) messages.push(`${label} http ${r.status()}: ${r.url()}`)
    })
    return messages
}

export async function open(page, path = ROUTE, { consent = false } = {}) {
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60_000 })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(250)
    if (consent) await acceptConsent(page)
}

/** What a customer does first: answers the cookie sheet, so it no longer covers the page. */
export async function acceptConsent(page) {
    const button = page.locator('.consent').getByRole('button', { name: 'Verstanden' })
    if (await button.count()) {
        await button.click()
        await page.locator('.consent').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {})
        await page.waitForTimeout(200)
    }
}

/**
 * The in-page inspector. Returns:
 *  over      document scrollWidth beyond the viewport
 *  spill     visible elements in <main> whose border box leaves the viewport sideways, or leaves an
 *            ancestor that clips (overflow hidden/clip) — that is "clipped" as a customer sees it
 *  cut       elements that cut their own text: overflow hidden and nowrap with scrollWidth > clientWidth
 *  overlaps  pairs that must never intersect: the spec callouts among themselves, and a tile's verdict
 *            badge with its compare control (when the compare control is visible)
 */
export const inspect = `() => {
    const desc = (el) => {
        const cls = typeof el.className === 'string' ? el.className.split(/\\s+/).filter(Boolean).slice(0, 2).join('.') : ''
        const id = el.id ? '#' + el.id : ''
        const text = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 28)
        return el.tagName.toLowerCase() + id + (cls ? '.' + cls : '') + (text ? ' "' + text + '"' : '')
    }
    const r = (el) => el.getBoundingClientRect()
    const vw = document.documentElement.clientWidth
    const out = { vw, over: document.documentElement.scrollWidth - vw, spill: [], cut: [], overlaps: [] }
    const main = document.querySelector('main') || document.body
    const visible = (el) => {
        const cs = getComputedStyle(el)
        return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0
    }
    const clips = (cs) => ['hidden', 'clip'].includes(cs.overflowX) || ['hidden', 'clip'].includes(cs.overflowY)
    const seen = new Set()

    for (const el of main.querySelectorAll('*')) {
        if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue
        if (el.closest('.visually-hidden, [data-state="closed"], [hidden]')) continue
        if (!visible(el)) continue
        const cs = getComputedStyle(el)
        if (cs.position === 'fixed') continue
        const b = r(el)
        if (b.width === 0 || b.height === 0) continue

        if (b.right > vw + 1 || b.left < -1) {
            const key = desc(el)
            if (!seen.has(key)) { seen.add(key); out.spill.push(key + ' [' + Math.round(b.left) + '..' + Math.round(b.right) + '] beyond viewport ' + vw) }
            continue
        }

        // Sideways beyond the parent's box: a nowrap control wider than its row is drawn outside it.
        const p = el.parentElement
        if (p && p !== main && cs.position !== 'absolute') {
            const pcs = getComputedStyle(p)
            const scrolls = ['auto', 'scroll'].includes(pcs.overflowX)
            const pb = r(p)
            if (!scrolls && (b.right > pb.right + 1 || b.left < pb.left - 1)) {
                const key = desc(el)
                if (!seen.has(key)) { seen.add(key); out.spill.push(key + ' [' + Math.round(b.left) + '..' + Math.round(b.right) + '] outside parent ' + desc(p) + ' [' + Math.round(pb.left) + '..' + Math.round(pb.right) + ']') }
                continue
            }
        }

        // Inside a clipping ancestor: the part outside is simply not drawn.
        let a = el.parentElement
        while (a && a !== main) {
            const acs = getComputedStyle(a)
            if (clips(acs) && !a.classList.contains('visually-hidden')) {
                const ab = r(a)
                if (b.right > ab.right + 1 || b.left < ab.left - 1 || b.bottom > ab.bottom + 1 || b.top < ab.top - 1) {
                    const key = desc(el)
                    if (!seen.has(key)) { seen.add(key); out.spill.push(key + ' [' + Math.round(b.left) + '..' + Math.round(b.right) + ' × ' + Math.round(b.top) + '..' + Math.round(b.bottom) + '] clipped by ' + desc(a) + ' [' + Math.round(ab.left) + '..' + Math.round(ab.right) + ' × ' + Math.round(ab.top) + '..' + Math.round(ab.bottom) + ']') }
                }
                break
            }
            a = a.parentElement
        }

        if (clips(cs) && cs.whiteSpace === 'nowrap' && el.scrollWidth > el.clientWidth + 1) {
            out.cut.push(desc(el) + ' text ' + el.scrollWidth + ' > box ' + el.clientWidth)
        }
    }

    const intersects = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1
    const callouts = [...main.querySelectorAll('.callout')]
    for (let i = 0; i < callouts.length; i++) {
        for (let j = i + 1; j < callouts.length; j++) {
            if (intersects(r(callouts[i]), r(callouts[j]))) out.overlaps.push(desc(callouts[i]) + ' × ' + desc(callouts[j]))
        }
    }
    for (const tile of main.querySelectorAll('.tile')) {
        const badge = tile.querySelector('.tile__badge')
        const compare = tile.querySelector('.tile__compare')
        if (badge && compare && parseFloat(getComputedStyle(compare).opacity) > 0 && intersects(r(badge), r(compare))) {
            out.overlaps.push(desc(badge) + ' × ' + desc(compare) + ' in ' + desc(tile.querySelector('.tile__name') || tile))
        }
    }

    return out
}`

/** Runs the inspector in the page (a string is evaluated as an expression, so it is called here). */
export function inspectPage(page) {
    return page.evaluate(`(${inspect})()`)
}

export function report(title, r) {
    const lines = []
    if (r.over > 1) lines.push(`overflow ${r.over}px`)
    for (const s of r.spill) lines.push(`spill: ${s}`)
    for (const c of r.cut) lines.push(`cut: ${c}`)
    for (const o of r.overlaps) lines.push(`overlap: ${o}`)
    return lines.map((l) => `${title} ${l}`)
}
