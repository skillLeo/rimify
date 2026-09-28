/**
 * Focus that lands (K2-03, K2-04, K2-05).
 *
 * The admin kept losing the keyboard to `<body>` for one reason in several disguises: it moved the focus
 * *before* the page had settled — onto a button still disabled for the round trip, into a form while a
 * closing menu's focus trap still held the focus, onto a row the answer then removed, or from a component
 * the answer then re-created (a visit without `preserveState` mounts the page anew). `focus()` on any of
 * those does nothing, and nothing tried again.
 *
 * So a caller no longer focuses; it *requests*: it names the controls that should have the focus, best
 * first — by element id, or by `data-focus` for a control whose id is not its own (reka's menu triggers
 * set their own). Each frame, until one is usable — connected, shown, enabled — and the focus has stayed
 * on it, the request looks again. A newer request replaces an older one; one that finds nothing within
 * two seconds gives up rather than jumping late. The request lives outside any component, so the page
 * being mounted anew does not lose it. While it waits, a closing menu is told not to hand the focus back
 * to its trigger (`onMenuClose`, bound to DropdownMenuContent's `close-auto-focus`), so the two never race.
 */

/** An element's id or `data-focus` key, or a function that finds the element at the moment it is asked. */
export type FocusTarget = string | (() => HTMLElement | null)

export interface FocusRequest {
    /** Bring the control into view (it may be screens away from where the person was). */
    scroll?: boolean
}

/** How long a request waits for its control: long enough for a slow round trip, short enough never to jump late. */
const MAX_WAIT_MS = 2000

let frame = 0
let pending: { targets: FocusTarget[]; options: FocusRequest; started: number } | null = null

/** The element a target names: its id, else the element that carries it as `data-focus`. */
export function resolveTarget(target: FocusTarget): HTMLElement | null {
    if (typeof target !== 'string') {
        return target()
    }

    return document.getElementById(target) ?? document.querySelector<HTMLElement>(`[data-focus="${CSS.escape(target)}"]`)
}

/** Whether the keyboard can actually be put on the element now. */
export function usable(element: HTMLElement | null): element is HTMLElement {
    if (element === null || !element.isConnected) {
        return false
    }

    if ((element as HTMLButtonElement).disabled === true || element.getAttribute('aria-disabled') === 'true') {
        return false
    }

    return element.getClientRects().length > 0
}

function cancel(): void {
    if (frame !== 0) {
        cancelAnimationFrame(frame)
        frame = 0
    }

    pending = null
}

function attempt(): boolean {
    if (pending === null) {
        return true
    }

    const element = pending.targets.map(resolveTarget).find(usable)

    if (element === undefined) {
        return false
    }

    element.focus({ preventScroll: true })

    // A menu's focus trap that is still closing takes the focus straight back: not landed yet.
    if (document.activeElement !== element) {
        return false
    }

    if (pending.options.scroll) {
        // A jump to another part of the page, asked for by the person: at once, not a long glide.
        element.scrollIntoView({ block: 'center', behavior: 'auto' })
    }

    pending = null

    return true
}

function tick(): void {
    frame = 0

    if (pending === null) {
        return
    }

    // Measured in time, not frames: how often frames come differs by browser, tab and test runner.
    if (attempt() || performance.now() - pending.started >= MAX_WAIT_MS) {
        pending = null

        return
    }

    frame = requestAnimationFrame(tick)
}

/**
 * Give the focus to the first usable target once the page has settled.
 *
 * @param targets best first; the first one that exists, is shown and is enabled wins
 */
function request(targets: FocusTarget | FocusTarget[], options: FocusRequest = {}): void {
    cancel()
    pending = { targets: Array.isArray(targets) ? targets : [targets], options, started: performance.now() }
    frame = requestAnimationFrame(tick)
}

/** For DropdownMenuContent's `close-auto-focus`: a waiting request keeps the menu from taking the focus back. */
function onMenuClose(event: Event): void {
    if (pending !== null) {
        event.preventDefault()
    }
}

export function useFocusAfter() {
    return { request, onMenuClose, cancel }
}
