/**
 * The shop sketches' data, in memory only (the Gutachten rework brief §8, §9, §11 Phase 1). The wheel is the one the
 * client showed in the meeting — BBS LeMans LM124 with a second version, 9 × 18 ET 40 5 × 115 — and the car the
 * proposal named. Prices, availability and every answer are examples. The tyres come from invented makers, as the demo
 * catalogue's do (CatalogueSeeder: „Laufwerk"), so no real product is described with figures it does not have; their EU
 * label values are examples too, and say so on the page.
 */

import { decimal, withUnit } from '../../format'

export type Answer = 'conditional' | 'none' | 'refused'

export interface Version {
    id: string
    finish: string
    diameter: number
    width: number
    et: number
    holes: number
    circle: number
    bore: number
    priceCents: number
    /** Four wheels: written out, never multiplied in a component (the money rule, eslint.config.js). */
    setCents: number
    available: boolean
    /** For the example car: approved with Auflagen, no approval on record, or ruled out by a paper. */
    forCar: Answer
}

export interface ShopFinish {
    id: string
    name: string
    hex: string
    art: 'black' | 'graphite' | 'silver' | 'bronze' | 'polished'
}

export const WHEEL = {
    brand: 'BBS',
    model: 'LeMans LM124',
    spokes: 10,
    finishes: [
        { id: 'blue', name: 'Blue Gloss', hex: '#1F3E73', art: 'graphite' },
        { id: 'black', name: 'Black Gloss', hex: '#141518', art: 'black' },
    ] as ShopFinish[],
}

function versions(finish: string): Version[] {
    return [
        { id: `${finish}-18a`, finish, diameter: 18, width: 8.5, et: 30, holes: 5, circle: 120, bore: 72.5, priceCents: 35000, setCents: 140000, available: true, forCar: 'conditional' },
        { id: `${finish}-18b`, finish, diameter: 18, width: 9, et: 40, holes: 5, circle: 115, bore: 72.5, priceCents: 35000, setCents: 140000, available: true, forCar: 'none' },
        { id: `${finish}-19a`, finish, diameter: 19, width: 8.5, et: 35, holes: 5, circle: 120, bore: 72.6, priceCents: 39500, setCents: 158000, available: true, forCar: 'conditional' },
        { id: `${finish}-19b`, finish, diameter: 19, width: 9.5, et: 40, holes: 5, circle: 120, bore: 72.6, priceCents: 43000, setCents: 172000, available: false, forCar: 'refused' },
    ]
}

export const VERSIONS: Version[] = [...versions('blue'), ...versions('black')]

export const CAR = { name: 'BMW 3er (E90) 320i', short: 'BMW 3er' }

/** `8,5` · `9` — the rim width as the shop writes it. */
export function width(value: number): string {
    return decimal(value, Number.isInteger(value) ? 0 : 1)
}

/** The three values the client asked every version to name: „Breite 8,5 J · ET 30 · Lochkreis 5 × 120". */
export function versionLine(version: Version): string {
    return `Breite ${width(version.width)} J · ET ${version.et} · Lochkreis ${version.holes} × ${version.circle}`
}

/** `8,5 J × 18 · ET 30 · 5 × 120` — the version in one line, for the basket and the steps. */
export function versionShort(version: Version): string {
    return `${width(version.width)} J × ${version.diameter} · ET ${version.et} · ${version.holes} × ${version.circle}`
}

export function boreText(version: Version): string {
    return withUnit(decimal(version.bore, 1), 'mm')
}

export type Season = 'sommer' | 'winter' | 'ganzjahr'

export interface TyreSize {
    size: string
    li: number
    si: string
    priceCents: number
}

export interface DemoTyre {
    id: string
    brand: string
    model: string
    season: Season
    /** The same on both axles: 225/40 R18 on the 8,5 J version. */
    front: TyreSize
    /** The rear of the front/rear pair the paper allows (68B: 255/35 R18 behind 225/40 R18), where the model has it. */
    rear: TyreSize | null
    setCents: number
    /** Two front and two rear, written out. */
    mixedSetCents: number | null
    label: { fuel: 'A' | 'B' | 'C' | 'D' | 'E'; wet: 'A' | 'B' | 'C' | 'D' | 'E'; noiseDb: number; noiseClass: 'A' | 'B' | 'C'; snow: boolean; ice: boolean }
    delivery: 'sofort' | 'tage' | 'anfrage'
    /** How many photos the sketch pretends the model has, 0 to 4: placeholders, never another tyre's photo. */
    photos: number
}

export const TYRE_BRANDS = ['Laufwerk', 'Nordspur', 'Profila', 'Granit']

function tyre(id: string, brand: string, model: string, season: Season, front: [number, string, number], rear: [number, string, number] | null, label: DemoTyre['label'], delivery: DemoTyre['delivery'], photos: number, setCents: number, mixedSetCents: number | null): DemoTyre {
    return {
        id,
        brand,
        model,
        season,
        front: { size: '225/40 R18', li: front[0], si: front[1], priceCents: front[2] },
        rear: rear === null ? null : { size: '255/35 R18', li: rear[0], si: rear[1], priceCents: rear[2] },
        setCents,
        mixedSetCents,
        label,
        delivery,
        photos,
    }
}

