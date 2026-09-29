/**
 * The rail — pure rules, no DOM, so every threshold is tested (railResize.test.ts) and the layout, the
 * handle and the end-to-end specs all use the same ones.
 *
 * Two states, never one:
 *   - The intent (`RailIntent`): the width and whether this person collapsed it. Stored on the
 *     account, and changed only by a gesture — the toggle, `[`, Enter or Space on the handle, a drag,
 *     the double-click reset.
 *   - The effective rail (`effectiveRail`): what this window shows for that intent. Derived on every
 *     layout and never stored. A narrow window, a resize in the middle of a drag, a rotated tablet
 *     change only this.
 *
 * The rules:
 *   - Free between 232 and 400 px; two magnets, 260 (the default) and 320 (comfortable). A magnet
 *     catches the rail within 8 px and holds it until the pointer is more than 12 px away — distance,
 *     not time, so it feels the same at any frame rate, and the rail never flickers on and off it.
 *   - Below 200 px the drag collapses it to the 64 px icon rail — a state, not a width: the width it
 *     had is kept. Pulled out past 120 px it opens again at that width, and holds there until the
 *     pointer reaches it (so the rail does not collapse again under a pointer still at 130 px).
 *   - The content keeps 960 px of the page (the window less its scrollbar): where the stored width
 *     does not fit, the rail is shown at the widest that does; with no room even for 232 px it is
 *     collapsed by the window, and the toggle says why instead of opening.
 *   - Below 248 px the group labels switch to their short form (AdminNavigation's `short`).
 */

export const RAIL = {
    min: 232,
    max: 400,
    default: 260,
    comfortable: 320,
    /** The icon rail (--adm-rail-w-min). */
    collapsed: 64,
    collapseBelow: 200,
    expandPast: 120,
    /** A magnet catches the rail this close to it … */
    snap: 8,
    /** … and lets go only once the pointer is further away than this (hysteresis). */
    release: 12,
    shortBelow: 248,
    /** The content area's minimum: the rail collapses before the content shrinks under it. */
    contentMin: 960,
    step: 16,
    bigStep: 48,
    saveEveryMs: 1000,
    /** The keys have stopped: this long without a key down or up. Then the width is saved and said. */
    keyQuietMs: 250,
    /** No resizing below this: a forced icon rail on a tablet, the bottom bar on a phone. */
    resizableFrom: 1024,
} as const

export const MAGNETS: readonly number[] = [RAIL.default, RAIL.comfortable]

export interface RailState {
    collapsed: boolean
    /** The rail's width — while collapsed, the width it will open to. */
    width: number
    /** Opened from collapsed during this drag and waiting for the pointer to reach its width. */
    holding?: boolean
    /** Where the pointer was at the last step of this drag: opening needs it moving outward. */
    pointer?: number
    /** The width when this drag began: a drag that ends collapsed opens again at it, not at 232. */
    origin?: number
    /** The magnet holding the rail during this drag, if one is. */
    magnet?: number | null
}

/** A stored width, or the default when it is none: whole pixels, inside the range. */
export function clampWidth(raw: unknown): number {
    return typeof raw === 'number' && Number.isInteger(raw) && raw >= RAIL.min && raw <= RAIL.max ? raw : RAIL.default
}

/**
 * The width the rail and the content share: the window less its scrollbar. (The layout measures it
 * directly; this is the rule its measurement follows, so it can be tested with a scrollbar — which
 * a headless browser never draws.)
 */
export function pageWidth(windowWidth: number, scrollbar: number): number {
    return windowWidth - scrollbar
}

/** The widest the rail may be on a page this wide, leaving the content its 960 px (at most 400). */
export function maxFit(page: number): number {
    return Math.min(RAIL.max, page - RAIL.contentMin)
}

/** The width a stored width is shown at on a page this wide: its own, or the widest that fits. */
export function fitWidth(width: number, page: number): number {
    return Math.max(RAIL.min, Math.min(width, maxFit(page)))
}

/** What this person chose: stored on the account, changed only by a gesture. */
export interface RailIntent {
    collapsed: boolean
    width: number
}

/** What this window shows for an intent. Derived, never stored. */
export interface RailEffective {
    collapsed: boolean
    /** The width shown (while collapsed, the width it opens to). */
    width: number
    /** Collapsed by the window: no room for even 232 px beside the content. */
    forced: boolean
    /** Shown narrower than the stored width, because the stored one does not fit. */
    clamped: boolean
    /** The widest this page allows. */
    max: number
}

/**
 * The rail this window shows for an intent. `page` is null where nothing is known or nothing is
 * resized — on the server, and below 1024 px, where the stylesheet decides — and the intent is then
 * shown as it is.
 */
export function effectiveRail(intent: RailIntent, page: number | null): RailEffective {
    if (page === null) {
        return { collapsed: intent.collapsed, width: intent.width, forced: false, clamped: false, max: RAIL.max }
    }

    const max = maxFit(page)

    if (max < RAIL.min) {
        return { collapsed: true, width: intent.width, forced: true, clamped: false, max: RAIL.min }
    }

    const width = fitWidth(intent.width, page)

    return { collapsed: intent.collapsed, width, forced: false, clamped: width < intent.width, max }
}

