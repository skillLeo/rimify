// Checklist 2 on /__design under touch emulation (hasTouch, isMobile where the engine allows it):
// no stuck hover after a tap, every target in <main> at least 44px, no input under 16px (iOS zoom),
// safe areas honoured by every fixed bottom surface, nothing sized with 100vh, and the viewport
// meta allows env() to work at all.
//
//   node scripts/qa/probes/design-mobile.mjs [--browsers chromium,webkit,firefox] [--width 390]
import { parseArgs } from '../lib.mjs'
import { launch, open, options, watchConsole } from './design-lib.mjs'

const args = parseArgs()
const browsers = (typeof args.browsers === 'string' ? args.browsers : 'chromium,webkit,firefox').split(',')
const widths = args.width ? [Number(args.width)] : [390, 320]
const problems = []
const notes = []

const look = `(el) => {
    const cs = getComputedStyle(el)
    return [cs.backgroundColor, cs.borderColor, cs.color, cs.textDecorationLine, cs.outlineStyle, cs.transform].join(' | ')
}`

for (const name of browsers) {
    const browser = await launch(name)

    for (const width of widths) {
        const context = await browser.newContext(options(name, width))
        const page = await context.newPage()
        const label = `${name.padEnd(8)} ${String(width).padStart(4)} touch`
        const messages = watchConsole(page, label)
        await open(page, undefined, { consent: true })

        // ── The viewport meta and the page's own touch hygiene ───────────────────────
        const meta = await page.evaluate(() => ({
            viewport: document.querySelector('meta[name=viewport]')?.getAttribute('content') ?? '',
            hoverMQ: matchMedia('(hover: hover)').matches,
            coarse: matchMedia('(pointer: coarse)').matches,
            isMobile: document.body.classList.contains('is-mobile'),
            tapHighlight: getComputedStyle(document.body).webkitTapHighlightColor,
        }))
        if (!/viewport-fit=cover/.test(meta.viewport)) notes.push(`${label} viewport meta has no viewport-fit=cover ("${meta.viewport}") — env(safe-area-inset-*) stays 0 on a notched iPhone`)
        if (!/width=device-width/.test(meta.viewport)) problems.push(`${label} viewport meta lacks width=device-width`)
        if (/maximum-scale=1|user-scalable=no/.test(meta.viewport)) problems.push(`${label} viewport meta forbids pinch zoom`)
        notes.push(`${label} hover:hover=${meta.hoverMQ} pointer:coarse=${meta.coarse} body.is-mobile=${meta.isMobile}`)

        // ── Inputs: never below 16px ─────────────────────────────────────────────────
        // iOS zooms into text entry only; a checkbox or radio does not take typing.
        const smallInputs = await page.evaluate(() => [...document.querySelectorAll('main input:not([type=checkbox]):not([type=radio]), main select, main textarea')]
            .filter((el) => el.getBoundingClientRect().width > 0 && parseFloat(getComputedStyle(el).fontSize) < 16)
            .map((el) => `${el.tagName.toLowerCase()}#${el.id || el.type} ${getComputedStyle(el).fontSize}`))
        for (const s of smallInputs) problems.push(`${label} input below 16px: ${s}`)

        // ── Tap targets: every control in main, measured as the customer's hit area ──
        const small = await page.evaluate(() => {
            const targetOf = (el) => {
                if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) return el.closest('label') ?? el
                const after = getComputedStyle(el, '::after')
                if (el instanceof HTMLAnchorElement && after.position === 'absolute' && after.content !== 'none' && el.offsetParent) return el.offsetParent
                return el
            }
            const out = []
            for (const el of document.querySelectorAll('main a, main button, main input, main select, main [role=tab], main label.check, main label.tile__compare')) {
                if (el.closest('.visually-hidden')) continue
                const cs = getComputedStyle(el)
                if (cs.visibility === 'hidden' || cs.display === 'none') continue
                if (el.matches('label') && el.querySelector('input')) { /* the label is the target for its input; measured below via the input */ }
                const t = targetOf(el)
                const b = t.getBoundingClientRect()
                if (b.width === 0 || b.height === 0) continue
                if (b.height < 43.5 || b.width < 43.5) {
                    const text = (el.textContent || el.getAttribute('aria-label') || el.id || '').trim().replace(/\\s+/g, ' ').slice(0, 30)
                    out.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} "${text}" ${Math.round(b.width)}×${Math.round(b.height)}`)
                }
            }
            return [...new Set(out)]
        })
        for (const s of small) problems.push(`${label} tap target under 44px: ${s}`)

        // ── Tap every control, look for a stuck hover/active look ───────────────────
        const controls = page.locator('main button:not([disabled]):not([aria-disabled=true]), main .chip:not([aria-disabled=true]), main [role=tab], main .accordion__trigger, main label.check')
        const n = await controls.count()
        for (let i = 0; i < n; i++) {
            const c = controls.nth(i)
            if (!(await c.isVisible())) continue
            const text = ((await c.textContent()) ?? (await c.getAttribute('aria-label')) ?? '').trim().slice(0, 30)
            if (/öffnen$|Wird geprüft/.test(text)) continue
            await c.scrollIntoViewIfNeeded()
            const before = await c.evaluate(`(${look})`)
            const stateBefore = await c.evaluate((el) => [el.getAttribute('aria-pressed'), el.getAttribute('aria-selected'), el.getAttribute('aria-expanded'), el.getAttribute('data-state')].join())
            await c.tap().catch((e) => problems.push(`${label} tap on "${text}" failed: ${e.message.split('\n')[0]}`))
            await page.waitForTimeout(350)
            // A second tap somewhere neutral, as a thumb lifting and touching the page again.
            await page.touchscreen.tap(width / 2, 8).catch(() => {})
            await page.waitForTimeout(250)
            const after = await c.evaluate(`(${look})`)
            const stateAfter = await c.evaluate((el) => [el.getAttribute('aria-pressed'), el.getAttribute('aria-selected'), el.getAttribute('aria-expanded'), el.getAttribute('data-state')].join())
            const focused = await c.evaluate((el) => el === document.activeElement || el.contains(document.activeElement))
            if (after !== before && stateBefore === stateAfter && !focused) {
                problems.push(`${label} "${text}" keeps a different look after the tap: ${before} → ${after}`)
            }
            if (!page.url().endsWith('/__design')) { problems.push(`${label} tapping "${text}" navigated to ${page.url()}`); await open(page, undefined, { consent: true }) }
        }

        // ── Tile compare: always visible on touch, and above the stretched link ─────
        const tile = page.locator('.tile').filter({ has: page.locator('.tile__badge') }).first()
        await tile.scrollIntoViewIfNeeded()
        const op = await tile.locator('.tile__compare').evaluate((el) => getComputedStyle(el).opacity)
        if (op !== '1') problems.push(`${label} tile compare control is not visible on touch (opacity ${op})`)
        const cb = tile.locator('.tile__compare input')
        await tile.locator('.tile__compare').tap()
        await page.waitForTimeout(300)
        if (!page.url().endsWith('/__design')) { problems.push(`${label} tapping "Vergleichen" followed the tile link`); await open(page, undefined, { consent: true }) }
        else if (!(await cb.isChecked())) problems.push(`${label} tapping "Vergleichen" did not check the box`)

        // ── Sticky hover on the tile name after a tap on the tile (it navigates, so test on a copy) ─
        // ── Fixed bottom surfaces and safe areas ────────────────────────────────────
        const fixed = await page.evaluate(() => {
            const out = []
            const sheets = [...document.styleSheets].filter((s) => { try { return !!s.cssRules } catch { return false } })
            const rules = sheets.flatMap((s) => [...s.cssRules].flatMap((r) => (r.cssRules ? [...r.cssRules] : [r])))
            const has100vh = rules.filter((r) => r.style && /(^|[^d])100vh/.test(r.cssText)).map((r) => r.selectorText)
            const bottomFixed = rules.filter((r) => r.style && r.style.position === 'fixed' && r.style.bottom && r.style.bottom !== 'auto').map((r) => `${r.selectorText}: bottom ${r.style.bottom}`)
            const noSafe = bottomFixed.filter((s) => !/safe-area/.test(s))
            return { has100vh: [...new Set(has100vh)], noSafe }
        })
        for (const s of fixed.has100vh) notes.push(`${label} 100vh in stylesheet rule: ${s}`)
        for (const s of fixed.noSafe) notes.push(`${label} fixed-to-bottom rule without safe-area inset: ${s}`)

        // Open the sheet and the drawer on touch: their bottom padding must include the safe area.
        for (const [trigger, sel] of [['Sheet öffnen', '.sheet'], ['Drawer öffnen', '.drawer']]) {
            const btn = page.getByRole('button', { name: trigger })
            await btn.scrollIntoViewIfNeeded()
            await btn.tap()
            const panel = page.locator(sel)
            await panel.waitFor({ state: 'visible', timeout: 3000 }).catch(() => problems.push(`${label} ${trigger}: did not open on tap`))
            await page.waitForTimeout(400)
            const g = await panel.evaluate((el) => {
                const b = el.getBoundingClientRect()
                const cs = getComputedStyle(el)
                return { bottom: Math.round(b.bottom), vh: window.innerHeight, pad: cs.paddingBottom, h: Math.round(b.height), maxH: cs.maxHeight, scrollable: el.scrollHeight > el.clientHeight + 1 }
            })
            if (Math.abs(g.bottom - g.vh) > 1) problems.push(`${label} ${trigger}: panel bottom ${g.bottom} is not at the viewport bottom ${g.vh}`)
            notes.push(`${label} ${trigger}: height ${g.h}/${g.vh}, padding-bottom ${g.pad}, max-height ${g.maxH}, scrollable ${g.scrollable}`)
            // A touch scroll on the scrim must not move the page.
            const y0 = await page.evaluate('window.scrollY')
            await page.touchscreen.tap(10, 100).catch(() => {})
            await page.waitForTimeout(400)
            if (await panel.isVisible()) {
                await page.keyboard.press('Escape')
                await panel.waitFor({ state: 'hidden' }).catch(() => {})
            }
            await page.waitForTimeout(300)
            const y1 = await page.evaluate('window.scrollY')
            if (y1 !== y0) problems.push(`${label} ${trigger}: page moved ${y0}→${y1} around a tap on the scrim`)
        }

        for (const m of messages) problems.push(`${label} console: ${m}`)
        await page.close()
        await context.close()
    }

    await browser.close()
}

if (notes.length) console.log('notes:\n' + notes.map((n) => '  ' + n).join('\n'))
if (problems.length === 0) {
    console.log(`touch clean in ${browsers.join(', ')} at ${widths.join(', ')}`)
    process.exit(0)
}
console.log(problems.join('\n'))
process.exit(1)
