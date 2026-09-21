/**
 * Android back and browser back close an open bottom sheet instead of leaving the page.
 *
 * Opening a sheet pushes one history entry that copies the current Inertia state and adds a
 * marker. Inertia handles `popstate` in the bubble phase on `window`; this module listens in the
 * capture phase, which the DOM fires first even at the target, and swallows the event with
 * `stopImmediatePropagation()` while a sheet is open — so Inertia never sees the pop and never
 * re-renders the page. The page keeps its state; only the sheet closes.
 *
 * Closing a sheet by any other means (handle, backdrop, button) pops that entry again, so the
 * history never carries a dead entry. A navigation while a sheet is open strips the marker in
 * place instead (`stripSheetState()`), because a `history.back()` racing Inertia's own push is
 * exactly the kind of thing that cannot be made reliable.
 *
 * Bookkeeping, not the marker, decides whether an entry was pushed: Inertia rewrites the current
 * entry on every scroll (to save the position) and drops the marker with it.
 */

export const SHEET_STATE_KEY = 'rmfSheet'

interface Entry {
    id: string
    onBack: () => void
}

const stack: Entry[] = []
let pending: { id: string; resolve: () => void; timer: ReturnType<typeof setTimeout> } | null = null
let installed = false

function onPopstate(event: PopStateEvent): void {
    const top = stack[stack.length - 1]

    if (top === undefined) {
        return
    }

    // The event is ours either way: a programmatic close, or the user's back gesture.
    event.stopImmediatePropagation()
    stack.pop()

    if (pending && pending.id === top.id) {
        clearTimeout(pending.timer)
        pending.resolve()
        pending = null

        return
    }

    top.onBack()
}

function install(): void {
    if (installed || typeof window === 'undefined') {
        return
    }

    window.addEventListener('popstate', onPopstate, true)
    installed = true
}

export interface SheetHistory {
    /** Push the entry. Call when the sheet opens. */
    open(): void
    /** Pop the entry if it is ours. Resolves once the history has settled. */
    close(): Promise<void>
    /** Whether this sheet currently owns the top entry. */
    owns(): boolean
}

export function useSheetHistory(id: string, onBack: () => void): SheetHistory {
    install()

    function owns(): boolean {
        const top = stack[stack.length - 1]

        return top !== undefined && top.id === id
    }

    function open(): void {
        if (typeof window === 'undefined' || owns()) {
            return
        }

        const base = (window.history.state as Record<string, unknown> | null) ?? {}
        window.history.pushState({ ...base, [SHEET_STATE_KEY]: id }, '', window.location.href)
        stack.push({ id, onBack })
    }

    function close(): Promise<void> {
        if (typeof window === 'undefined' || !owns()) {
            return Promise.resolve()
        }

        return new Promise<void>((resolve) => {
            // If the pop never arrives (an entry rewritten by something else), the promise still
            // settles and the stack is corrected by hand.
            const timer = setTimeout(() => {
                if (pending && pending.id === id) {
                    pending = null
                    const index = stack.findIndex((e) => e.id === id)

                    if (index !== -1) {
                        stack.splice(index, 1)
                    }

                    resolve()
                }
            }, 400)

            pending = { id, resolve, timer }
            window.history.back()
        })
    }

    return { open, close, owns }
}

/** Before a navigation: forget every open sheet and remove the marker from the current entry. */
export function stripSheetState(): void {
    if (typeof window === 'undefined') {
        return
    }

    stack.length = 0

    if (pending) {
        clearTimeout(pending.timer)
        pending.resolve()
        pending = null
    }

    const state = window.history.state as Record<string, unknown> | null

    if (state && SHEET_STATE_KEY in state) {
        const { [SHEET_STATE_KEY]: _marker, ...rest } = state
        window.history.replaceState(rest, '', window.location.href)
    }
}

/** How many sheets currently own a history entry — for tests and the layout's "close all". */
export function openSheetCount(): number {
    return stack.length
}
