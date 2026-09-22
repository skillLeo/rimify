/*
 * The pure helpers of the brand wall (home-brands.md §8, criteria 8, 9 and 23). The rendered
 * component is covered in BrandWall.component.test.ts.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { VehicleProp } from '../../types/rimify'
import {
    closingLabel,
    hasMark,
    markStyle,
    noteText,
    orderedBrands,
    WALL_MAX_COLUMNS,
    wallLayout,
    wallStyle,
    wordmarkSize,
    type Brand,
} from './brandWall'

function brand(overrides: Partial<Brand> = {}): Brand {
    return { name: 'MOTEC', slug: 'motec', logo: null, logoAspect: null, count: 18, href: '/felgen?marke=motec', ...overrides }
}

const vehicle: VehicleProp = {
    id: 3,
    make: 'Audi',
    model: 'RS 4',
    variant: 'RS 4 Avant (B9)',
    label: 'Audi RS 4 Avant',
    short: 'Audi RS 4',
    hsn: '0588',
    tsn: 'BKH',
    keyNumbers: 'HSN 0588 · TSN BKH',
    buildWindow: '2017–2019',
}

const TIERS = ['s', 'm', 'l', 'xl'] as const

/*
 * home-brands.md §2.2, the whole table: for b brands, [columns, closing span] at S · M · L · XL.
 * A span equal to the columns is the footer strip; with one to three brands it is a footer at
 * every tier, and the brands share one row.
 */
const LAYOUT_TABLE: Record<number, [number, number][]> = {
    1: [[1, 1], [1, 1], [1, 1], [1, 1]],
    2: [[2, 2], [2, 2], [2, 2], [2, 2]],
    3: [[3, 3], [3, 3], [3, 3], [3, 3]],
    4: [[2, 2], [3, 2], [5, 1], [5, 1]],
    5: [[2, 1], [3, 1], [3, 1], [6, 1]],
    6: [[2, 2], [4, 2], [4, 2], [4, 2]],
    7: [[2, 1], [4, 1], [4, 1], [4, 1]],
    8: [[2, 2], [3, 1], [5, 2], [5, 2]],
    9: [[2, 1], [4, 3], [5, 1], [5, 1]],
    10: [[2, 2], [4, 2], [4, 2], [6, 2]],
    11: [[2, 1], [4, 1], [4, 1], [6, 1]],
    12: [[2, 2], [4, 4], [5, 3], [5, 3]],
    13: [[2, 1], [4, 3], [5, 2], [5, 2]],
    14: [[2, 2], [4, 2], [5, 1], [5, 1]],
}

describe('wallLayout — the wall always closes on its own link cell (§2.2)', () => {
    it('returns the spec table for 1 to 14 brands at every tier', () => {
        for (const [b, expected] of Object.entries(LAYOUT_TABLE)) {
            const got = TIERS.map((tier) => {
                const { columns, closingSpan } = wallLayout(Number(b) + 1, WALL_MAX_COLUMNS[tier])

                return [columns, closingSpan]
            })

            expect(got, `${b} brands`).toEqual(expected)
        }
    })

    it('never leaves a hole: 1 ≤ span ≤ columns, the last row is reached, the rows are filled', () => {
        for (let cells = 2; cells <= 40; cells++) {
            for (const max of [2, 4, 5, 6]) {
                const { rows, columns, closingSpan } = wallLayout(cells, max)

                expect(closingSpan).toBeGreaterThanOrEqual(1)
                expect(closingSpan).toBeLessThanOrEqual(columns)
                if (cells <= 4) {
                    // One to three brands: one row of brands, the closing link a footer strip under it.
                    expect({ rows, columns, closingSpan }).toEqual({ rows: 2, columns: cells - 1, closingSpan: cells - 1 })
                } else {
                    expect(columns).toBeLessThanOrEqual(max)
                }
                expect((rows - 1) * columns).toBeLessThan(cells)
                // The brands plus the closing cell's span cover every column of every row.
                expect(cells - 1 + closingSpan).toBe(columns * rows)
            }
        }
    })

    it('writes every tier as inline custom properties for the list', () => {
        expect(wallStyle(2)).toEqual({
            '--wall-cols-s': '2',
            '--wall-span-s': '2',
            '--wall-cols-m': '2',
            '--wall-span-m': '2',
            '--wall-cols-l': '2',
            '--wall-span-l': '2',
            '--wall-cols-xl': '2',
            '--wall-span-xl': '2',
        })
        // From four brands on, the closing cell is a peer again where the row has room.
        expect(wallStyle(4)['--wall-cols-xl']).toBe('5')
        expect(wallStyle(4)['--wall-span-xl']).toBe('1')
        expect(wallStyle(13)['--wall-cols-xl']).toBe('5')
        expect(wallStyle(13)['--wall-span-xl']).toBe('2')
        expect(wallStyle(13)['--wall-cols-m']).toBe('4')
        expect(wallStyle(13)['--wall-span-m']).toBe('3')
    })
})

