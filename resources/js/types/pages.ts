/**
 * Page props, declared once and used three times each — by `Index.vue`, which forwards them, and
 * by the `Desktop.vue` and `Mobile.vue` that render them.
 *
 * Declaring them here rather than per file is what makes a renamed controller key a build failure
 * instead of an empty section nobody notices until a client review. The two device variants of a
 * page always receive exactly the same data: the split is presentation, never content.
 */

import type {
    BasketLine,
    BasketTotals,
    BasketTpms,
    BasketWeightOption,
    ConditionGroupsView,
    ContactProp,
    Facets,
    ImageManifest,
    ProductCardProp,
    VerdictStatus,
} from './rimify'

export interface MakeOption {
    make: string
    models: number
}

export interface ModelOption {
    model: string
    variants: number
}

export interface VariantOption {
    id: number
    variant: string
    typeDesignation: string | null
    keyNumbers: string
    hsn: string
    tsn: string
    vsn: string | null
    buildWindow: string
    /** Whether `buildWindow` names one; beside a Feld K line an unknown one is left out. */
    buildKnown?: boolean
    powerPs: number | null
    bodyForm: string | null
    /** Shown, never hidden: an incomplete row is named as incomplete rather than guessed at. */
    needsReview: boolean
    /** `Feld K: e1*2007/46*0283, ab *04` — a car without key numbers, told apart from its twin by its papers. */
    approval?: string | null
    /** `Feld K ab *04` — the range alone, where a line has no room for the number. */
    approvalShort?: string | null
    [key: string]: unknown
}

/**
 * The hero's photograph (PROTECTED.md P1): a brand asset chosen in Inhalte › Seiten › Startseite, there with or without
 * a catalogue (`App\Support\HeroPhotos`). The licensed cut-out with its anchors and stamp, the same wheel in its other
 * finish behind it, and what it shows, for the alt text.
 */
export interface HeroPhoto {
    brand: string
    name: string
    finish: string
    imageManifest: ImageManifest | null
    companion?: { finish: string; imageManifest: ImageManifest } | null
    /**
     * The photographed wheel's values as its document states them for the stamped size — the leaders, the caption and
     * the spec line — in every state of the catalogue (the client's #4: the hero asks the catalogue nothing). Null where
     * the photograph's record names none; absent in an older fixture.
     */
    facts?: HeroProduct['facts'] | null
}

/**
 * The wheel in the hero's photograph, once it is published: one configuration's own values
 * (`StartseiteController::heroConfig`, docs/phase0/ACCURACY.md §3.0 and §4) — for the numbers section (H8) and the band.
 * Null with the catalogue empty or the wheel a draft (D-155); the hero itself stands on the photograph's own values.
 */
export interface HeroProduct {
    slug: string
    name: string
    brand: string
    finish: string
    fromPriceCents: number
    fromPrice: string
    /**
     * The hero finish's own cut-out (`wheel_finishes.image_manifest`): the square frame with its
     * `anchors`, the shadowless `bare` frame, the `stamp` read off the wheel, and the 4:3 frame
     * under `wide`. Null (the server always sends the key) or absent (a fixture): no photograph,
     * and the hero draws the outline.
     */
    imageManifest?: ImageManifest | null
    /**
     * The same wheel in its other photographed finish (the Borbet DB8GT2: Bronze matt beside Schwarz matt), drawn behind
     * the leading wheel and rolling in a beat after it; no callouts. Null or absent: one wheel.
     */
    companion?: { finish: string; imageManifest: ImageManifest } | null
    /** True when there is no photograph of this product: the outline is drawn and no product is named. */
    symbolic: boolean
    /**
     * In the shop at a price. False for a published wheel still priced at zero: its photograph and its
     * values are shown, never a price or a link. Absent (an older fixture) reads as true.
     */
    published?: boolean
    config: {
        widthIn: number
        diameterIn: number
        etMm: number
        boltHoles: number
        boltCircleMm: number
        centreBoreMm: number
    }
    /** The configuration's facts, formatted on the server by GermanFormat (R-10). */
    facts: {
        /** `8,5J` */
        width: string
        /** `19` */
        diameter: string
        /** `ET 45` */
        et: string
        /** `5 × 112` */
        boltPattern: string
        /** `66,6 mm` */
        centreBore: string
        /** `53810` — only when the photographed stamp belongs to this configuration. */
        kba: string | null
        /** `620 kg` — only when verified. */
        maxLoad: string | null
        /** `8,5J × 19 · ET 45 · LK 5 × 112 · MLB 66,6 mm · Traglast 620 kg` */
        specLine: string
    }
}

export interface HomeStats {
    gutachten: number
    variants: number
    wheels: number
    brands: number
}

export type TyreClass = 'A' | 'B' | 'C' | 'D' | 'E'

