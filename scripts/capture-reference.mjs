/**
 * §3 — capture the prototype.
 *
 * This is the step that makes the whole pass possible. The prototype's pages are thin
 * `data-mount` skeletons; `shared/pages.js`, `pages2.js`, `admin.js` and `art.js` build the real
 * markup at runtime. Reading the page HTML therefore shows almost nothing, and porting from it
 * means guessing — which §1 names as the first cause of the drift.
 *
 * So we run the prototype in a real browser and write down what it actually produced:
 *
 *   design-reference/_rendered/<vp>/<case>.html   the post-JavaScript DOM — the porting source
 *   tests/visual/baseline/<vp>/<case>.png         the pixel contract for Gate A
 *   tests/visual/signature/<vp>/<case>.json       the structural contract for Gate B
 *   tests/visual/har/<case>.<vp>.har              recorded network, replayed so the external
 *                                                 photographs cannot change a later run
 *
 * Baselines come only from here. §8: never regenerate one from the Laravel page.
 *
 * Usage:  node scripts/capture-reference.mjs [--only <substring>] [--base http://127.0.0.1:5500]
 */

import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { allCases, assertStateKeys, STATES, REFERENCE_DIR } from '../tests/visual/cases.mjs'
import {
    prepareContext,
    seedState,
    settle,
    scrollThrough,
    contextOptions,
} from '../tests/visual/harness.mjs'
import { signatureOf } from '../tests/visual/signature.mjs'
import { serveDesignPhotos } from '../tests/visual/photo-cache.mjs'

const argv = process.argv.slice(2)
const arg = (flag, fallback) => {
    const i = argv.indexOf(flag)
    return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback
}

const BASE = arg('--base', 'http://127.0.0.1:5500').replace(/\/$/, '')
const ONLY = arg('--only', null)

const ensureDir = (file) => mkdirSync(dirname(file), { recursive: true })

/**
 * The six files without which the prototype renders as empty skeletons. Checking them by name
 * up front turns "every baseline is a blank page" into one sentence naming what is missing.
 */
const REQUIRED_SHARED = [
    'tokens.css',
    'components.css',
    'app.js',
    'pages.js',
    'pages2.js',
    'admin.js',
    'art.js',
    'data.js',
]

function preflight() {
    const missing = REQUIRED_SHARED.filter(
        (f) => !existsSync(join(REFERENCE_DIR, 'shared', f))
    )

    if (missing.length) {
        console.error(
            `\n  design-reference/shared/ is missing: ${missing.join(', ')}\n\n` +
                `  Without these the prototype renders as unstyled empty skeletons and every\n` +
                `  baseline captured would be a blank page. §2 is not complete.\n\n` +
                `  Do NOT rebuild them from a written spec — that is exactly how drift happens.\n`
        )
        process.exit(1)
    }

    // Confirm the sessionStorage key names against shared/app.js rather than trusting the
    // literals in cases.mjs. Seeding a key nothing reads would baseline the wrong header.
    assertStateKeys()
}

