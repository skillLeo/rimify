import { describe, expect, it } from 'vitest'
import { afterBrand, composedTitle, shopTitle, titleDiverges } from './wheelTitle'

/*
 * His admin items 5, 6 and 13 (D-298): a wheel's name in the shop is the brand, the model and the Radtypenbezeichnung —
 * the same rule as App\Support\WheelTitle, for the admin's preview while typing.
 */
describe('the title in the shop', () => {
    it('composes brand, model and Radtypenbezeichnung @admin-205 @admin-206 @admin-213', () => {
        expect(composedTitle('BORBET', 'Havanna', 'HA 8018')).toBe('BORBET Havanna HA 8018')
        expect(composedTitle('BORBET', ' Havanna ', '')).toBe('BORBET Havanna')
    })

    it('never says the designation twice where the model already holds it @admin-206', () => {
        expect(composedTitle('MOTEC', 'MCR4 Ultimate', 'mcr4')).toBe('MOTEC MCR4 Ultimate')
    })

    it('reads a typed title as what follows the brand: the brand always leads @admin-213', () => {
        expect(afterBrand('BORBET', 'BORBET Havanna Black')).toBe('Havanna Black')
        expect(afterBrand('BORBET', 'borbet  Havanna Black')).toBe('Havanna Black')
        expect(afterBrand('BORBET', 'BORBETT Havanna')).toBe('BORBETT Havanna')
        expect(shopTitle('BORBET', 'Havanna', 'HA 8018', 'Havanna Black Edition')).toBe('BORBET Havanna Black Edition')
        expect(shopTitle('BORBET', 'Havanna', 'HA 8018', '')).toBe('BORBET Havanna HA 8018')
    })

    it('flags a typed title the parts no longer make — and not one they do @admin-213', () => {
        expect(titleDiverges('BORBET', 'Havanna', 'HA 8018', 'Havanna Black')).toBe(true)
        expect(titleDiverges('BORBET', 'Havanna', 'HA 8018', 'BORBET Havanna HA 8018')).toBe(false)
        expect(titleDiverges('BORBET', 'Havanna', 'HA 8018', 'Havanna HA 8018')).toBe(false)
        expect(titleDiverges('BORBET', 'Havanna', 'HA 8018', '')).toBe(false)
    })
})
