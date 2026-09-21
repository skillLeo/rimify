import { describe, expect, it } from 'vitest'
import { resolveHref } from './useShared'

describe('resolveHref', () => {
    it('sends a vehicle-aware item to the listing once a vehicle is chosen', () => {
        expect(resolveHref('/felgen-suchen', 'vehicle_aware', true, '/felgen')).toBe('/felgen')
    })

    it('keeps the selector for a vehicle-aware item without a vehicle', () => {
        expect(resolveHref('/felgen-suchen', 'vehicle_aware', false, '/felgen')).toBe('/felgen-suchen')
    })

    it('leaves every other item alone', () => {
        expect(resolveHref('/faq', null, true, '/felgen')).toBe('/faq')
    })
})