export const TYRES: DemoTyre[] = [
    tyre('laufwerk-s1', 'Laufwerk', 'Sommer S1', 'sommer', [92, 'Y', 11900], [94, 'Y', 13900], { fuel: 'B', wet: 'A', noiseDb: 71, noiseClass: 'B', snow: false, ice: false }, 'sofort', 3, 47600, 51600),
    tyre('laufwerk-s3', 'Laufwerk', 'Sommer S3', 'sommer', [92, 'Y', 15900], [94, 'Y', 17900], { fuel: 'A', wet: 'A', noiseDb: 70, noiseClass: 'A', snow: false, ice: false }, 'tage', 2, 63600, 67600),
    tyre('laufwerk-w1', 'Laufwerk', 'Winter W1', 'winter', [92, 'V', 12900], null, { fuel: 'C', wet: 'B', noiseDb: 72, noiseClass: 'B', snow: true, ice: false }, 'sofort', 1, 51600, null),
    tyre('laufwerk-a1', 'Laufwerk', 'Allwetter A1', 'ganzjahr', [92, 'W', 13400], [94, 'W', 15400], { fuel: 'C', wet: 'B', noiseDb: 71, noiseClass: 'B', snow: true, ice: false }, 'tage', 0, 53600, 57600),
    tyre('nordspur-sport', 'Nordspur', 'Sport 2', 'sommer', [92, 'Y', 9900], [94, 'Y', 11400], { fuel: 'C', wet: 'B', noiseDb: 72, noiseClass: 'B', snow: false, ice: false }, 'sofort', 2, 39600, 42600),
    tyre('nordspur-polar', 'Nordspur', 'Polar 5', 'winter', [92, 'V', 10900], [94, 'V', 12400], { fuel: 'C', wet: 'C', noiseDb: 71, noiseClass: 'B', snow: true, ice: true }, 'sofort', 1, 43600, 46600),
    tyre('nordspur-all', 'Nordspur', 'Allroad 4S', 'ganzjahr', [92, 'Y', 11900], null, { fuel: 'B', wet: 'B', noiseDb: 70, noiseClass: 'A', snow: true, ice: false }, 'anfrage', 0, 47600, null),
    tyre('profila-contour', 'Profila', 'Contour', 'sommer', [92, 'Y', 13900], [94, 'Y', 15900], { fuel: 'A', wet: 'B', noiseDb: 69, noiseClass: 'A', snow: false, ice: false }, 'tage', 4, 55600, 59600),
    tyre('profila-frost', 'Profila', 'Frost Pro', 'winter', [92, 'V', 14400], null, { fuel: 'B', wet: 'B', noiseDb: 70, noiseClass: 'A', snow: true, ice: false }, 'tage', 2, 57600, null),
    tyre('granit-gt', 'Granit', 'GT Sport', 'sommer', [92, 'Y', 17900], [94, 'Y', 19900], { fuel: 'B', wet: 'A', noiseDb: 72, noiseClass: 'B', snow: false, ice: false }, 'sofort', 3, 71600, 75600),
    tyre('granit-touring', 'Granit', 'Touring 3', 'sommer', [92, 'W', 10400], null, { fuel: 'A', wet: 'B', noiseDb: 68, noiseClass: 'A', snow: false, ice: false }, 'sofort', 1, 41600, null),
    tyre('granit-winter', 'Granit', 'Wintergrip', 'winter', [92, 'V', 11400], [94, 'V', 13400], { fuel: 'C', wet: 'B', noiseDb: 72, noiseClass: 'B', snow: true, ice: false }, 'anfrage', 0, 45600, 49600),
]

export const SEASONS: { value: Season; label: string }[] = [
    { value: 'sommer', label: 'Sommer' },
    { value: 'winter', label: 'Winter' },
    { value: 'ganzjahr', label: 'Ganzjahr' },
]

export function deliveryText(delivery: DemoTyre['delivery']): string {
    return { sofort: 'Sofort lieferbar', tage: 'Lieferbar in 3–5 Tagen', anfrage: 'Auf Anfrage' }[delivery]
}

/**
 * The extras of a Komplettrad, asked as the live product page asks them (#15): the Wuchtgewichte colour, the free one
 * first; and RDKS sensors, Mit or Ohne, answered by nobody but the customer — the checkout asks where nobody has. No paid
 * extra is ever chosen for them. Valves are not offered: which valves a wheel may take is its Gutachten's to say.
 */
export const WEIGHTS = [
    { id: 'silber', name: 'Silber', hex: '#B9BEC4', eachCents: 0, setCents: 0 },
    { id: 'schwarz', name: 'Schwarz', hex: '#1C1D20', eachCents: 300, setCents: 1200 },
]

export const RDKS = { eachCents: 4900, setCents: 19600 }

/** Mounting and balancing, the preview's own price per wheel (25,00 €), for four wheels written out. */
export const MOUNTING_EACH_CENTS = 2500

export const MOUNTING_SET_CENTS = 10000
