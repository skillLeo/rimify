import { describe, expect, it } from 'vitest'
import type { ImageManifest } from '../../Components/Ui/Picture.vue'
import type { KomplettradOptionsProp, KomplettradTyreProp, MischbereifungSetProp, ProduktConfig } from '../../types/pages'
import { extrasAnswered, extrasHint, filterCards, flowSum, freeStandardColour, initialExtras, offerOf, priceBands, priceWith, setSummary, sortCards, type TyreCardView } from './komplettradFlow'

/* The tyres a version offers as cards, the filters, the order and the sum (the Gutachten rework §9): only what the server sent is ever a card. */

function tyre(over: Partial<KomplettradTyreProp> = {}): KomplettradTyreProp {
    return {
        id: 7,
        brandName: 'Bridgestone',
        name: 'Potenza Sport',
        season: 'sommer',
        seasonLabel: 'Sommerreifen',
        sizeLabel: '245/45 R19 100Y',
        tyrePriceCents: 15_000,
        tyrePrice: '150,00 €',
        tyreSetCents: 60_000,
        tyreSet: '600,00 €',
        facts: 'Lastindex 100: bis 800 kg je Reifen · Y: bis 300 km/h',
        perWheelCents: 96_500,
        perWheel: '965,00 €',
        forFourCents: 386_000,
        forFour: '3.860,00 €',
        label: null,
        isDemo: false,
        ...over,
    }
}

function set(over: Partial<MischbereifungSetProp> = {}): MischbereifungSetProp {
    return {
        key: '7-8',
        frontTyreId: 7,
        rearTyreId: 8,
        brandName: 'Bridgestone',
        name: 'Potenza',
        rearBrandName: 'Bridgestone',
        rearName: 'Potenza',
        season: 'sommer',
        seasonLabel: 'Sommerreifen',
        frontTyrePrice: '140,00 €',
        rearTyrePrice: '160,00 €',
        tyreSetCents: 60_000,
        tyreSet: '600,00 €',
        frontFacts: 'Lastindex 88: bis 560 kg je Reifen',
        rearFacts: 'Lastindex 92: bis 630 kg je Reifen',
        frontLabel: '225/35 R19 88Y',
        rearLabel: '255/30 R19 92Y',
        perWheelFront: '950,00 €',
        perWheelRear: '990,00 €',
        forFourCents: 388_000,
        forFour: '3.880,00 €',
        isDemo: false,
        ...over,
    }
}

function config(over: Partial<ProduktConfig> = {}): ProduktConfig {
    return {
        id: 11,
        finishId: 1,
        sku: 'X',
        diameterIn: 19,
        widthIn: 8.5,
        etMm: 45,
        sizeLabel: '8,5J × 19 · ET 45',
        versionLabel: 'Breite 8,5J · ET 45 · Lochkreis 5 × 112',
        fullLabel: '8,5J × 19 · ET 45 · 5 × 112 · 66,5 mm',
        boltPattern: '5 × 112',
        centreBore: '66,5 mm',
        priceCents: 80_000,
        price: '800,00 €',
        priceForFour: '3.200,00 €',
        inStock: true,
        kbaNumber: null,
        weightG: null,
        verdict: null,
        komplettrad: { refusal: null, refusalCode: null, minSentence: 'Mindestens 100Y.', priceOpen: false, quantity: 4, tyres: [tyre()] },
        mischbereifung: null,
        ...over,
    } as ProduktConfig
}

const pairOf = (sets: MischbereifungSetProp[], over = {}) => ({ key: '1', number: 1, front: '225/35 R19', rear: '255/30 R19', sameSize: false, minSentence: 'Vorne 88Y, hinten 92Y.', noSet: null, sets, ...over })
const photo = (name: string): ImageManifest => ({ name, base: `/x/${name}`, width: 1, height: 1, widths: [1], placeholder: '', fallback: 'jpg' })

function card(over: Partial<TyreCardView> = {}): TyreCardView {
    return { key: 'k', mode: 'same', frontTyreId: 1, rearTyreId: null, brands: ['A'], name: 'M', season: 'sommer', seasonLabel: 'Sommerreifen', sides: [], setCents: 50_000, set: '500,00 €', each: '', unit: '', perWheel: null, forFourCents: 0, forFour: '', prices: [], photos: [], answer: null, isDemo: false, ...over }
}

