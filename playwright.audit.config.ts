import { defineConfig, devices } from '@playwright/test';

/*
 * The full admin audit (docs/review/ADMIN-AUDIT.md, the operator's brief of 23.10.2026): every admin page, form, list
 * and journey against a server of its own — a fresh database with born-demo data, never the e2e shops or the
 * development database. The server is started by hand (docs/review/ADMIN-AUDIT.md › Aufbau), so this config starts
 * none and rebuilds nothing; without AUDIT_URL it refuses to guess.
 *
 *   AUDIT_URL=http://127.0.0.1:8050 npx playwright test -c playwright.audit.config.ts
 *
 * 1440 is the primary width; 1024 the second. One worker: the journeys build on one another's data, in order.
 */
const AUDIT_URL = process.env.AUDIT_URL;

if (!AUDIT_URL) {
    throw new Error('AUDIT_URL names the audit server (docs/review/ADMIN-AUDIT.md › Aufbau); the audit never guesses one.');
}

export default defineConfig({
    testDir: './e2e/audit',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    timeout: 120_000,
    expect: { timeout: 10_000 },
    reporter: [['list'], ['json', { outputFile: 'test-results/audit/report.json' }]],
    outputDir: 'test-results/audit',
    use: {
        baseURL: AUDIT_URL,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'audit-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
        { name: 'audit-1024', use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } } },
    ],
});
