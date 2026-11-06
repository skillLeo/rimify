/**
 * The Komplettrad's steps, in memory and tested apart from the page (the Gutachten rework §9): what the server offers for a version as
 * one kind of card, the filters and the order, and the sum. Nothing here decides whether a tyre may be fitted: only what TyreEligibility
 * sent is ever a card (R-13). Every figure is the server's (R-10): a card only picks one, and the sum adds whole cents.
 */

import type { ImageManifest } from '../../Components/Ui/Picture.vue'
import { setNames } from '../../Components/Product/setNames'
import { formatMoney } from '../../lib/num'
import type { ConditionGroupsView } from '../../types/rimify'
import type { BasketWeightOption } from '../../types/rimify'
import type { KomplettradOptionsProp, KomplettradTyreProp, MischbereifungPairProp, MischbereifungSetProp, ProduktConfig, TyreClass, TyreLabelProp } from '../../types/pages'

export type TyreMode = 'same' | 'mixed'
export type PriceBand = { value: string; label: string; from: number | null; to: number | null }
export type TyreSort = 'preis-auf' | 'preis-ab' | 'marke'
export type Rdks = 'ja' | 'nein' | null

export interface EuLabel {
    fuel: TyreClass
    wet: TyreClass
    noiseDb: number
    noiseClass: 'A' | 'B' | 'C'
    snowGrip: boolean | null
    iceGrip: boolean | null
    eprelId: string
    title: string
}

/** One axle of a card, or both where one tyre stands on them. */
export interface CardSide {
    axle: string | null
    /** The tyre's own line, where the axles carry two (D-336). */
    line: string | null
    size: string
    facts: string
    eu: EuLabel | null
}

export interface TyreCardView {
    key: string
    mode: TyreMode
    frontTyreId: number
    rearTyreId: number | null
    brands: string[]
    /** The line both axles carry; null where they differ. */
    name: string | null
    season: string
    seasonLabel: string
    sides: CardSide[]
    /** The tyres alone: what the filters and the order read, and the card prints. */
    setCents: number
    set: string
    /** One tyre's price where there is one to name; the two axles' where they differ. */
    each: string
    unit: string
    /** The whole Komplettrad, with the free colour; `prices` per colour. */
    perWheel: string | null
    forFourCents: number
    forFour: string
    prices: { colourId: number; forFourCents: number; forFour: string }[]
    photos: ImageManifest[]
    answer: ConditionGroupsView | null
    isDemo: boolean
}

export interface PairView {
    key: string
    number: number
    front: string
    rear: string
    sameSize: boolean
    minSentence: string
    noSet: string | null
    answer: ConditionGroupsView | null
    cards: TyreCardView[]
}

export interface FlowOffer {
    refusal: string | null
    refusalCode: string | null
    minSentence: string | null
    /** Four alike. */
    same: TyreCardView[]
    /** Two and two: the Gutachten's combinations (D-335), or the pairs of its table (D-105). */
    pairs: PairView[]
    /** The Gutachten lists its combinations: the Komplettrad is one of them, and there is no „four alike“ beside it. */
    listed: boolean
    mixedRefusal: string | null
    rules: string | null
    rulesPage: number | null
    sourcePage: number | null
    priceOpen: boolean
    /** Wheels one add takes: four alike, or per axle. */
    quantity: number
    perAxle: number
}

const TYRE_CLASSES: readonly string[] = ['A', 'B', 'C', 'D', 'E']
const NOISE_CLASSES: readonly string[] = ['A', 'B', 'C']

/* A label with a class the regulation does not know is not shown; it is never "corrected". */
/* A size in one piece on the label's title line, on a phone too: never „235/45“ over „R19 99W“. */
function oneSize(size: string): string {
    return size.replace(/ /g, '\u00A0')
}

function euFrom(label: TyreLabelProp | null | undefined, title: string): EuLabel | null {
    if (!label || !label.fuel || !label.wetGrip || !TYRE_CLASSES.includes(label.fuel) || !TYRE_CLASSES.includes(label.wetGrip) || label.noiseDb === null || !label.noiseClass || !NOISE_CLASSES.includes(label.noiseClass)) {
        return null
    }

    return {
        fuel: label.fuel as TyreClass,
        wet: label.wetGrip as TyreClass,
        noiseDb: label.noiseDb,
        noiseClass: label.noiseClass as 'A' | 'B' | 'C',
        snowGrip: label.snowGrip,
        iceGrip: label.iceGrip,
        eprelId: label.eprelId,
        title,
    }
}

