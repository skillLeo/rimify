import { test as base } from '@playwright/test'

/*
 * The suites' `test`: Playwright's own with one addition (the launch release §3, flaky mobile tests).
 * A test that routes requests through a handler (`page.route` … `route.fetch()`) can end while one is
 * still in flight — a background Inertia reload after the last assertion — and Playwright then fails
 * the test that had already passed („route.fetch: Test ended“). Every page's routes are dropped when
 * its test ends, the in-flight ones ignored, so a finished test stays finished.
 *
 * Everything else is Playwright's, re-exported: `import { expect, test, type Page } from './fixtures'`.
 *
 * `E2E_CPU_THROTTLE=4` slows every page's main thread fourfold (Chromium only): a race that a fast machine hides —
 * a focus that lands a frame late, a list that renders after the check — shows up at once. Off unless set.
 */

export * from '@playwright/test'

export const test = base.extend<{ dropRoutes: void; cpuThrottle: void }>({
    cpuThrottle: [
        async ({ page, browserName }, use) => {
            const rate = Number(process.env.E2E_CPU_THROTTLE ?? 0)

            if (rate > 1 && browserName === 'chromium') {
                const cdp = await page.context().newCDPSession(page)
                await cdp.send('Emulation.setCPUThrottlingRate', { rate })
            }

            await use()
        },
        { auto: true },
    ],
    dropRoutes: [
        async ({ page }, use) => {
            await use()

            // A test may close its own page (admin-rail-resize: the width survives the tab closing).
            if (!page.isClosed()) {
                await page.unrouteAll({ behavior: 'ignoreErrors' })
            }
        },
        { auto: true },
    ],
})
