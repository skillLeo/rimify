import { beforeEach, describe, expect, it, vi } from 'vitest'

type Listener = (event: { detail: { visit: Record<string, unknown> } }) => void

const listeners: Record<string, Listener[]> = {}
const visit = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    router: {
        on: (event: string, cb: Listener) => {
            ;(listeners[event] ??= []).push(cb)

            return () => {
                listeners[event] = (listeners[event] ?? []).filter((l) => l !== cb)
            }
        },
        visit: (...args: unknown[]) => visit(...args),
    },
}))

const { goBack, installNavigationDirection, markNext, navigationDepth } = await import('./useNavigationDirection')

function fire(event: string, detail: { visit: Record<string, unknown> }): void {
    for (const l of listeners[event] ?? []) {
        l({ detail })
    }
}

function plainVisit(): Record<string, unknown> {
    return { method: 'get', async: false, prefetch: false, only: [], except: [], viewTransition: false }
}

describe('useNavigationDirection', () => {
    let teardown: () => void

    beforeEach(() => {
        sessionStorage.clear()
        delete document.documentElement.dataset.nav
        visit.mockReset()
        for (const key of Object.keys(listeners)) {
            delete listeners[key]
        }
        window.matchMedia = ((query: string) => ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined })) as unknown as typeof window.matchMedia
        teardown = installNavigationDirection()
    })

    it('marks a plain GET visit as forward and asks Inertia for a view transition', () => {
        const v = plainVisit()
        fire('before', { visit: v })

        expect(document.documentElement.dataset.nav).toBe('forward')
        expect(v.viewTransition).toBe('startViewTransition' in document)
        teardown()
    })

    it('uses the direction announced for the next visit once', () => {
        markNext('tab')
        fire('before', { visit: plainVisit() })
        expect(document.documentElement.dataset.nav).toBe('tab')

        fire('before', { visit: plainVisit() })
        expect(document.documentElement.dataset.nav).toBe('forward')
        teardown()
    })

    it('leaves partial reloads and prefetches alone', () => {
        const partial: Record<string, unknown> = { ...plainVisit(), only: ['popular'] }
        fire('before', { visit: partial })
        expect(partial.viewTransition).toBe(false)
        expect(document.documentElement.dataset.nav).toBeUndefined()

        const prefetch: Record<string, unknown> = { ...plainVisit(), prefetch: true }
        fire('before', { visit: prefetch })
        expect(prefetch.viewTransition).toBe(false)
        teardown()
    })

    it('counts depth up on navigate and down on a pop, and marks the pop as back', () => {
        fire('navigate', { visit: {} })
        fire('navigate', { visit: {} })
        expect(navigationDepth()).toBe(2)

        window.dispatchEvent(new PopStateEvent('popstate', { state: null }))
        expect(document.documentElement.dataset.nav).toBe('back')
        fire('navigate', { visit: {} })
        expect(navigationDepth()).toBe(1)
        teardown()
    })

    it('goBack falls back to the route when the session has no history', () => {
        goBack('/felgen')

        expect(visit).toHaveBeenCalledWith('/felgen')
        teardown()
    })
})
