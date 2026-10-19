import { beforeEach, describe, expect, it, vi } from 'vitest'

type Detail = { page?: { url: string; props?: Record<string, unknown> }; visit?: { prefetch: boolean } }
type Listener = (event: { detail: Detail }) => void

const listeners: Record<string, Listener[]> = {}
const reload = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    router: {
        on: (event: string, cb: Listener) => {
            ;(listeners[event] ??= []).push(cb)

            return () => undefined
        },
        reload: (...args: unknown[]) => reload(...args),
    },
}))

const { installRestoredPages } = await import('./restoredPages')

/* What Inertia does on Back: the browser's popstate, then the restored page's navigation — no request. */
function back(url: string, props?: Record<string, unknown>): void {
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
    listeners.navigate?.forEach((l) => l({ detail: { page: { url, ...(props ? { props } : {}) } } }))
}

/** The partial reload's answer, as Inertia hands it to `onSuccess`. */
function answer(props: Record<string, unknown>): void {
    const options = reload.mock.calls.at(-1)?.[0] as { onSuccess?: (page: { props: Record<string, unknown> }) => void }

    options.onSuccess?.({ props })
}

function visit(url: string, props?: Record<string, unknown>): void {
    listeners.before?.forEach((l) => l({ detail: { visit: { prefetch: false } } }))
    listeners.navigate?.forEach((l) => l({ detail: { page: { url, ...(props ? { props } : {}) } } }))
}

/** The back/forward cache bringing the page back whole (`persisted`), or a page loaded the ordinary way. */
function pageshow(persisted: boolean): void {
    const event = new Event('pageshow')
    Object.defineProperty(event, 'persisted', { value: persisted })
    window.dispatchEvent(event)
}

describe('restoredPages', () => {
    installRestoredPages()
    installRestoredPages()

    beforeEach(() => reload.mockClear())

    it('tells the server the car of a page restored by Back or Forward, once @kunde-08', () => {
        back('/felgen?zoll=19&fahrzeug=0005-Z46-00001')

        expect(reload).toHaveBeenCalledTimes(1)
        expect(reload).toHaveBeenCalledWith(expect.objectContaining({ only: ['vehicle'] }))
        // Registered once, however often the app starts it.
        expect(listeners.navigate).toHaveLength(1)
    })

    // The interaction review of D-286: figures entered on another page, then Back — the restored page carried the answers
    // of the figures before. Asked again whole where what they rest on changed; left as it is where it did not.
    it('asks a restored page again whole where the car’s papers or build changed while it lay in history', () => {
        const car = { id: 127, papers: null, build: null }

        back('/felgen', { vehicle: car })
        expect(reload).toHaveBeenCalledWith(expect.objectContaining({ only: ['vehicle'] }))

        answer({ vehicle: { ...car, papers: { axleFrontKg: 1130, axleRearKg: 1240, topSpeedKmh: 198 } } })
        expect(reload).toHaveBeenCalledTimes(2)
        expect(reload.mock.calls[1]).toEqual([])

        reload.mockClear()
        back('/felgen', { vehicle: car })
        answer({ vehicle: car })
        expect(reload).toHaveBeenCalledTimes(1)
    })

    it('leaves a restored page that names no car and carries no catalogue, and every ordinary visit, alone @kunde-08', () => {
        back('/warenkorb')
        visit('/felgen?fahrzeug=0005-Z90-00001', { catalogue: 'k1' })

        expect(reload).not.toHaveBeenCalled()
    })

    // His admin item 16: a Gutachten corrected or a wheel published while the page lay in history — the page brought back
    // must not show what the catalogue said before.
    it('asks a restored page again whole where the catalogue moved on while it lay in history @admin-216', () => {
        back('/felgen/borbet-db8gt2', { catalogue: 'k1' })
        expect(reload).toHaveBeenCalledWith(expect.objectContaining({ only: ['catalogue'] }))

        answer({ catalogue: 'k2' })
        expect(reload).toHaveBeenCalledTimes(2)
        expect(reload.mock.calls[1]).toEqual([])

        // Nothing moved on: the one small question, and the page stays as it is.
        reload.mockClear()
        back('/felgen/borbet-db8gt2', { catalogue: 'k2' })
        answer({ catalogue: 'k2' })
        expect(reload).toHaveBeenCalledTimes(1)
    })

    it('asks for the car and the catalogue in one request, and again whole where either moved on @admin-216', () => {
        const car = { id: 127, papers: null, build: null }

        back('/felgen?fahrzeug=0005-Z46-00001', { vehicle: car, catalogue: 'k1' })
        expect(reload).toHaveBeenCalledTimes(1)
        expect(reload).toHaveBeenCalledWith(expect.objectContaining({ only: ['vehicle', 'catalogue'] }))

        answer({ vehicle: car, catalogue: 'k2' })
        expect(reload).toHaveBeenCalledTimes(2)
    })

    // BELL-02: the answer to this reload is a page from the server, and the bell takes its count as the freshest — so an
    // admin page asks for its shell too, or the bell would fall back to the count the page was left with.
    it('asks a restored admin page for its shell as well, so the bell and the rail count afresh @admin-216', () => {
        back('/admin/felgen', { catalogue: 'k1', admin: { notifications: { unread: 3 } } })

        expect(reload).toHaveBeenCalledWith(expect.objectContaining({ only: ['catalogue', 'admin'] }))
    })

    it('checks a page the back/forward cache brought back whole, and none loaded the ordinary way @admin-216', () => {
        window.history.replaceState({ page: { url: '/felgen', props: { catalogue: 'k1' } } }, '')

        pageshow(false)
        expect(reload).not.toHaveBeenCalled()

        pageshow(true)
        expect(reload).toHaveBeenCalledWith(expect.objectContaining({ only: ['catalogue'] }))
        answer({ catalogue: 'k2' })
        expect(reload).toHaveBeenCalledTimes(2)
    })

    it('keeps the check of a restored page while a link is fetched ahead under the pointer', () => {
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
        listeners.before?.forEach((l) => l({ detail: { visit: { prefetch: true } } }))
        listeners.navigate?.forEach((l) => l({ detail: { page: { url: '/felgen', props: { catalogue: 'k1' } } } }))

        expect(reload).toHaveBeenCalledTimes(1)
    })
})