export interface EuTyreLabel {
    title: string
    fuel: TyreClass
    wet: TyreClass
    noiseDb: number
    noiseClass: 'A' | 'B' | 'C'
    /** The label's pictograms, as on record (D-302). */
    snowGrip: boolean
    iceGrip: boolean
    eprelId: string | null
}

/** The vehicle's original size, the calculator's *Aktuell* — real data from the documents, or null. */
export interface CalculatorPrefill {
    widthIn: number
    diameterIn: number
    etMm: number
    tyreWidth: number
    aspect: number
}

/** One side of the calculator, as `lib/fitmentMath`'s `WheelSetup` writes it. */
export interface RechnerSetup {
    widthIn: number
    diameterIn: number
    etMm: number
    tyreWidthMm: number
    aspect: number
}

/**
 * /felgenrechner: the vehicle's prefill as the homepage has it, and the comparison a shared link
 * carried in `?rechner=` — parsed on the server so the first paint already shows it; null when
 * the parameter is absent or not something the form offers (never an error page).
 */
export interface FelgenrechnerProps {
    prefill: CalculatorPrefill | null
    state: { current: RechnerSetup; next: RechnerSetup } | null
}

/** A photographed wheel for the dark band (#9): the shadowless cut-out and where the wheel is in it, in fractions. */
export interface BandWheel {
    brand: string
    name: string
    finish: string
    image: ImageManifest
    anchor: { x: number; y: number; r: number }
    /** The wheel's own page: it is in the shop (the client's #9). Absent in an older fixture. */
    href?: string | null
}

export interface GuideTeaser {
    slug: string
    title: string
    teaser: string
    minutes: number
}

export interface FaqPreview {
    id: number
    question: string
    answer: string
}

/**
 * The homepage. `garage`, `vehicle`, `serviceStatus` and `contact` come from the shared props;
 * everything here is data from the database or the configuration — nothing on the page is typed
 * into a template (docs/design/sections/home.md §0.7).
 */
export interface StartseiteProps {
    hero: {
        title: string
        subline: string
        /** The phone document's shorter sentence; the desktop one when absent. */
        sublineMobile?: string
        /** Null only where the release shipped without the photograph (rimify:smoke reports it); absent in an older fixture. */
        photo?: HeroPhoto | null
    }
    /** The counts the story (H4) shows. */
    stats: HomeStats
    /** The wheel in the hero's photograph where the shop sells it, for the numbers section (H8); null otherwise. */
    photoWheel: HeroProduct | null
    selector: { makes: MakeOption[] }
    /** F1 for the shared vehicle, in the first paint; null without a vehicle. `shopEmpty`: no wheel published at all. */
    fitmentCount: { count: number; permitted: number; conditional: number; shopEmpty?: boolean } | null
    promises: { title: string; text: string; icon: string }[]
    /**
     * The shelf (the client's #5): „Meistgekaufte Felgen“ by the paid order lines of the last 90 days, or before the
     * first sale „Neu im Shop“, newest first. With a vehicle the cards are that car's answer. Null — no shelf at all —
     * while fewer than four wheels are on sale.
     */
    popular: {
        title: string
        ranking: 'meistgekauft' | 'neu'
        cards: ProductCardProp[]
        /** The listing's count for the vehicle; null without one. */
        total: number | null
    } | null
    /** No wheel on sale at all (a test environment reset to an empty shop). */
    shopEmpty: boolean
    recentlyViewed: ProductCardProp[]
    /** `fitting`: how many of the size's models a document permits on the vehicle; null without one. */
    sizes: { inch: number; count: number; fitting: number | null; href: string }[]
    /**
     * Every wheel brand (`brands.is_wheel_brand`), stock or not, plus any brand with a published
     * model that has an in-stock configuration. `count`: published models with stock, 0 allowed;
     * `href`: the listing link, null when there is nothing to list — a brand without stock is
     * greyed and is never a link (CLAUDE.md §2).
     * `logo`: absolute path to a one-colour, transparent, tight-bounds file used as a CSS mask;
     * `logoAspect`: its width / height, 3 decimals — both null when there is no usable logo. The
     * sample range (`slug` `demo`) never has one (docs/design/sections/home-brands.md §4.2).
     */
    brands: { name: string; slug: string; logo: string | null; logoAspect: number | null; count: number; href: string | null }[]
    /** `wheel`: the photographed wheel that turns in the dark band (#9), null where none is photographed. */
    komplettrad: { tyre: EuTyreLabel | null; wheel?: BandWheel | null }
    calculator: { prefill: CalculatorPrefill | null }
    partners: { enabled: boolean; demo: boolean }
    guides: GuideTeaser[]
    faq: FaqPreview[]
    /**
     * True while any published wheel model is seeded demo data (`wheel_models.is_demo`). The page
     * then shows the *Demodaten* note; the flag disappears with the rows before launch.
     */
    demo: boolean
}

