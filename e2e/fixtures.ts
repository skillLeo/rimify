import { test as base } from '@playwright/test'

/*
 * The suites' `test`: Playwright's own with one addition (the launch release §3, flaky mobile tests).
 * A test that routes requests through a handler (`page.route` … `route.fetch()`) can end while one is
 * still in flight — a background Inertia reload after the last assertion — and Playwright then fails
 * the test that had already passed („route.fetch: Test ended“). Every page's routes are dropped when
 * its test ends, the in-flight ones ignored, so a finished test stays finished.
 *
 * Everything else is Playwright's, re-exported: `import { expect, test, type Page } from './fixtures'`.
 */

export * from '@playwright/test'

export const test = base.extend<{ dropRoutes: void }>({
    dropRoutes: [
        async ({ page }, use) => {
            await use()
            await page.unrouteAll({ behavior: 'ignoreErrors' })
        },
        { auto: true },
    ],
})