describe('what a version offers', () => {
    it('makes a card of each tyre the server sent, and of nothing else', () => {
        const offer = offerOf(config(), {})

        expect(offer.same.map((c) => c.frontTyreId)).toEqual([7])
        expect(offer.same[0]).toMatchObject({ key: 't7', mode: 'same', rearTyreId: null, set: '600,00 €', each: '150,00 € je Reifen', unit: 'für 4 Reifen', name: 'Potenza Sport', brands: ['Bridgestone'] })
        expect(offer.same[0]!.sides).toEqual([{ axle: null, line: null, size: '245/45 R19 100Y', facts: 'Lastindex 100: bis 800 kg je Reifen · Y: bis 300 km/h', eu: null }])
        expect(offer.refusal).toBeNull()
    })

    it('hands a tyre its model’s photographs, and none of another’s: no picture, no photo', () => {
        const offer = offerOf(config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres: [tyre(), tyre({ id: 9, name: 'Andere' })] } }), { 7: [photo('eins')] })

        expect(offer.same.map((c) => c.photos.map((p) => p.name))).toEqual([['eins'], []])
    })

    it('shows a set per axle: both sizes, the combined price, a tyre’s price per axle', () => {
        const offer = offerOf(config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres: [], combinations: [pairOf([set()])], perAxle: 2 } }), {})

        expect(offer.listed).toBe(true)
        expect(offer.same).toEqual([])
        expect(offer.pairs[0]!.cards[0]).toMatchObject({ mode: 'mixed', frontTyreId: 7, rearTyreId: 8, set: '600,00 €', unit: 'für 2 vorne und 2 hinten', each: 'vorne 140,00 €, hinten 160,00 € je Reifen' })
        expect(offer.pairs[0]!.cards[0]!.sides.map((s) => [s.axle, s.size])).toEqual([['vorne', '225/35 R19 88Y'], ['hinten', '255/30 R19 92Y']])
    })

    it('says one tyre on both axles once, where a combination names one size', () => {
        const same = set({ rearTyreId: 7, rearLabel: '225/35 R19 88Y', rearTyrePrice: '140,00 €' })
        const offer = offerOf(config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres: [], combinations: [pairOf([same], { sameSize: true })], perAxle: 2 } }), {})
        const only = offer.pairs[0]!.cards[0]!

        expect(only.sides.map((s) => s.axle)).toEqual(['vorne und hinten'])
        expect(only.each).toBe('140,00 € je Reifen')
    })

    it('names each axle’s tyre where two lines stand on them (D-336)', () => {
        const two = set({ rearName: 'Turanza' })
        const offer = offerOf(config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres: [], combinations: [pairOf([two])], perAxle: 2 } }), {})
        const only = offer.pairs[0]!.cards[0]!

        expect(only.name).toBeNull()
        expect(only.sides.map((s) => s.line)).toEqual(['Potenza', 'Turanza'])
    })

    it('never shows a label with a class the regulation does not know: it is left out, not corrected', () => {
        const label = (fuel: string) => ({ fuel, wetGrip: 'A', noiseDb: 70, noiseClass: 'B', snowGrip: true, iceGrip: false, eprelId: '123' })
        const offer = offerOf(config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres: [tyre({ label: label('Z') as never }), tyre({ id: 8, label: label('B') as never })] } }), {})

        expect(offer.same[0]!.sides[0]!.eu).toBeNull()
        expect(offer.same[1]!.sides[0]!.eu).toMatchObject({ fuel: 'B', wet: 'A', noiseDb: 70, snowGrip: true, eprelId: '123' })
    })

    it('carries the server’s sentence where there is nothing to offer, never an empty list', () => {
        const refused = offerOf(config({ komplettrad: { refusal: 'Zuerst dein Fahrzeug.', refusalCode: 'NO_VEHICLE', minSentence: null, priceOpen: false, quantity: 4, tyres: [] } }), {})

        expect(refused).toMatchObject({ refusal: 'Zuerst dein Fahrzeug.', refusalCode: 'NO_VEHICLE' })
        expect(offerOf(config({ komplettrad: null }), {}).refusal).toContain('Passende Reifen')
    })

    it('lets the pairs stand where four alike are refused (#20), and says what is missing where they have no tyre', () => {
        const staggered = { refusal: 'Vier gleiche gibt es nicht.', refusalCode: 'STAGGERED_LAYOUT' as const, minSentence: null, priceOpen: false, quantity: 4, tyres: [] }
        const mix = (sets: MischbereifungSetProp[], noSet: string | null = null) => ({ refusal: null, refusalCode: null, perAxle: 2, rules: 'Ein Hersteller.', sourcePage: 3, priceOpen: false, pairs: [pairOf(sets, { noSet })] })

        expect(offerOf(config({ komplettrad: staggered, mischbereifung: mix([set()]) }), {})).toMatchObject({ refusal: null, rules: 'Ein Hersteller.', listed: false })
        expect(offerOf(config({ komplettrad: staggered, mischbereifung: mix([], 'Für die Hinterachse haben wir keinen Reifen.') }), {})).toMatchObject({ refusal: 'Für die Hinterachse haben wir keinen Reifen.', refusalCode: 'NO_TYRE_AVAILABLE' })
    })
})