function tyreCard(tyre: KomplettradTyreProp, photos: Record<string, ImageManifest[]>): TyreCardView {
    return {
        key: `t${tyre.id}`,
        mode: 'same',
        frontTyreId: tyre.id,
        rearTyreId: null,
        brands: [tyre.brandName],
        name: tyre.name,
        season: tyre.season,
        seasonLabel: tyre.seasonLabel,
        sides: [{ axle: null, line: null, size: tyre.sizeLabel, facts: tyre.facts ?? '', eu: euFrom(tyre.label, `${tyre.brandName} ${tyre.name} · ${oneSize(tyre.sizeLabel)}`) }],
        setCents: tyre.tyreSetCents ?? 0,
        set: tyre.tyreSet ?? '',
        each: `${tyre.tyrePrice} je Reifen`,
        unit: 'für 4 Reifen',
        perWheel: tyre.perWheel,
        forFourCents: tyre.forFourCents,
        forFour: tyre.forFour,
        prices: tyre.prices ?? [],
        photos: photos[String(tyre.id)] ?? [],
        answer: tyre.answer ?? null,
        isDemo: tyre.isDemo,
    }
}

function setCard(set: MischbereifungSetProp, pair: MischbereifungPairProp, photos: Record<string, ImageManifest[]>): TyreCardView {
    const names = setNames(set)
    const one = set.frontTyreId === set.rearTyreId
    const rearBrand = set.rearBrandName ?? set.brandName
    const rearName = set.rearName ?? set.name
    const sameSize = set.frontLabel === set.rearLabel
    const sides: CardSide[] = sameSize && one
        ? [{ axle: 'vorne und hinten', line: null, size: set.frontLabel, facts: set.frontFacts ?? '', eu: euFrom(set.frontEu, `${set.brandName} ${set.name} · ${oneSize(set.frontLabel)}`) }]
        : [
              { axle: 'vorne', line: names.front, size: set.frontLabel, facts: set.frontFacts ?? '', eu: euFrom(set.frontEu, `${set.brandName} ${set.name} · ${oneSize(set.frontLabel)}`) },
              { axle: 'hinten', line: names.rear, size: set.rearLabel, facts: set.rearFacts ?? '', eu: euFrom(one ? set.frontEu : set.rearEu, `${rearBrand} ${rearName} · ${oneSize(set.rearLabel)}`) },
          ]

    return {
        key: `${pair.key}:${set.key}`,
        mode: 'mixed',
        frontTyreId: set.frontTyreId,
        rearTyreId: set.rearTyreId,
        brands: names.brands,
        name: names.line,
        season: set.season ?? '',
        seasonLabel: set.seasonLabel,
        sides,
        setCents: set.tyreSetCents ?? 0,
        set: set.tyreSet ?? '',
        each: set.frontTyrePrice === set.rearTyrePrice ? `${set.frontTyrePrice} je Reifen` : `vorne ${set.frontTyrePrice}, hinten ${set.rearTyrePrice} je Reifen`,
        unit: 'für 2 vorne und 2 hinten',
        perWheel: null,
        forFourCents: set.forFourCents,
        forFour: set.forFour,
        prices: (set.prices ?? []).map((p) => ({ colourId: p.colourId, forFourCents: p.forFourCents, forFour: p.forFour })),
        photos: photos[String(set.frontTyreId)] ?? [],
        answer: pair.answer ?? null,
        isDemo: set.isDemo,
    }
}

function pairView(pair: MischbereifungPairProp, photos: Record<string, ImageManifest[]>): PairView {
    return {
        key: pair.key,
        number: pair.number,
        front: pair.front,
        rear: pair.rear,
        sameSize: pair.sameSize === true,
        minSentence: pair.minSentence,
        noSet: pair.noSet ?? null,
        answer: pair.answer ?? null,
        cards: pair.sets.map((set) => setCard(set, pair, photos)),
    }
}

/* What the server refuses everything else with, should it ever send neither tyres nor a sentence: never an empty panel. */
const NO_TYRES = 'Passende Reifen für diese Größe können wir dir gerade nicht anbieten. Die Felge allein kannst du bestellen.'

/** What the server offers for one version, as one kind of card. */
export function offerOf(config: ProduktConfig, photos: Record<string, ImageManifest[]>): FlowOffer {
    const offer = config.komplettrad
    const mixed = config.mischbereifung ?? null
    const listed = (offer?.combinations?.length ?? 0) > 0
    const pairs = (listed ? (offer?.combinations ?? []) : (mixed?.pairs ?? [])).map((pair) => pairView(pair, photos))
    const same = (offer?.tyres ?? []).map((tyre) => tyreCard(tyre, photos))
    // Four alike refused while the table has its pairs: the pairs are what there is (#20), and no refusal stands over them.
    const none = same.length === 0 && pairs.every((pair) => pair.cards.length === 0)

    return {
        // Pairs without a tyre: what is missing, never „four alike do not exist“ above a dead button (#20).
        refusal: none ? (pairs.length > 0 ? (pairs[0]?.noSet ?? NO_TYRES) : (offer?.refusal ?? mixed?.refusal ?? NO_TYRES)) : null,
        refusalCode: none ? (pairs.length > 0 ? 'NO_TYRE_AVAILABLE' : (offer?.refusalCode ?? null)) : null,
        minSentence: offer?.minSentence ?? null,
        same,
        pairs,
        listed,
        mixedRefusal: mixed?.refusal ?? null,
        rules: mixed?.rules ?? null,
        rulesPage: (mixed?.rulesPage === undefined ? mixed?.sourcePage : mixed.rulesPage) ?? null,
        sourcePage: offer?.sourcePage ?? mixed?.sourcePage ?? null,
        priceOpen: offer?.priceOpen === true || mixed?.priceOpen === true,
        quantity: offer?.quantity ?? 4,
        perAxle: offer?.perAxle ?? mixed?.perAxle ?? 2,
    }
}