export interface SelectorProps {
    makes: MakeOption[]
    models: ModelOption[]
    variants: VariantOption[]
    selectedMake: string | null
    selectedModel: string | null
}

/** The RIMIFY-Check (#28): the car's selector, the wheel's three choices, and the answer for the pair. */
export interface CheckProps extends SelectorProps {
    wheelBrands: { slug: string; name: string }[]
    wheelModels: { slug: string; name: string }[]
    /** The wheel's finishes (`ausfuehrung`), chosen on their own. */
    wheelFinishes?: { id: number; name: string }[]
    /** `8,5J × 19 · ET 35`, one per configuration of the chosen finish. */
    wheelSizes: { id: number; label: string }[]
    chosen: { brand: string | null; wheel: string | null; finish?: number | null; size: number | null }
    /** A link naming a wheel (`felge`) or a size (`groesse`) the shop no longer has: which of the two. */
    notFound?: 'wheel' | 'size' | null
    /** „Ändern“ pressed on a chosen car (`aendern=1`): the selector stays open through its drill steps. */
    changing?: boolean
    /** Only for a pair: a car and one size of one wheel. The product page's own row, built by the same code. */
    answer: CheckAnswer | null
}

export interface CheckAnswer {
    product: { slug: string; brandName: string; modelName: string; finishId: number; finishName: string }
    config: ProduktConfig
    komplettradOptions: KomplettradOptionsProp | null
}

/**
 * What a key-number lookup flashes back.
 *
 * `ambiguous` is not an error state. More than one car behind one pair of key numbers is ordinary,
 * and the chooser it opens is a confirmation — `1860`/`AAS` is two Audi RS 4 Avants whose top
 * speeds differ by 10 km/h, which is exactly the field the legal tyre requirement turns on.
 */
export interface LookupResult {
    /** `closed`: no vehicle dataset is loaded, the search by key numbers is not open yet (KeyNumberSearch). */
    status: 'ambiguous' | 'not_found' | 'closed'
    hsn: string
    tsn: string
    distinction?: {
        required: boolean
        /** Nothing displayable differs — the VSN and the reading help are all we honestly have. */
        indistinguishable: boolean
        attributes: string[]
        labels: Record<string, string>
        rows: {
            id: number
            label: string
            vsn: string | null
            values: Record<string, string>
        }[]
    }
}

export interface FelgenProps {
    hasVehicle: boolean
    cards: ProductCardProp[]
    total: number | null
    /** What the filters narrowed from — the range, or the car's wheels, unfiltered; null while no filter is set. */
    unfiltered?: number | null
    facets: Facets
    filters: Record<string, unknown>
    page?: number
    /** True while any published wheel model is seeded demo data; the listing shows the *Demodaten* note. */
    demo: boolean
    /** Those demo wheels are the acceptance set and sold here with the test payment: the note says that instead. */
    acceptance?: boolean
    /** What of the chosen car the page's answers wait for — `bodyForm`, `driveAxle` (§1.1). Additive. */
    missing?: string[]
    /** The fields of the car's papers its tyres wait for — `8.1`, `8.2`, `T` (D-286). Additive. */
    owed?: string[]
}

export interface ProduktProps {
    product: {
        modelId: number
        slug: string
        modelName: string
        brandName: string
        typeDesignation: string | null
        descriptionDe: string | null
        spokes: number
        rating: number | null
        ratingCount: number
        ratingLabel: string | null
        /** GPSR, as entered per brand; null (or absent in older fixtures) until it is. */
        manufacturer?: {
            name: string
            address: string
            contact: string
            euResponsible: { name: string; address: string | null; contact: string | null } | null
            safetyNote: string | null
        } | null
        /** While the wheel has no reviews, what the page can prove instead: its released documents and the cars (D-103). */
        proof?: { gutachten: number; variants: number }
    }
    /** The buyers' visible reviews, newest first (D-103). The rating is computed from them alone. */
    reviews?: ProductReview[]
    /** `image`: the finish's own studio photograph and its other angles, or null — then it is drawn. */
    finishes: { id: number; name: string; hex: string | null; artFinish: string; image: ImageManifest | null }[]
    configs: ProduktConfig[]
    hasVehicle: boolean
    /** `Lieferzeit 3–5 Werktage · Versand 4,90 €` (Shipping::summary): only what is given; null while nothing is. */
    shipping?: string | null
    /** What goes with a Komplettrad (#15): the active Wuchtgewichte colours and the RDKS question for a set; null without a car. */
    komplettradOptions?: KomplettradOptionsProp | null
}

export interface KomplettradOptionsProp {
    colours: BasketWeightOption[]
    /** The basket's own RDKS block for the set this page adds; `yesTotal` is what „Ja“ would add. */
    tpms: BasketTpms & { yesTotal: string | null }
}

