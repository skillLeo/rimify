import { mkdirSync } from 'node:fs'
import { test as base, expect, type Locator, type Page, type TestInfo } from '@playwright/test'
import { BASE, INSTANCE } from './instance'

/*
 * What every acceptance test carries (the operator's brief „PROVE ALL 34 IN A REAL BROWSER“ §1):
 *
 * - the listeners, attached before the first navigation — a console error, a script crash, a failed request, any 4xx or
 *   5xx, fonts and images included. At the end of the test the list must be empty. A response a test provokes on purpose
 *   (the 404 page, a refused form) is named by that test with `problems.expected(…)`, with the reason; nothing is
 *   waved through by default;
 * - the instance, annotated on the result, so a pass is always a pass *somewhere*;
 * - one picture per item, engine and instance: docs/qa/shots/abnahme/<instanz>/<nr>-<engine>.png.
 */

interface Problems {
    /** A response or message this test causes on purpose: the pattern, and why it is not a finding. */
    expected: (pattern: RegExp, why: string) => void
}

/*
 * The one message that is the test's own doing: in WebKit, `screenshot()` injects a stylesheet of Playwright's, and the
 * page's Content-Security-Policy refuses it — „Refused to apply a stylesheet …“, twice per picture. Proven before it was
 * set aside (13.10.2026): no such message after the page has loaded, two after every screenshot of any kind, none in
 * Chromium, and every stylesheet of the page itself carries its nonce and applies. So it is set aside only while this
 * suite is taking a picture, and the listener record says how often.
 */
const shooting = new WeakSet<Page>()
const OWN_SCREENSHOT_STYLE = /Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline'/

export const test = base.extend<{ problems: Problems }>({
    problems: [
        async ({ page }, use, info) => {
            const seen: string[] = []
            const allowed: { pattern: RegExp; why: string }[] = []
            let ownShots = 0

            page.on('console', (m) => {
                if (m.type() !== 'error') {
                    return
                }

                if (shooting.has(page) && OWN_SCREENSHOT_STYLE.test(m.text())) {
                    ownShots++

                    return
                }

                seen.push(`console: ${m.text()}`)
            })
            page.on('pageerror', (e) => seen.push(`JS crash: ${e.message}`))
            page.on('requestfailed', (r) => {
                // A request the browser itself gave up because the page moved on is not a failure of the site: Chromium
                // names it net::ERR_ABORTED, WebKit „Load request cancelled“.
                if (!/^net::ERR_ABORTED$|^Load request cancelled$/.test(r.failure()?.errorText ?? '')) {
                    seen.push(`failed: ${r.url()} (${r.failure()?.errorText ?? '?'})`)
                }
            })
            page.on('response', (r) => {
                if (r.status() >= 400) {
                    seen.push(`${r.status()} ${r.url()}`)
                }
            })

            info.annotations.push({ type: 'instanz', description: `${INSTANCE} · ${BASE}` })

            await use({ expected: (pattern, why) => allowed.push({ pattern, why }) })

            const findings = seen.filter((p) => !allowed.some((a) => a.pattern.test(p)))
            const waved = seen.filter((p) => allowed.some((a) => a.pattern.test(p)))

            await info.attach('listeners', {
                body: [
                    findings.length === 0 ? 'clean' : findings.join('\n'),
                    ...waved.map((p) => `expected: ${p} — ${allowed.find((a) => a.pattern.test(p))?.why}`),
                    ...(ownShots > 0 ? [`set aside: ${ownShots} × WebKit refusing Playwright's own screenshot style, while a picture was taken`] : []),
                ].join('\n'),
                contentType: 'text/plain',
            })
            expect(findings, `the page reported:\n${findings.join('\n')}`).toHaveLength(0)
        },
        { auto: true },
    ],
})

export { expect }

/** `chromium` at 1440 × 900 or `webkit` at 390 × 844 — the iPhone. */
export const engine = (info: TestInfo): 'chromium' | 'webkit' => (info.project.name.includes('webkit') ? 'webkit' : 'chromium')

export const phone = (info: TestInfo): boolean => engine(info) === 'webkit'

/** The choice a returning visitor already made, so the cookie sheet is not in the picture. A cookie, no server write. */
export async function consent(page: Page): Promise<void> {
    await page.context().addCookies([
        { name: 'rmf_consent', value: encodeURIComponent(JSON.stringify({ necessary: true, statistics: false, decidedAt: '2026-01-01T00:00:00.000Z' })), url: BASE },
    ])
}

/** Open a page and wait until the client has taken over the server's frame and the fonts are in. */
export async function open(page: Page, path: string): Promise<void> {
    await page.goto(path, { waitUntil: 'load' })
    await page.waitForFunction(() => (document.querySelector('#app') as (Element & { __vue_app__?: unknown }) | null)?.__vue_app__ !== undefined, null, { timeout: 60_000 })
    await page.evaluate(() => document.fonts.ready)
}

/** The item's picture on this engine and instance. */
export async function evidence(target: Page | Locator, nr: number, info: TestInfo): Promise<void> {
    const dir = `docs/qa/shots/abnahme/${INSTANCE}`
    const path = `${dir}/${String(nr).padStart(2, '0')}-${engine(info)}.png`

    const page = 'page' in target ? target.page() : target

    mkdirSync(dir, { recursive: true })
    shooting.add(page)

    try {
        await target.screenshot({ path, animations: 'disabled' })
        // The refusal is reported a moment after the picture.
        await page.waitForTimeout(250)
    } finally {
        shooting.delete(page)
    }

    await info.attach(`kunde-${String(nr).padStart(2, '0')}`, { path, contentType: 'image/png' })
}

