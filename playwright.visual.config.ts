import { defineConfig, devices } from '@playwright/test';

/*
 * Visual baselines of the finished pages (G9): once a page is approved, its screenshots at 390
 * and 1440 are captured here so the page cannot drift. Baselines live next to the spec, per
 * project, and are updated deliberately with `npx playwright test -c playwright.visual.config.ts --update-snapshots`.
 */
export default defineConfig({
    testDir: './tests/visual-v2',
    fullyParallel: false,
    workers: 1,
    reporter: [['list']],
    outputDir: 'test-results/visual',
    snapshotPathTemplate: '{testDir}/baseline/{projectName}/{testFilePath}/{arg}{ext}',
    expect: {
        toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled', caret: 'hide' },
    },
    use: {
        baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8000',
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        // Every baseline is captured after a consent choice, so the sheet is never in the picture.
        storageState: {
            cookies: [
                {
                    name: 'rmf_consent',
                    value: encodeURIComponent(JSON.stringify({ necessary: true, statistics: false, decidedAt: '2026-01-01T00:00:00.000Z' })),
                    domain: '127.0.0.1',
                    path: '/',
                    expires: -1,
                    httpOnly: false,
                    secure: false,
                    sameSite: 'Lax',
                },
            ],
            origins: [],
        },
    },
    projects: [
        {
            name: 'desktop-1440',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
        },
        {
            name: 'mobile-390',
            use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
        },
    ],
});
