import { defineConfig } from '@playwright/test'

/**
 * The fidelity suite is configured separately from the journey suite in `playwright.config.ts`.
 *
 * It needs no project-level viewport or device: every case builds its own context through
 * `contextOptions()` in the harness, so that the prototype capture and the page under test are
 * prepared by one piece of code rather than by a config here and a script there. A viewport set
 * in two places is a viewport that will eventually disagree with itself.
 *
 * `workers: 1` is deliberate. Full-page screenshots of several pages at once contend for the
 * GPU, and a contended capture lands a pixel or two apart on text antialiasing — which is
 * exactly the size of difference the 0.5% gate is trying to measure.
 */
export default defineConfig({
    testDir: './tests/visual',
    testMatch: '**/*.spec.ts',
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    // No retries. A case that passes on the second attempt is a case whose result depends on
    // something the harness has not frozen, and that is a finding, not a flake to absorb.
    retries: 0,
    reporter: [
        ['list'],
        ['html', { open: 'never', outputFolder: 'tests/visual/playwright-report' }],
    ],
    outputDir: 'tests/visual/test-results',
    timeout: 90_000,
    use: {
        baseURL: process.env.VISUAL_BASE_URL ?? 'http://127.0.0.1:8000',
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        trace: 'retain-on-failure',
    },
    projects: [{ name: 'fidelity' }],
    webServer: {
        command: 'php artisan serve --host=127.0.0.1 --port=8000',
        url: 'http://127.0.0.1:8000/up',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
    },
})
