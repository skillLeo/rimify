/**
 * The rail's width, as a drag or a key moves it — pure rules, no DOM, so every threshold is tested
 * (railResize.test.ts) and the handle only feeds pointer positions and keys in.
 *
 *   - Free between 232 and 400 px; two magnets, 260 (the default) and 320 (comfortable), that catch
 *     the rail within 8 px of them.
 *   - Below 200 px the drag collapses it to the 64 px icon rail — a state, not a width: the width it
 *     had is kept. Pulled out past 120 px it opens again at that width, and holds there until the
 *     pointer reaches it (so the rail does not collapse again under a pointer still at 130 px).
 *   - The content keeps 960 px: in a window without room for the rail at a width, the rail may not
 *     be that wide — and with no room even for 232 px, it stays collapsed.
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
    snap: 8,
    /** How long a snap holds the rail still, so the snap is felt rather than seen. */
    snapHoldMs: 6,
    shortBelow: 248,
    /** The content area's minimum: the rail collapses before the content shrinks under it. */
    contentMin: 960,
    step: 16,
    bigStep: 48,
    saveEveryMs: 1000,
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
}

export interface RailStep extends RailState {
    /** The magnet the rail just caught, if it did. */
    snapped: number | null
}

/** A stored width, or the default when it is none: whole pixels, inside the range. */
export function clampWidth(raw: unknown): number {
    return typeof raw === 'number' && Number.isInteger(raw) && raw >= RAIL.min && raw <= RAIL.max ? raw : RAIL.default
}

/** The widest the rail may be in this window, leaving the content its 960 px. */
export function roomFor(viewport: number): number {
    return Math.min(RAIL.max, viewport - RAIL.contentMin)
}

/** Whether a window has room for the rail at this width beside the content's 960 px. */
export function fits(width: number, viewport: number): boolean {
    return viewport - width >= RAIL.contentMin
}

/** The width the rail can open to in this window: its own, or as much as there is room for. */
function openAt(width: number, viewport: number): number {
    return Math.max(RAIL.min, Math.min(width, roomFor(viewport)))
}

/**
 * Where the rail goes for a pointer `desired` px from its left edge.
 */
export function dragTo(desired: number, state: RailState, viewport = Number.POSITIVE_INFINITY): RailStep {
    const room = roomFor(viewport)

    const pointer = desired

    if (state.collapsed) {
        // Dragged out past 120 px it opens — at the width it had, if the window has room for the rail
        // at all. Out, not merely beyond: a rail that just collapsed under a pointer still moving in
        // (at 150 px, say) stays collapsed.
        const outward = state.pointer === undefined || desired > state.pointer

        if (outward && desired > RAIL.expandPast && room >= RAIL.min) {
            const width = openAt(state.width, viewport)

            return { collapsed: false, width, holding: desired < width, pointer, origin: state.origin, snapped: null }
        }

        return { collapsed: true, width: state.width, holding: false, pointer, origin: state.origin, snapped: null }
    }

    if (state.holding) {
        if (desired < RAIL.expandPast) {
            return { collapsed: true, width: state.width, holding: false, pointer, origin: state.origin, snapped: null }
        }

        if (desired < state.width) {
            return { collapsed: false, width: state.width, holding: true, pointer, origin: state.origin, snapped: null }
        }
    }

    // Collapsed on the way in: the width to open to again is the one this drag started from — the
    // rail shrank to 232 on its way here, and that is not the width anybody chose.
    if (desired < RAIL.collapseBelow || room < RAIL.min) {
        return { collapsed: true, width: state.origin ?? state.width, holding: false, pointer, origin: state.origin, snapped: null }
    }

    const width = Math.round(Math.min(room, Math.max(RAIL.min, desired)))

    for (const magnet of MAGNETS) {
        if (magnet <= room && Math.abs(width - magnet) <= RAIL.snap) {
            return { collapsed: false, width: magnet, holding: false, pointer, origin: state.origin, snapped: magnet }
        }
    }

    return { collapsed: false, width, holding: false, pointer, origin: state.origin, snapped: null }
}

/**
 * The rail after a key on its handle, or null for a key the handle does not use. Arrows move it 16 px
 * (Shift: 48), Home is the default, End the widest the window allows, Enter and Space collapse and
 * open it. A key never collapses by width: only Enter and Space do.
 */
export function keyTo(key: string, shift: boolean, state: RailState, viewport = Number.POSITIVE_INFINITY): RailState | null {
    const room = roomFor(viewport)
    const step = shift ? RAIL.bigStep : RAIL.step

    if (key === 'Enter' || key === ' ') {
        return state.collapsed && room >= RAIL.min ? { collapsed: false, width: openAt(state.width, viewport) } : { collapsed: true, width: state.width }
    }

    if (room < RAIL.min) {
        return null
    }

    const within = (width: number): number => Math.max(RAIL.min, Math.min(room, width))

    switch (key) {
        case 'ArrowRight':
            return state.collapsed ? { collapsed: false, width: openAt(state.width, viewport) } : { collapsed: false, width: within(state.width + step) }
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
