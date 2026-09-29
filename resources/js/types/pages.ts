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
 * The wheel the hero shows: an admin-chosen product and one configuration's own values
 * (`StartseiteController::heroConfig`, docs/phase0/ACCURACY.md §3.0 and §4).
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
    /** True when there is no photograph of this product: the outline is drawn and no product is named. */
    symbolic: boolean
    /**
     * In the shop at a price. False for the chosen wheel while it is a draft: its photograph and its
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

export interface PopularTab {
    key: 'beliebt' | 'neu' | 'bis200'
    label: string
}

export type TyreClass = 'A' | 'B' | 'C' | 'D' | 'E'

export interface EuTyreLabel {
    title: string
    fuel: TyreClass
    wet: TyreClass
    noiseDb: number
    noiseClass: 'A' | 'B' | 'C'
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
        product: HeroProduct | null
        stats: HomeStats
    }
    selector: { makes: MakeOption[] }
    /** F1 for the shared vehicle, in the first paint; null without a vehicle. */
    fitmentCount: { count: number; permitted: number; conditional: number } | null
    promises: { title: string; text: string; icon: string }[]
    popular: {
        /** Null with a vehicle: the heading then names the vehicle. */
        title: string | null
        /** Empty with a vehicle: the row is that car's answer, not a catalogue order. */
        tabs: PopularTab[]
        active: string
        cards: ProductCardProp[]
        /** The listing's count for the vehicle; null without one. */
        total: number | null
    }
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
    komplettrad: { tyre: EuTyreLabel | null }
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

/**
 * What a key-number lookup flashes back.
 *
 * `ambiguous` is not an error state. More than one car behind one pair of key numbers is ordinary,
 * and the chooser it opens is a confirmation — `1860`/`AAS` is two Audi RS 4 Avants whose top
 * speeds differ by 10 km/h, which is exactly the field the legal tyre requirement turns on.
 */
export interface LookupResult {
    status: 'ambiguous' | 'not_found'
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
    facets: Facets
    filters: Record<string, unknown>
    page?: number
    /** True while any published wheel model is seeded demo data; the listing shows the *Demodaten* note. */
    demo: boolean
    /** What of the chosen car the page's answers wait for — `bodyForm`, `driveAxle` (§1.1). Additive. */
    missing?: string[]
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
    }
    /** `image`: the finish's own studio photograph and its other angles, or null — then it is drawn. */
    finishes: { id: number; name: string; hex: string | null; artFinish: string; image: ImageManifest | null }[]
    configs: ProduktConfig[]
    hasVehicle: boolean
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
    stockQty: number
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
}

export interface ConfigVerdict {
    status: VerdictStatus
    label: string
    sellable: boolean
    requiresEntry: boolean
    /** Additive: null for a wheel that may not go on the car, absent in an older payload. */
    detail?: FitmentDetailView | null
    entryNoteDe: string | null
    /** Full German sentences, never codes such as A02 (R-15). */
    conditions: string[]
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
    minSource?: 'DOCUMENT' | 'DERIVED'
    minLoadSource?: 'DOCUMENT' | 'DERIVED'
    minSpeedSource?: 'DOCUMENT' | 'DERIVED'
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
    | 'NO_WEIGHT_COLOUR'

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
    stockQty: number
    /** The tyre alone, per tyre. */
    tyrePriceCents: number
    tyrePrice: string
    /** Rim + tyre + mounting + weights for ONE wheel: the known components, an unpriced one left out. */
    perWheelCents: number
    perWheel: string
    /** `perWheel` × 4, formatted on the server (R-10); the page never multiplies cents. */
    forFourCents: number
    forFour: string
    /** The EU label, only where the tyre carries a verified EPREL id (ACCURACY D7). */
    label: { fuel: string | null; wetGrip: string | null; noiseDb: number | null; noiseClass: string | null; eprelId: string } | null
    isDemo: boolean
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
        documents: { kind: 'ABE' | 'Teilegutachten' | 'ECE' | 'EG-Genehmigung'; number: string | null }[]
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
    vehicle: string | null
    wheel: string | null
    /** The wheel half, where the verdict has one. */
    wheelLabel: string | null
    reason: string | null
    requiresEntry: boolean
    entryNote: string | null
    conditions: string[]
    front: string[]
    rear: string[]
    tyre: { statusLabel: string; summary: string | null; basis: string | null; lines: string[]; stricterByPapers: boolean } | null
    papers: { axleFrontKg: number; axleRearKg: number; topSpeedKmh: number; powerKw?: number | null } | null
    /** What the answer assumed that the vehicle data does not hold, and from where (G-02). Additive. */
    build?: { fact: string; value: string; source: string }[]
    document: { label: string; issuer: string | null; revision: number; page: number | null } | null
    /** Said only when the document has changed since the result was issued. */
    documentToday: string | null
    issuedAt: string | null
}

export interface CheckErgebnisProps {
    token: string
    result: CheckResultView | null
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
            documentRevision: number
            detail: Record<string, unknown>
        } | null
    }[]
    contact: ContactProp
}

export interface FaqProps {
    groups: { key: string; entries: { id: number; question: string; answer: string }[] }[]
    contact: ContactProp
}

export interface KontaktProps {
    contact: ContactProp
}

export interface RechtlichesProps {
    tabs: { slug: string; title: string }[]
    active: string
    blocks: { id: number; type: string; data: Record<string, unknown> }[]
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
