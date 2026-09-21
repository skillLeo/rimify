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
        baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8000',
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
    webServer: {
        command: 'php artisan serve --host=127.0.0.1 --port=8000',
        url: 'http://127.0.0.1:8000/up',
        reuseExistingServer: true,
        timeout: 60_000,
    },
})
