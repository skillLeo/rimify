/**
 * The case table.
 *
 * §1 of tests/visual/README.md names the two causes of drift, and the second one — "the same"
 * being an opinion rather than a number — starts right here. A hand-authored list of the
 * seventeen screens would make every later gate measure against an invented list. So the table
 * is DISCOVERED from `design-reference/` and never typed out: the prototype directory is the
 * enumeration, exactly as the prototype markup is the specification.
 *
 * A case is one prototype page at one viewport, plus optionally a seeded session state. The
 * thirty-four page files give thirty-four pairs; the two extra Startseite vehicle states named
 * in §7 bring it to the thirty-six of §9.
 */

import { readdirSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const REFERENCE_DIR = 'design-reference'
export const RENDERED_DIR = join('design-reference', '_rendered')
export const BASELINE_DIR = join('tests', 'visual', 'baseline')
export const SIGNATURE_DIR = join('tests', 'visual', 'signature')
export const HAR_DIR = join('tests', 'visual', 'har')

/**
 * The two viewports. These are the prototype's own two device builds, not a responsive sweep —
 * `desktop/x.html` and `mobile/x.html` are different documents, so each is captured at the width
 * it was drawn for and never at the other's.
 */
export const VIEWPORTS = {
    desktop: { dir: 'desktop', width: 1440, height: 900, isMobile: false },
    mobile: { dir: 'mobile', width: 390, height: 844, isMobile: true },
}

/**
 * Seeded session states.
 *
 * The prototype keeps its state in sessionStorage, and the header state machine reads it: no
 * vehicle gives the plain black header, a vehicle on a listing or basket page gives the white
 * box centred in the header, and a vehicle anywhere else once the listing has been seen gives
 * the blue bar above it. Those three are mutually exclusive, so a Startseite captured without a
 * vehicle proves nothing about the other two. §7 asks for Startseite at `@vehicle` for exactly
 * that reason.
 *
 * `null` means "leave sessionStorage untouched" — the prototype's own cold-start state.
 *
 * The key names are CONFIRMED against the prototype at capture time by `assertStateKeys()`
 * below rather than trusted from these literals. If `shared/app.js` calls them something else,
 * the capture fails loudly instead of seeding three keys nothing reads and silently baselining
 * the wrong header.
 */
export const STATES = {
    default: null,
    vehicle: {
        rmf_vehicle: JSON.stringify({
            hsn: '0588',
            tsn: 'AAS',
            make: 'AUDI',
            model: 'RS 4 Avant',
            variant: '2.9 TFSI quattro',
            label: 'Audi RS 4 Avant 2.9 TFSI quattro',
        }),
        rmf_seenPLP: '1',
    },
}

/** Cases that exist in addition to the one-per-page default. Keyed by page slug. */
const EXTRA_STATES = {
    startseite: ['vehicle'],
}

/**
 * §7 fixes the order of work: Startseite first at both viewports and both vehicle states, then
 * the rest of the storefront, then the admin panel. Sorting by this rank means the report
 * follows that order rather than the filesystem's alphabet.
 */
const ORDER_HINT = ['startseite']
const ADMIN_PREFIX = 'admin'

function rank(slug) {
    const explicit = ORDER_HINT.indexOf(slug)
    if (explicit !== -1) return explicit
    if (slug.startsWith(ADMIN_PREFIX)) return 900
    return 500
}

/**
 * Read the page slugs out of the prototype. Both device directories must agree: the mobile and
 * desktop designs cover exactly the same screens, so a slug present in one and missing from the
 * other is a broken copy of the prototype, not a screen that happens to be desktop-only. Fail
 * closed.
 */
export function discoverSlugs(root = REFERENCE_DIR) {
    const read = (dir) => {
        const path = join(root, dir)
        if (!existsSync(path)) {
            throw new Error(
                `design-reference/${dir}/ is missing. §2 has not been completed — copy the ` +
                    `prototype in before capturing. Do not rebuild it from a written spec.`
            )
        }
        return readdirSync(path)
            .filter((f) => f.endsWith('.html'))
            .map((f) => f.replace(/\.html$/, ''))
            .sort()
    }

    const desktop = read('desktop')
    const mobile = read('mobile')

    const onlyDesktop = desktop.filter((s) => !mobile.includes(s))
    const onlyMobile = mobile.filter((s) => !desktop.includes(s))
    if (onlyDesktop.length || onlyMobile.length) {
        throw new Error(
            'The two device builds do not contain the same screens, so the copy in §2 is ' +
                `incomplete. Only in desktop/: [${onlyDesktop.join(', ')}]. ` +
                `Only in mobile/: [${onlyMobile.join(', ')}].`
        )
    }

    return desktop
}

/**
 * The full case list. Each entry is one thing that gets a baseline PNG, a DOM signature and a
 * row in the report.
 */
export function allCases(root = REFERENCE_DIR) {
    const cases = []

    for (const slug of discoverSlugs(root)) {
        const states = ['default', ...(EXTRA_STATES[slug] ?? [])]

        for (const state of states) {
            for (const [vp, viewport] of Object.entries(VIEWPORTS)) {
                // A state variant only earns its own case where §7 asks for one; the
                // default state is the bare slug so the common case reads as `startseite`
                // rather than `startseite@default`.
                const id = state === 'default' ? slug : `${slug}@${state}`

                cases.push({
                    id,
                    slug,
                    state,
                    viewport: vp,
                    ...viewport,
                    source: join(root, viewport.dir, `${slug}.html`),
                    rendered: join(RENDERED_DIR, vp, `${id}.html`),
                    baseline: join(BASELINE_DIR, vp, `${id}.png`),
                    signature: join(SIGNATURE_DIR, vp, `${id}.json`),
                    har: join(HAR_DIR, `${id}.${vp}.har`),
                    rank: rank(slug),
                })
            }
        }
    }

    return cases.sort(
        (a, b) =>
            a.rank - b.rank ||
            a.slug.localeCompare(b.slug) ||
            a.state.localeCompare(b.state) ||
            // Desktop before mobile, matching §7's "Startseite desktop, then mobile".
            Number(a.isMobile) - Number(b.isMobile)
    )
}

/**
 * Confirm the sessionStorage key names against the prototype's own source before seeding them.
 *
 * Seeding a key nothing reads is the quietest possible failure: the page renders its cold-start
 * header, the capture succeeds, the baseline is wrong, and every later gate faithfully measures
 * the Laravel page against a state the prototype was never in. That is "confidently wrong", so
 * it fails closed instead.
 */
export function assertStateKeys(root = REFERENCE_DIR) {
    const appJs = join(root, 'shared', 'app.js')
    if (!existsSync(appJs)) {
        throw new Error(`${appJs} is missing — cannot confirm the sessionStorage key names.`)
    }

    const source = readFileSync(appJs, 'utf8')
    const used = new Set()
    for (const state of Object.values(STATES)) {
        if (state) Object.keys(state).forEach((k) => used.add(k))
    }

    const unknown = [...used].filter((key) => !source.includes(key))
    if (unknown.length) {
        throw new Error(
            `These seeded sessionStorage keys do not appear in shared/app.js: ` +
                `[${unknown.join(', ')}]. Seeding a key the prototype never reads would ` +
                `baseline the wrong header state. Read app.js and correct STATES in ` +
                `tests/visual/cases.mjs.`
        )
    }
}