/** One buyer's review as the product page shows it: no name, a verified purchase by construction (D-103). */
export interface ProductReview {
    id: number
    rating: number
    body: string | null
    at: string | null
    reply: string | null
}

/** One amount the product page offers and its price, `{quantity: 4, cents: 91600, text: '916,00 €'}`. */
export interface AmountPrice {
    quantity: number
    cents: number
    text: string
}

export interface ProduktConfig {
    id: number
    finishId: number
    sku: string
    diameterIn: number
    widthIn: number
    etMm: number
    sizeLabel: string
    fullLabel: string
    boltPattern: string
    /** The rim's own bore, `66,5 mm`. The bore a document states for the chosen car is in the verdict. */
    centreBore: string
    /** `H2` — the hump designation the wheel's approval prints; null where the record holds none. */
    hump?: string | null
    /** ONE rim (docs/specs/komplettrad.md §9). */
    priceCents: number
    price: string
    /** The set of four, formatted on the server; the page never multiplies cents. */
    priceForFour?: string
    /** The price of each amount the page offers (1–8), from LinePrice on the server (D-102): the browser only picks. */
    amounts?: AmountPrice[]
    /** Available or not, never a count (his admin item 7, D-299). */
    inStock: boolean
    kbaNumber: string | null
    weightG: number | null
    /** Null when no vehicle is chosen. Price, stock and verdict travel together, by design. */
    verdict: ConfigVerdict | null
    /**
     * The Komplettrad offer for this configuration, decided and priced on the server, travelling
     * with the price and the verdict so a size change swaps all of them in one commit. Absent only
     * in fixtures written before it existed; the server always sends it.
     */
    komplettrad?: KomplettradOfferProp | null
    /** Mischbereifung (#20, D-105): null where the document prints no pairing table — the page says nothing then. */
    mischbereifung?: MischbereifungProp | null
}

/**
 * What the Gutachten asks of this car, as the customer works through it (Block D, item 15): the Auflagen by
 * section — Abnahme, Arbeiten am Fahrzeug (with the millimetres for this Fahrzeugtyp), Befestigung, Reifen,
 * Hinweise — the bolts with their torque, each tyre size with its axle and printed minimum, and the document's
 * notes. Every line is a sentence of the answer's own documents.
 */
export interface FitmentDetailView {
    /**
     * `sizes`: the sizes a sentence belongs to where the document hangs it off some of the car's sizes, not all
     * (empty: every size). `own`: RIMIFY's sentence (the kW band), not the document's.
     */
    sections: { title: string; items: { text: string; measures: string[]; sizes?: string[]; own?: boolean }[] }[]
    /** `number`: the code the document's sentence names the set by (`S01`), null where it names it by type. */
    fasteners: { number?: string | null; thread: string; label: string; torque: string | null; article: string | null; limit: string | null }[]
    tyres: { label: string; axle: string; minimum: string | null; band: string | null }[]
    notices: string[]
    /**
     * The documents' sentences as printed, with their page, no section and nothing left out (#21). `sizes` as in
     * `sections`: the one thing kept with a sentence, so two sizes' sentences never stand in one list. Additive.
     */
    original?: { text: string; page: number | null; sizes?: string[] }[]
}

