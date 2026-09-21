/**
 * Determinism harness.
 *
 * Both sides of every comparison — the prototype at :5500 and the Laravel page at :8000 — are
 * put into the same frozen state before a pixel is read. Without this a diff reports the caret
 * blinking, a transition caught mid-flight, a `Math.random()` product order or a clock that
 * moved between the two captures, and the 0.5% gate of §6 becomes noise rather than a measure.
 *
 * Everything here is symmetrical on purpose. Anything applied to the prototype and not to the
 * Laravel page (or the reverse) would be a difference the harness introduced and then measured.
 */

import { VIEWPORTS } from './cases.mjs'

/** Fixed instant for both sides. Any date the pages render — a delivery estimate, an order
 *  date, a copyright year — resolves from this and not from the wall clock. */
export const FIXED_EPOCH_MS = Date.UTC(2026, 0, 15, 9, 30, 0)

/** Seed for the deterministic PRNG. Arbitrary, but identical on both sides, which is the point. */
export const RANDOM_SEED = 0x1a44d4 >>> 0

/**
 * Freeze the clock, the PRNG and animation. Installed with `addInitScript` so it runs before any
 * prototype or application script — a page that reads `Date.now()` at module scope must see the
 * frozen value, which rules out doing this after load.
 */
export function determinismScript(epochMs, seed) {
    return `(() => {
        // ── Clock ────────────────────────────────────────────────────────────────────────────
        const FIXED = ${epochMs};
        const RealDate = Date;
        class FrozenDate extends RealDate {
            constructor(...args) {
                if (args.length === 0) super(FIXED);
                else super(...args);
            }
            static now() { return FIXED; }
            static parse(...a) { return RealDate.parse(...a); }
            static UTC(...a) { return RealDate.UTC(...a); }
        }
        Object.defineProperty(FrozenDate, 'name', { value: 'Date' });
        window.Date = FrozenDate;

        // performance.now() drives requestAnimationFrame-based easing; pinning it to zero stops
        // a captured frame depending on how busy the machine was.
        try {
            const perf = window.performance;
            Object.defineProperty(perf, 'now', { configurable: true, value: () => 0 });
            Object.defineProperty(perf, 'timeOrigin', { configurable: true, value: FIXED });
        } catch (e) { /* locked down in some contexts; the CSS freeze below still holds */ }

        // ── PRNG ─────────────────────────────────────────────────────────────────────────────
        // mulberry32: small, and identical output for identical seed on both sides.
        let s = ${seed} >>> 0;
        Math.random = function () {
            s = (s + 0x6D2B79F5) >>> 0;
            let t = s;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };

        // crypto.randomUUID() would otherwise leak entropy into any generated id that reaches
        // the DOM signature.
        try {
            if (window.crypto) {
                let n = 0;
                window.crypto.randomUUID = () =>
                    '00000000-0000-4000-8000-' + String(++n).padStart(12, '0');
                window.crypto.getRandomValues = (arr) => {
                    for (let i = 0; i < arr.length; i++) arr[i] = (i * 31 + 7) & 0xff;
                    return arr;
                };
            }
        } catch (e) { /* non-secure context */ }
    })();`
}

/**
 * CSS freeze. Injected as a stylesheet rather than by walking the DOM so it also catches nodes
 * the prototype's generators create after load.
 *
 * `caret-color: transparent` matters more than it looks: an autofocused field in the vehicle
 * selector blinks a one-pixel-wide caret, which lands on roughly half of all captures and makes
 * a case flap between passing and failing for no reason anyone can see.
 */
export const FREEZE_CSS = `
    *, *::before, *::after {
        animation-delay: -0.0001s !important;
        animation-duration: 0s !important;
        animation-iteration-count: 1 !important;
        animation-play-state: paused !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
        caret-color: transparent !important;
    }
    html { scroll-behavior: auto !important; }
    /* A scrollbar that appears on one side and not the other shifts every pixel to its left. */
    ::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
`

/**
 * Apply everything a context needs before it opens a page. Used identically for the reference
 * capture and for the Laravel page under test.
 */