/** The bars that stay put while the page scrolls — header and vehicle bar on top, a price bar below: how far each reaches. */
async function bars(target: Locator): Promise<{ top: number; bottom: number }> {
    return target.evaluate((el) => {
        const edge = (e: Element): 'top' | 'bottom' | null => {
            if (!['fixed', 'sticky'].includes(getComputedStyle(e).position)) {
                return null
            }

            const r = e.getBoundingClientRect()

            return r.top <= 5 ? 'top' : r.bottom >= window.innerHeight - 5 ? 'bottom' : null
        }
        const own = new Set<string>()

        for (let e: Element | null = el; e !== null; e = e.parentElement) {
            const at = edge(e)

            if (at !== null) {
                own.add(at)
            }
        }

        let top = 0
        let bottom = 0

        for (const e of document.querySelectorAll('body *')) {
            const r = e.getBoundingClientRect()

            if (r.height === 0 || r.height >= window.innerHeight / 2 || r.bottom <= 0 || r.top >= window.innerHeight) {
                continue
            }

            const at = edge(e)

            if (at === 'top' && !own.has('top')) {
                top = Math.max(top, r.bottom)
            } else if (at === 'bottom' && !own.has('bottom')) {
                bottom = Math.max(bottom, window.innerHeight - r.top)
            }
        }

        return { top, bottom }
    })
}

/**
 * The item's picture around several elements at once — a heading and the line under it, a row and the note about it —
 * taken inside the window, just under the bars that stay put, the window made taller first where it does not fit.
 */
export async function evidenceAround(page: Page, targets: Locator[], nr: number, info: TestInfo, pad = 16): Promise<void> {
    const dir = `docs/qa/shots/abnahme/${INSTANCE}`
    const path = `${dir}/${String(nr).padStart(2, '0')}-${engine(info)}.png`
    const view = page.viewportSize() ?? { width: 1440, height: 900 }
    const first = targets[0]

    if (first === undefined) {
        throw new Error('a picture of nothing')
    }

    const union = async (): Promise<{ x: number; y: number; width: number; height: number }> => {
        const boxes = await Promise.all(targets.map(async (t) => (await t.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 }))
        const x = Math.min(...boxes.map((b) => b.x))
        const y = Math.min(...boxes.map((b) => b.y))

        return { x, y, width: Math.max(...boxes.map((b) => b.x + b.width)) - x, height: Math.max(...boxes.map((b) => b.y + b.height)) - y }
    }

    await first.scrollIntoViewIfNeeded()
    let chrome = await bars(first)
    let area = await union()
    const needed = Math.ceil(area.height + 2 * pad + chrome.top + Math.max(chrome.bottom, 160))
    const taller = needed > view.height

    if (taller) {
        await page.setViewportSize({ width: view.width, height: needed })
        await page.waitForTimeout(200)
        area = await union()
    }

    await page.evaluate((by) => window.scrollBy(0, by), area.y - chrome.top - pad)
    await page.waitForTimeout(150)
    area = await union()
    chrome = await bars(first)

    const height = (page.viewportSize() ?? view).height
    const x = Math.max(0, area.x - pad)
    const y = Math.max(chrome.top, area.y - pad)
    const clip = { x, y, width: Math.min(view.width, area.x + area.width + pad) - x, height: Math.min(height - chrome.bottom, area.y + area.height + pad) - y }

    mkdirSync(dir, { recursive: true })
    shooting.add(page)

    try {
        await page.screenshot({ path, animations: 'disabled', clip })
        await page.waitForTimeout(250)
    } finally {
        shooting.delete(page)
    }

    if (taller) {
        await page.setViewportSize(view)
    }

    await info.attach(`kunde-${String(nr).padStart(2, '0')}`, { path, contentType: 'image/png' })
}

/** The whole page as a visitor who has scrolled through it sees it — or a second picture of it under its own name. */
export async function evidencePage(page: Page, nr: number, info: TestInfo, name?: string): Promise<string> {
    const dir = `docs/qa/shots/abnahme/${INSTANCE}`
    const path = `${dir}/${name ?? `${String(nr).padStart(2, '0')}-${engine(info)}`}.png`

    mkdirSync(dir, { recursive: true })
    shooting.add(page)

    try {
        await page.screenshot({ path, animations: 'disabled', fullPage: true })
        await page.waitForTimeout(250)
    } finally {
        shooting.delete(page)
    }

    await info.attach(name ?? `kunde-${String(nr).padStart(2, '0')}`, { path, contentType: 'image/png' })

    return path
}

/** WCAG contrast of an element's text on its own background. */
export async function contrast(locator: Locator): Promise<number> {
    return locator.evaluate((el) => {
        const parse = (c: string): number[] => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
        const linear = (v: number): number => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4)
        const lum = ([r = 0, g = 0, b = 0]: number[]): number => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
        const style = getComputedStyle(el)
        const [a, b] = [lum(parse(style.color)), lum(parse(style.backgroundColor))]

        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    })
}
