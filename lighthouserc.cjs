// Lighthouse CI — G7. Mobile, simulated throttling, against the production build with SSR on.
// Run through `node scripts/qa/lighthouse.mjs`, which points it at Playwright's Chromium and
// sets the consent cookie so the sheet does not sit in the first paint.
const consent = encodeURIComponent(
    JSON.stringify({ necessary: true, statistics: false, decidedAt: '2026-01-01T00:00:00.000Z' }),
)

module.exports = {
    ci: {
        collect: {
            url: [(process.env.QA_BASE_URL ?? 'http://127.0.0.1:8000') + '/'],
            numberOfRuns: 3,
            settings: {
                chromeFlags: '--headless=new --no-sandbox',
                formFactor: 'mobile',
                screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
                throttlingMethod: 'simulate',
                extraHeaders: JSON.stringify({ Cookie: `rmf_consent=${consent}` }),
                emulatedUserAgent:
                    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
            },
        },
        assert: {
            assertions: {
                'categories:performance': ['error', { minScore: 0.95 }],
                'categories:accessibility': ['error', { minScore: 1 }],
                'categories:best-practices': ['error', { minScore: 1 }],
                'categories:seo': ['error', { minScore: 1 }],
                'cumulative-layout-shift': ['error', { maxNumericValue: 0 }],
                'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
                'total-blocking-time': ['error', { maxNumericValue: 150 }],
            },
        },
        upload: {
            target: 'filesystem',
            outputDir: 'docs/qa/lighthouse',
            reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%.%%EXTENSION%%',
        },
    },
}