/**
 * The toggle — the one function the toggle button, `[`, and Enter or Space on the handle all call.
 * It flips whether the person collapsed it and keeps their width (opened on a narrow page, it shows
 * at the widest that fits). Null where the window collapsed it: there is nothing to open, and
 * nothing may be stored.
 */
export function toggleIntent(intent: RailIntent, page: number | null): RailIntent | null {
    return effectiveRail(intent, page).forced ? null : { collapsed: !intent.collapsed, width: intent.width }
}

/** What the toggle's tooltip says when it will do less than its name: why, and what it will do. */
export function toggleHint(intent: RailIntent, page: number | null): string | null {
    const shown = effectiveRail(intent, page)

    if (shown.forced) {
        return 'Fenster zu schmal für die Seitenleiste'
    }

    return intent.collapsed && shown.clamped ? `Fenster zu schmal für ${intent.width} px, öffnet mit ${shown.width} px` : null
}

/**
 * The revision of a save: the clock, and never below the last one plus one, so it only grows — the
 * server drops a save older than the one it holds (AdminUser::rememberRail).
 */
export function nextRev(last: number, now: number): number {
    return Math.max(Math.floor(now), last + 1)
}

/**
 * Where the rail goes for a pointer `desired` px from its left edge. On a page with no room for the
 * rail at all nothing moves: that collapse is the window's, not the pointer's.
 */
export function dragTo(desired: number, state: RailState, viewport = Number.POSITIVE_INFINITY): RailState {
    const room = maxFit(viewport)

    if (room < RAIL.min) {
        return state
    }

    const pointer = desired
    const origin = state.origin

    if (state.collapsed) {
        // Dragged out past 120 px it opens — at the width it had, or as wide as the window allows. Out,
        // not merely beyond: a rail that just collapsed under a pointer still moving in (at 150 px,
        // say) stays collapsed.
        const outward = state.pointer === undefined || desired > state.pointer

        if (outward && desired > RAIL.expandPast) {
            const width = fitWidth(state.width, viewport)

            return { collapsed: false, width, holding: desired < width, pointer, origin, magnet: null }
        }

        return { collapsed: true, width: state.width, holding: false, pointer, origin, magnet: null }
    }

    if (state.holding) {
        if (desired < RAIL.expandPast) {
            return { collapsed: true, width: state.width, holding: false, pointer, origin, magnet: null }
        }

        if (desired < state.width) {
            return { collapsed: false, width: state.width, holding: true, pointer, origin, magnet: null }
        }
    }

    // Collapsed on the way in: the width to open to again is the one this drag started from — the
    // rail shrank to 232 on its way here, and that is not the width anybody chose.
    if (desired < RAIL.collapseBelow) {
        return { collapsed: true, width: origin ?? state.width, holding: false, pointer, origin, magnet: null }
    }

    const width = Math.round(Math.min(room, Math.max(RAIL.min, desired)))

    // Held by a magnet: it stays there until the pointer is more than 12 px away …
    const held = state.magnet ?? null

    if (held !== null && held <= room && Math.abs(width - held) <= RAIL.release) {
        return { collapsed: false, width: held, holding: false, pointer, origin, magnet: held }
    }

    // … and a magnet catches it within 8 px.
    for (const magnet of MAGNETS) {
        if (magnet <= room && Math.abs(width - magnet) <= RAIL.snap) {
            return { collapsed: false, width: magnet, holding: false, pointer, origin, magnet }
        }
    }

    return { collapsed: false, width, holding: false, pointer, origin, magnet: null }
}

/**
 * The rail after a key on its handle, or null for a key the handle does not use. Arrows move it 16 px
 * (Shift: 48), Home is the default, End the widest the window allows, Enter and Space collapse and
 * open it. A key never collapses by width: only Enter and Space do. In a window with no room for the
 * rail at all no key does anything — that collapse is the window's.
 */
export function keyTo(key: string, shift: boolean, state: RailState, viewport = Number.POSITIVE_INFINITY): RailState | null {
    const room = maxFit(viewport)
    const step = shift ? RAIL.bigStep : RAIL.step

    if (room < RAIL.min) {
        return null
    }

    if (key === 'Enter' || key === ' ') {
        return state.collapsed ? { collapsed: false, width: fitWidth(state.width, viewport) } : { collapsed: true, width: state.width }
    }

    const within = (width: number): number => Math.max(RAIL.min, Math.min(room, width))

    switch (key) {
        case 'ArrowRight':
            return state.collapsed ? { collapsed: false, width: fitWidth(state.width, viewport) } : { collapsed: false, width: within(state.width + step) }
        case 'ArrowLeft':
            return state.collapsed ? null : { collapsed: false, width: within(state.width - step) }
        case 'Home':
            return { collapsed: false, width: within(RAIL.default) }
        case 'End':
            return { collapsed: false, width: within(RAIL.max) }
        default:
            return null
    }
}

/** Below 248 px the group labels take their short form — a word of its own, never cut mid-word. */
export function labelMode(width: number): 'short' | 'full' {
    return width < RAIL.shortBelow ? 'short' : 'full'
}

/** What a screen reader hears once the rail stops moving: the result, not the pixels on the way. */
export function railSentence(state: RailState): string {
    return state.collapsed ? 'Seitenleiste eingeklappt' : `Seitenleiste ${state.width} Pixel breit`
}
