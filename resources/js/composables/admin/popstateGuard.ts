/**
 * One listener for the browser's Back and Forward that runs before Inertia's.
 *
 * Inertia restores the previous page on `popstate` from a listener it adds when the app starts, and
 * at the window the browser calls listeners in the order they were added — the capture flag does
 * not put a later one first. A form that must ask before its changes are lost (useDirtyForm) could
 * therefore never stop the restore on its own. This listener is added in app.ts before the app
 * starts; while a form holds changes it claims the guard, and a `true` from it swallows the event,
 * so Inertia never swaps the page.
 */

type Guard = (event: PopStateEvent) => boolean

let guard: Guard | null = null
let installed = false

export function installPopstateGuard(): void {
    if (installed || typeof window === 'undefined') {
        return
    }

    window.addEventListener(
        'popstate',
        (event) => {
            if (guard?.(event)) {
                event.stopImmediatePropagation()
            }
        },
        true
    )
    installed = true
}

/** Claims the guard; the returned function releases it, if it is still this one's. */
export function claimPopstateGuard(next: Guard): () => void {
    installPopstateGuard()
    guard = next

    return () => {
        if (guard === next) {
            guard = null
        }
    }
}
