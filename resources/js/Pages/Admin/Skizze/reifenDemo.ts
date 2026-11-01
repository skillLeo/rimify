/**
 * The admin tyre sketch's data, in memory only (the Gutachten rework brief §9): tyre MODELS — maker, model, season,
 * photos — each with its size lines, and on every line its supplier, price, availability and EU tyre label. The models
 * are the shop sketch's invented ones; one size comes from two suppliers at two prices, to put the open question where
 * it arises. Every figure is an example.
 */

import { TYRES, type Season } from '../../Skizze/shopDemo'

export interface SizeLine {
    id: string
    size: string
    li: number
    si: string
    supplier: string
    priceCents: number
    available: boolean
    /** Null where the label is not on record yet: the tyre is then not offered (D-303). */
    label: { fuel: string; wet: string; noiseDb: number; noiseClass: string; snow: boolean; ice: boolean; eprel: string | null } | null
}

export interface TyreModel {
    id: string
    brand: string
    model: string
    season: Season
    photos: number
    sizes: SizeLine[]
    changed: string
}

export const SUPPLIERS = ['Großhandel Nord', 'Reifenlager Süd', 'Direkt vom Hersteller']

function eprel(seed: number): string {
    return String(400000 + seed * 7919)
}

export const MODELS: TyreModel[] = TYRES.map((tyre, index) => {
    const label = { fuel: tyre.label.fuel, wet: tyre.label.wet, noiseDb: tyre.label.noiseDb, noiseClass: tyre.label.noiseClass, snow: tyre.label.snow, ice: tyre.label.ice, eprel: eprel(index) }
    const sizes: SizeLine[] = [
        { id: `${tyre.id}-1`, size: tyre.front.size, li: tyre.front.li, si: tyre.front.si, supplier: SUPPLIERS[index % 3] ?? '', priceCents: tyre.front.priceCents, available: tyre.delivery !== 'anfrage', label },
    ]

    if (tyre.rear) {
        sizes.push({ id: `${tyre.id}-2`, size: tyre.rear.size, li: tyre.rear.li, si: tyre.rear.si, supplier: SUPPLIERS[(index + 1) % 3] ?? '', priceCents: tyre.rear.priceCents, available: tyre.delivery !== 'anfrage', label: index % 4 === 3 ? null : { ...label, noiseDb: label.noiseDb + 1, eprel: eprel(index + 50) } })
    }

    if (index % 3 === 0) {
        sizes.push({ id: `${tyre.id}-3`, size: '235/35 R19', li: 91, si: tyre.front.si, supplier: SUPPLIERS[(index + 2) % 3] ?? '', priceCents: tyre.front.priceCents + 3000, available: true, label: index === 3 ? null : { ...label, eprel: eprel(index + 100) } })
    }

    return { id: tyre.id, brand: tyre.brand, model: tyre.model, season: tyre.season, photos: tyre.photos, sizes, changed: `${String(28 - index).padStart(2, '0')}.10.2026` }
})

/* The first model's 225/40 R18 also comes from a second supplier, at another price: the question for the client. */
const first = MODELS[0]

if (first !== undefined && first.sizes[0] !== undefined) {
    first.sizes.splice(1, 0, { ...first.sizes[0], id: `${first.id}-1b`, supplier: 'Reifenlager Süd', priceCents: first.sizes[0].priceCents - 500 })
}

export const SUPPLIER_QUESTION = 'Kann derselbe Reifen (gleiche Marke, gleiches Modell, gleiche Größe) von mehreren Lieferanten mit unterschiedlichen Preisen kommen? Wenn ja: Welcher Preis soll im Shop stehen?'