export async function prepareContext(context, { epochMs = FIXED_EPOCH_MS, seed = RANDOM_SEED } = {}) {
    await context.addInitScript(determinismScript(epochMs, seed))
}

/**
 * Seed the prototype's sessionStorage for a state case.
 *
 * Origin matters: sessionStorage is per-origin, so this has to run on the origin the page will
 * be served from, before that page's scripts read it. Playwright's `addInitScript` fires on
 * every document in the context, which is what makes this reliable across the prototype's
 * `location.href` navigations.
 */
export async function seedState(context, state) {
    if (!state) return

    await context.addInitScript((entries) => {
        try {
            for (const [key, value] of entries) window.sessionStorage.setItem(key, value)
        } catch (e) {
            // A blocked storage accessor must not pass silently — the page would render its
            // cold-start state and the baseline would record the wrong header.
            window.__RIMIFY_SEED_FAILED__ = String(e)
        }
    }, Object.entries(state))
}

/**
 * Wait until the page has stopped ADDING images and every one of them has finished.
 *
 * Shared by `settle()` and `scrollThrough()`, because both can be followed by new image requests
 * and a screenshot taken between the two is a screenshot of a half-loaded page.
 *
 * `requireRuntime` is true on the first call, where the runtime must also have drawn: at first
 * paint the document legitimately contains none of the design's photographs, so "every image has
 * loaded" would otherwise be satisfied by an empty set. After a scroll the runtime has long since
 * run, and only the images matter.
 */
async function awaitImages(page, timeout, requireRuntime) {
    await page.evaluate(() => {
        // Reset the counter so a previous call's total cannot make the first poll look stable.
        window.__rimifyImgCount = -1
    })

    await page.waitForFunction(
        (needsRuntime) => {
            const w = window

            if (needsRuntime) {
                // Both sides load the same six runtime files and both expose `window.APP`, so
                // this is symmetric.
                if (!w.APP) return false

                /*
                 * And it must have drawn. `boot()` calls renderChrome(), then renderFooter(),
                 * then the page's builder — and renderFooter() writes into #bottom on EVERY page,
                 * including the admin screens, where the shell hides #bottom but still fills it.
                 * So a #bottom with children is the one "drawing has started" signal that works
                 * on all thirty-four pages.
                 *
                 * An earlier version waited for `fillAll()` to stamp `data-filled`. That is true
                 * only of the pages whose sections are in the FILL table — the listing is built by
                 * renderPLP(), the basket by renderCart(), the admin screens by shell(), and none
                 * of them stamp anything — so 28 of 34 pages waited for a mark never coming.
                 */
                const bottom = document.getElementById('bottom')
                if (bottom !== null && bottom.childElementCount === 0) return false
            }

            const imgs = Array.from(document.images)
            const allComplete = imgs.every((img) => img.complete)
            const stable = w.__rimifyImgCount === imgs.length
            w.__rimifyImgCount = imgs.length

            return allComplete && stable
        },
        requireRuntime,
        { timeout, polling: 250 }
    )

    /*
     * Loaded is not the same as painted.
     *
     * `img.complete` turns true when the bytes have arrived, but a 300KB photograph may still be
     * decoding when the screenshot is taken — and a half-decoded image is captured as blank or
     * banded. That is what made the Startseite read 0.000% on one run and 3.4% on the next with
     * an identical DOM: not a difference in the page, a difference in how far the decoder had got.
     *
     * `decode()` resolves only once the frame is ready to paint. Failures are swallowed because a
     * broken image is a legitimate terminal state here — the design draws a fallback for exactly
     * that — and because a decode that rejects must not fail a case the page renders correctly.
     */
    await page.evaluate(() =>
        Promise.all(
            Array.from(document.images).map((img) =>
                typeof img.decode === 'function' ? img.decode().catch(() => {}) : Promise.resolve()
            )
        )
    )
}

/**
 * Wait until the page has genuinely stopped changing.
 *
 * `networkidle` alone is not enough here. The prototype builds its markup at runtime from
 * `shared/pages.js`, and the photo-over-SVG pattern in `art.js` swaps an `<img>` in over a
 * drawn fallback — so a capture taken at `load` records the fallback art, and the diff then
 * reports "photo missing" against a Laravel page that got its photo in time.
 */
