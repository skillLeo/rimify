// Checklist 10 on /__design: paste "0005 582" and "0005/582" into HSN/TSN; autofill hooks; 200 %
// zoom; reduced motion; OS dark mode must not change the form controls.
//
//   node scripts/qa/probes/design-input.mjs [--browsers chromium,webkit,firefox]
import { readFileSync } from 'node:fs'
import { parseArgs } from '../lib.mjs'
import { SHOTS, inspectPage, launch, open, options, report, watchConsole } from './design-lib.mjs'

const args = parseArgs()
const browsers = (typeof args.browsers === 'string' ? args.browsers : 'chromium,webkit,firefox').split(',')
const problems = []
const notes = []

for (const name of browsers) {
    const browser = await launch(name)

    // ── Paste into HSN / TSN, autofill attributes ─────────────────────────────────
    {
        const context = await browser.newContext(options(name, 1440))
        const page = await context.newPage()
        const label = `${name.padEnd(8)} 1440`
        const messages = watchConsole(page, label)
        await open(page, undefined, { consent: true })

        for (const text of ['0005 582', '0005/582']) {
            for (const sel of ['#sp-hsn', '#sp-err']) {
                const input = page.locator(sel)
                await input.scrollIntoViewIfNeeded()
                await input.fill('')
                await input.focus()
                // A real paste: set the clipboard through a temporary textarea, then Ctrl+V.
                await page.evaluate(async (t) => {
                    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select()
                    document.execCommand('copy'); ta.remove()
                }, text)
                await input.focus()
                await page.keyboard.press(process.platform === 'darwin' ? 'Meta+v' : 'Control+v')
                await page.waitForTimeout(150)
                let value = await input.inputValue()
                if (value === '') {
                    // The clipboard is not always available to a headless engine; type it instead.
                    await input.type(text)
                    value = await input.inputValue()
                }
                notes.push(`${label} paste "${text}" into ${sel} → "${value}"`)
                const maxlength = await input.getAttribute('maxlength')
                if (maxlength && value.length > Number(maxlength)) problems.push(`${label} ${sel} accepted ${value.length} chars over maxlength ${maxlength}`)
            }
        }

        const auto = await page.evaluate(() => [...document.querySelectorAll('main input, main select')].map((el) => `${el.id || el.type}: autocomplete=${el.getAttribute('autocomplete') ?? '-'} inputmode=${el.getAttribute('inputmode') ?? '-'} type=${el.type}`))
        notes.push(`${label} field attributes: ${auto.join(' · ')}`)

        for (const m of messages) problems.push(`${label} console: ${m}`)
        await page.close()
        await context.close()
    }

    // ── 200 % zoom: a 1440 window at 200 % is 720 CSS px at DPR 2 ────────────────
    for (const [w, h] of [[720, 450], [640, 400]]) {
        const context = await browser.newContext({ ...options(name, 1440), viewport: { width: w, height: h }, deviceScaleFactor: 2 })
        const page = await context.newPage()
        const label = `${name.padEnd(8)} ${w * 2}@200%`
        await open(page, undefined, { consent: true })
        const r = await inspectPage(page)
        problems.push(...report(label, r).filter((l) => !/callout/.test(l)))
        if (name === 'chromium') await page.screenshot({ path: `${SHOTS}/${name}-${w * 2}-zoom200-full.png`, fullPage: true })
        await page.close()
        await context.close()
    }

    // ── Reduced motion ───────────────────────────────────────────────────────────
    {
        const context = await browser.newContext({ ...options(name, 1440), reducedMotion: 'reduce' })
        const page = await context.newPage()
        const label = `${name.padEnd(8)} reduced-motion`
        const messages = watchConsole(page, label)
        await open(page, undefined, { consent: true })
        const rm = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
        if (!rm) problems.push(`${label} the media query did not apply`)
        // The callout line is visible without the animation.
        const lineOpacity = await page.evaluate(() => [...document.querySelectorAll('.callout__line')].map((s) => getComputedStyle(s).opacity))
        notes.push(`${label} callout lines before draw: ${lineOpacity.join(', ') || 'none rendered'}`)
        // Overlay animation is effectively off.
        await page.getByRole('button', { name: 'Dialog öffnen' }).click()
        await page.locator('.dialog').waitFor({ state: 'visible' })
        const dur = await page.evaluate(() => ({ overlay: getComputedStyle(document.querySelector('.overlay')).animationDuration, dialog: getComputedStyle(document.querySelector('.dialog')).animationDuration }))
        if (parseFloat(dur.overlay) > 0.05 || parseFloat(dur.dialog) > 0.05) problems.push(`${label} overlay still animates: ${JSON.stringify(dur)}`)
        await page.keyboard.press('Escape')
        await page.locator('.dialog').waitFor({ state: 'hidden', timeout: 2000 }).catch(() => problems.push(`${label} dialog did not close (exit animation with reduced motion?)`))
        // The busy spinner under reduced motion.
        const busy = page.getByRole('button', { name: 'Wird geprüft' })
        await busy.scrollIntoViewIfNeeded()
        await busy.click()
        await page.waitForTimeout(150)
        const spin = await busy.evaluate((el) => { const a = getComputedStyle(el, '::after'); return `${a.animationName} ${a.animationDuration} ×${a.animationIterationCount}` })
        notes.push(`${label} busy spinner: ${spin}`)
        // Accordion open/close works without motion.
        const acc = page.locator('.accordion__trigger').first()
        await acc.scrollIntoViewIfNeeded()
        await acc.click()
        await page.waitForTimeout(100)
        if (!(await page.locator('.accordion__body').first().isVisible())) problems.push(`${label} accordion body not visible after click`)
        await acc.click()
        await page.waitForTimeout(100)
        if (await page.locator('.accordion__body').first().isVisible()) problems.push(`${label} accordion body still visible after closing`)
        for (const m of messages) problems.push(`${label} console: ${m}`)
        await page.close()
        await context.close()
    }

    // ── Dark mode: the controls must look the same ───────────────────────────────
    {
        const shots = {}
        const styles = {}
        for (const scheme of ['light', 'dark']) {
            const context = await browser.newContext({ ...options(name, 1440), colorScheme: scheme })
            const page = await context.newPage()
            await open(page, undefined, { consent: true })
            const fields = page.locator('section[aria-labelledby=s-fields]')
            await fields.scrollIntoViewIfNeeded()
            await page.waitForTimeout(200)
            shots[scheme] = await fields.screenshot({ animations: 'disabled' })
            styles[scheme] = await page.evaluate(() => {
                const pick = (sel) => { const el = document.querySelector(sel); const cs = getComputedStyle(el); return `${cs.backgroundColor} ${cs.color} ${cs.borderColor} ${cs.colorScheme}` }
                return { html: getComputedStyle(document.documentElement).colorScheme, input: pick('#sp-text'), select: pick('#sp-select'), disabled: pick('#sp-dis'), checkbox: pick('label.check input'), body: pick('body') }
            })
            if (name === 'chromium') await page.screenshot({ path: `${SHOTS}/${name}-1440-fields-${scheme}.png`, clip: await fields.boundingBox().then((b) => ({ x: 0, y: Math.max(0, b.y), width: 1440, height: Math.min(b.height, 900) })), animations: 'disabled' }).catch(() => {})
            await page.close()
            await context.close()
        }
        const label = `${name.padEnd(8)} dark-mode`
        for (const k of Object.keys(styles.light)) {
            if (styles.light[k] !== styles.dark[k]) problems.push(`${label} ${k} differs in dark mode: "${styles.light[k]}" → "${styles.dark[k]}"`)
        }
        if (!shots.light.equals(shots.dark)) {
            // Pixel-compare, so a one-pixel antialiasing difference is not a bug.
            const sharp = (await import('sharp')).default
            const a = await sharp(shots.light).raw().toBuffer({ resolveWithObject: true })
            const b = await sharp(shots.dark).raw().toBuffer({ resolveWithObject: true })
            let diff = 0
            if (a.info.width === b.info.width && a.info.height === b.info.height) {
                for (let i = 0; i < a.data.length; i += a.info.channels) {
                    if (Math.abs(a.data[i] - b.data[i]) > 8 || Math.abs(a.data[i + 1] - b.data[i + 1]) > 8 || Math.abs(a.data[i + 2] - b.data[i + 2]) > 8) diff++
                }
                const pct = (diff / (a.info.width * a.info.height)) * 100
                if (pct > 0.05) problems.push(`${label} the fields section renders differently in dark mode: ${diff} px (${pct.toFixed(2)} %) differ`)
                else notes.push(`${label} fields section: ${diff} px differ between light and dark (${pct.toFixed(3)} %)`)
            } else problems.push(`${label} the fields section changes size in dark mode: ${a.info.width}×${a.info.height} → ${b.info.width}×${b.info.height}`)
        } else notes.push(`${label} fields section pixel-identical in light and dark`)
    }

    await browser.close()
}

if (notes.length) console.log('notes:\n' + notes.map((n) => '  ' + n).join('\n'))
if (problems.length === 0) {
    console.log(`input checks clean in ${browsers.join(', ')}`)
    process.exit(0)
}
console.log(problems.join('\n'))
process.exit(1)
