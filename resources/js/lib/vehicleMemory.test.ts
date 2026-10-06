import { beforeEach, describe, expect, it, vi } from 'vitest'

type Listener = (event: { detail: { page: { url: string } } }) => void

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

const { installVehicleMemory, namesVehicle, vehicleVisitOptions } = await import('./vehicleMemory')

const E46_LISTING = 'http://shop.test/felgen?zoll=19.0&fahrzeug=0005-Z46-00001'

/* What Inertia does on Back: the browser's popstate, then the restored page's navigation — no request. */
function back(url: string): void {
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
    listeners.navigate?.forEach((l) => l({ detail: { page: { url } } }))
}

function visit(url: string): void {
    listeners.before?.forEach((l) => l({ detail: { page: { url } } }))
    listeners.navigate?.forEach((l) => l({ detail: { page: { url } } }))
}

describe('vehicleMemory', () => {
    installVehicleMemory()
    installVehicleMemory()

    beforeEach(() => reload.mockClear())

    it('tells the server the car of a page restored by Back or Forward, once @kunde-08', () => {
        back('/felgen?zoll=19&fahrzeug=0005-Z46-00001')

        expect(reload).toHaveBeenCalledTimes(1)
        expect(reload).toHaveBeenCalledWith({ only: ['vehicle'] })
        // Registered once, however often the app starts it.
        expect(listeners.navigate).toHaveLength(1)
    })

    it('leaves a restored page that names no car, and every ordinary visit, alone @kunde-08', () => {
        back('/warenkorb')
        visit('/felgen?fahrzeug=0005-Z90-00001')

        expect(reload).not.toHaveBeenCalled()
    })

    it('reads the car from the address alone', () => {
        expect(namesVehicle('/felgen/borbet-db8gt2?ausfuehrung=7&fahrzeug=0005-Z46-00001')).toBe(true)
        expect(namesVehicle('/felgen?zoll=19')).toBe(false)
    })

    it('carries the car on screen into a visit to another of its pages — a tile, a filter, the breadcrumb @kunde-08', () => {
        const car = { fahrzeug: '0005-Z46-00001' }

        expect(vehicleVisitOptions('/felgen/borbet-db8gt2?ausfuehrung=7', { method: 'get', data: {} }, E46_LISTING)).toEqual({ data: car })
        expect(vehicleVisitOptions('/felgen', { method: 'get', data: { zoll: ['18.0'] } }, E46_LISTING)).toEqual({ data: { zoll: ['18.0'], ...car } })
        expect(vehicleVisitOptions('http://shop.test/', { data: {} }, E46_LISTING)).toEqual({ data: car })
        expect(vehicleVisitOptions('/vergleich', {}, E46_LISTING)).toEqual({ data: car })
        expect(vehicleVisitOptions('/rimify-check', { method: 'get', data: { marke: 'BMW' } }, E46_LISTING)).toEqual({ data: { marke: 'BMW', ...car } })
    })

    it('leaves a visit alone that names a car of its own, changes one, leaves the car\'s pages or starts from a page without one @kunde-08', () => {
        // Its own car, in the address or in the data: the visit's word stands.
        expect(vehicleVisitOptions('/felgen?fahrzeug=0005-Z90-00001', { method: 'get', data: {} }, E46_LISTING)).toEqual({})
        expect(vehicleVisitOptions('/felgen', { method: 'get', data: { fahrzeug: '0005-Z90-00001' } }, E46_LISTING)).toEqual({})
        // Choosing or removing a car is never a GET.
        expect(vehicleVisitOptions('/fahrzeug', { method: 'post', data: { fahrzeug: 7 } }, E46_LISTING)).toEqual({})
        expect(vehicleVisitOptions('/fahrzeug', { method: 'delete' }, E46_LISTING)).toEqual({})
        // Pages that answer for no car keep their address: the selector, the basket, the contact form, another site.
        for (const href of ['/felgen-suchen', '/warenkorb', '/kontakt?betreff=Frage', 'https://example.org/felgen']) {
            expect(vehicleVisitOptions(href, { method: 'get', data: {} }, E46_LISTING)).toEqual({})
        }
        // A page without a car in its address carries none.
        expect(vehicleVisitOptions('/felgen', { method: 'get', data: {} }, 'http://shop.test/warenkorb')).toEqual({})
        // On the server there is no page on screen.
        expect(vehicleVisitOptions('/felgen', { method: 'get', data: {} }, null)).toEqual({})
    })
})
