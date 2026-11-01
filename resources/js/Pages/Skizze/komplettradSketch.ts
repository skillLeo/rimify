/**
 * The Komplettrad sketch's list and basket (the Gutachten rework brief §9): the tyres that fit, filtered by season, brand
 * and set price and sorted by price or brand; a set the same front and rear, or two and two where the paper allows a
 * pair; no paid extra unless the customer chose it; and the basket as its lines. In memory only, kept apart from the page so it is tested.
 */

import { MOUNTING_SET_CENTS, RDKS, WEIGHTS, type DemoTyre, type Season, type Version } from './shopDemo'
import { versionShort } from './shopDemo'

export type Mode = 'same' | 'mixed'
export type PriceBand = 'alle' | 'bis500' | '500bis600' | 'ueber600'
export type Sort = 'preis-auf' | 'preis-ab' | 'marke'

export interface TyreFilter {
    mode: Mode
    seasons: Season[]
    brands: string[]
    price: PriceBand
    sort: Sort
}

export const PRICE_BANDS: { value: PriceBand; label: string }[] = [
    { value: 'alle', label: 'Alle Preise' },
    { value: 'bis500', label: 'bis 500 €' },
    { value: '500bis600', label: '500 bis 600 €' },
    { value: 'ueber600', label: 'über 600 €' },
]

/**
 * The demo tyres in the sizes of the version chosen: 225/40 R18 and 255/35 R18 on 18 inches, 235/35 R19 and 265/30 R19 on
 * 19 — a 19-inch rim is never offered 18-inch tyres. Prices of the larger size are the smaller one's plus 20,00 €, the
 * set added up, never multiplied (the money rule).
 */
export function fitFor(tyre: DemoTyre, diameter: number): DemoTyre {
    if (diameter !== 19) {
        return tyre
    }

    const front = { size: '235/35 R19', li: 91, si: tyre.front.si, priceCents: tyre.front.priceCents + 2000 }
    const rear = tyre.rear === null ? null : { size: '265/30 R19', li: 93, si: tyre.rear.si, priceCents: tyre.rear.priceCents + 2000 }

    return {
        ...tyre,
        front,
        rear,
        setCents: front.priceCents + front.priceCents + front.priceCents + front.priceCents,
        mixedSetCents: rear === null ? null : front.priceCents + front.priceCents + rear.priceCents + rear.priceCents,
    }
}

/** The sizes a version takes, for the mode tiles: the same front and rear, and the pair the paper allows. */
export function sizesOf(diameter: number): { front: string; rear: string; li: number } {
    return diameter === 19 ? { front: '235/35 R19', rear: '265/30 R19', li: 91 } : { front: '225/40 R18', rear: '255/35 R18', li: 92 }
}

/** The price of four tyres: four alike, or two front and two rear. */
export function setPrice(tyre: DemoTyre, mode: Mode): number {
    return mode === 'mixed' && tyre.mixedSetCents !== null ? tyre.mixedSetCents : tyre.setCents
}

function inBand(cents: number, band: PriceBand): boolean {
    switch (band) {
        case 'bis500':
            return cents <= 50000
        case '500bis600':
            return cents > 50000 && cents <= 60000
        case 'ueber600':
            return cents > 60000
        default:
            return true
    }
}

export function filterTyres(tyres: DemoTyre[], filter: TyreFilter): DemoTyre[] {
    const list = tyres.filter(
        (tyre) =>
            (filter.mode === 'same' || tyre.rear !== null) &&
            (filter.seasons.length === 0 || filter.seasons.includes(tyre.season)) &&
            (filter.brands.length === 0 || filter.brands.includes(tyre.brand)) &&
            inBand(setPrice(tyre, filter.mode), filter.price),
    )

    return list.sort((a, b) => {
        if (filter.sort === 'marke') {
            return a.brand.localeCompare(b.brand, 'de') || a.model.localeCompare(b.model, 'de')
        }

        const diff = setPrice(a, filter.mode) - setPrice(b, filter.mode)

        return filter.sort === 'preis-ab' ? -diff : diff
    })
}

export type Rdks = 'ja' | 'nein' | null

/** What the extras step starts at: the free colour of weights, and the RDKS question unanswered — never a paid extra. */
export function initialExtras(): { weights: string; rdks: Rdks } {
    return { weights: WEIGHTS[0]?.id ?? '', rdks: null }
}

export interface BasketLine {
    label: string
    detail: string
    cents: number
}

/** The Komplettrad as its lines: rims, tyres, mounting, the weights' colour, and RDKS sensors only where asked for. */
export function basketLines(version: Version, tyre: DemoTyre, mode: Mode, weights: string, rdks: Rdks): BasketLine[] {
    const tyreDetail = mode === 'mixed' && tyre.rear !== null
        ? `2 × vorne ${tyre.front.size} ${tyre.front.li}${tyre.front.si} · 2 × hinten ${tyre.rear.size} ${tyre.rear.li}${tyre.rear.si}`
        : `4 × ${tyre.front.size} ${tyre.front.li}${tyre.front.si}`
    const colour = WEIGHTS.find((w) => w.id === weights) ?? WEIGHTS[0]
    const lines: BasketLine[] = [
        { label: '4 Felgen', detail: versionShort(version), cents: version.setCents },
        { label: `4 Reifen ${tyre.brand} ${tyre.model}`, detail: tyreDetail, cents: setPrice(tyre, mode) },
        { label: 'Montage und Wuchten', detail: '4 Räder, fertig montiert', cents: MOUNTING_SET_CENTS },
    ]

    if (colour !== undefined) {
        lines.push({ label: `Wuchtgewichte ${colour.name}`, detail: colour.setCents === 0 ? 'ohne Aufpreis' : 'für 4 Räder', cents: colour.setCents })
    }

    if (rdks === 'ja') {
        lines.push({ label: 'RDKS-Sensoren', detail: '4 Sensoren, gleich mit eingesetzt', cents: RDKS.setCents })
    }

    return lines
}

export function total(lines: BasketLine[]): number {
    return lines.reduce((sum, line) => sum + line.cents, 0)
}