/**
 * What the product page and the RIMIFY-Check say of a version's Komplettrad before its steps: whether there is one, why not, and from
 * what price — the server's lowest figure, per wheel, or the lowest 2 + 2 where only pairs stand.
 */
export function setSummary(config: ProduktConfig | null): { ready: boolean; refusal: string | null; refusalCode: string | null; from: string | null; fromUnit: string; priceOpen: boolean } {
    if (config === null) {
        return { ready: false, refusal: null, refusalCode: null, from: null, fromUnit: 'pro Rad', priceOpen: false }
    }

    const offer = offerOf(config, {})
    const lowest = (cards: TyreCardView[]): TyreCardView | null => cards.reduce<TyreCardView | null>((low, card) => (low === null || card.forFourCents < low.forFourCents ? card : low), null)
    const same = lowest(offer.same)
    const pair = lowest(offer.pairs.flatMap((item) => item.cards))

    return {
        ready: offer.refusal === null,
        refusal: offer.refusal,
        refusalCode: offer.refusalCode,
        from: same?.perWheel ?? pair?.forFour ?? null,
        fromUnit: same !== null ? 'pro Rad' : 'für 2 + 2',
        // The fee nobody has named: the page then promises no mounting in its figure.
        priceOpen: offer.priceOpen,
    }
}

export interface TyreFilter {
    seasons: string[]
    brands: string[]
    band: string
}

export function filterCards(cards: TyreCardView[], filter: TyreFilter, bands: PriceBand[]): TyreCardView[] {
    const band = bands.find((b) => b.value === filter.band) ?? null

    return cards.filter(
        (card) =>
            (filter.seasons.length === 0 || filter.seasons.includes(card.season)) &&
            (filter.brands.length === 0 || card.brands.some((brand) => filter.brands.includes(brand))) &&
            (band === null || ((band.from === null || card.setCents > band.from) && (band.to === null || card.setCents <= band.to))),
    )
}

export function sortCards(cards: TyreCardView[], sort: TyreSort): TyreCardView[] {
    return [...cards].sort((a, b) => {
        if (sort === 'marke') {
            return (a.brands[0] ?? '').localeCompare(b.brands[0] ?? '', 'de') || (a.name ?? '').localeCompare(b.name ?? '', 'de') || a.setCents - b.setCents
        }

        return sort === 'preis-ab' ? b.setCents - a.setCents : a.setCents - b.setCents
    })
}

/* In euros, whole fifties: a price range reads as one, and a limit never cuts between two tyres a cent apart. */
function roundedDown(cents: number): number {
    return cents - (cents % 5000)
}

/**
 * Up to three price ranges for the tyres on the page, cut at their thirds and rounded. None where a choice would say nothing: three
 * tyres or fewer, or ranges of one price. Never a range nothing falls in.
 */
export function priceBands(cards: TyreCardView[]): PriceBand[] {
    const prices = [...cards.map((card) => card.setCents)].sort((a, b) => a - b)

    if (prices.length < 4) {
        return []
    }

    const low = roundedDown(prices[Math.floor(prices.length / 3)] ?? 0)
    const high = roundedDown(prices[Math.floor((prices.length * 2) / 3)] ?? 0)
    const within = (from: number | null, to: number | null): boolean => prices.some((p) => (from === null || p > from) && (to === null || p <= to))
    const bands: PriceBand[] = []

    if (low > 0 && within(null, low)) {
        bands.push({ value: `bis-${low}`, label: `bis ${formatMoney(low, true)}`, from: null, to: low })
    }

    if (high > low && within(low, high)) {
        bands.push({ value: `${low}-${high}`, label: `${formatMoney(low, true)} bis ${formatMoney(high, true)}`, from: low, to: high })
    }

    const top = high > low ? high : low

    if (top > 0 && within(top, null)) {
        bands.push({ value: `ueber-${top}`, label: `über ${formatMoney(top, true)}`, from: top, to: null })
    }

    return bands.length > 1 ? bands : []
}

