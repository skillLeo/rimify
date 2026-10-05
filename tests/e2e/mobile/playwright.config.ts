import { defineConfig, devices } from '@playwright/test'
import { SHOP, SHOP_DB } from '../../../e2e/shop'

/* The shop's address in one place (e2e/shop.ts): the server listens where the specs look. */
const SHOP_PORT = new URL(SHOP).port

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
    // The same shop every run, whatever the main suite bought in it (e2e/global-setup.ts).
    globalSetup: '../../../e2e/global-setup.ts',
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    timeout: 90_000,
    expect: { timeout: 15_000 },
    reporter: [['list']],
    outputDir: '../../../test-results/mobile',
    use: {
        // The phone documents are the storefront's: the e2e shop (e2e/shop.ts), its own database.
        baseURL: SHOP,
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
        command: `node scripts/e2e/serve.mjs --port ${SHOP_PORT} --workers 4`,
        cwd: '../../..',
        env: SHOP_DB,
        url: `${SHOP}/up`,
        reuseExistingServer: true,
        timeout: 90_000,
    },
})
