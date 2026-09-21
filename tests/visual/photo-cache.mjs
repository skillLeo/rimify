/**
 * Serve the design's photographs from disk, at their own URLs.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────────────────────
 *
 * `shared/art.js` layers every photograph over a drawn SVG and reveals the drawing when the image
 * fails:
 *
 *     onerror="var p=this.parentNode.querySelector('[data-fb]');if(p)p.style.opacity=1;this.remove()"
 *
 * That is good design and a trap for this suite. A blocked or throttled image does not leave a
 * gap anyone would notice — it silently substitutes different artwork. The first baseline run hit
 * exactly that: Startseite requests about twenty photographs and only nine survived, so the
 * "prototype baseline" recorded drawn wheels where the design shows photographs, and every later
 * comparison would have been measured against artwork the design never displays.
 *
 * Unsplash also rate-limits, so which images survive changes between runs. That makes the
 * baseline itself non-deterministic, which defeats the entire method.
 *
 * ── What it does ─────────────────────────────────────────────────────────────────────────────
 *
 * The page still requests the design's exact URLs — no markup changes, `src` stays byte-identical
 * and Gate B still compares it. The request is fulfilled from `design-export/images/`, which
 * holds all 25 files downloaded from those same URLs with `MANIFEST.md` recording each mapping.
 *
 * Applied identically to both sides, so it can never be the cause of a difference.
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join('design-export', 'images')

/** The design's own URL builder, copied from `art.js` so the two cannot drift apart. */
const u = (id, w) => `https://unsplash.com/photos/${id}/download?force=true&w=${w || 1200}`

/**
 * Every remote image the design asks for, mapped to the local copy of that exact URL.
 * Taken from `PHOTO` and `LOGO` in art.js, in the same order, so the list is auditable
 * line by line against the source.
 */
export const PHOTO_FILES = {
    [u('pQ0_oAtnDqI', 2000)]: 'hero.jpg',
    [u('odmg2fspBBU', 1200)]: 'hero-mobile.jpg',
    [u('7L2-sf19x78', 1600)]: 'check-car.jpg',
    [u('ENHqkZBMTMA', 1400)]: 'lager.jpg',
    'https://images.unsplash.com/photo-1761040100208-07f603acc83f?auto=format&fit=crop&w=1400&q=80':
        'werkstatt.jpg',
    [u('l9riyueOA2k', 900)]: 'tyre.jpg',
    'https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?auto=format&fit=crop&w=1600&q=80':
        'admin-panel.jpg',
    // PHOTO.wheels — used by the product cards, which is why the cards must be photographic.
    'https://images.unsplash.com/photo-1761040100208-07f603acc83f?auto=format&fit=crop&w=900&q=80':
        'wheel-1.jpg',
    [u('zAfKgmZIbSU', 900)]: 'wheel-2.jpg',
    [u('ENHqkZBMTMA', 900)]: 'wheel-4.jpg',
    [u('m8zQivdifx8', 900)]: 'wheel-5.jpg',
    [u('pQ0_oAtnDqI', 900)]: 'wheel-6.jpg',
    // PHOTO.banners — the four brand cards.
    [u('m8zQivdifx8', 1200)]: 'banner-1.jpg',
    [u('zAfKgmZIbSU', 1200)]: 'banner-2.jpg',
    [u('l9riyueOA2k', 1200)]: 'banner-3.jpg',
    [u('ENHqkZBMTMA', 1200)]: 'banner-4.jpg',
    // LOGO — eight marques.
    'https://cdn.simpleicons.org/bmw/0E1116': 'logo-bmw.svg',
    'https://cdn.simpleicons.org/audi/0E1116': 'logo-audi.svg',
    'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg': 'logo-mercedes.svg',
    'https://cdn.simpleicons.org/volkswagen/0E1116': 'logo-vw.svg',
    'https://cdn.simpleicons.org/porsche/0E1116': 'logo-porsche.svg',
    'https://cdn.simpleicons.org/opel/0E1116': 'logo-opel.svg',
    'https://cdn.simpleicons.org/ford/0E1116': 'logo-ford.svg',
    'https://cdn.simpleicons.org/skoda/0E1116': 'logo-skoda.svg',
}

// `PHOTO.wheels[2]` and `PHOTO.tyre` are the same URL at the same width, so one key would
// otherwise overwrite the other. Stated rather than silently deduplicated.
PHOTO_FILES[u('l9riyueOA2k', 900)] = 'tyre.jpg'

const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' }

/**
 * Install the interception on a context. Call before the first navigation.
 *
 * Returns a report so a caller can assert that every file it expected was actually on disk —
 * a missing file would fall through to the network and reintroduce the very flakiness this
 * removes.
 */
export async function serveDesignPhotos(context) {
    const missing = []

    for (const [url, file] of Object.entries(PHOTO_FILES)) {
        const path = join(DIR, file)
        if (!existsSync(path)) {
            missing.push(file)
            continue
        }

        const ext = file.slice(file.lastIndexOf('.'))
        const body = readFileSync(path)

        await context.route(url, (route) =>
            route.fulfill({
                status: 200,
                contentType: TYPES[ext] ?? 'application/octet-stream',
                headers: { 'cache-control': 'public, max-age=31536000' },
                body,
            })
        )
    }

    if (missing.length) {
        throw new Error(
            `design-export/images is missing: ${missing.join(', ')}. Without them the design's ` +
                `photographs fall back to drawn art and the capture records the wrong artwork.`
        )
    }

    return { served: Object.keys(PHOTO_FILES).length }
}
