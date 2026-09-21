// Checklist 6 on /__design: Tab order follows the visual order, focus is always visible (and
// visibly enough: a 3:1 change against the surface), the shortcuts work outside inputs and never
// inside them, and the top layer answers Esc and hands focus back.
//
//   node scripts/qa/probes/design-keyboard.mjs [--browsers chromium,webkit,firefox] [--width 1440]
import { parseArgs } from '../lib.mjs'
import { launch, open, options, watchConsole } from './design-lib.mjs'

const args = parseArgs()
const browsers = (typeof args.browsers === 'string' ? args.browsers : 'chromium,webkit,firefox').split(',')
const widths = args.width ? [Number(args.width)] : [1440, 390]
const problems = []
const notes = []

/** The focused element, with what a keyboard user sees of it. */
const describeFocus = `() => {
    const el = document.activeElement
    if (!el || el === document.body) return null
    const rgb = (c) => { const m = c.match(/\\d+(\\.\\d+)?/g) || [0, 0, 0, 1]; return { r: +m[0], g: +m[1], b: +m[2], a: m.length > 3 ? +m[3] : 1 } }
    const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
    const contrast = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05) }
    const cs = getComputedStyle(el)
    // The unfocused look, read with the element blurred and immediately refocused.
    const focusedBg = cs.backgroundColor, focusedOutline = cs.outlineStyle + ' ' + cs.outlineWidth, focusedShadow = cs.boxShadow, focusedBorder = cs.borderColor
    el.blur()
    const off = getComputedStyle(el)
    const restBg = off.backgroundColor, restOutline = off.outlineStyle + ' ' + off.outlineWidth, restShadow = off.boxShadow, restBorder = off.borderColor
    el.focus({ preventScroll: true })
    // Behind the element: the nearest ancestor with an opaque background.
    let p = el.parentElement, behind = 'rgb(255, 255, 255)'
    while (p) { const c = getComputedStyle(p).backgroundColor; if (rgb(c).a > 0.5) { behind = c; break } p = p.parentElement }
    const outlineShown = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && focusedOutline !== restOutline
    const shadowShown = focusedShadow !== 'none' && focusedShadow !== restShadow
    const borderShown = focusedBorder !== restBorder
    const bgShown = focusedBg !== restBg
    const bgContrast = bgShown ? contrast(rgb(focusedBg), rgb(behind)) : 0
    const outlineContrast = outlineShown ? contrast(rgb(cs.outlineColor), rgb(behind)) : 0
    const b = el.getBoundingClientRect()
    const cls = typeof el.className === 'string' ? el.className.split(/\\s+/).filter(Boolean).slice(0, 2).join('.') : ''
    const text = (el.textContent || el.getAttribute('aria-label') || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 26)
    // A stable identity per element, so two radios called "on" are not mistaken for a loop.
    if (!el.dataset.qaFocus) el.dataset.qaFocus = String(Object.keys(document.body.dataset).length + Math.random())
    return {
        id: el.dataset.qaFocus,
        desc: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '') + (text ? ' "' + text + '"' : ''),
        inMain: !!el.closest('main'),
        inOverlay: !!el.closest('[role=dialog]'),
        top: Math.round(b.top + window.scrollY), left: Math.round(b.left), bottom: Math.round(b.bottom + window.scrollY), width: Math.round(b.width), height: Math.round(b.height),
        outlineShown, shadowShown, borderShown, bgShown, bgContrast: Math.round(bgContrast * 100) / 100, outlineContrast: Math.round(outlineContrast * 100) / 100,
        focusedBg, restBg, behind, outline: focusedOutline + ' ' + cs.outlineColor,
        visible: getComputedStyle(el).visibility !== 'hidden' && b.width > 0,
    }
}`

