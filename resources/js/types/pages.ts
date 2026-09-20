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
    Facets,
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

export interface StartseiteProps {
    bestsellers: ProductCardProp[]
    makes: MakeOption[]
    brands: { name: string; slug: string; spokes: number }[]
    month: string
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
    finishes: { id: number; name: string; hex: string | null; artFinish: string }[]
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

export interface CheckErgebnisProps {
    token: string
    result: { status: VerdictStatus } | null
}

export interface BasketProps {
    lines: BasketLine[]
    totals: BasketTotals
}

export interface KasseProps extends BasketProps {
    contact: { email: string; phone: string }
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
    contact: { email: string; phone: string; hours: string }
}

export interface FaqProps {
    groups: { key: string; entries: { id: number; question: string; answer: string }[] }[]
    contact: { phone: string; email: string; hours: string }
}

export interface KontaktProps {
    contact: {
        email: string
        phone: string
        phoneIntl: string
        whatsapp: string
        hours: string
    }
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
