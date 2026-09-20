/**
 * The shapes every page receives.
 *
 * These mirror what `HandleInertiaRequests::share()` and the controllers send. Keeping them in one
 * file rather than re-declaring props per page is what makes a controller change break the build
 * instead of breaking a page at runtime.
 */

import type { Finish } from '../art'

/** The four presentations of the vehicle-context state machine. Decided on the server (R-08). */
export type HeaderMode = 'PLAIN' | 'WHITE_BOX' | 'BLUE_BAR' | 'SUPPRESSED'

/** A verdict has four states and is never a boolean. UNKNOWN is not NOT_PERMITTED (R-07). */
export type VerdictStatus = 'PERMITTED' | 'CONDITIONAL' | 'NOT_PERMITTED' | 'UNKNOWN'

export interface VehicleProp {
    id: number
    make: string
    model: string
    variant: string
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
    footer_pages: NavItem[]
    footer_legal: NavItem[]
    mobile_bottom: NavItem[]
}

export interface SharedProps {
    headerMode: HeaderMode
    vehicle: VehicleProp | null
    menus: Menus
    cartCount: number
    routeName: string | null
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
    rating: number | null
    ratingCount: number
    ratingLabel: string | null
    fromPriceCents: number
    fromPrice: string
    inStock: boolean
    stockQty: number
    /** `17 · 18 · 19` as already-formatted German decimals. */
    diameters: string[]
    /** Null when no vehicle is chosen: with no car, no compatibility claim is made at all. */
    fitment: { requiresEntry: boolean } | null
}

export interface FacetOption {
    value: string
    count: number
}

export type Facets = Record<string, FacetOption[]>

export interface BasketLine {
    key: string
    kind: 'WHEEL' | 'TYRE'
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
    shipping: string
    shippingCents: number
    freeShipping: boolean
    tax: string
    total: string
    totalCents: number
    count: number
}
