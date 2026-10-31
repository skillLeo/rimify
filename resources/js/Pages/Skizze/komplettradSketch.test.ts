import { describe, expect, it } from 'vitest'
import { basketLines, filterTyres, fitFor, initialExtras, setPrice, type TyreFilter } from './komplettradSketch'
import { MOUNTING_SET_CENTS, RDKS, TYRES, VERSIONS, WEIGHTS } from './shopDemo'

const ALL: TyreFilter = { mode: 'same', seasons: [], brands: [], price: 'alle', sort: 'preis-auf' }

describe('the tyre list of the Komplettrad sketch', () => {
    it('shows every fitting tyre, cheapest set first', () => {
        const list = filterTyres(TYRES, ALL)

        expect(list).toHaveLength(TYRES.length)
        expect(list.map((tyre) => setPrice(tyre, 'same'))).toEqual([...list.map((tyre) => setPrice(tyre, 'same'))].sort((a, b) => a - b))
    })

    it('shows only models that come in both sizes when front and rear differ', () => {
        const list = filterTyres(TYRES, { ...ALL, mode: 'mixed' })

        expect(list.length).toBeGreaterThan(0)
        expect(list.every((tyre) => tyre.rear !== null)).toBe(true)
        expect(list.length).toBeLessThan(TYRES.length)
    })

    it('filters by season and by brand together', () => {
        const list = filterTyres(TYRES, { ...ALL, seasons: ['winter'], brands: ['Laufwerk', 'Nordspur'] })

        expect(list.map((tyre) => tyre.id).sort()).toEqual(['laufwerk-w1', 'nordspur-polar'])
    })

    it('filters by the price of the set', () => {
        const list = filterTyres(TYRES, { ...ALL, price: 'bis500' })

        expect(list.length).toBeGreaterThan(0)
        expect(list.every((tyre) => setPrice(tyre, 'same') <= 50000)).toBe(true)
    })

    it('sorts by brand, then model', () => {
        const list = filterTyres(TYRES, { ...ALL, sort: 'marke' })

        expect(list[0]?.brand).toBe('Granit')
        expect(list[list.length - 1]?.brand).toBe('Profila')
    })

    it('sorts by price, dearest first', () => {
        const list = filterTyres(TYRES, { ...ALL, sort: 'preis-ab' })

        expect(setPrice(list[0]!, 'same')).toBeGreaterThanOrEqual(setPrice(list[1]!, 'same'))
    })
})

describe('the extras and the basket', () => {
    it('chooses no paid extra for the customer: the free weights, and the RDKS question left open', () => {
        const start = initialExtras()

        expect(start.rdks).toBeNull()
        expect(WEIGHTS.find((w) => w.id === start.weights)?.setCents).toBe(0)
    })

    it('adds rims, tyres, mounting and the weights, and RDKS sensors only where the customer asked for them', () => {
        const version = VERSIONS[0]!
        const tyre = TYRES.find((t) => t.id === 'laufwerk-s1')!
        const black = WEIGHTS.find((w) => w.id === 'schwarz')!

        expect(basketLines(version, tyre, 'same', 'schwarz', 'ja').map((line) => line.cents)).toEqual([version.setCents, tyre.setCents, MOUNTING_SET_CENTS, black.setCents, RDKS.setCents])
        expect(basketLines(version, tyre, 'same', 'silber', null).map((line) => line.label)).not.toContain('RDKS-Sensoren')
        expect(basketLines(version, tyre, 'same', 'silber', 'nein').map((line) => line.label)).not.toContain('RDKS-Sensoren')
    })

    it('prices a front/rear set as two of each', () => {
        const tyre = TYRES.find((t) => t.id === 'laufwerk-s1')!

        expect(setPrice(tyre, 'mixed')).toBe(tyre.front.priceCents + tyre.front.priceCents + tyre.rear!.priceCents + tyre.rear!.priceCents)
    })
})

describe('tyres for the version chosen (D-386)', () => {
    it('offers 19-inch tyres on a 19-inch version, priced as four of them', () => {
        const tyre = fitFor(TYRES.find((t) => t.id === 'laufwerk-s1')!, 19)

        expect(tyre.front.size).toBe('235/35 R19')
        expect(tyre.rear?.size).toBe('265/30 R19')
        expect(tyre.setCents).toBe(tyre.front.priceCents + tyre.front.priceCents + tyre.front.priceCents + tyre.front.priceCents)
    })

    it('leaves the 18-inch tyres as they are', () => {
        const tyre = TYRES.find((t) => t.id === 'laufwerk-s1')!

        expect(fitFor(tyre, 18)).toEqual(tyre)
    })
})
