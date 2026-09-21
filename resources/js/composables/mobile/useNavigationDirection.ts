/**
 * Which way a navigation goes, decided before Inertia swaps the page, so the view transition
 * can slide the right way.
 *
 *   forward  a drill-down: the new screen slides in from the right, the old one shifts left
 *   tab      a bottom-bar switch: a short cross-fade, no sliding
 *   back     never animated — the platform already animates the swipe-back gesture
 *
 * The direction lands on `<html data-nav="…">`, the CSS in MobileLayout keys on it, and Inertia
 * is asked for a view transition on every plain GET visit (`visit.viewTransition` is mutable in
 * the `before` event). Popstate visits never get one: Inertia restores those quietly.
 *
 * The same module keeps a depth counter, so a back arrow knows whether there is anything to go
 * back to inside this session. `history.length` cannot say that.
 */

import { router } from '@inertiajs/vue3'

export type NavDirection = 'forward' | 'back' | 'tab'

const DEPTH_KEY = 'rmf.nav.depth'

let pendingDirection: NavDirection | null = null
let popped = false
let installed = false

function readDepth(): number {
    try {
        return Number(sessionStorage.getItem(DEPTH_KEY) ?? '0') || 0
    } catch {
        return 0
    }
}

function writeDepth(value: number): void {
    try {
        sessionStorage.setItem(DEPTH_KEY, String(Math.max(0, value)))
    } catch {
        // Storage blocked: the arrow then always falls back to its href, which is still correct.
    }
}

function reducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Announce the direction of the very next visit (the tab bar calls this before it navigates). */
export function markNext(direction: NavDirection): void {
    pendingDirection = direction
}

function setDirection(direction: NavDirection): void {
    document.documentElement.dataset.nav = direction
}

interface BeforeVisit {
    method: string
    async: boolean
    prefetch: boolean
    only: string[]
    except: string[]
    viewTransition: boolean | ((transition: unknown) => void)
}

/** Installed once by the mobile layout. Returns the teardown. */
export function installNavigationDirection(): () => void {
    if (installed || typeof window === 'undefined') {
        return () => undefined
    }

    installed = true

    const onPop = (): void => {
        popped = true
        setDirection('back')
    }

    window.addEventListener('popstate', onPop)

    const offBefore = router.on('before', (event) => {
        const visit = event.detail.visit as unknown as BeforeVisit

        if (visit.prefetch || visit.async || visit.method !== 'get' || visit.only.length > 0 || visit.except.length > 0) {
            return
        }

        const direction = pendingDirection ?? 'forward'
        pendingDirection = null
        setDirection(direction)

        if (!reducedMotion() && 'startViewTransition' in document) {
            visit.viewTransition = true
        }
    })

    const offNavigate = router.on('navigate', () => {
        if (popped) {
            popped = false
            writeDepth(readDepth() - 1)

            return
        }

        writeDepth(readDepth() + 1)
    })

    return () => {
        window.removeEventListener('popstate', onPop)
        offBefore()
        offNavigate()
        installed = false
    }
}

/**
 * The back arrow: history when this session has some, the fallback route when it has none (a
 * deep link, an installed app opened on an inner page).
 */
export function goBack(fallback: string): void {
    if (typeof window === 'undefined') {
        return
    }

    if (readDepth() > 0 && window.history.length > 1) {
        window.history.back()

        return
    }

    markNext('back')
    router.visit(fallback)
}

/** For tests. */
export function navigationDepth(): number {
    return readDepth()
}
