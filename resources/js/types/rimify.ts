/**
 * The shapes every page receives.
 *
 * These mirror what `HandleInertiaRequests::share()` and the controllers send. Keeping them in one
 * file rather than re-declaring props per page is what makes a controller change break the build
 * instead of breaking a page at runtime.
 */

import type { Finish } from '../art'
import type { ImageManifest } from '../Components/Ui/Picture.vue'

export type { ImageManifest }

/** The four presentations of the vehicle-context state machine. Decided on the server (R-08). */
export type HeaderMode = 'PLAIN' | 'WHITE_BOX' | 'BLUE_BAR' | 'SUPPRESSED'

/** A verdict has four states and is never a boolean. UNKNOWN is not NOT_PERMITTED (R-07). */
export type VerdictStatus = 'PERMITTED' | 'CONDITIONAL' | 'NOT_PERMITTED' | 'UNKNOWN'

export interface VehicleProp {
    id: number
    make: string
    model: string
    variant: string
    /** How a Gutachten names the car (`B9`); null when the data does not carry it. */
    typeDesignation?: string | null
    /** `Audi RS 4 Avant Quattro` — used wherever there is room. */
    label: string
    /** `Audi RS 4` — the phone-width truncation, which must never wrap to two lines. */
    short: string
    hsn: string
    tsn: string
    keyNumbers: string
    buildWindow: string
}

export interface NavItem {
    label: string
    href: string
    routeName: string | null
    /** `vehicle_aware` sends Felgen suchen to the listing once a vehicle is set. */
    behaviour: string | null
    icon: string | null
}

export interface Menus {
    header: NavItem[]
    footer_shop: NavItem[]
    footer_service: NavItem[]
    footer_legal: NavItem[]
    mobile_bottom: NavItem[]
}

export interface MenuLink {
    label: string
    href: string
    sub?: string
    count?: number
}

/** What the Felgen menu opens onto; every entry leads to a real listing. */
export interface MegaMenuProp {
    brands: MenuLink[]
    sizes: MenuLink[]
    makes: MenuLink[]
    popular: MenuLink[]
}

/** The visitor's cookie choice; null while none has been made. */
export interface ConsentProp {
    necessary: true
    statistics: boolean
    decidedAt: string
}

/**
 * The shop's contact details (config/rimify.php). A detail the client has not given is null —
 * never a placeholder — and every surface then leaves it out and offers the e-mail instead.
 */
export interface ContactProp {
    email: string
    phone: string | null
    phoneIntl: string | null
    whatsapp: string | null
    hours: string
}

export interface GarageVehicle {
    id: number
    label: string
    short: string
}

export interface ServiceStatusProp {
    open: boolean
    label: string
    until: string
}

export interface SharedProps {
    headerMode: HeaderMode
    vehicle: VehicleProp | null
    menus: Menus
    cartCount: number
    routeName: string | null
    /** One source of truth for the phone, the e-mail and the opening hours (D-023). */
    contact: ContactProp
    mega: MegaMenuProp
    consent: ConsentProp | null
    /** The last five vehicles chosen on this browser, most recent first (F7). */
    garage: GarageVehicle[]
    /** Whether someone answers right now, computed on the server (F9). */
    serviceStatus: ServiceStatusProp
    /** Demonstration rows are on show: the header carries the Demodaten badge (ACCURACY D4). A page's own `demo` prop is a different thing. */
    demoBadge: boolean
    isMobile: boolean
    locale: string
    /** Remote photography layered over the drawn art — a temporary client-review flag. */
    photography: boolean
    flash: { toast: string | null }
    [key: string]: unknown
}

/** What `wheelSVG()` needs, carried on every card and line. */
export interface ArtProp {
    finish: Finish | string
    spokes: number
}

export interface ProductCardProp {
    modelId: number
    modelName: string
    slug: string
    brandName: string
    finishId: number
    finishName: string
    art: ArtProp
    /**
     * This finish's own cut-out (`wheel_finishes.image_manifest`) as `Picture` reads it: AVIF →
     * WebP → PNG at the listed widths, 1:1, with the 4:3 frame under `wide`. Null shows the
     * drawn outline, plainly — never another finish's photograph.
     */
    image: (ImageManifest & { wide?: ImageManifest }) | null
    rating: number | null
    ratingCount: number
    ratingLabel: string | null
    fromPriceCents: number
    fromPrice: string
    inStock: boolean
    stockQty: number
    /** `17 · 18 · 19` as already-formatted German decimals. */
    diameters: string[]
    /**
     * The subset of `diameters` with a `PERMITTED`/`CONDITIONAL` configuration for the vehicle;
     * null without a vehicle (or while the server does not send it — the tile then greys nothing).
     */
    diametersFitting?: string[] | null
    /** `${modelId}:${finishId}` — the one key the compare store uses. Derived on the client when absent. */
    compareKey?: string
    /** A seeded demonstration row (`wheel_models.is_demo`). Nothing on the card says so; the page does. */
    isDemo?: boolean
    /**
     * Null when no vehicle is chosen: with no car, no compatibility claim is made at all.
     *
     * Otherwise the fitment engine's answer for the configurations this card stands for, merged
     * toward caution. `CONDITIONAL` always travels with its Auflagen as full German sentences.
     */
    fitment: CardFitment | null
}

/** The one key the compare store, the tray and `/vergleich?f=` share (home-overhaul.md §0.3). */
export function compareKeyOf(card: Pick<ProductCardProp, 'modelId' | 'finishId' | 'compareKey'>): string {
    return card.compareKey ?? `${card.modelId}:${card.finishId}`
}

export interface CardFitment {
    status?: VerdictStatus
    requiresEntry: boolean
    conditions?: string[]
}

export interface FacetOption {
    value: string
    count: number
    /** The value as a customer reads it — `8,5` rather than `8.50` (R-10). */
    label?: string
}

export type Facets = Record<string, FacetOption[]>

export interface BasketLine {
    key: string
    /** Only wheels: Felgen alone, or a Komplettrad that carries its tyre (ACCURACY D6). */
    kind: 'WHEEL'
    title: string
    subtitle: string
    brandName: string
    sizeLabel?: string
    art: { kind: 'wheel' | 'tyre'; finish?: string; spokes?: number; label?: string }
    quantity: number
    unitPrice: string
    lineTotal: string
    lineTotalCents: number
    inStock: boolean
    slug?: string
    /**
     * Re-computed on every render, never trusted from the session: a document may have been
     * superseded since the line was added, and the basket is the last place that can say so
     * before money changes hands. Null when no vehicle is chosen.
     */
    verdict?: {
        status: VerdictStatus
        label: string
        sellable: boolean
        requiresEntry: boolean
        conditions: string[]
    } | null
}

export interface BasketTotals {
    subtotal: string
    subtotalCents?: number
    /** False while the client has not set a shipping price: the figure reads "wird noch festgelegt". */
    shippingConfigured?: boolean
    shipping: string
    /** Null while the shipping price is not configured; it is then left out of the total. */
    shippingCents: number | null
    freeShipping: boolean
    tax: string
    total: string
    totalCents: number
    count: number
}