async function captureOne(browser, testCase) {
    const context = await browser.newContext({
        ...contextOptions(testCase),
        recordHar: { path: testCase.har, mode: 'full', content: 'embed' },
    })

    try {
        await prepareContext(context)
        // Before anything navigates: the design's photographs are served from disk at their own
        // URLs. Without this, Unsplash throttling decides which images survive, art.js quietly
        // swaps in drawn fallbacks for the rest, and the baseline records artwork the design
        // does not display. The HAR records these fulfilled responses, so replay matches.
        await serveDesignPhotos(context)
        await seedState(context, STATES[testCase.state])

        const page = await context.newPage()

        const failures = []
        page.on('pageerror', (err) => failures.push(String(err)))
        page.on('console', (msg) => {
            if (msg.type() === 'error') failures.push(msg.text())
        })

        const url = `${BASE}/${testCase.dir}/${testCase.slug}.html`
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' })

        if (!response || !response.ok()) {
            throw new Error(`${url} returned ${response ? response.status() : 'no response'}`)
        }

        await settle(page)
        await scrollThrough(page)

        // A prototype page that threw is a page that did not finish building its markup. Capturing
        // it would bake a half-generated DOM into the contract every later page is measured
        // against, so it fails closed.
        if (failures.length) {
            throw new Error(
                `The prototype page logged ${failures.length} error(s), so its markup may be ` +
                    `incomplete:\n    ${failures.slice(0, 5).join('\n    ')}`
            )
        }

        // ── Layout facts worth knowing before porting ────────────────────────────────────────
        //
        // A page with no `<meta name="viewport">` lays out at 980 CSS pixels on a phone and is
        // then scaled down, so it is not being designed at 390 at all. If a mobile prototype
        // page is missing one, that is a property of the prototype and §1 says to reproduce it
        // faithfully and write it down — not to quietly add the tag and call the result the
        // same design.
        const layout = await page.evaluate(() => ({
            images: document.images.length,
            /*
             * art.js reveals a drawn fallback by setting its wrapper's opacity to 1 and removing
             * the <img>. A revealed fallback therefore means a photograph did not arrive, and a
             * baseline captured in that state records artwork the design does not show.
             */
            revealedFallbacks: [...document.querySelectorAll('[data-fb]')].filter(
                (el) => el.style.opacity === '1'
            ).length,
            innerWidth: window.innerWidth,
            viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? null,
            lang: document.documentElement.getAttribute('lang'),
            fonts: [...new Set([...document.querySelectorAll('link[rel="stylesheet"]')]
                .map((l) => l.getAttribute('href'))
                .filter((h) => h && h.includes('fonts.googleapis.com')))],
        }))

        if (layout.revealedFallbacks > 0) {
            throw new Error(
                `${layout.revealedFallbacks} photograph(s) failed to load, so the page fell back ` +
                    `to drawn art. Capturing this would baseline artwork the design does not ` +
                    `display. Check design-export/images and tests/visual/photo-cache.mjs.`
            )
        }

        if (testCase.isMobile && layout.viewportMeta === null) {
            console.log(
                `\n      note: ${testCase.slug} (mobile) declares no viewport meta, so it lays ` +
                    `out at ${layout.innerWidth}px.\n      Reproduce it; do not add the tag.`
            )
        }

        // ── The rendered DOM: the porting source for §4 ──────────────────────────────────────
        const html = await page.evaluate(() => {
            const doctype = document.doctype
                ? `<!DOCTYPE ${document.doctype.name}>\n`
                : ''
            return doctype + document.documentElement.outerHTML
        })

        ensureDir(testCase.rendered)
        writeFileSync(
            testCase.rendered,
            `<!--\n` +
                `  RENDERED DOM — captured from the prototype after its JavaScript ran.\n` +
                `  Case: ${testCase.id}   Viewport: ${testCase.viewport} ` +
                `(${testCase.width}x${testCase.height})   State: ${testCase.state}\n` +
                `  Source: ${testCase.dir}/${testCase.slug}.html\n\n` +
                `  This file, not the source HTML, is what the Vue components are ported from.\n` +
                `  It is generated — edit the capture, never this.\n` +
                `-->\n` +
                html,
            'utf8'
        )

        // ── Signature: Gate B ────────────────────────────────────────────────────────────────
        const signature = await signatureOf(page)
        ensureDir(testCase.signature)
        writeFileSync(testCase.signature, JSON.stringify(signature, null, 2), 'utf8')

        // ── Baseline PNG: Gate A ─────────────────────────────────────────────────────────────
        ensureDir(testCase.baseline)
        await page.screenshot({
            path: testCase.baseline,
            fullPage: true,
            animations: 'disabled',
            scale: 'css',
        })

        return {
            id: testCase.id,
            viewport: testCase.viewport,
            ok: true,
            height: signature.height,
            nodes: signature.nodes.length,
            ...layout,
        }
    } finally {
        // Closing the context is what flushes the HAR to disk.
        await context.close()
    }
}

async function main() {
    preflight()

    let cases = allCases()
    if (ONLY) cases = cases.filter((c) => c.id.includes(ONLY) || c.viewport === ONLY)

    if (!cases.length) {
        console.error(`  No cases matched --only ${ONLY}.`)
        process.exit(1)
    }

    console.log(`\n  Capturing ${cases.length} case-viewport pairs from ${BASE}\n`)

    const browser = await chromium.launch()
    const results = []
    let failed = 0

    try {
        for (const testCase of cases) {
            process.stdout.write(`  ${testCase.id.padEnd(28)} ${testCase.viewport.padEnd(8)} `)
            try {
                const result = await captureOne(browser, testCase)
                results.push(result)
                console.log(`ok   ${String(result.height).padStart(5)}px  ${result.nodes} nodes`)
            } catch (error) {
                failed++
                results.push({
                    id: testCase.id,
                    viewport: testCase.viewport,
                    ok: false,
                    error: String(error.message ?? error),
                })
                console.log(`FAIL\n      ${String(error.message ?? error).split('\n').join('\n      ')}`)
            }
        }
    } finally {
        await browser.close()
    }

    writeFileSync(
        join('tests', 'visual', 'capture-manifest.json'),
        JSON.stringify({ base: BASE, cases: results }, null, 2),
        'utf8'
    )

    console.log(
        `\n  ${results.length - failed}/${results.length} captured.` +
            (failed ? `  ${failed} failed — nothing downstream is trustworthy until they pass.\n` : `\n`)
    )

    process.exit(failed ? 1 : 0)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
