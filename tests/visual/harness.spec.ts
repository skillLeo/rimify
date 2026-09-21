/**
 * The harness guards the harness.
 *
 * Every number the fidelity suite reports rests on the assumption that both sides were frozen
 * identically. If the clock override stops applying, or the PRNG reseeds per context, nothing
 * fails loudly — the diffs just get noisier, and the honest response to a noisy diff is to go
 * looking for a cause in the CSS that was never there. §8 forbids raising the threshold; this
 * file is what makes that instruction survivable, by proving the noise floor is actually zero.
 *
 * It needs no server: the page under test is a string, so these checks run even while §2 is
 * blocked and the prototype is unavailable.
 */

import { test, expect } from '@playwright/test'

// @ts-expect-error — plain ESM, shared with the capture script.
import { prepareContext, seedState, settle, contextOptions, FIXED_EPOCH_MS, FREEZE_CSS } from './harness.mjs'
// @ts-expect-error — plain ESM, shared with the capture script.
import { signatureOf, compare } from './signature.mjs'

/**
 * A page with the shapes the real ones have: text, classes, a link, an image, a hidden node.
 *
 * The viewport meta is not decoration. Without it a mobile context lays the page out at 980 CSS
 * pixels and scales down, so a fixture that omits it is not representative of a phone at all —
 * which is what the first run of this file discovered.
 */
const FIXTURE = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${FREEZE_CSS} body{margin:0;font:16px Lato,sans-serif} .hid{display:none}</style></head>
<body>
  <header class="hdr"><a class="lnk" href="/felgen">Felgen</a></header>
  <main class="wrap">
    <h1 class="t-h1">Passt diese Felge an mein Auto?</h1>
    <p class="mono">8,5J &middot; ET 35 &middot; 66,6 mm</p>
    <img class="ph" src="https://images.unsplash.com/photo-0" alt="Felge">
    <span class="hid">niemals sichtbar</span>
    <button type="button" class="btn btn--primary" aria-label="Prüfen">Prüfen</button>
  </main>