/*
 * §3.4: width = min(k·√a, Wmax, Hmax·a), height = width / a — with the tier values read from
 * tokens.css itself, so a token change that breaks the reference table fails here.
 */
const here = dirname(fileURLToPath(import.meta.url))
const tokensCss = readFileSync(resolve(here, '../../../css/tokens.css'), 'utf8')

function tokenSteps(name: string): number[] {
    return [...tokensCss.matchAll(new RegExp(`${name}:\\s*(\\d+)px;`, 'g'))].map((match) => Number(match[1]))
}

const K = tokenSteps('--logo-k')
const W_MAX = tokenSteps('--logo-w-max')
const H_MAX = tokenSteps('--logo-h-max')

/** What the CSS rule draws for a mark's inline properties at a tier (0 S · 1 M · 2 L · 3 XL). */
function drawnBox(style: Record<string, string>, tier: number): { width: number; height: number } {
    const aspect = Number(style['--logo-aspect'])
    const root = Number(style['--logo-sqrt'])
    const width = Math.min((K[tier] ?? Number.NaN) * root, W_MAX[tier] ?? Number.NaN, (H_MAX[tier] ?? Number.NaN) * aspect)

    return { width, height: width / aspect }
}

/* §3.4 reference results, px: [width, height] at S · M · L · XL. */
const REFERENCE: [number, [number, number][]][] = [
    [1, [[36, 36], [40, 40], [44, 44], [48, 48]]],
    [1.5, [[53.9, 35.9], [58.8, 39.2], [66, 44], [72, 48]]],
    [2.5, [[69.6, 27.8], [75.9, 30.4], [88.5, 35.4], [101.2, 40.5]]],
    [4.2, [[90.2, 21.5], [98.4, 23.4], [114.8, 27.3], [131.2, 31.2]]],
    [6, [[104, 17.3], [117.6, 19.6], [128, 21.3], [144, 24]]],
    [9, [[104, 11.6], [120, 13.3], [128, 14.2], [144, 16]]],
]

describe('the logo box — constant area, two caps, proportions kept (§3.4)', () => {
    it('reads the tier tokens the spec names', () => {
        expect(K).toEqual([44, 48, 56, 64])
        expect(W_MAX).toEqual([104, 120, 128, 144])
        expect(H_MAX).toEqual([36, 40, 44, 48])
    })

    it('draws the reference table from the inline aspect and its square root', () => {
        for (const [aspect, rows] of REFERENCE) {
            const style = markStyle(brand({ logo: '/storage/brands/motec.svg', logoAspect: aspect }))

            rows.forEach(([width, height], tier) => {
                const box = drawnBox(style, tier)

                // The table is rounded to one decimal and √a travels with three: well inside the ±0,5 px of §8.
                expect(Math.abs(box.width - width), `a ${aspect}, tier ${tier}, width`).toBeLessThanOrEqual(0.1)
                expect(Math.abs(box.height - height), `a ${aspect}, tier ${tier}, height`).toBeLessThanOrEqual(0.1)
                // The proportions are the file's, always.
                expect(box.width / box.height).toBeCloseTo(aspect, 6)
            })
        }
    })

    it('passes a wide and a compact logo to CSS as aspect, root and mask image', () => {
        expect(markStyle(brand({ logo: '/storage/brands/motec.svg', logoAspect: 4.2 }))).toEqual({
            '--logo-aspect': '4.200',
            '--logo-sqrt': '2.049',
            '--logo-url': 'url("/storage/brands/motec.svg")',
        })
        expect(markStyle(brand({ logo: '/storage/brands/emblem.png?v=3a', logoAspect: 1 }))).toEqual({
            '--logo-aspect': '1.000',
            '--logo-sqrt': '1.000',
            '--logo-url': 'url("/storage/brands/emblem.png?v=3a")',
        })
    })
})

