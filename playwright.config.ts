import { defineConfig, devices } from '@playwright/test';
import { EMPTY_SHOP, EMPTY_SHOP_DB, SHOP, SHOP_DB } from './e2e/shop';

/*
 * The admin's port: 8000, unless another project on the machine holds it (E2E_ADMIN_PORT). Every spec that names the
 * admin's address reads E2E_BASE_URL, set from it here; moved, both servers write that address into their links
 * (APP_URL), so a picture never points at whatever else answers on 8000.
 */
const ADMIN_PORT = Number(process.env.E2E_ADMIN_PORT ?? 8000);
const ADMIN = `http://127.0.0.1:${ADMIN_PORT}`;
const MOVED: Record<string, string> = ADMIN_PORT !== 8000 ? { APP_URL: ADMIN } : {};

process.env.E2E_BASE_URL ??= ADMIN;

/* The two shops' addresses in one place (e2e/shop.ts): each server listens where its specs look. */
const port = (url: string): string => new URL(url).port;

// The eight journeys run at 1440 (desktop) and 390 (mobile). The device split is decided on
// the server from the User-Agent, so the mobile project sends a real mobile UA.
export default defineConfig({
    testDir: './e2e',
    // The e2e shop, rebuilt before every run: the specs that buy leave it with less stock (e2e/global-setup.ts).
    globalSetup: './e2e/global-setup.ts',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    // Budgets for a development machine serving SSR pages, not for a fast CI box (the launch release §3):
    // a test's own waits stay short, the test as a whole may take a minute.
    timeout: 60_000,
    expect: { timeout: 10_000 },
    reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
    outputDir: 'test-results',
    use: {
        baseURL: process.env.E2E_BASE_URL,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'desktop-1440',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1440, height: 900 },
            },
        },
        {
            name: 'mobile-390',
            use: {
                ...devices['Pixel 7'],
                viewport: { width: 390, height: 844 },
            },
        },
    ],
    // Several PHP workers behind each port (scripts/e2e/serve.mjs): a single `php artisan serve` answers one
    // request at a time on Windows, and a long run then queues itself into timeouts.
    webServer: [
        {
            // The admin and its demo data.
            command: `node scripts/e2e/serve.mjs --port ${ADMIN_PORT} --workers 4`,
            env: MOVED,
            url: `${ADMIN}/up`,
            reuseExistingServer: !process.env.CI,
            timeout: 90_000,
        },
        {
            // The storefront specs' shop (e2e/shop.ts): its own database, seeded by E2eShopSeeder
            // (`composer e2e:shop`), because example data never reaches the storefront.
            command: `node scripts/e2e/serve.mjs --port ${port(SHOP)} --workers 4`,
            env: { ...SHOP_DB, ...MOVED },
            url: `${SHOP}/up`,
            reuseExistingServer: !process.env.CI,
            timeout: 90_000,
        },
        {
            // The same shop with nothing published (e2e/shop.ts EMPTY_SHOP, E2eEmptyShopSeeder): the homepage's hero
            // and the selector's 0 against an empty catalogue (the operator's brief of 05.10.2026, §2).
            command: `node scripts/e2e/serve.mjs --port ${port(EMPTY_SHOP)} --workers 2`,
            env: { ...EMPTY_SHOP_DB, ...MOVED },
            url: `${EMPTY_SHOP}/up`,
            reuseExistingServer: !process.env.CI,
            timeout: 90_000,
        },
    ],
});
