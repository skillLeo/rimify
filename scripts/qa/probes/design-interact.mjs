// Checklist 5 (and the overlay contract) on /__design: click, tap and keyboard-activate every
// control; double-click every button; open and close each overlay three times fast; check focus
// trap, Esc, scrim click, focus return, scroll lock, no layout jump, background not scrollable; the
// aria-busy button; the tile's compare control above the stretched link; the callout toggle; tabs
// and accordion. Console is watched throughout.
//
//   node scripts/qa/probes/design-interact.mjs [--browsers chromium,webkit,firefox] [--width 1440|390]
import { parseArgs } from '../lib.mjs'
import { SHOTS, launch, open, options, watchConsole } from './design-lib.mjs'

const args = parseArgs()
const browsers = (typeof args.browsers === 'string' ? args.browsers : 'chromium,webkit,firefox').split(',')
const widths = args.width ? [Number(args.width)] : [1440, 390]
const problems = []
const notes = []

const OVERLAYS = [
    { trigger: 'Dialog öffnen', content: '.dialog', title: 'Fahrzeug entfernen?' },
    { trigger: 'Drawer öffnen', content: '.drawer', title: 'Menü' },
    { trigger: 'Sheet öffnen', content: '.sheet', title: 'Dein Fahrzeug' },
]

function fail(label, text) {
    problems.push(`${label} ${text}`)
}

/** Where the page is and what has focus, logged after each sub-step of an overlay test. */
async function trace(page, label, what) {
    const s = await page.evaluate(() => `${window.scrollY} · focus ${document.activeElement ? document.activeElement.tagName + ' "' + (document.activeElement.textContent || document.activeElement.getAttribute('aria-label') || '').trim().slice(0, 18) + '"' : 'none'} · open ${document.querySelectorAll('.dialog, .drawer, .sheet').length}`)
    notes.push(`${label} trace ${what}: ${s}`)
}

/** Everything about the page's frame that an overlay must not disturb. */
const frame = `() => {
    const h1 = document.querySelector('h1').getBoundingClientRect()
    const body = getComputedStyle(document.body)
    return {
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
        h1Left: Math.round(h1.left * 10) / 10,
        h1Width: Math.round(h1.width * 10) / 10,
        bodyPaddingRight: body.paddingRight,
        bodyMarginRight: body.marginRight,
        bodyOverflow: body.overflow,
        scrollY: window.scrollY,
        gutter: getComputedStyle(document.documentElement).scrollbarGutter,
    }
}`

for (const name of browsers) {
    const browser = await launch(name)

    for (const width of widths) {
        const mobile = width < 640
        const context = await browser.newContext(options(name, width))
        const page = await context.newPage()
        const label = `${name.padEnd(8)} ${String(width).padStart(4)}`
        const messages = watchConsole(page, label)
        await open(page, undefined, { consent: true })

        try {
            await run(page, label, mobile, name, width)
        } catch (e) {
            fail(label, `probe aborted: ${String(e.message).split('\n')[0]}`)
        }

        consoleProblems(messages, label)
        await page.close()
        await context.close()
    }

    await browser.close()
}

