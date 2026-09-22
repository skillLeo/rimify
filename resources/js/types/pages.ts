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
    powerPs: number | null
    bodyForm: string | null
    /** Shown, never hidden: an incomplete row is named as incomplete rather than guessed at. */
    needsReview: boolean
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
    centreBore: string
    priceCents: number
    price: string
    stockQty: number
    inStock: boolean
    kbaNumber: string | null
    weightG: number | null
    /** Null when no vehicle is chosen. Price, stock and verdict travel together, by design. */
    verdict: ConfigVerdict | null
}

export interface ConfigVerdict {
    status: VerdictStatus
    label: string
    sellable: boolean
    requiresEntry: boolean
    entryNoteDe: string | null
    /** Full German sentences, never codes such as A02 (R-15). */
    conditions: string[]
    reason: string | null
    reasonCode: string | null
    document: { number: string | null; issuer: string | null; kind: string } | null
    tyreSizes: string[]
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

export interface CheckErgebnisProps {
    token: string
    result: { status: VerdictStatus } | null
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

export interface AdminDashboardProps {
    tiles: { key: string; label: string; value: string }[]
    revenue: { label: string; value: number }[]
    conflicts: {
        id: number
        kind: string
        blocking: boolean
        vehicle: string
        keyNumbers: string
    }[]
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
    }[]
}

export interface AdminBenachrichtigungenProps {
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
}