/** The extras start empty: nothing chosen for the customer (§ 312a Abs. 3 BGB, D-355), and the sensors asked, never assumed. */
export function initialExtras(): { colourId: number | null; rdks: Rdks } {
    return { colourId: null, rdks: null }
}

/** The colour the server puts in where none is chosen: the standard one, if it costs nothing (Basket::freeStandardColour, D-355). */
export function freeStandardColour<T extends { isDefault: boolean; surchargeCents: number }>(colours: T[]): T | null {
    const standard = colours.find((colour) => colour.isDefault) ?? colours[0] ?? null

    return standard?.surchargeCents === 0 ? standard : null
}

/**
 * What „Weiter: Warenkorb“ still waits for, in a sentence, or null: the answer on the sensors (the client's change of 05.11.2026), and
 * the weights' colour where none comes free, which the basket would refuse only after the customer got there.
 */
export function extrasHint(tpms: KomplettradOptionsProp['tpms'] | null | undefined, rdks: Rdks, colours: KomplettradOptionsProp['colours'] = [], colourId: number | null = null): string | null {
    const sensors = tpms !== null && tpms !== undefined && rdks === null
    const colour = colours.length > 0 && colourId === null && freeStandardColour(colours) === null

    if (sensors && colour) {
        return 'Wähl zuerst eine Farbe für die Wuchtgewichte und sag uns, ob du RDKS-Sensoren brauchst.'
    }

    if (colour) {
        return 'Wähl zuerst eine Farbe für die Wuchtgewichte.'
    }

    return sensors ? 'Sag uns zuerst, ob du RDKS-Sensoren brauchst.' : null
}

export function extrasAnswered(tpms: KomplettradOptionsProp['tpms'] | null | undefined, rdks: Rdks, colours: KomplettradOptionsProp['colours'] = [], colourId: number | null = null): boolean {
    return extrasHint(tpms, rdks, colours, colourId) === null
}

export function priceWith(card: TyreCardView, colourId: number | null): { forFourCents: number; forFour: string } {
    return card.prices.find((p) => p.colourId === colourId) ?? { forFourCents: card.forFourCents, forFour: card.forFour }
}

export interface BasketLine {
    label: string
    detail: string
    price: string
}

export interface FlowSum {
    lines: BasketLine[]
    /** What the basket will charge for it, sensors included. */
    totalCents: number
    /** The fee nobody has named yet: said, and left out of the sum (D-032). */
    open: boolean
}

/**
 * The Komplettrad as its lines: rims, tyres, mounting, the weights' colour, the sensors where asked for. The server's figures, each its
 * own; the sum is the set's own figure with the colour chosen, plus the sensors.
 */
export function flowSum(
    config: ProduktConfig,
    card: TyreCardView,
    mounting: { each: string; total: string } | null,
    colour: (BasketWeightOption & { surchargeForFour?: string }) | null,
    tpms: KomplettradOptionsProp['tpms'] | null | undefined,
    rdks: Rdks,
    /** Wheels of Kompletträder in the basket already: the one answer on the sensors goes for them too (D-411). */
    wheelsInBasket = 0,
): FlowSum {
    const tyres = card.sides.map((side) => `${side.axle === null ? '4 ×' : side.axle === 'vorne und hinten' ? '2 + 2 ×' : `2 × ${side.axle}`} ${side.size}`).join(' · ')
    const lines: BasketLine[] = [
        { label: '4 Felgen', detail: config.fullLabel, price: config.priceForFour ?? '' },
        { label: `4 Reifen ${[card.brands.join(' · '), card.name].filter(Boolean).join(' ')}`, detail: tyres, price: card.set },
        { label: 'Montage und Auswuchten', detail: mounting === null ? 'Der Preis dafür steht noch nicht fest.' : `4 Räder, je ${mounting.each}`, price: mounting?.total ?? '–' },
    ]

    if (colour !== null) {
        lines.push({ label: `Wuchtgewichte ${colour.name}`, detail: colour.surchargeCents === 0 ? 'für 4 Räder' : `für 4 Räder, je ${colour.surcharge}`, price: colour.surchargeCents === 0 ? 'ohne Aufpreis' : (colour.surchargeForFour ?? colour.surcharge) })
    }

    const sensors = rdks === 'ja' && tpms?.available === true

    if (sensors) {
        lines.push({ label: 'RDKS-Sensoren', detail: `${tpms.line ?? ''}, ${wheelsInBasket > 0 ? 'für alle Räder im Warenkorb' : 'gleich mit eingesetzt'}`, price: tpms.yesTotal ?? '' })
    }

    return {
        lines,
        totalCents: priceWith(card, colour?.id ?? null).forFourCents + (sensors ? (tpms.yesTotalCents ?? 0) : 0),
        open: mounting === null,
    }
}
