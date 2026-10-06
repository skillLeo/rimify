import { defineConfig, devices } from '@playwright/test'
import { E2E_FEATURES, SHOP, SHOP_DB } from './e2e/shop'
import { ABNAHME, ABNAHME_DB } from './e2e/kundenliste/support'

/*
 * The client's list, proven one by one (the operator's brief „THE 34“ §0): only the tests tagged `@kunde-NN`, at
 * 1440 × 900 and 390 × 844, against the acceptance shop (`rimify:demo --abnahme` on the preview's empty start). A few
 * items need a full catalogue — four wheels and more for #5, a long filter column for #24, an „all Hinweise“ document
 * for the „Freigegeben“ badge of #23 — and use the e2e shop for that, said in the spec. Run by `npm run kundenliste`,
 * which writes docs/review/KUNDENLISTE.md from the JSON report.
 */
const port = (url: string): string => new URL(url).port

export default defineConfig({
    testDir: './e2e/kundenliste',
    globalSetup: './e2e/kundenliste/global-setup.ts',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    timeout: 120_000,
    expect: { timeout: 15_000 },
    reporter: [['list'], ['json', { outputFile: process.env.KUNDENLISTE_JSON ?? 'test-results/kundenliste.json' }]],
    outputDir: 'test-results/kundenliste',
    use: {
        baseURL: ABNAHME,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
        { name: 'mobile-390', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    ],
    webServer: [
        {
            command: `node scripts/e2e/serve.mjs --port ${port(ABNAHME)} --workers 4`,
            env: { ...ABNAHME_DB, ...E2E_FEATURES, APP_URL: ABNAHME },
            url: `${ABNAHME}/up`,
            reuseExistingServer: true,
            timeout: 120_000,
        },
        {
            command: `node scripts/e2e/serve.mjs --port ${port(SHOP)} --workers 4`,
            env: { ...SHOP_DB, ...E2E_FEATURES },
            url: `${SHOP}/up`,
            reuseExistingServer: true,
            timeout: 120_000,
        },
    ],
})