async function run(page, label, mobile, name, width) {
    {
        // ── Overlays ────────────────────────────────────────────────────────────────
        for (const o of OVERLAYS) {
            const trigger = page.getByRole('button', { name: o.trigger })
            // The trigger mid-screen, so neither Playwright's pre-click scroll nor a focus() has a
            // reason to move the page: any movement from here on is the overlay's doing.
            await trigger.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
            await page.waitForTimeout(150)
            const before = await page.evaluate(`(${frame})()`)

            await trigger.click()
            const content = page.locator(o.content)
            await content.waitFor({ state: 'visible', timeout: 3000 }).catch(() => fail(label, `${o.trigger}: ${o.content} did not open`))
            await page.waitForTimeout(400)
            const during = await page.evaluate(`(${frame})()`)

            // Layout jump: the h1 must not move sideways, whatever the scroll lock does to <body>.
            if (Math.abs(during.h1Left - before.h1Left) > 0.5 || Math.abs(during.h1Width - before.h1Width) > 0.5) {
                fail(label, `${o.trigger}: layout jump on open — h1 left ${before.h1Left}→${during.h1Left}, width ${before.h1Width}→${during.h1Width} (body padding-right ${during.bodyPaddingRight}, margin-right ${during.bodyMarginRight}, scrollbar-gutter ${during.gutter}, clientWidth ${before.clientWidth}→${during.clientWidth})`)
            }
            if (during.scrollY !== before.scrollY) fail(label, `${o.trigger}: scroll jump on open ${before.scrollY}→${during.scrollY}`)

            // Scroll lock: a wheel on the scrim must not move the page.
            await page.mouse.move(10, Math.round((await page.viewportSize()).height / 2))
            await page.mouse.wheel(0, 600)
            await page.waitForTimeout(250)
            const afterWheel = await page.evaluate('window.scrollY')
            if (afterWheel !== before.scrollY) fail(label, `${o.trigger}: background scrolled under the overlay (${before.scrollY}→${afterWheel}); body overflow "${during.bodyOverflow}"`)
            if (mobile) {
                // A swipe on the scrim on a phone.
                const vs = await page.viewportSize()
                await page.touchscreen.tap(10, Math.round(vs.height / 2)).catch(() => {})
            }
            const afterTouch = await page.evaluate('window.scrollY')
            if (afterTouch !== before.scrollY) fail(label, `${o.trigger}: background scrolled after a touch on the scrim (${before.scrollY}→${afterTouch})`)
            await trace(page, label, `${o.trigger} after wheel/touch`)

            // If a tap on the scrim closed it, reopen to keep testing.
            if (!(await content.isVisible())) {
                await trigger.click()
                await content.waitFor({ state: 'visible' })
                await page.waitForTimeout(350)
            }

            // Focus is inside the overlay; the title is what the overlay is named after.
            const focusInside = await page.evaluate((sel) => document.querySelector(sel)?.contains(document.activeElement) ?? false, o.content)
            if (!focusInside) fail(label, `${o.trigger}: focus is not inside the overlay after opening (on ${await page.evaluate('document.activeElement && (document.activeElement.tagName + " " + (document.activeElement.textContent || "").trim().slice(0, 30))')})`)
            const named = await content.getAttribute('aria-labelledby')
            if (!named) fail(label, `${o.trigger}: content has no aria-labelledby`)
            const modal = await content.getAttribute('aria-modal')
            if (modal !== 'true') fail(label, `${o.trigger}: aria-modal is "${modal}"`)

            // Focus trap: Tab many times, never leave the overlay.
            for (let i = 0; i < 12; i++) {
                await page.keyboard.press('Tab')
                const inside = await page.evaluate((sel) => document.querySelector(sel)?.contains(document.activeElement) ?? false, o.content)
                if (!inside) {
                    fail(label, `${o.trigger}: Tab #${i + 1} escaped the overlay to ${await page.evaluate('document.activeElement && document.activeElement.tagName + "." + document.activeElement.className')}`)
                    break
                }
            }
            for (let i = 0; i < 6; i++) {
                await page.keyboard.press('Shift+Tab')
                const inside = await page.evaluate((sel) => document.querySelector(sel)?.contains(document.activeElement) ?? false, o.content)
                if (!inside) {
                    fail(label, `${o.trigger}: Shift+Tab #${i + 1} escaped the overlay`)
                    break
                }
            }

            // Visible focus on the focused control inside.
            const ring = await page.evaluate(() => {
                const el = document.activeElement
                if (!el || el === document.body) return 'none'
                const cs = getComputedStyle(el)
                return `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} / box-shadow ${cs.boxShadow}`
            })
            if (/^none 0px|^none/.test(ring) && !/rgb/.test(ring.split('box-shadow')[1] ?? '')) fail(label, `${o.trigger}: focused control inside has no visible focus ring (${ring})`)

            await trace(page, label, `${o.trigger} after Tab loop`)

            // Esc closes and returns focus to the trigger.
            await page.keyboard.press('Escape')
            await content.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => fail(label, `${o.trigger}: Esc did not close`))
            await page.waitForTimeout(350)
            const returned = await page.evaluate((t) => (document.activeElement?.textContent || '').trim() === t, o.trigger)
            if (!returned) fail(label, `${o.trigger}: focus did not return to the trigger after Esc (on ${await page.evaluate('document.activeElement && document.activeElement.tagName + " " + (document.activeElement.textContent||"").trim().slice(0,30)')})`)
            const after = await page.evaluate(`(${frame})()`)
            if (after.scrollY !== before.scrollY) fail(label, `${o.trigger}: scroll position changed after close ${before.scrollY}→${after.scrollY}`)
            if (after.bodyOverflow === 'hidden') fail(label, `${o.trigger}: body still overflow:hidden after close`)
            if (after.bodyPaddingRight !== before.bodyPaddingRight) fail(label, `${o.trigger}: body padding-right left at ${after.bodyPaddingRight}`)
            if (Math.abs(after.h1Left - before.h1Left) > 0.5) fail(label, `${o.trigger}: layout did not return after close (h1 left ${before.h1Left}→${after.h1Left})`)

            // Scrim click closes and returns focus.
            await trigger.click()
            await content.waitFor({ state: 'visible' })
            await page.waitForTimeout(350)
            const overlay = page.locator('.overlay').first()
            const box = await overlay.boundingBox()
            if (!box) fail(label, `${o.trigger}: no .overlay scrim found`)
            // Click a corner of the scrim that no overlay shape covers (top-left for drawer/sheet, top-left for dialog too).
            await page.mouse.click(8, 8)
            await content.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => fail(label, `${o.trigger}: scrim click did not close`))
            await page.waitForTimeout(350)
            const returned2 = await page.evaluate((t) => (document.activeElement?.textContent || '').trim() === t, o.trigger)
            if (!returned2) fail(label, `${o.trigger}: focus did not return to the trigger after scrim click`)
            await trace(page, label, `${o.trigger} after scrim click`)

            // The close button.
            await trigger.click()
            await content.waitFor({ state: 'visible' })
            await page.waitForTimeout(350)
            const closeBtn = content.getByRole('button', { name: 'Schließen' })
            const cb = await closeBtn.boundingBox()
            if (!cb || cb.width < 43.5 || cb.height < 43.5) fail(label, `${o.trigger}: close button is ${cb ? `${Math.round(cb.width)}×${Math.round(cb.height)}` : 'missing'}`)
            await closeBtn.click()
            await content.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => fail(label, `${o.trigger}: close button did not close`))
            await page.waitForTimeout(350)
            await trace(page, label, `${o.trigger} after close button`)

            // Rapid open/close ×3: no stuck scrim, no stuck scroll lock, focus back on the trigger.
            for (let i = 0; i < 3; i++) {
                await trigger.click()
                await page.waitForTimeout(60)
                await page.keyboard.press('Escape')
                await page.waitForTimeout(60)
            }
            await page.waitForTimeout(600)
            const stuck = await page.evaluate(() => ({
                overlays: document.querySelectorAll('.overlay').length,
                contents: document.querySelectorAll('.dialog, .drawer, .sheet').length,
                bodyOverflow: getComputedStyle(document.body).overflow,
                pointer: document.body.style.pointerEvents,
                active: (document.activeElement?.textContent || '').trim().slice(0, 30),
            }))
            if (stuck.overlays || stuck.contents) fail(label, `${o.trigger}: after 3 rapid open/close, ${stuck.overlays} scrim(s) and ${stuck.contents} panel(s) remain in the DOM`)
            if (stuck.bodyOverflow === 'hidden') fail(label, `${o.trigger}: after 3 rapid open/close, body is still overflow:hidden`)
            if (stuck.pointer === 'none') fail(label, `${o.trigger}: after 3 rapid open/close, body still has pointer-events:none`)
            if (stuck.active !== o.trigger) fail(label, `${o.trigger}: after 3 rapid open/close, focus is on "${stuck.active}"`)
            const finalScroll = await page.evaluate('window.scrollY')
            if (finalScroll !== before.scrollY) fail(label, `${o.trigger}: scroll moved during rapid open/close ${before.scrollY}→${finalScroll}`)
            await trace(page, label, `${o.trigger} after rapid ×3`)

            // Double-click on the trigger: one overlay, not two.
            await trigger.dblclick()
            await page.waitForTimeout(400)
            const count = await page.locator('.dialog, .drawer, .sheet').count()
            if (count !== 1) fail(label, `${o.trigger}: double-click leaves ${count} panel(s) open`)
            const scrims = await page.locator('.overlay').count()
            if (scrims > 1) fail(label, `${o.trigger}: double-click leaves ${scrims} scrims`)
            await page.keyboard.press('Escape')
            await page.waitForTimeout(350)

            // Overlay geometry at this width.
            await trigger.click()
            await content.waitFor({ state: 'visible' })
            await page.waitForTimeout(350)
            const geo = await content.evaluate((el) => {
                const b = el.getBoundingClientRect()
                const vw = document.documentElement.clientWidth
                const vh = window.innerHeight
                const inner = [...el.querySelectorAll('*')].map((c) => c.getBoundingClientRect()).filter((r) => r.width && r.height)
                const spill = inner.filter((r) => r.right > b.right + 1 || r.left < b.left - 1)
                return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, vw, vh, spill: spill.length, scrollH: el.scrollHeight, clientH: el.clientHeight }
            })
            if (geo.right > geo.vw + 1 || geo.left < -1) fail(label, `${o.trigger}: panel [${Math.round(geo.left)}..${Math.round(geo.right)}] leaves the viewport (${geo.vw})`)
            if (geo.bottom > geo.vh + 1 || geo.top < -1) fail(label, `${o.trigger}: panel [${Math.round(geo.top)}..${Math.round(geo.bottom)}] leaves the viewport height (${geo.vh})`)
            if (geo.spill) fail(label, `${o.trigger}: ${geo.spill} element(s) inside the panel stick out sideways`)
            await page.screenshot({ path: `${SHOTS}/${name}-${width}-${o.content.slice(1)}.png`, animations: 'disabled' })
            await page.keyboard.press('Escape')
            await content.waitFor({ state: 'hidden' })
            await page.waitForTimeout(350)
            await trace(page, label, `${o.trigger} after dblclick + geometry`)
        }

        // ── Buttons: click, double-click, keyboard ─────────────────────────────────
        const busy = page.getByRole('button', { name: 'Wird geprüft' })
        await busy.scrollIntoViewIfNeeded()
        const busyBox = await busy.boundingBox()
        await busy.click()
        await page.waitForTimeout(150)
        const busyState = await busy.evaluate((el) => {
            const cs = getComputedStyle(el)
            const after = getComputedStyle(el, '::after')
            return { aria: el.getAttribute('aria-busy'), color: cs.color, pointer: cs.pointerEvents, spinner: after.width, anim: after.animationName, w: el.getBoundingClientRect().width }
        })
        if (busyState.aria !== 'true') fail(label, `aria-busy button: aria-busy is "${busyState.aria}" after click`)
        if (busyState.spinner === '0px' || busyState.anim === 'none') fail(label, `aria-busy button: no spinner (::after ${busyState.spinner}, animation ${busyState.anim})`)
        if (busyBox && Math.abs(busyState.w - busyBox.width) > 0.5) fail(label, `aria-busy button: width changed ${busyBox.width}→${busyState.w}`)
        if (busyState.pointer !== 'none') fail(label, `aria-busy button: still accepts pointer events while busy`)
        // A second click while busy must not re-arm it beyond its 1.8s.
        await busy.click({ force: true }).catch(() => {})
        await page.waitForTimeout(2000)
        const busyAfter = await busy.getAttribute('aria-busy')
        if (busyAfter === 'true') fail(label, `aria-busy button: still busy 2s after the click`)
        // Keyboard: Space/Enter re-trigger.
        await busy.focus()
        await page.keyboard.press('Enter')
        await page.waitForTimeout(100)
        if ((await busy.getAttribute('aria-busy')) !== 'true') fail(label, `aria-busy button: Enter does not activate it`)
        await page.waitForTimeout(2000)

        // Every other button in main: click, double-click, Enter, Space — nothing may throw, navigate, or change the URL.
        const buttons = page.locator('main button:not([disabled])')
        const n = await buttons.count()
        for (let i = 0; i < n; i++) {
            const b = buttons.nth(i)
            const text = ((await b.textContent()) ?? (await b.getAttribute('aria-label')) ?? '').trim().slice(0, 30)
            // The overlays, the busy button, the callout toggle and the struck chip have their own checks.
            if (/öffnen$/.test(text) || /Wird geprüft|Linien/.test(text)) continue
            if ((await b.getAttribute('aria-disabled')) === 'true') continue
            if (!(await b.isVisible())) continue
            await b.scrollIntoViewIfNeeded()
            await b.click().catch((e) => fail(label, `button "${text}": click threw ${e.message.split('\n')[0]}`))
            await page.waitForTimeout(60)
            await b.dblclick().catch(() => {})
            await page.waitForTimeout(60)
            await b.focus()
            await page.keyboard.press('Enter')
            await page.keyboard.press('Space')
            await page.waitForTimeout(60)
            // Close whatever a control may have opened.
            await page.keyboard.press('Escape')
            if (!page.url().endsWith('/__design')) {
                fail(label, `button "${text}": navigated to ${page.url()}`)
                await open(page)
            }
        }

        // ── Tabs ───────────────────────────────────────────────────────────────────
        const tabs = page.getByRole('tab')
        await tabs.first().scrollIntoViewIfNeeded()
        await tabs.nth(1).click()
        if ((await tabs.nth(1).getAttribute('aria-selected')) !== 'true') fail(label, 'tabs: click on "Neu" does not select it')
        if (!(await page.getByRole('tabpanel').filter({ hasText: 'Neu im Sortiment' }).isVisible())) fail(label, 'tabs: panel "Neu" not shown after click')
        await tabs.nth(1).focus()
        await page.keyboard.press('ArrowRight')
        if ((await tabs.nth(2).getAttribute('aria-selected')) !== 'true') fail(label, 'tabs: ArrowRight does not move to the next tab')
        await page.keyboard.press('ArrowRight')
        if ((await tabs.nth(0).getAttribute('aria-selected')) !== 'true') fail(label, 'tabs: ArrowRight does not wrap to the first tab')
        await page.keyboard.press('End')
        if ((await tabs.nth(2).getAttribute('aria-selected')) !== 'true') fail(label, 'tabs: End does not select the last tab')
        await page.keyboard.press('Home')
        if ((await tabs.nth(0).getAttribute('aria-selected')) !== 'true') fail(label, 'tabs: Home does not select the first tab')
        for (let i = 0; i < 3; i++) {
            const tb = await tabs.nth(i).boundingBox()
            if (mobile && tb && (tb.width < 43.5 || tb.height < 43.5)) fail(label, `tabs: "${await tabs.nth(i).textContent()}" is ${Math.round(tb.width)}×${Math.round(tb.height)} on touch`)
        }
        // The active underline sits on the hairline, not above or below it.
        const underline = await page.evaluate(() => {
            const list = document.querySelector('.tabs__list').getBoundingClientRect()
            const active = document.querySelector('.tabs__trigger[data-state="active"]').getBoundingClientRect()
            return Math.round((active.bottom - list.bottom) * 10) / 10
        })
        if (Math.abs(underline) > 1) fail(label, `tabs: active underline is ${underline}px off the list hairline`)

        // ── Accordion ──────────────────────────────────────────────────────────────
        const acc = page.locator('.accordion__trigger')
        await acc.first().scrollIntoViewIfNeeded()
        await acc.first().click()
        await page.waitForTimeout(350)
        if ((await acc.first().getAttribute('aria-expanded')) !== 'true') fail(label, 'accordion: click does not expand')
        const body1 = page.locator('.accordion__body').first()
        if (!(await body1.isVisible())) fail(label, 'accordion: body not visible after expand')
        await acc.nth(1).click()
        await page.waitForTimeout(350)
        if ((await acc.first().getAttribute('aria-expanded')) === 'true') fail(label, 'accordion: first item stays open when the second opens (type=single)')
        await acc.nth(1).click()
        await page.waitForTimeout(350)
        if ((await acc.nth(1).getAttribute('aria-expanded')) === 'true') fail(label, 'accordion: item does not collapse on second click')
        // Double-click: ends closed (open+close), never in a half state.
        await acc.nth(2).dblclick()
        await page.waitForTimeout(400)
        const st = await acc.nth(2).getAttribute('data-state')
        const heightOk = await page.evaluate(() => {
            const c = document.querySelector('.accordion__item:nth-child(3) .accordion__content')
            if (!c) return true
            const cs = getComputedStyle(c)
            return cs.display === 'none' || c.getBoundingClientRect().height === 0 || c.getBoundingClientRect().height >= c.scrollHeight - 1
        })
        if (!heightOk) fail(label, `accordion: after a double-click the third item is half-open (state ${st})`)
        await acc.nth(2).focus()
        await page.keyboard.press('Enter')
        await page.waitForTimeout(350)
        const expanded = await acc.nth(2).getAttribute('aria-expanded')
        await page.keyboard.press('Space')
        await page.waitForTimeout(350)
        if ((await acc.nth(2).getAttribute('aria-expanded')) === expanded) fail(label, 'accordion: Space does not toggle')
        await page.keyboard.press('ArrowDown')
        const focusedNext = await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 20))
        if (!focusedNext || focusedNext === 'Wo finde ich HSN und') notes.push(`${label} accordion: ArrowDown from the last trigger stays/loops (${focusedNext})`)
        const trigH = await acc.first().boundingBox()
        if (trigH && trigH.height < 43.5) fail(label, `accordion: trigger is ${Math.round(trigH.height)}px tall`)

        // ── Tiles: compare control above the stretched link ────────────────────────
        const tile = page.locator('.tile').filter({ has: page.locator('.tile__badge') }).first()
        await tile.scrollIntoViewIfNeeded()
        await page.waitForTimeout(100)
        if (!mobile) {
            const hidden = await tile.locator('.tile__compare').evaluate((el) => getComputedStyle(el).opacity)
            if (hidden !== '0') notes.push(`${label} tile: compare control visible without hover (opacity ${hidden})`)
            await tile.hover()
            await page.waitForTimeout(250)
        }
        const compare = tile.locator('.tile__compare')
        const visible = await compare.evaluate((el) => getComputedStyle(el).opacity)
        if (visible !== '1') fail(label, `tile: compare control not revealed (opacity ${visible})`)
        const cbox = await compare.boundingBox()
        if (cbox && (cbox.height < 43.5) && mobile) fail(label, `tile: compare control is ${Math.round(cbox.width)}×${Math.round(cbox.height)} on touch`)
        // Badge and compare must not intersect.
        const inter = await tile.evaluate((t) => {
            const a = t.querySelector('.tile__badge').getBoundingClientRect()
            const b = t.querySelector('.tile__compare').getBoundingClientRect()
            const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
            const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
            return { x: Math.round(x), y: Math.round(y), a: `${Math.round(a.left)}..${Math.round(a.right)}`, b: `${Math.round(b.left)}..${Math.round(b.right)}`, tile: Math.round(t.getBoundingClientRect().width) }
        })
        if (inter.x > 0 && inter.y > 0) fail(label, `tile: verdict badge [${inter.a}] and compare control [${inter.b}] overlap by ${inter.x}×${inter.y}px (tile ${inter.tile}px wide)`)
        // Clicking the compare label toggles the checkbox and does not follow the link.
        const cbx = compare.locator('input')
        const wasChecked = await cbx.isChecked()
        await compare.click()
        await page.waitForTimeout(300)
        if (!page.url().endsWith('/__design')) {
            fail(label, `tile: clicking "Vergleichen" followed the stretched link to ${page.url()}`)
            await open(page)
        } else if ((await cbx.isChecked()) === wasChecked) {
            fail(label, 'tile: clicking "Vergleichen" did not toggle the checkbox')
        }
        // Checked: stays visible without hover.
        await page.mouse.move(0, 0)
        await page.waitForTimeout(250)
        const stays = await compare.evaluate((el) => getComputedStyle(el).opacity)
        if (await cbx.isChecked() && stays !== '1') fail(label, `tile: checked compare control hides when the pointer leaves (opacity ${stays})`)
        await cbx.uncheck().catch(() => {})
        // Keyboard: Tab to the tile name reveals the compare control (focus-within).
        await page.locator('.tile__name').first().focus()
        await page.waitForTimeout(200)
        const fw = await page.locator('.tile').first().locator('.tile__compare').evaluate((el) => getComputedStyle(el).opacity)
        if (fw !== '1') fail(label, `tile: compare control not revealed on keyboard focus (opacity ${fw})`)
        // The whole tile is the link's hit area: a click on the price goes to the product.
        const price = page.locator('.tile').first().locator('.tile__price')
        const hit = await price.evaluate((el) => {
            const b = el.getBoundingClientRect()
            const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
            return top ? top.tagName + '.' + top.className : 'none'
        })
        if (!/^A\./.test(hit)) fail(label, `tile: the element under the price is ${hit}, not the stretched link`)

        // ── Spec callout toggle ────────────────────────────────────────────────────
        const draw = page.getByRole('button', { name: /Linien/ })
        await draw.scrollIntoViewIfNeeded()
        const frameBox = await page.locator('.specimen__frame').boundingBox()
        if (!frameBox || frameBox.width < 100 || frameBox.height < 50) fail(label, `callout: frame is ${frameBox ? `${Math.round(frameBox.width)}×${Math.round(frameBox.height)}` : 'missing'} — the specimen is invisible`)
        await draw.click()
        await page.waitForTimeout(100)
        const ready = await page.locator('.specimen__frame').evaluate((el) => el.classList.contains('is-ready'))
        if (!ready) fail(label, 'callout: "Linien einzeichnen" did not set is-ready')
        if ((await draw.textContent())?.trim() !== 'Linien zurücksetzen') fail(label, 'callout: button label did not change to "Linien zurücksetzen"')
        await page.waitForTimeout(900)
        const lines = await page.evaluate(() => [...document.querySelectorAll('.callout__line')].map((s) => ({ opacity: getComputedStyle(s).opacity, w: s.getAttribute('width'), h: s.getAttribute('height'), offset: getComputedStyle(s.querySelector('path')).strokeDashoffset })))
        if (lines.length !== 3) fail(label, `callout: ${lines.length} lines rendered, expected 3 (the line SVG only exists once the frame has a size)`)
        for (const l of lines) {
            if (l.opacity !== '1') fail(label, `callout: line still invisible after draw (opacity ${l.opacity})`)
            if (Number(l.w) < 1 || Number(l.h) < 1) fail(label, `callout: line SVG measured ${l.w}×${l.h}`)
        }
        await draw.click()
        await page.waitForTimeout(100)
        if ((await draw.textContent())?.trim() !== 'Linien einzeichnen') fail(label, 'callout: toggle back did not restore the label')
        await draw.dblclick()
        await page.waitForTimeout(200)
        // A double-click is two toggles: back where it started.
        if ((await draw.textContent())?.trim() !== 'Linien einzeichnen') notes.push(`${label} callout: after a double-click the label is "${(await draw.textContent())?.trim()}"`)

        // ── Chips, checkbox/radio, fields ──────────────────────────────────────────
        const struck = page.locator('.chip--struck')
        await struck.click({ force: true })
        const struckPressed = await struck.getAttribute('aria-pressed')
        if (struckPressed === 'true') fail(label, 'chip: the struck chip becomes pressed on click')
        const radios = page.locator('label.check input[type=radio]')
        await page.locator('label.check').nth(2).click()
        if (!(await radios.nth(1).isChecked())) fail(label, 'radio: clicking the label "Kompletträder" does not select it')
        const check = page.locator('label.check').first()
        await check.click()
        if (await check.locator('input').isChecked()) fail(label, 'checkbox: clicking the label "Ohne Eintragung" does not uncheck it')
        await check.click()
        const checkH = await check.boundingBox()
        if (checkH && checkH.height < 43.5) fail(label, `checkbox row is ${Math.round(checkH.height)}px tall`)
        const sel = page.locator('#sp-select')
        await sel.selectOption({ index: 1 })
        if ((await sel.inputValue()) !== '3er Limousine (E46)') fail(label, 'select: option 2 not selected')
        const dis = page.locator('#sp-dis')
        if (await dis.isEnabled()) fail(label, 'disabled field is enabled')
    }
}

function consoleProblems(messages, label) {
    for (const m of messages) problems.push(`${label} console: ${m}`)
}

if (notes.length) console.log('notes:\n' + notes.map((n) => '  ' + n).join('\n'))
if (problems.length === 0) {
    console.log(`interactions clean in ${browsers.join(', ')} at ${widths.join(', ')}`)
    process.exit(0)
}
console.log(problems.join('\n'))
process.exit(1)
