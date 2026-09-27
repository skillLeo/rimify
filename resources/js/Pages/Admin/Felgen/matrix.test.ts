import { describe, expect, it } from 'vitest'
import type { FinishForm, SizeForm } from '../../../types/admin/felgen'
import { finishCode, generate, normal, parseList, planned, skuFor, type MatrixInput } from './matrix'

const finishes: FinishForm[] = [
    { key: 'f1', id: 1, name: 'Graphit matt', hex: '', art_finish: 'graphite' },
    { key: 'n1', id: null, name: 'Silber', hex: '', art_finish: 'silver' },
]

const input: MatrixInput = {
    finishes: ['f1'],
    diameters: '18 19',
    widths: '8; 8,5',
    ets: '35',
    bolt_holes: 5,
    bolt_circle: '112',
    bore: '66,6',
    price: '189,00',
    stock: 4,
}

function at<T>(list: T[], index: number): T {
    const value = list[index]

    if (value === undefined) {
        throw new Error(`no row ${index}`)
    }

    return value
}

function counter(): () => string {
    let n = 0

    return () => `m${++n}`
}

describe('reading a typed list', () => {
    it('splits on spaces, semicolons and lines — never on the decimal comma', () => {
        expect(parseList('8 8,5\n9;9,5')).toEqual(['8', '8,5', '9', '9,5'])
    })

    it('drops a value typed twice, however it was written', () => {
        expect(parseList('8,5 8,50 8.5')).toEqual(['8,5'])
        expect(normal('8,50')).toBe(normal('8.5'))
    })
})

describe('the SKU of a new size', () => {
    it('is built from its parts, upper case, umlauts spelled out', () => {
        expect(skuFor('Stahlwerk 19', 'Kontur S', 'Graphit matt', '18', '8,5', '35')).toBe('STAHLWERK-19-KONTUR-S-18X8.5-ET35-GM')
        expect(skuFor('Bergsteig', 'Grät', 'Weiß', '19', '9', '-5')).toBe('BERGSTEIG-GRAET-19X9-ET-5-W')
    })

    it('names a finish by its initials', () => {
        expect(finishCode('Schwarz glänzend poliert')).toBe('SGP')
    })
})

describe('making the matrix', () => {
    it('makes every combination for the chosen finishes', () => {
        const rows = generate(input, finishes, [], 'Nordfelge', 'Fjord', counter())

        expect(rows).toHaveLength(4)
        expect(planned(input)).toBe(4)
        expect(rows.map((r) => `${r.diameter}/${r.width}`)).toEqual(['18/8', '18/8,5', '19/8', '19/8,5'])
        expect(at(rows, 0)).toMatchObject({ finish: 'f1', et: '35', bolt_holes: 5, bolt_circle: '112', bore: '66,6', price: '189,00', stock: 4, id: null })
    })

    it('leaves out a size the table already holds', () => {
        const existing: SizeForm[] = [{ ...at(generate(input, finishes, [], 'Nordfelge', 'Fjord', counter()), 1), key: 'c9', id: 9 }]

        expect(generate(input, finishes, existing, 'Nordfelge', 'Fjord', counter())).toHaveLength(3)
    })

    it('gives a clashing SKU a number instead of making a duplicate', () => {
        const first = at(generate(input, finishes, [], 'Nordfelge', 'Fjord', counter()), 0)
        const existing: SizeForm[] = [{ ...first, key: 'c1', id: 1, et: '40' }]
        const rows = generate(input, finishes, existing, 'Nordfelge', 'Fjord', counter())

        expect(at(rows, 0).sku).toBe(`${first.sku}-2`)
    })
})
