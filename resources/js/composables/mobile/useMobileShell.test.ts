import { describe, expect, it } from 'vitest'
import { isNavigationVisit } from './useMobileShell'

describe('useMobileShell · isNavigationVisit', () => {
    it('treats a plain visit as a navigation that closes sheets', () => {
        expect(isNavigationVisit({ prefetch: false, only: [], except: [] })).toBe(true)
        expect(isNavigationVisit({})).toBe(true)
    })

    it('leaves sheets open for a prefetch — the press before a click', () => {
        expect(isNavigationVisit({ prefetch: true, only: [], except: [] })).toBe(false)
    })

    it('leaves sheets open for a partial reload of the page behind them', () => {
        expect(isNavigationVisit({ prefetch: false, only: ['popular'], except: [] })).toBe(false)
        expect(isNavigationVisit({ prefetch: false, only: [], except: ['popular'] })).toBe(false)
    })
})