export async function settle(page, { timeout = 30_000 } = {}) {
    await page.waitForLoadState('domcontentloaded')

    // Fonts first: Lato and IBM Plex Mono change every text metric on the page, so a capture
    // taken before they swap measures fallback metrics.
    await page.evaluate(() => document.fonts.ready)

    /*
     * Wait until the page has stopped ADDING images, not merely until the ones present right now
     * have finished.
     *
     * The design's markup is generated by a runtime that is injected after Vue mounts, so at the
     * moment of first paint the document legitimately contains none of its photographs. A single
     * "are all images complete" check passes trivially against an empty set, and the screenshot
     * then catches a page whose photographs are still arriving — which is exactly how a fully
     * correct DOM produced two blank 500px-wide bands where the design has photographs.
     *
     * So: poll until the image count is unchanged across consecutive checks AND every one of them
     * has reached a terminal state. Failure is terminal too — the fallback SVG is designed for
     * it — but it must have been reached rather than still pending.
     */
    await awaitImages(page, timeout, true)


    /*
     * Fonts again — and this is the one that matters.
     *
     * The first `document.fonts.ready` above resolves against the markup present at load. But the
     * runtime draws afterwards, and its markup is the first thing on the page to use `.mono`:
     * every phone number, every 8,5J, every ET 35. IBM Plex Mono is therefore not requested until
     * after that first await has already resolved, so waiting only once leaves those values
     * rendered in a fallback monospace — different glyph widths, different pixels, on a page whose
     * DOM is otherwise identical.
     */
    await page.evaluate(() => document.fonts.ready)

    await page.waitForLoadState('networkidle', { timeout }).catch(() => {
        // A page holding a long-poll open would otherwise fail the whole case; the font and
        // image waits above have already established that the visible content is settled.
    })

    const seedError = await page.evaluate(() => window.__RIMIFY_SEED_FAILED__ ?? null)
    if (seedError) {
        throw new Error(
            `sessionStorage seeding failed (${seedError}). The page rendered its cold-start ` +
                `state, so this capture would baseline the wrong header.`
        )
    }

    // Two frames, so anything the generators scheduled has been through a full paint.
    await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    )
}

/**
 * Scroll the full height once and come back.
 *
 * Any lazy image or reveal-on-scroll section must be in its final state before a full-page
 * screenshot, otherwise the capture contains a band that was still animating in. Coming back to
 * the top matters because a full-page screenshot of a `position: sticky` header renders it where
 * the scroll left it.
 */
export async function scrollThrough(page) {
    await page.evaluate(async () => {
        const step = Math.max(200, window.innerHeight * 0.8)
        for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y)
            await new Promise((r) => requestAnimationFrame(r))
        }
        window.scrollTo(0, 0)
        await new Promise((r) => requestAnimationFrame(r))
    })
    await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    )

    /*
     * Scrolling is what makes far-below-the-fold images start loading, so the wait has to happen
     * AFTER the scroll, not only before it. Without this the screenshot caught the last brand
     * card still blank on the 8,913px mobile Startseite — a page whose DOM was already identical,
     * which is why it read as a mysterious sub-1% difference rather than as a missing image.
     */
    await awaitImages(page, 30_000, false).catch(() => {
        // A page that never settles here has already been through the full wait in settle(); do
        // not fail the case for an image that arrived late on the way back up.
    })

    await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    )
}

/** Context options for one viewport, shared by both sides so neither gets a different device. */
export function contextOptions(viewport) {
    const vp = typeof viewport === 'string' ? VIEWPORTS[viewport] : viewport

    return {
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        isMobile: vp.isMobile,
        hasTouch: vp.isMobile,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        colorScheme: 'light',
        reducedMotion: 'reduce',
        // The device split is decided server-side from the User-Agent (R-08), so the mobile
        // context has to present as a real phone or Laravel ships the desktop page and the
        // diff reports a difference that is mine, not the design's.
        userAgent: vp.isMobile
            ? 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'
            : undefined,
    }
}
