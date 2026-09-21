/**
 * §6 — the two gates.
 *
 * Gate A  the rendered page differs from the prototype baseline by ≤ 0.5% of pixels, and the
 *         two pages are exactly the same height.
 * Gate B  the DOM signature matches exactly.
 *
 * Both sides are driven through the identical harness, and the external photographs are replayed
 * from the HAR recorded during capture — so a run measures our markup and our CSS, never
 * Unsplash's cache or the office network.
 *
 * §8 is a standing instruction about this file: when a case fails, fix the cause. Never raise
 * THRESHOLD, never regenerate a baseline from the Laravel page, never add an allowlist entry to
 * make a real difference disappear.
 */

import { test, expect } from '@playwright/test'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

// @ts-expect-error — plain ESM modules, shared verbatim with the capture script so that both
// sides of every comparison are prepared by the same code rather than by two similar copies.
import { allCases, STATES } from './cases.mjs'
// @ts-expect-error — see above.
import { prepareContext, seedState, settle, scrollThrough, contextOptions } from './harness.mjs'
// @ts-expect-error — see above.
import { signatureOf, compare } from './signature.mjs'

/** §6. Not a dial. */
const THRESHOLD = 0.005

/** Per-channel tolerance for a single pixel, before it counts as different at all. Antialiasing
 *  of identical text at identical metrics still lands a channel or two apart on some GPUs. */
const PIXEL_TOLERANCE = 0.1

const ARTIFACT_DIR = join('tests', 'visual', 'artifacts')
const RESULT_FILE = join(ARTIFACT_DIR, 'results.json')
const ALLOWLIST_FILE = join('tests', 'visual', 'allowlist.json')

type Allowlist = {
    entries: Array<{
        case: string
        viewport?: string
        reason: string
        region?: { x: number; y: number; width: number; height: number }
    }>
}

/** The BOM a Windows editor adds to a hand-edited JSON file would otherwise fail the whole suite
 *  with an error naming neither the file nor the cause. */
const readJson = (file: string) =>
    JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''))

const allowlist: Allowlist = existsSync(ALLOWLIST_FILE)
    ? readJson(ALLOWLIST_FILE)
    : { entries: [] }

// §9 caps the allowlist at five. Enforced here rather than trusted, because the pressure to add
// a sixth arrives exactly when the deadline does.
test('the allowlist stays within its budget', () => {
    expect(
        allowlist.entries.length,
        `The allowlist has ${allowlist.entries.length} entries; §9 permits at most 5. ` +
            `Each one is a difference from the prototype that we have agreed not to see.`
    ).toBeLessThanOrEqual(5)

    for (const entry of allowlist.entries) {
        expect(
            entry.reason?.length ?? 0,
            `Allowlist entry for "${entry.case}" has no reason. An unexplained exemption is ` +
                `indistinguishable from a bug someone hid.`
        ).toBeGreaterThan(20)
    }
})

const results: Array<Record<string, unknown>> = []

test.afterAll(() => {
    mkdirSync(ARTIFACT_DIR, { recursive: true })
    writeFileSync(RESULT_FILE, JSON.stringify({ threshold: THRESHOLD, results }, null, 2), 'utf8')
})

/**
 * Discovering the cases means reading `design-reference/`, which does not exist until §2 is done.
 *
 * A throw at import time would take the whole file down, including the harness checks that do not
 * need the prototype. A silent skip would be worse: §9's "all 36 green" could then be reached with
 * zero of them ever compared. So a missing prototype registers one loud failing test that names
 * the reason.
 */
let cases: Array<Record<string, string & { [k: string]: unknown }>> = []
let discoveryError: string | null = null

try {
    cases = allCases()
} catch (error) {
    discoveryError = String((error as Error).message ?? error)
}

if (discoveryError) {
    test('the prototype is available to compare against', () => {
        throw new Error(
            `${discoveryError}\n\n` +
                `The fidelity suite has nothing to measure against until §2 is complete. This is ` +
                `a failure rather than a skip on purpose: a skipped suite reads as "nothing to ` +
                `report", and "36 green" must never be reachable without 36 comparisons.`
        )
    })
}

