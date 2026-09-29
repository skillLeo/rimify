import { defineConfig, devices } from '@playwright/test'

/*
 * The device lab for the phone documents. Four iPhones on WebKit, two Androids on Chromium, all
 * against the production build with SSR on:
 *
 *   npx playwright test -c tests/e2e/mobile/playwright.config.ts
 *   npx playwright test -c tests/e2e/mobile/playwright.config.ts --project pixel-8
 *
 * The device presets send real mobile User-Agents, which is what the server decides the
 * document by.
 */
export default defineConfig({
    testDir: '.',
    testMatch: /.*\.spec\.ts$/,
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    timeout: 90_000,
    expect: { timeout: 15_000 },
    reporter: [['list']],
    outputDir: '../../../test-results/mobile',
    use: {
        // The phone documents are the storefront's: the e2e shop (e2e/shop.ts), its own database.
        baseURL: process.env.E2E_SHOP_URL ?? 'http://127.0.0.1:8010',
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'iphone-se', use: { ...devices['iPhone SE (3rd gen)'] } },
        { name: 'iphone-16', use: { ...devices['iPhone 16'] } },
        { name: 'iphone-16-pro-max', use: { ...devices['iPhone 16 Pro Max'] } },
        { name: 'iphone-16-landscape', use: { ...devices['iPhone 16 landscape'] } },
        { name: 'pixel-8', use: { ...devices['Pixel 8'] } },
        { name: 'galaxy-a55', use: { ...devices['Galaxy A55'] } },
    ],
    // Several PHP workers behind the port (scripts/e2e/serve.mjs), as the main suite.
    webServer: {
        command: 'node scripts/e2e/serve.mjs --port 8010 --workers 4',
        cwd: '../../..',
        env: { DB_DATABASE: 'rimify_wf_e2e' },
        url: 'http://127.0.0.1:8010/up',
        reuseExistingServer: true,
        timeout: 90_000,
    },
})