export interface ConfigVerdict {
    status: VerdictStatus
    label: string
    /** Every Auflage a Hinweis (#23, D-104): „Freigegeben“, quietly „mit Hinweisen“. Additive. */
    notesOnly?: boolean
    sellable: boolean
    /**
     * The rim alone sells while the tyres wait for the car's papers, where the wheel's own approval does not (D-289) —
     * never a Komplettrad. Additive.
     */
    rimSellable?: boolean
    requiresEntry: boolean
    /** The document frees the papers from correction (§ 15 FZV): its own line (resources/js/fitment/papers.ts). Additive. */
    papersExempt?: boolean
    /** Additive: null for a wheel that may not go on the car, absent in an older payload. */
    detail?: FitmentDetailView | null
    entryNoteDe: string | null
    /** Full German sentences, never codes such as A02 (R-15) — every Auflage once, for counting. */
    conditions: string[]
    /** What the customer reads: the combination's once, each tyre size's with that size (ConditionGroups). Additive. */
    conditionGroups?: ConditionGroupsView
    /** Compare: only what holds for every size is in `conditions`; more depend on the size. Additive. */
    conditionsVary?: boolean
    /** Compare: the Abnahme or Eintragung depends on the size. Additive. */
    entryVaries?: boolean
    /**
     * `66,6 mm` — the Mittenlochbohrung the covering documents state for THIS car, additive and
     * optional. Null where they state none (`UNSTATED`) or name different ones (`CONFLICTING`):
     * the page then shows the rim's own figure, labelled as the rim's, and never silently
     * substitutes it for the document's.
     */
    centreBore?: string | null
    centreBoreSource?: 'DOCUMENT' | 'UNSTATED' | 'CONFLICTING'
    reason: string | null
    reasonCode: string | null
    /** What of the car an UNKNOWN answer waits for — `bodyForm`, `driveAxle` — asked for by name (§1.1). Additive. */
    missing?: string[]
    /**
     * pdf: the Gutachten itself, at the page the answer stands on; absent where no file is stored.
     * others: the further documents the answer rests on, named (the corrections memo §3).
     * notes: full sentences about the document itself — a Nachtrag without its base, the month a wheel
     * must be made from (§4).
     */
    document: {
        number: string | null
        issuer: string | null
        kind: string
        pdf?: { url: string; page: number | null } | null
        others?: string[]
        notes?: string[]
        /** An example document (decision 6, D-239): marked where it is shown, opened through its marked page. */
        example?: boolean
    } | null
    tyreSizes: string[]
    /* docs/specs/komplettrad.md §3.4 — the tyre side of the verdict, additive and optional. */
    /** `245/45 R18` per axle; `tyreSizes` above stays the front list. */
    tyreSizesFront?: string[]
    tyreSizesRear?: string[]
    tyreLayout?: 'SAME' | 'MIXED'
    /** The stricter axle's minimum; null while the engine could not derive one (R-03). */
    minLoadIndex?: number | null
    minSpeedSymbol?: string | null
    /** Which side of R-06 governed — combined, and per half, because a document may state only one. */
    minSource?: 'DOCUMENT' | 'DERIVED' | 'PAPERS'
    minLoadSource?: 'DOCUMENT' | 'DERIVED' | 'PAPERS'
    minSpeedSource?: 'DOCUMENT' | 'DERIVED' | 'PAPERS'
    /** `Für dein Fahrzeug brauchen die Reifen mindestens …` — a full sentence, never a bare number pair. */
    minSentence?: string | null
    /**
     * The two halves of the answer (R-03 as amended on 28.09.2026): the wheel, from the document alone,
     * and the tyres, from the car's axle loads (8.1, 8.2) and top speed (T). `status` is the weaker.
     * Absent on a negative verdict.
     */
    wheelStatus?: VerdictStatus | null
    wheelLabel?: string | null
    tyre?: {
        status: VerdictStatus
        label: string
        /** Full German sentences: the document's limits and the fields to compare, or the sum. */
        lines: string[]
        thresholds: { text: string; maxAxleLoad: string }[]
        fromVehicleData: boolean
        /** Always shown, with the car's figures: the binding axle and what it asks for — or why not. */
        summary?: string | null
        /** The document it came from: `Grundlage: Tabelle auf Seite 6 im Gutachten 55255.` */
        basis?: string | null
        /** The sum („So haben wir gerechnet“) open at once: a no, or the customer's figures made it stricter. */
        open?: boolean
        /**
         * The fields of the papers the answer waits for — `8.1`, `8.2`, `T` — where the tyres are „Noch nicht bestätigt“ for
         * want of them (D-286): the way on is the customer's own Zulassungsbescheinigung. Additive.
         */
        owed?: string[]
    } | null
}

/**
 * Why no Komplettrad is offered: the engine's thirteen cases (`KomplettradRefusal`) plus the one
 * arm the storefront raises itself when no active Wuchtgewichte colour exists. The code picks the
 * route forward; the customer only ever reads the sentence beside it (R-15).
 */
export type KomplettradRefusalCode =
    | 'NO_VEHICLE'
    | 'VERDICT_NOT_PERMITTED'
    | 'VERDICT_UNKNOWN'
    | 'TYRES_UNKNOWN'
    | 'TYRES_AWAIT_PAPERS'
    | 'TYRES_NOT_PERMITTED'
    | 'VERDICT_RESTORED'
    | 'NO_PERMITTED_SIZES'
    | 'NO_USABLE_MINIMUM'
    | 'STAGGERED_LAYOUT'
    | 'TYRE_CHOICE_RESTRICTED'
    | 'DIAMETER_MISMATCH'
    | 'SIZE_NOT_PERMITTED'
    | 'BELOW_MINIMUM'
    | 'OUT_OF_STOCK'
    | 'NO_TYRE_AVAILABLE'
    | 'NO_SAME_SIZE_COMBINATION'
    | 'SIZE_NOT_A_COMBINATION'
    | 'NO_WEIGHT_COLOUR'

/**
 * A tyre's EU label as the server sends it (Basket::euLabel): a class not on record is null, never invented; the
 * snow and ice pictograms true only where „ja“ is on record (D-302).
 */
export interface TyreLabelProp {
    fuel: string | null
    wetGrip: string | null
    noiseDb: number | null
    noiseClass: string | null
    snowGrip: boolean | null
    iceGrip: boolean | null
    eprelId: string
}

