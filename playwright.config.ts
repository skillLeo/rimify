import { defineConfig, devices } from '@playwright/test';
import { E2E_FEATURES, EMPTY_SHOP, EMPTY_SHOP_DB, SHOP, SHOP_DB } from './e2e/shop';

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

/*
 * The acceptance run (`abnahme`, the operator's briefs of 13.10.2026): the deployed site — or a seeded instance of ours —
 * in a window one can watch, signed in once per role, one tagged test per item of the client's list, with video and a
 * trace for every one. It exists only while RIMIFY_URL names its target (never a guess): without that variable this
 * file is the fast headless suite, exactly as before; with it, it is the acceptance run and nothing else — no local
 * server is started and no local shop rebuilt for a run against another machine.
 *
 *   RIMIFY_URL=… RIMIFY_EMAIL=… RIMIFY_PASSWORD=… npx playwright test --project=abnahme --project=abnahme-webkit
 *
 * `slowMo` is there so a person watching can see what is pressed. Chromium at 1440 × 900, and WebKit at 390 × 844 —
 * Chromium passing proves nothing about an iPhone.
 */
const ACCEPTANCE = Boolean(process.env.RIMIFY_URL);
const WATCHED = {
    baseURL: process.env.RIMIFY_URL,
    headless: false,
    storageState: 'tests/abnahme/.auth/super-admin.json',
    video: 'on',
    trace: 'on',
    screenshot: 'only-on-failure',
} as const;
const ABNAHME = [
    {
        name: 'abnahme-setup',
        testDir: './tests/abnahme',
        testMatch: /auth\.setup\.ts/,
        use: { baseURL: process.env.RIMIFY_URL, headless: false, launchOptions: { slowMo: 120 } },
    },
    {
        name: 'abnahme',
        testDir: './tests/abnahme',
        testMatch: /.*\.spec\.ts/,
        use: {
            ...WATCHED,
            launchOptions: { slowMo: 120, args: ['--disable-blink-features=AutomationControlled'] },
            viewport: { width: 1440, height: 900 },
        },
        dependencies: ['abnahme-setup'],
    },
    {
        name: 'abnahme-webkit',
        testDir: './tests/abnahme',
        testMatch: /.*\.spec\.ts/,
        use: {
            ...devices['iPhone 13'],
            ...WATCHED,
            launchOptions: { slowMo: 120 },
            viewport: { width: 390, height: 844 },
        },
        dependencies: ['abnahme-setup'],
    },
];

// The eight journeys run at 1440 (desktop) and 390 (mobile). The device split is decided on
// the server from the User-Agent, so the mobile project sends a real mobile UA.
export default defineConfig({
    testDir: './e2e',
    // The client's list is a suite of its own, against the acceptance shop (playwright.kundenliste.config.ts,
    // `npm run kundenliste`): run from here it would ask this config's servers for a shop they do not hold. The admin
    // audit too (playwright.audit.config.ts): it runs against its own server and database.
    testIgnore: ['**/kundenliste/**', '**/audit/**'],
    // The e2e shop, rebuilt before every run: the specs that buy leave it with less stock (e2e/global-setup.ts).
    globalSetup: ACCEPTANCE ? undefined : './e2e/global-setup.ts',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    // Budgets for a development machine serving SSR pages, not for a fast CI box (the launch release §3):
    // a test's own waits stay short, the test as a whole may take a minute.
    timeout: 60_000,
    expect: { timeout: 10_000 },
    reporter: ACCEPTANCE
        ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/abnahme' }], ['json', { outputFile: process.env.ABNAHME_JSON ?? 'test-results/abnahme.json' }]]
        : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
    outputDir: ACCEPTANCE ? 'test-results/abnahme' : 'test-results',
    use: {
        baseURL: process.env.E2E_BASE_URL,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: ACCEPTANCE ? ABNAHME : [
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
    webServer: ACCEPTANCE ? [] : [
        {
            // The admin and its demo data.
            command: `node scripts/e2e/serve.mjs --port ${ADMIN_PORT} --workers 4`,
            env: { ...E2E_FEATURES, ...MOVED },
            url: `${ADMIN}/up`,
            reuseExistingServer: !process.env.CI,
            timeout: 90_000,
        },
        {
            // The storefront specs' shop (e2e/shop.ts): its own database, seeded by E2eShopSeeder
            // (`composer e2e:shop`), because example data never reaches the storefront.
            command: `node scripts/e2e/serve.mjs --port ${port(SHOP)} --workers 4`,
            env: { ...SHOP_DB, ...E2E_FEATURES, ...MOVED },
            url: `${SHOP}/up`,
            reuseExistingServer: !process.env.CI,
            timeout: 90_000,
        },
        {
            // The same shop with nothing published (e2e/shop.ts EMPTY_SHOP, E2eEmptyShopSeeder): the homepage's hero
            // and the selector's 0 against an empty catalogue (the operator's brief of 05.10.2026, §2).
            command: `node scripts/e2e/serve.mjs --port ${port(EMPTY_SHOP)} --workers 2`,
            env: { ...EMPTY_SHOP_DB, ...E2E_FEATURES, ...MOVED },
            url: `${EMPTY_SHOP}/up`,
            reuseExistingServer: !process.env.CI,
            timeout: 90_000,
        },
    ],
});