for (const name of browsers) {
    const browser = await launch(name)

    for (const width of widths) {
        const context = await browser.newContext(options(name, width))
        const page = await context.newPage()
        const label = `${name.padEnd(8)} ${String(width).padStart(4)}`
        const messages = watchConsole(page, label)
        await open(page, undefined, { consent: true })

        // ── Walk the whole page with Tab ────────────────────────────────────────────
        await page.evaluate(() => { window.scrollTo(0, 0); document.body.focus() })
        const seen = []
        let inMainStarted = false
        for (let i = 0; i < 400; i++) {
            await page.keyboard.press('Tab')
            const f = await page.evaluate(`(${describeFocus})()`)
            if (!f) { problems.push(`${label} Tab #${i + 1}: focus fell on <body>`); break }
            if (f.inMain) inMainStarted = true
            else if (inMainStarted) break // into the footer: main is done
            if (!f.inMain) continue
            if (seen.some((s) => s.id === f.id)) { notes.push(`${label} focus loop at ${f.desc}`); break }
            seen.push(f)
        }
        if (seen.length < 30) problems.push(`${label} only ${seen.length} focus stops inside main — the walk broke early`)

        for (const f of seen) {
            if (!f.visible) problems.push(`${label} focus on an invisible element: ${f.desc}`)
            const shown = f.outlineShown || f.shadowShown || f.borderShown || f.bgShown
            if (!shown) problems.push(`${label} no visible focus on ${f.desc} (outline ${f.outline}, bg ${f.focusedBg})`)
            else if (!f.outlineShown && !f.shadowShown && !f.borderShown && f.bgShown && f.bgContrast < 3) {
                problems.push(`${label} focus on ${f.desc} is shown only by a background change ${f.restBg} → ${f.focusedBg} against ${f.behind}: contrast ${f.bgContrast}:1 (needs 3:1)`)
            }
            if (f.outlineShown && f.outlineContrast < 3) problems.push(`${label} focus outline on ${f.desc} has ${f.outlineContrast}:1 contrast against ${f.behind}`)
        }

        // Visual order: the next stop is lower, or on the same row and further right.
        for (let i = 1; i < seen.length; i++) {
            const a = seen[i - 1], b = seen[i]
            const sameRow = Math.abs(a.top - b.top) < Math.min(a.height, b.height) * 0.6
            const ok = sameRow ? b.left >= a.left - 2 : b.top >= a.top - 2 || b.top >= a.bottom - 8
            if (!ok) problems.push(`${label} Tab order vs. visual order: ${a.desc} (y ${a.top}, x ${a.left}) → ${b.desc} (y ${b.top}, x ${b.left})`)
        }

        // ── Shortcuts: what fires outside an input, and nothing fires inside one ─────
        const opensSomething = async (press) => {
            await page.evaluate(() => { document.activeElement instanceof HTMLElement && document.activeElement.blur() })
            await page.keyboard.press(press)
            await page.waitForTimeout(400)
            const opened = await page.evaluate(() => [...document.querySelectorAll('[role=dialog], .palette, .overlay, .dialog')].filter((el) => el.getBoundingClientRect().width > 0).map((el) => el.className.split(' ').slice(0, 2).join('.')))
            await page.keyboard.press('Escape')
            await page.waitForTimeout(400)
            return opened
        }
        const shortcuts = {}
        for (const key of ['/', '?', 'Control+k', 'Meta+k', 'Control+K']) {
            const opened = await opensSomething(key)
            if (opened.length) shortcuts[key] = opened.join(', ')
        }
        notes.push(`${label} shortcuts that open something outside inputs: ${Object.keys(shortcuts).length ? JSON.stringify(shortcuts) : 'none found'}`)
        // "/" is documented to focus the search.
        await page.evaluate(() => { document.activeElement instanceof HTMLElement && document.activeElement.blur() })
        await page.keyboard.press('/')
        await page.waitForTimeout(400)
        const slashTarget = await page.evaluate(() => { const el = document.activeElement; return el && el !== document.body ? `${el.tagName.toLowerCase()}#${el.id || ''}[type=${el.type || ''}] in ${el.closest('[role=dialog]') ? 'dialog' : el.closest('header') ? 'header' : 'page'}` : 'nothing' })
        notes.push(`${label} "/" focuses: ${slashTarget}`)
        if (!/input/.test(slashTarget)) problems.push(`${label} "/" did not focus a search field (focus on ${slashTarget})`)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
        await page.evaluate(() => { document.activeElement instanceof HTMLElement && document.activeElement.blur() })
        // A shortcut must not fire while an overlay is open: "/" inside the open Dialog.
        await page.getByRole('button', { name: 'Dialog öffnen' }).scrollIntoViewIfNeeded()
        await page.getByRole('button', { name: 'Dialog öffnen' }).click()
        await page.locator('.dialog').waitFor({ state: 'visible' })
        await page.keyboard.press('/')
        await page.waitForTimeout(300)
        const stillInDialog = await page.evaluate(() => !!document.activeElement?.closest('.dialog'))
        if (!stillInDialog) problems.push(`${label} "/" while the dialog is open moved focus out of it`)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(400)

        for (const sel of ['#sp-text', '#sp-search', '#sp-hsn']) {
            const input = page.locator(sel)
            await input.scrollIntoViewIfNeeded()
            await input.click()
            await input.fill('')
            for (const key of ['/', 'Control+k', 'Meta+k', 'k']) {
                await page.keyboard.press(key)
                await page.waitForTimeout(250)
                const opened = await page.evaluate(() => [...document.querySelectorAll('[role=dialog], .palette, .overlay, .dialog')].filter((el) => el.getBoundingClientRect().width > 0).length)
                if (opened) {
                    problems.push(`${label} shortcut "${key}" fired inside ${sel}`)
                    await page.keyboard.press('Escape')
                    await page.waitForTimeout(300)
                    await input.click()
                }
            }
            const value = await input.inputValue()
            if (!value.includes('/')) problems.push(`${label} typing "/" into ${sel} was swallowed (value "${value}")`)
            if (!/k/i.test(value)) problems.push(`${label} typing "k" into ${sel} was swallowed (value "${value}")`)
        }

        // The select: arrow keys change the value and do not scroll the page or move tabs.
        const sel = page.locator('#sp-select')
        await sel.focus()
        const y = await page.evaluate('window.scrollY')
        await page.keyboard.press('ArrowDown')
        await page.waitForTimeout(150)
        if ((await page.evaluate('window.scrollY')) !== y) problems.push(`${label} ArrowDown on the select scrolled the page`)

        // Esc on the top layer while a field inside the dialog... the overlays are covered by the
        // interaction probe; here: Esc with nothing open must not move focus or scroll.
        const busy = page.getByRole('button', { name: 'Wird geprüft' })
        await busy.focus()
        const y2 = await page.evaluate('window.scrollY')
        await page.keyboard.press('Escape')
        await page.waitForTimeout(150)
        const still = await page.evaluate(() => (document.activeElement?.textContent || '').trim())
        if (still !== 'Wird geprüft') problems.push(`${label} Esc with nothing open moved focus to "${still}"`)
        if ((await page.evaluate('window.scrollY')) !== y2) problems.push(`${label} Esc with nothing open scrolled the page`)

        // Space on a focused button must not scroll the page (it is a click), Space on the page does.
        await busy.focus()
        await page.keyboard.press('Space')
        await page.waitForTimeout(150)
        if ((await page.evaluate('window.scrollY')) !== y2) problems.push(`${label} Space on a button scrolled the page`)

        for (const m of messages) problems.push(`${label} console: ${m}`)
        await page.close()
        await context.close()
    }

    await browser.close()
}

if (notes.length) console.log('notes:\n' + notes.map((n) => '  ' + n).join('\n'))
if (problems.length === 0) {
    console.log(`keyboard clean in ${browsers.join(', ')} at ${widths.join(', ')}`)
    process.exit(0)
}
console.log(problems.join('\n'))
process.exit(1)
