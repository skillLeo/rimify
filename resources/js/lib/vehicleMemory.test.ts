import { describe, expect, it } from 'vitest'
import { namesVehicle, vehicleVisitOptions } from './vehicleMemory'

const E46_LISTING = 'http://shop.test/felgen?zoll=19.0&fahrzeug=0005-Z46-00001'

// What Back and Forward do with the car: restoredPages.test.ts.
describe('vehicleMemory', () => {
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