describe('what the product page says of it', () => {
    it('names the lowest figure, per wheel, or the lowest 2 + 2 where only pairs stand', () => {
        const two = config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres: [tyre(), tyre({ id: 8, perWheel: '900,00 €', forFourCents: 360_000 })] } })
        const pairs = config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres: [], combinations: [pairOf([set(), set({ key: 'b', forFourCents: 300_000, forFour: '3.000,00 €' })])], perAxle: 2 } })

        expect(setSummary(two)).toMatchObject({ ready: true, from: '900,00 €', fromUnit: 'pro Rad' })
        expect(setSummary(pairs)).toMatchObject({ ready: true, from: '3.000,00 €', fromUnit: 'für 2 + 2' })
        expect(setSummary(null)).toMatchObject({ ready: false, from: null })
    })
})

describe('filters and the order', () => {
    const cards = [
        card({ key: 'a', brands: ['Continental'], season: 'sommer', setCents: 40_000 }),
        card({ key: 'b', brands: ['Bridgestone'], season: 'winter', setCents: 60_000 }),
        card({ key: 'c', brands: ['Continental'], season: 'winter', setCents: 80_000 }),
        card({ key: 'd', brands: ['Apollo', 'Bridgestone'], season: 'sommer', setCents: 90_000 }),
    ]
    const none = { seasons: [], brands: [], band: '' }

    it('narrows by season and by brand, and a set of two makers counts for each', () => {
        expect(filterCards(cards, { ...none, seasons: ['winter'] }, []).map((c) => c.key)).toEqual(['b', 'c'])
        expect(filterCards(cards, { ...none, brands: ['Bridgestone'] }, []).map((c) => c.key)).toEqual(['b', 'd'])
        expect(filterCards(cards, { ...none, seasons: ['sommer'], brands: ['Continental'] }, []).map((c) => c.key)).toEqual(['a'])
    })

    it('narrows by a price range on the tyres’ own price', () => {
        const bands = priceBands(cards)
        const middle = bands.find((b) => b.from !== null && b.to !== null)!

        expect(filterCards(cards, { ...none, band: middle.value }, bands).every((c) => c.setCents > middle.from! && c.setCents <= middle.to!)).toBe(true)
        expect(filterCards(cards, { ...none, band: 'gibt-es-nicht' }, bands)).toHaveLength(4)
    })

    it('sorts by price, either way, and by brand', () => {
        expect(sortCards(cards, 'preis-auf').map((c) => c.key)).toEqual(['a', 'b', 'c', 'd'])
        expect(sortCards(cards, 'preis-ab').map((c) => c.key)).toEqual(['d', 'c', 'b', 'a'])
        expect(sortCards(cards, 'marke').map((c) => c.brands[0])).toEqual(['Apollo', 'Bridgestone', 'Continental', 'Continental'])
        // The list it was given stays as it was.
        expect(cards[0]!.key).toBe('a')
    })

    it('offers price ranges only where they say something, and never one nothing falls in', () => {
        expect(priceBands(cards.slice(0, 3))).toEqual([])
        expect(priceBands(cards.map((c) => ({ ...c, setCents: 50_000 })))).toEqual([])

        const bands = priceBands(cards)

        expect(bands.length).toBeGreaterThan(1)

        for (const band of bands) {
            expect(filterCards(cards, { ...none, band: band.value }, bands).length).toBeGreaterThan(0)
        }

        // Every tyre falls in exactly one.
        expect(bands.map((band) => filterCards(cards, { ...none, band: band.value }, bands).length).reduce((a, b) => a + b, 0)).toBe(cards.length)
    })
})