/** One tyre the verdict permits on the chosen configuration, priced per wheel on the server. */
export interface KomplettradTyreProp {
    id: number
    brandName: string
    name: string
    season: 'sommer' | 'winter' | 'ganzjahres'
    /** `Sommerreifen` */
    seasonLabel: string
    /** `245/45 R18 100Y` */
    sizeLabel: string
    /** The tyre alone, per tyre. */
    tyrePriceCents: number
    tyrePrice: string
    /** Rim + tyre + mounting + weights for ONE wheel: the known components, an unpriced one left out. */
    perWheelCents: number
    perWheel: string
    /** `perWheel` × 4, formatted on the server (R-10); the page never multiplies cents. */
    forFourCents: number
    forFour: string
    /** The set priced with each active Wuchtgewichte colour (#15): the page picks the one chosen, never adds a surcharge. */
    prices?: { colourId: number; perWheel: string; forFourCents: number; forFour: string }[]
    /** The EU label, only where the tyre carries a verified EPREL id (ACCURACY D7). */
    label: TyreLabelProp | null
    isDemo: boolean
    /** The answer with this tyre fitted (#18): its size's Auflagen and Eintragung, as the basket line says them. Additive. */
    answer?: ConditionGroupsView | null
}

/**
 * The Komplettrad offer for one configuration (docs/specs/komplettrad.md §4.11). Either `tyres`
 * is non-empty or `refusal` carries the one German sentence saying why — never both empty, so no
 * surface can render an empty panel.
 */
export interface KomplettradOfferProp {
    refusal: string | null
    refusalCode: KomplettradRefusalCode | null
    minSentence: string | null
    /** A component of the price is not configured yet: the figure is the known sum and the page says so. */
    priceOpen: boolean
    /** What one click adds — a set. */
    quantity: number
    tyres: KomplettradTyreProp[]
}

/** One tyre set of a mixed pair: one maker's one line, front and rear, priced per wheel and for the 2 + 2 on the server. */
export interface MischbereifungSetProp {
    key: string
    frontTyreId: number
    rearTyreId: number
    brandName: string
    name: string
    seasonLabel: string
    /** `235/45 R19 95Y` */
    frontLabel: string
    rearLabel: string
    perWheelFront: string
    perWheelRear: string
    /** Two of each, from LinePrice on the server — the page never multiplies. */
    forFourCents: number
    forFour: string
    /** The set priced with each active Wuchtgewichte colour (PDP-07): the card shows the colour picked above it. */
    prices?: { colourId: number; perWheelFront: string; perWheelRear: string; forFourCents: number; forFour: string }[]
    isDemo: boolean
}

/** One front/rear pair the document's table permits for the car on this rim. */
export interface MischbereifungPairProp {
    key: string
    /** The table's entry number (`Nr. 8`). */
    number: number
    /** `235/45 R19` */
    front: string
    rear: string
    /** Each axle against its own load, and the axle that asks for more. */
    minSentence: string
    sets: MischbereifungSetProp[]
}

/** Mischbereifung for one configuration (D-105): pairs, or the one sentence saying why there are none. */
export interface MischbereifungProp {
    refusal: string | null
    refusalCode: string | null
    /** Wheels per axle one click adds. */
    perAxle: number
    /** The document's own words beyond the table: one maker, one profile per axle, the confirmation in the car. */
    rules: string | null
    /** The page of the pairs' numbering: the Auflage printing the table, or the document's own list of combinations (D-256). */
    sourcePage: number | null
    /** The page of the sentence `rules` comes from; absent from a payload rendered before D-256. */
    rulesPage?: number | null
    priceOpen: boolean
    pairs: MischbereifungPairProp[]
}

/** One column of `/vergleich`: the card plus the figures the table lines up (home-overhaul.md §2.6). */
export interface CompareItem extends ProductCardProp {
    specs: {
        /** `8 J × 18 · 8,5 J × 19` — one entry per distinct width × diameter. */
        sizes: string[]
        /** `ET 35 – ET 45`, or one value. */
        etRange: string
        /** `LK 5 × 112` */
        boltPattern: string
        /** `66,6 mm` */
        centreBore: string
        /** `example`: born demo — named as an example wherever it is shown (D-239). */
        documents: { kind: 'ABE' | 'Teilegutachten' | 'ECE' | 'EG-Genehmigung'; number: string | null; example?: boolean }[]
    }
    /** Merged toward caution across the model's configurations; null without a vehicle. */
    verdict: ConfigVerdict | null
    /** Decided on the server: the page never picks a size. */
    buy: { kind: 'basket'; configId: number; sizeLabel: string } | { kind: 'choose'; href: string } | { kind: 'none' }
}

export interface VergleichProps {
    items: CompareItem[]
    /** Keys that were asked for and are no longer in the range. */
    missing: number
    cap: 4
    /** Any product on the page is seeded demo data: the page carries the note once. */
    demo: boolean
}