for (const testCase of cases) {
    test(`${testCase.id} @ ${testCase.viewport}`, async ({ browser }, testInfo) => {
        // A case with no baseline has never been captured. Skipping it silently would let §9's
        // "all 36 green" be reached with thirty of them never compared, so it fails.
        expect(
            existsSync(testCase.baseline),
            `No baseline at ${testCase.baseline}. Run scripts/capture-reference.mjs against the ` +
                `prototype on :5500 first. Baselines come only from the prototype.`
        ).toBe(true)

        const context = await browser.newContext(contextOptions(testCase))

        try {
            await prepareContext(context)
            await seedState(context, STATES[testCase.state])

            // Replay the photographs exactly as they were during capture. `notFound: 'abort'`
            // rather than 'fallback' on purpose: a request the prototype never made is a
            // request our page invented, and letting it reach the network would hide that.
            if (existsSync(testCase.har)) {
                await context.routeFromHAR(testCase.har, {
                    url: /^https?:\/\/(?!127\.0\.0\.1|localhost)/,
                    notFound: 'abort',
                    update: false,
                })
            }

            const page = await context.newPage()

            const consoleErrors: string[] = []
            page.on('pageerror', (err) => consoleErrors.push(String(err)))

            const url = `/__fixture/${encodeURIComponent(testCase.id)}`
            const response = await page.goto(url, { waitUntil: 'domcontentloaded' })
            expect(
                response?.status(),
                `${url} did not render. The fixture route maps a case id to the controller and ` +
                    `state the prototype page shows; an unmapped case is a gap in that table.`
            ).toBe(200)

            await settle(page)
            await scrollThrough(page)

            // ── Gate B first ────────────────────────────────────────────────────────────────
            // Structure before pixels: a structural difference explains the pixel difference,
            // so reporting it first names the cause instead of the symptom.
            const expectedSig = readJson(testCase.signature)
            const actualSig = await signatureOf(page)
            const structural = compare(expectedSig, actualSig)

            // ── Gate A ──────────────────────────────────────────────────────────────────────
            const actualPath = join(ARTIFACT_DIR, testCase.viewport, `${testCase.id}.actual.png`)
            mkdirSync(dirname(actualPath), { recursive: true })
            await page.screenshot({
                path: actualPath,
                fullPage: true,
                animations: 'disabled',
                scale: 'css',
            })

            const baseline = PNG.sync.read(readFileSync(testCase.baseline))
            const actual = PNG.sync.read(readFileSync(actualPath))

            const sameSize = baseline.width === actual.width && baseline.height === actual.height

            let ratio = 1
            let differing = 0
            let diffPath: string | null = null

            if (sameSize) {
                const diff = new PNG({ width: baseline.width, height: baseline.height })

                applyAllowlist(baseline, actual, testCase)

                differing = pixelmatch(
                    baseline.data,
                    actual.data,
                    diff.data,
                    baseline.width,
                    baseline.height,
                    { threshold: PIXEL_TOLERANCE, includeAA: false }
                )
                ratio = differing / (baseline.width * baseline.height)

                diffPath = join(ARTIFACT_DIR, testCase.viewport, `${testCase.id}.diff.png`)
                writeFileSync(diffPath, PNG.sync.write(diff))
                await testInfo.attach('diff', { path: diffPath, contentType: 'image/png' })
            }

            results.push({
                id: testCase.id,
                viewport: testCase.viewport,
                ratio,
                differing,
                sameSize,
                baselineHeight: baseline.height,
                actualHeight: actual.height,
                structural: structural.length,
                structuralDetail: structural.slice(0, 3),
                baseline: testCase.baseline,
                actual: actualPath,
                diff: diffPath,
                passed: sameSize && ratio <= THRESHOLD && structural.length === 0,
            })

            await testInfo.attach('baseline', {
                path: testCase.baseline,
                contentType: 'image/png',
            })

            expect(
                consoleErrors,
                `The page threw, so what was measured is not what it renders when healthy.`
            ).toEqual([])

            // Height before the ratio: two pages of different heights cannot be compared pixel
            // for pixel at all, and the height difference is the actionable number.
            expect(
                actual.height,
                `Height differs. Prototype ${baseline.height}px, ours ${actual.height}px ` +
                    `(${actual.height - baseline.height > 0 ? '+' : ''}${actual.height - baseline.height}px). ` +
                    `Find the section that is taller before looking at the diff image.`
            ).toBe(baseline.height)

            expect(
                actual.width,
                `Width differs. Prototype ${baseline.width}px, ours ${actual.width}px. ` +
                    `Usually a container that scrolls horizontally on one side.`
            ).toBe(baseline.width)

            expect(
                structural,
                structural.length
                    ? `Gate B — ${structural.length} structural difference(s):\n\n` +
                      structural.map((d: { detail: string }) => d.detail).join('\n\n')
                    : ''
            ).toEqual([])

            expect(
                ratio,
                `Gate A — ${(ratio * 100).toFixed(3)}% of pixels differ (${differing} of ` +
                    `${baseline.width * baseline.height}); the gate is ${(THRESHOLD * 100).toFixed(1)}%.\n` +
                    `Diff image: ${diffPath}\n` +
                    `Work the §8 checklist. Do not raise the threshold.`
            ).toBeLessThanOrEqual(THRESHOLD)
        } finally {
            await context.close()
        }
    })
}

/**
 * Blank out allowlisted regions in BOTH images, so an agreed exemption is invisible to the diff
 * rather than merely tolerated by it.
 *
 * This exists for genuinely unreproducible content — nothing else. §8: an allowlist entry must
 * never be used to make a real difference disappear.
 */
function applyAllowlist(
    baseline: PNG,
    actual: PNG,
    testCase: { id: string; viewport: string }
): void {
    const entries = allowlist.entries.filter(
        (e) => e.case === testCase.id && (!e.viewport || e.viewport === testCase.viewport)
    )

    for (const entry of entries) {
        if (!entry.region) continue
        const { x, y, width, height } = entry.region

        for (let row = y; row < Math.min(y + height, baseline.height); row++) {
            for (let col = x; col < Math.min(x + width, baseline.width); col++) {
                const i = (baseline.width * row + col) << 2
                baseline.data[i] = actual.data[i] = 0
                baseline.data[i + 1] = actual.data[i + 1] = 0
                baseline.data[i + 2] = actual.data[i + 2] = 0
                baseline.data[i + 3] = actual.data[i + 3] = 255
            }
        }
    }
}
