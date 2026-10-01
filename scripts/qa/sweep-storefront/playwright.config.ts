import { defineConfig, devices } from '@playwright/test';

/*
 * The client-ready click-through of the storefront (docs/reviews/sweep-storefront.md), against a running shop —
 * by default the preview, https://rimify.skillleo.com. Its own config, outside e2e/, so `composer verify` never
 * walks a remote host: no webServer, no e2e shop reset, nothing seeded.
 *
 *   npx playwright test -c scripts/qa/sweep-storefront/playwright.config.ts
 *   SWEEP_BASE_URL=http://127.0.0.1:8000 npx playwright test -c scripts/qa/sweep-storefront/playwright.config.ts
 *
 * Run from the project root (the evidence paths are relative to it). Output:
 *   docs/reviews/sweep-storefront/findings-<project>.jsonl   every finding, one JSON line each
 *   docs/reviews/sweep-storefront/live-findings.md          the same, merged, one line each (global-teardown.ts)
 *   docs/qa/shots/sweep-storefront/                         the screenshots the lines name
 *
 * What it writes on the shop: cookies and the session's basket; one RIMIFY-Check result per project (POST
 * /rimify-check/ergebnis — the customer's „drucken oder teilen“); and on the desktop project ONE test order of ONE
 * 19″ wheel, paid with the sandbox's „Zahlung erfolgreich“ (no money moves; stock −1). The phone project stops at the
 * payment step and reads the desktop's order with the desktop's session. Set SWEEP_NO_ORDER=1 to stop both at the
 * payment step. It never presses „Konto anlegen“, never subscribes to a notification, never sends a form to the team.
 */
export default defineConfig({
    testDir: '.',
    testMatch: /sweep\.spec\.ts$/,
    globalSetup: './global-setup.ts',
    globalTeardown: './global-teardown.ts',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    // A remote host on a shared plan, SSR on every page: a step may take a while, a whole journey longer.
    timeout: 240_000,
    expect: { timeout: 20_000 },
    reporter: [['list']],
    outputDir: '../../../test-results/sweep-storefront',
    use: {
        baseURL: process.env.SWEEP_BASE_URL ?? 'https://rimify.skillleo.com',
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        navigationTimeout: 60_000,
        actionTimeout: 20_000,
    },
    projects: [
        {
            name: 'desktop-1440',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
        },
        {
            // The device split is decided on the server from the User-Agent: a real phone UA, touch, isMobile.
            name: 'mobile-390',
            // No `dependencies`: a dependency that has a red test (every finding is a soft failure) would skip the
            // phone entirely. One worker runs the projects in this order, so the desktop's order is there when the
            // phone looks for it; if it is not, the phone says so and goes on.
            use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
        },
    ],
});