/** A printable RIMIFY-Check as it was issued: frozen whole, every sentence of it (29.09.2026). */
export interface CheckResultView {
    status: VerdictStatus
    statusLabel: string
    /** Every Auflage a Hinweis (#23, D-104). Additive. */
    notesOnly?: boolean
    vehicle: string | null
    wheel: string | null
    /** The wheel half, where the verdict has one. */
    wheelLabel: string | null
    reason: string | null
    requiresEntry: boolean
    /** § 15 FZV as frozen with the answer: the papers need no correction. Additive. */
    papersExempt?: boolean
    entryNote: string | null
    conditions: string[]
    /** What is printed (ConditionGroups). Additive. */
    conditionGroups?: ConditionGroupsView
    front: string[]
    rear: string[]
    tyre: { statusLabel: string; summary: string | null; basis: string | null; lines: string[]; stricterByPapers: boolean } | null
    /** The figures the customer typed; one they were not asked for and did not give is null (D-291). */
    papers: { axleFrontKg: number | null; axleRearKg: number | null; topSpeedKmh: number | null; powerKw?: number | null } | null
    /** What the answer assumed that the vehicle data does not hold, and from where (G-02). Additive. */
    build?: { fact: string; value: string; source: string }[]
    document: { label: string; issuer: string | null; revision: number; page: number | null; example?: boolean } | null
    /** Said only when the document has changed since the result was issued. */
    documentToday: string | null
    issuedAt: string | null
    /** The last day the link opens this result; then it is deleted with the figures in it (D-292). Additive. */
    keptUntil?: string | null
}

export interface CheckErgebnisProps {
    token: string
    result: CheckResultView | null
    /** How long a result is kept, in months (CheckResult::KEEP_MONTHS, D-292). */
    keepMonths: number
    /** Kept, but its frozen answer can no longer be read: said as that, never as the expiry. Additive. */
    unreadable?: boolean
}

export interface BasketProps {
    lines: BasketLine[]
    totals: BasketTotals
}

/*
 * A page that passes `contact` passes the shared shape whole: the page prop replaces the shared
 * one, and the header and the footer read it too. Phone and WhatsApp are null until the client
 * gives them.
 */

export interface KasseProps extends BasketProps {
    contact: ContactProp
}

export interface BestellungProps {
    order: {
        number: string
        status: string
        statusLabel: string
        placedAt: string | null
        vehicleLabel: string | null
        keyNumbers: string | null
        subtotal: string
        shipping: string
        tax: string
        /** Written at a VAT rate of 0 (a Kleinunternehmer's order, § 19 UStG): no VAT line. */
        smallBusiness?: boolean
        total: string
        trackingCode: string | null
    }
    lines: {
        id: number
        kind: string
        kindLabel: string
        label: string
        quantity: number
        unitPrice: string
        lineTotal: string
        verdict: {
            status: VerdictStatus
            requiresEntry: boolean
            /** Every Auflage of the frozen answer a Hinweis (#23, D-104). Additive. */
            notesOnly?: boolean
            /** § 15 FZV as frozen at the purchase. Additive: an older order has none, and claims none. */
            papersExempt?: boolean
            documentRevision: number
            detail: Record<string, unknown>
            /** The Auflagen as the customer read them (ConditionGroups); null where the snapshot cannot be read. Additive. */
            conditionGroups?: ConditionGroupsView | null
            /** A rim sold alone (D-289): our own sentence as shown at the purchase, never among the Auflagen. Additive. */
            rimAloneNote?: string | null
        } | null
    }[]
    /** Where the payment stands; null on a seeded order. Only the provider's webhook ever makes it `paid`. */
    payment?: OrderPaymentState | null
    /** „Konto anlegen“ is offered: paid, this browser placed it, no account with a password yet. */
    accountOffer?: boolean
    /** The invoice as issued, by a signed link; null until one is. */
    invoice?: { number: string; href: string } | null
    contact: ContactProp
}

export interface OrderPaymentState {
    state: 'paid' | 'confirming' | 'processing' | 'failed' | 'closed'
    /** Keep asking /bestellung/{number}/status while the provider has not answered. */
    poll: boolean
    email: string | null
    /** The confirmation mail went out (audited); the page mentions it only then. */
    mailed?: boolean
    statusLabel?: string
}

export interface FaqProps {
    groups: { key: string; entries: { id: number; question: string; answer: string }[] }[]
    contact: ContactProp
}

export interface KontaktProps {
    contact: ContactProp
    /** What the page that linked here knew (#26): a subject and the path the visitor came from. */
    prefill?: { subject: string; from: string | null }
    /** When the server handed the form out, sealed (#12): sent back with the message. */
    ticket?: string
    /** The one address a copy of the message goes to: the signed-in customer's own, confirmed (D-218). Null for a guest. */
    copyTo?: string | null
}