describe('hasMark — a logo is drawn only when every check passes (§4.2, fail closed)', () => {
    const logo = '/storage/brands/motec.svg'

    it('accepts a safe path with an aspect inside [0.2, 20]', () => {
        expect(hasMark(brand({ logo, logoAspect: 4.2 }))).toBe(true)
        expect(hasMark(brand({ logo: '/images/brands/x_y-1.webp?v=abc123', logoAspect: 0.2 }))).toBe(true)
        expect(hasMark(brand({ logo: '/images/brands/x.png', logoAspect: 20 }))).toBe(true)
    })

    it('refuses a logo without an aspect, and an aspect without a logo', () => {
        expect(hasMark(brand({ logo, logoAspect: null }))).toBe(false)
        expect(hasMark(brand({ logo: null, logoAspect: 4.2 }))).toBe(false)
        // A server that does not ship the key yet: still the name, never a guessed box.
        const { logoAspect: _dropped, ...withoutAspect } = brand({ logo, logoAspect: 4.2 })
        expect(hasMark(withoutAspect as unknown as Brand)).toBe(false)
    })

    it('refuses an aspect outside the range or not finite', () => {
        for (const logoAspect of [0, 0.19, 20.01, Number.NaN, Number.POSITIVE_INFINITY, -4.2]) {
            expect(hasMark(brand({ logo, logoAspect })), String(logoAspect)).toBe(false)
        }
    })

    it('refuses anything that could break out of url("…") or is not a local image', () => {
        for (const bad of [
            'https://example.com/logo.svg',
            '//example.com/logo.svg',
            'storage/logo.svg',
            '/storage/logo.svg")',
            '/storage/lo go.svg',
            "/storage/logo'.svg",
            '/storage/logo.gif',
            '/storage/logo.svg?v=1;x',
            'data:image/svg+xml,<svg/>',
            'javascript:alert(1)',
        ]) {
            expect(hasMark(brand({ logo: bad, logoAspect: 4.2 })), bad).toBe(false)
        }
    })

    it('never gives the sample range a mark, even when the data has one', () => {
        expect(hasMark(brand({ name: 'Demo', slug: 'demo', logo, logoAspect: 4.2 }))).toBe(false)
    })
})

describe('the wordmark, the order and the copy', () => {
    it('sizes the name by its longest word (§3.3)', () => {
        expect(wordmarkSize('MOTEC')).toBe('s')
        expect(wordmarkSize('BBS')).toBe('s')
        expect(wordmarkSize('Dotz')).toBe('s')
        expect(wordmarkSize('BORBET')).toBe('m')
        expect(wordmarkSize('Rotiform')).toBe('m')
        expect(wordmarkSize('OZ Racing')).toBe('m')
        expect(wordmarkSize('Leichtmetall')).toBe('l')
        // Characters, not UTF-16 units: five letters stay the short step.
        expect(wordmarkSize('ÄÖÜßé')).toBe('s')
    })

    it('moves the sample range to the end of the brands and leaves the prop untouched', () => {
        const list = [brand({ name: 'Demo', slug: 'demo' }), brand(), brand({ name: 'BBS', slug: 'bbs' })]

        expect(orderedBrands(list).map((b) => b.slug)).toEqual(['motec', 'bbs', 'demo'])
        expect(list.map((b) => b.slug)).toEqual(['demo', 'motec', 'bbs'])
    })

    it('names the closing cell by what it does, with and without a vehicle (§4.1)', () => {
        expect(closingLabel(null)).toBe('Alle Felgen ansehen')
        expect(closingLabel(vehicle)).toBe('Passende Felgen anzeigen')
    })

    it('states the rule, and with a vehicle that the counts are the whole stock (§4.1)', () => {
        expect(noteText(null)).toBe('Nur Marken, von denen gerade Felgen auf Lager sind.')
        expect(noteText(vehicle)).toBe(
            'Nur Marken, von denen gerade Felgen auf Lager sind. Die Zahl ist der gesamte Lagerbestand der Marke; welche davon an deinen Audi RS 4 passen, zeigt dir die Liste.'
        )
    })
})
