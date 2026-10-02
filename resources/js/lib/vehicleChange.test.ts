import { describe, expect, it, vi } from 'vitest'

vi.mock('@inertiajs/vue3', () => ({ usePage: () => ({ props: {}, url: '/' }) }))

const { vehicleChangeHref } = await import('./vehicleChange')

/*
 * „Fahrzeug ändern“ from the shell (CHECK-16): the selector page everywhere, but on the RIMIFY-Check the question's own
 * selector, opened in place with the wheel kept — the car chosen then answers the question instead of opening the list.
 */
describe('vehicleChangeHref', () => {
    it('leads to the selector page from every page but the RIMIFY-Check', () => {
        expect(vehicleChangeHref('felgen.show', '/felgen/borbet-db8gt2?ausfuehrung=3')).toBe('/felgen-suchen')
        expect(vehicleChangeHref(null, '/')).toBe('/felgen-suchen')
    })

    it('opens the check page’s own selector, the wheel kept, the car and its drill dropped', () => {
        expect(vehicleChangeHref('check.index', '/rimify-check?hersteller=borbet&felge=borbet-db8gt2&groesse=110&fahrzeug=127&marke=BMW')).toBe(
            '/rimify-check?hersteller=borbet&felge=borbet-db8gt2&groesse=110&aendern=1'
        )
        expect(vehicleChangeHref('check.index', '/rimify-check')).toBe('/rimify-check?aendern=1')
        expect(vehicleChangeHref('check.index', undefined)).toBe('/rimify-check?aendern=1')
    })
})