</body></html>`

/**
 * The fixture is served from a real http origin rather than `setContent` on `about:blank`.
 *
 * `about:blank` is an opaque origin: `sessionStorage` throws there. Seeding state against it
 * therefore fails, which is correct behaviour and is exactly what the harness's own guard
 * reported on the first run — but it makes the fixture unlike every page this suite will ever
 * measure. Routing a real origin keeps the storage, the document URL and the security context
 * the same shape as the prototype on :5500 and the application on :8000.
 */
const ORIGIN = 'http://fixture.rimify.test'

async function openFixture(
    browser: import('@playwright/test').Browser,
    vp = 'desktop',
    state: Record<string, string> | null = null
) {
    const context = await browser.newContext(contextOptions(vp))
    await prepareContext(context)
    // Both init scripts must be registered before the first navigation.
    if (state) await seedState(context, state)

    await context.route(`${ORIGIN}/**`, (route) =>
        route.fulfill({
            status: 200,
            contentType: 'text/html; charset=utf-8',
            body: FIXTURE,
        })
    )

    const page = await context.newPage()
    await page.goto(`${ORIGIN}/`, { waitUntil: 'domcontentloaded' })
    return { context, page }
}

test('the clock is frozen and Date still behaves like Date', async ({ browser }) => {
    const { context, page } = await openFixture(browser)

    const probe = await page.evaluate(() => ({
        now: Date.now(),
        noArgs: new Date().getTime(),
        withArg: new Date(1_700_000_000_000).getTime(),
        isInstance: new Date() instanceof Date,
        name: Date.name,
        parsed: Date.parse('2020-01-01T00:00:00Z'),
        perf: performance.now(),
    }))

    expect(probe.now).toBe(FIXED_EPOCH_MS)
    expect(probe.noArgs).toBe(FIXED_EPOCH_MS)
    // Freezing the clock must not break date arithmetic the pages do for delivery estimates.
    expect(probe.withArg).toBe(1_700_000_000_000)
    expect(probe.parsed).toBe(Date.UTC(2020, 0, 1))
    expect(probe.isInstance).toBe(true)
    expect(probe.name).toBe('Date')
    expect(probe.perf).toBe(0)

    await context.close()
})

test('Math.random is identical in two separate contexts', async ({ browser }) => {
    const a = await openFixture(browser)
    const b = await openFixture(browser)

    const draw = (p: import('@playwright/test').Page) =>
        p.evaluate(() => [Math.random(), Math.random(), Math.random()])

    const [first, second] = await Promise.all([draw(a.page), draw(b.page)])

    // Identical seed, identical sequence — this is what stops a randomised product order from
    // registering as a visual difference between the capture and the test run.
    expect(second).toEqual(first)
    expect(new Set(first).size).toBe(3) // still varies within a run; not a constant

    await a.context.close()
    await b.context.close()
})

test('the DOM signature is stable and excludes hidden nodes', async ({ browser }) => {
    const a = await openFixture(browser)
    const b = await openFixture(browser)

    const first = await signatureOf(a.page)
    const second = await signatureOf(b.page)

    expect(compare(first, second)).toEqual([])
    expect(first.nodes.length).toBeGreaterThan(5)

    const flat = first.nodes.join('\n')
    // A display:none node is in neither capture's visible output, so including it would demand
    // we reproduce markup that never showed.
    expect(flat).not.toContain('niemals sichtbar')
    // src is part of the contract: "right layout, wrong photograph" must not pass.
    expect(flat).toContain('photo-0')
    // aria-* carries meaning and is collected even though it is not in STRUCTURAL_ATTRS.
    expect(flat).toContain('aria-label=Prüfen')

    await a.context.close()
    await b.context.close()
})

test('the signature notices a changed class, a changed word and a changed height', async ({
    browser,
}) => {
    const { context, page } = await openFixture(browser)
    const before = await signatureOf(page)

    await page.evaluate(() => {
        document.querySelector('.btn')!.className = 'btn btn--ghost'
        document.querySelector('.t-h1')!.textContent = 'Etwas ganz anderes'
        // Taller than the viewport on purpose: scrollHeight is floored at the viewport height,
        // so a short page stays 900px no matter what is added to it.
        const tall = document.createElement('div')
        tall.style.height = '1400px'
        document.body.appendChild(tall)
    })

    const after = await signatureOf(page)
    const diffs = compare(before, after)

    expect(diffs.length).toBeGreaterThan(0)
    expect(diffs.map((d: { kind: string }) => d.kind)).toContain('height')
    expect(diffs.map((d: { kind: string }) => d.kind)).toContain('node')

    await context.close()
})

test('seeded state reaches the page, and settle() passes when it did', async ({ browser }) => {
    const { context, page } = await openFixture(browser, 'desktop', {
        rmf_vehicle: '{"v":1}',
        rmf_seenPLP: '1',
    })

    await settle(page)

    // The value must be readable by page scripts, not merely written by us. The prototype's
    // header state machine reads these keys; seeding one nothing can read would render the
    // cold-start header and baseline the wrong thing entirely.
    expect(await page.evaluate(() => sessionStorage.getItem('rmf_vehicle'))).toBe('{"v":1}')
    expect(await page.evaluate(() => sessionStorage.getItem('rmf_seenPLP'))).toBe('1')

    await context.close()
})

test('settle() refuses a page whose state could not be seeded', async ({ browser }) => {
    // The guard that fired on this file's first run, pinned so it cannot quietly stop firing.
    // An opaque origin cannot hold sessionStorage, so the seed fails — and a capture taken
    // anyway would record the cold-start header while claiming to be the vehicle case.
    const context = await browser.newContext(contextOptions('desktop'))
    await prepareContext(context)
    await seedState(context, { rmf_vehicle: '{"v":1}' })

    const page = await context.newPage()
    await page.goto('about:blank')
    await page.setContent(FIXTURE, { waitUntil: 'domcontentloaded' })

    await expect(settle(page)).rejects.toThrow(/sessionStorage seeding failed/)

    await context.close()
})

test('the mobile context presents as a phone so the server-side device split applies', async ({
    browser,
}) => {
    const { context, page } = await openFixture(browser, 'mobile')

    const ua = await page.evaluate(() => navigator.userAgent)
    // R-08: the device split is decided server-side from the User-Agent. A mobile case that
    // requested with a desktop UA would be served the desktop page, and the resulting diff
    // would be entirely the harness's own doing.
    expect(ua).toContain('Mobile')
    expect(await page.evaluate(() => window.innerWidth)).toBe(390)

    await context.close()
})