describe('the extras', () => {
    const tpms = { applicable: true, quantity: 4, available: true, makeLabel: 'BMW', unitPriceCents: 4_900, unitPrice: '49,00 €', line: '4 × 49,00 €', choice: 'ja', totalCents: 0, total: '0,00 €', yesTotal: '196,00 €', yesTotalCents: 19_600, notice: null } as KomplettradOptionsProp['tpms']

    it('starts with nothing chosen for the customer: no paid extra, no answer', () => {
        expect(initialExtras()).toEqual({ colourId: null, rdks: null })
    })

    it('waits for the answer on the sensors, Mit or Ohne alike, and only where there is a question', () => {
        expect(extrasAnswered(tpms, null)).toBe(false)
        expect(extrasAnswered(tpms, 'ja')).toBe(true)
        expect(extrasAnswered(tpms, 'nein')).toBe(true)
        expect(extrasAnswered(null, null)).toBe(true)
    })

    it('waits for the weights’ colour too where none comes free: the basket would refuse only after the customer got there', () => {
        const paid = (id: number, isDefault = false) => ({ id, name: 'Schwarz', swatchHex: null, surchargeCents: 500, surcharge: '5,00 €', isDefault })
        const free = { id: 3, name: 'Silber', swatchHex: null, surchargeCents: 0, surcharge: '0,00 €', isDefault: true }

        expect(extrasHint(tpms, 'nein', [paid(1, true), paid(2)])).toBe('Wähl zuerst eine Farbe für die Wuchtgewichte.')
        expect(extrasHint(tpms, null, [paid(1, true), paid(2)])).toBe('Wähl zuerst eine Farbe für die Wuchtgewichte und sag uns, ob du RDKS-Sensoren brauchst.')
        expect(extrasHint(tpms, null, [free, paid(2)])).toBe('Sag uns zuerst, ob du RDKS-Sensoren brauchst.')
        expect(extrasAnswered(tpms, 'nein', [paid(1, true), paid(2)], 2)).toBe(true)
        expect(extrasAnswered(tpms, 'nein', [free, paid(2)])).toBe(true)
        // Without a colour marked, the first in the admin's order is the standard one, as on the server.
        expect(freeStandardColour([{ ...free, isDefault: false }, paid(2)])?.id).toBe(3)
        expect(freeStandardColour([paid(2), { ...free, isDefault: false }])).toBeNull()
    })

    it('adds up the lines to what the basket will charge: the set’s own figure in the colour, plus the sensors where asked for', () => {
        const priced = card({ brands: ['Bridgestone'], name: 'Potenza', set: '600,00 €', forFourCents: 386_000, sides: [{ axle: null, line: null, size: '245/45 R19 100Y', facts: '', eu: null }], prices: [{ colourId: 2, forFourCents: 388_000, forFour: '3.880,00 €' }] })
        const free = { id: 1, name: 'Silber', swatchHex: null, surchargeCents: 0, surcharge: '0,00 €', isDefault: true }
        const paid = { id: 2, name: 'Schwarz', swatchHex: null, surchargeCents: 500, surcharge: '5,00 €', surchargeForFour: '20,00 €', isDefault: false }
        const mounting = { each: '25,00 €', total: '100,00 €' }

        const plain = flowSum(config(), priced, mounting, free, tpms, 'nein')

        expect(plain.lines.map((l) => [l.label, l.price])).toEqual([
            ['4 Felgen', '3.200,00 €'],
            ['4 Reifen Bridgestone Potenza', '600,00 €'],
            ['Montage und Auswuchten', '100,00 €'],
            ['Wuchtgewichte Silber', 'ohne Aufpreis'],
        ])
        expect(plain.totalCents).toBe(386_000)
        expect(plain.open).toBe(false)

        const extras = flowSum(config(), priced, mounting, paid, tpms, 'ja')

        expect(extras.lines.map((l) => [l.label, l.price]).slice(3)).toEqual([['Wuchtgewichte Schwarz', '20,00 €'], ['RDKS-Sensoren', '196,00 €']])
        expect(extras.totalCents).toBe(388_000 + 19_600)
    })

    it('says a fee nobody has named, and leaves no figure for it', () => {
        const sum = flowSum(config(), card({ sides: [] }), null, null, null, null)

        expect(sum.open).toBe(true)
        expect(sum.lines.find((l) => l.label === 'Montage und Auswuchten')).toMatchObject({ price: '–', detail: 'Der Preis dafür steht noch nicht fest.' })
    })

    it('adds no sensors where none can be priced, whatever was answered', () => {
        const none = { ...tpms, available: false, yesTotal: null, yesTotalCents: null }
        const sum = flowSum(config(), card({ forFourCents: 100 }), null, null, none, 'ja')

        expect(sum.lines.some((l) => l.label === 'RDKS-Sensoren')).toBe(false)
        expect(sum.totalCents).toBe(100)
    })

    it('picks the set’s price in the colour chosen, and the standard colour’s without one', () => {
        const priced = card({ forFourCents: 1, forFour: 'a', prices: [{ colourId: 2, forFourCents: 2, forFour: 'b' }] })

        expect(priceWith(priced, 2)).toMatchObject({ forFourCents: 2, forFour: 'b' })
        expect(priceWith(priced, null)).toMatchObject({ forFourCents: 1, forFour: 'a' })
    })
})
