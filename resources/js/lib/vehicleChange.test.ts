import { describe, expect, it, vi } from 'vitest'

const destroyed = vi.hoisted(() => [] as unknown[][])
const here = vi.hoisted(() => ({ url: '/', routeName: null as string | null }))

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: { routeName: here.routeName }, url: here.url }),
    router: { delete: (...args: unknown[]) => destroyed.push(args) },
}))

const { useRemoveVehicle, useVehicleChooseHref, vehicleChangeHref } = await import('./vehicleChange')

/*
 * „Fahrzeug ändern“ from the shell (CHECK-16): the selector page everywhere, but on the RIMIFY-Check the question's own
 * selector, opened in place with the wheel kept — the car chosen then answers the question instead of opening the list.
 */
describe('vehicleChangeHref', () => {
    it('leads to the selector page from the pages that ask for no car', () => {
        expect(vehicleChangeHref('felgen.index', '/felgen?fahrzeug=127')).toBe('/felgen-suchen')
        expect(vehicleChangeHref(null, '/')).toBe('/felgen-suchen')
    })

    // The hint on the product page promises the versions of this wheel for the car: the car chosen brings the visitor back to them.
    it('leads back to the wheel and the version from the product page and the Komplettrad’s steps, the old car and the fragment dropped', () => {
        expect(vehicleChangeHref('felgen.show', '/felgen/borbet-db8gt2?ausfuehrung=3&groesse=5&fahrzeug=0005-Z46-00001#groessen')).toBe(
            `/felgen-suchen?zurueck=${encodeURIComponent('/felgen/borbet-db8gt2?ausfuehrung=3&groesse=5')}`
        )
        expect(vehicleChangeHref('komplettrad.show', '/komplettraeder?groesse=5&schritt=2')).toBe(`/felgen-suchen?zurueck=${encodeURIComponent('/komplettraeder?groesse=5&schritt=2')}`)
    })

    it('opens the check page’s own selector, the wheel kept, the car and its drill dropped', () => {
        expect(vehicleChangeHref('check.index', '/rimify-check?hersteller=borbet&felge=borbet-db8gt2&groesse=110&fahrzeug=127&marke=BMW')).toBe(
            '/rimify-check?hersteller=borbet&felge=borbet-db8gt2&groesse=110&aendern=1'
        )
        expect(vehicleChangeHref('check.index', '/rimify-check')).toBe('/rimify-check?aendern=1')
        expect(vehicleChangeHref('check.index', undefined)).toBe('/rimify-check?aendern=1')
    })

    it('offers the way back from the shell’s „Fahrzeug wählen“ too, and the plain selector everywhere else, the RIMIFY-Check included', () => {
        here.routeName = 'felgen.show'
        here.url = '/felgen/borbet-db8gt2?groesse=5'
        expect(useVehicleChooseHref().value).toBe(`/felgen-suchen?zurueck=${encodeURIComponent('/felgen/borbet-db8gt2?groesse=5')}`)

        here.routeName = 'check.index'
        here.url = '/rimify-check?felge=x'
        expect(useVehicleChooseHref().value).toBe('/felgen-suchen')
    })

    it('stays on the wheel when the car is removed there, and asks nothing new of the other pages', () => {
        here.routeName = 'felgen.show'
        here.url = '/felgen/borbet-db8gt2?groesse=5&fahrzeug=0005-Z46-00001'
        useRemoveVehicle()()

        expect(destroyed.at(-1)).toEqual(['/fahrzeug', { preserveScroll: true, data: { zurueck: '/felgen/borbet-db8gt2?groesse=5' } }])

        here.routeName = 'felgen.index'
        here.url = '/felgen'
        useRemoveVehicle()()

        expect(destroyed.at(-1)).toEqual(['/fahrzeug', { preserveScroll: true }])
    })
})