export interface RechtlichesProps {
    tabs: { slug: string; title: string }[]
    active: string
    blocks: { id: number; type: string; data: Record<string, unknown> }[]
    /** The Impressum's facts from the seller data (§ 5 DDG), each null while not given; null on every other tab. */
    /** `placeholder`: the values are the admin's placeholders, shown here only, and marked. */
    provider?: { rows: { label: string; value: string | null }[]; complete: boolean; placeholder?: boolean; notice?: string } | null
    /** What the page says while the Kanzlei's text is outstanding: one sentence naming who prepares it (LegalTexts::PREPARING). */
    preparing: string
}

export interface AdminAnmeldenProps {
    stage: string
}

export interface AdminUebersichtProps {
    /** Only the figures of areas the viewer may open; `href` only where the list exists. */
    tiles: { key: string; label: string; value: string; hint: string; href: string | null }[]
    /** `26.09.2026, 13:40 Uhr` in Europe/Berlin — when the figures were counted. */
    asOf: string
}

export interface AdminGutachtenProps {
    documents: {
        id: number
        reportNumber: string
        kind: string
        issuer: string
        kbaNumber: string | null
        issuedOn: string | null
        revision: number
        status: string
        pageCount: number | null
        fitmentCount: number
        publishedCount: number
        /** Seeded as an example: the list says „Demodaten“ beside the number. */
        demo?: boolean
        href: string
    }[]
    can: { create: boolean }
}

export interface AdminBenachrichtigungenProps {
    /** `waiting`: confirmed, still subscribed, not yet told — the rail's count. `limit`: the list's cap. */
    summary: { waiting: number; total: number; limit: number }
    subscriptions: {
        id: number
        email: string
        vehicle: string
        keyNumbers: string
        status: string
        requestedAt: string
        notifiedAt: string | null
    }[]
    demand: { vehicle: string; keyNumbers: string; waiting: number }[]
}

export interface AdminRollenProps {
    roles: {
        id: number
        name: string
        label: string
        description: string | null
        isSystem: boolean
        users: number
    }[]
    modules: {
        module: string
        label: string
        actions: { action: string; label: string; roles: Record<number, boolean> }[]
    }[]
    /**
     * Whether this admin holds `roles × ändern`. It decides only whether the grid draws checkboxes
     * or ticks and dashes; the server refuses the write regardless (R-11).
     */
    can: { update: boolean }
}

/**
 * Wuchtgewichte-Farben (docs/specs/komplettrad.md §6.5). Prices arrive formatted by GermanFormat
 * beside their raw cents: the table prints the string, the form edits it, and nothing on the page
 * multiplies cents.
 */
export interface AdminWuchtgewichteProps {
    colours: {
        id: number
        nameDe: string
        /** Derived from the name on the server; never posted. */
        slug: string
        /** `#C8CCD2`, or null — then a neutral chip is drawn rather than a wrong colour. */
        swatchHex: string | null
        /** Per wheel, never per set. */
        surchargeCents: number
        /** `2,50 €` */
        surcharge: string
        isDefault: boolean
        active: boolean
        sortOrder: number
        /** Seeded as an example: the list says „Demodaten“ beside the name. */
        demo?: boolean
    }[]
    /**
     * `Montage und Auswuchten` per wheel — one shop-wide fee, edited on this page (§13, D-032).
     * `cents` is null while nobody has named one, and then no Komplettrad can be ordered at all.
     */
    mounting: { cents: number | null; typed: string }
    /** What the page may offer. The server refuses regardless (R-11); this only hides. */
    can: { create: boolean; update: boolean; delete: boolean }
}

/** RDKS-Sensorpreise je Marke (docs/specs/komplettrad.md §6.5): one price per car make, per sensor. */
export interface AdminRdksProps {
    prices: {
        id: number
        /** `volkswagen` — MakeName::key(), the only key a per-make price may use. */
        makeKey: string
        /** `Volkswagen` — what a human reads. */
        makeLabelDe: string
        priceCents: number
        /** `49,00 €` */
        price: string
        active: boolean
        /** Seeded as an example: the list says „Demodaten“ beside the make. */
        demo?: boolean
    }[]
    /** The makes present in `vehicles`, for the datalist. Free text stays allowed. */
    makes: string[]
    /**
     * What a make with no row above is charged per sensor (§13, D-030). `cents` is null while there
     * is no default, and then only the makes listed above can have sensors at all.
     */
    default: { cents: number | null; typed: string }
    can: { create: boolean; update: boolean; delete: boolean }
}

export interface AdminProfilProps {
    profile: {
        name: string
        email: string
        /** The German role label; null means the address stands in for it. */
        role: string | null
        /** `26.09.2026, 13:10` in Europe/Berlin, or null before the first sign-in was recorded. */
        lastLogin: string | null
        twoFactor: boolean
    }
}
