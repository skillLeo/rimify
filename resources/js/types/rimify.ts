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
    /** Null, with the TSN, for a car typed from a Gutachten until a vehicle dataset brings them. */
    hsn: string | null
    tsn: string | null
    keyNumbers: string
    buildWindow: string
    /** `Feld K: e1*2007/46*0283, ab *04` — for a car without key numbers only; tells a Gutachten's halves of it apart. */
    approval?: string | null
    /**
     * The figures the customer typed from their own papers for THIS car (8.1, 8.2, T), kept in the browser
     * with the car until customer accounts exist; null when none were entered. Additive.
     */
    papers?: PapersProp | null
    /** The variant's power in kW, for the P.2 check on a photographed Zulassungsbescheinigung. Additive. */
    powerKw?: number | null
    /** Karosserieform and Antrieb as every answer reads them, and where each came from (§1.1). Additive. */
    build?: BuildProp | null
}

/**
 * A car's body style and drive: `data` — the vehicle data's own; `customer` — the owner said so; `name` — an
 * unambiguous word of the car's name (`bodyWord`, `driveWord`), shown with „stimmt das?“.
 */
export interface BuildProp {
    bodyForm: string | null
    bodySource: 'data' | 'customer' | 'name' | null
    bodyWord: string | null
    driveAxle: string | null
    driveSource: 'data' | 'customer' | 'name' | null
    driveWord: string | null
}

export interface PapersProp {
    axleFrontKg: number
    axleRearKg: number
    topSpeedKmh: number
    /** P.2, where the customer gave it: a Gutachten's kW band is read against it (Block D). */
    powerKw?: number | null
    /** Where the vehicle data asks for more than the customer typed, and the answer uses that figure. */
    notes: string[]
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
    /** `Feld K ab *04` — for a car without key numbers, the range that tells a Gutachten's halves of it apart. */
    range?: string | null
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
    /** "Sag mir Bescheid" by e-mail works only where outgoing mail is configured; otherwise the forms offer the shop's address. */
    notifyByMail?: boolean
    isMobile: boolean
    locale: string
    /** Remote photography layered over the drawn art — a temporary client-review flag. */
    photography: boolean
    /** The seller is a Kleinunternehmer (§ 19 UStG): no VAT on any price note or summary (usePriceTerms). */
    smallBusiness: boolean
    /** The test environment's ribbon: on staging only, until put away (PreviewRibbon.vue). */
    previewRibbon?: boolean
    /** Staging only: `Testumgebung · Stand 56fc810c vom 01.10.2026, 16:25 Uhr` (App\Support\ReleaseStamp). */
    release?: string | null
    flash: { toast: string | null; added?: AddedToBasket | null }
    /**
     * A signed-in admin looking at the shop while the review is on (D-142): the feedback button bottom right, and the
     * role it is sent with. Absent for everyone else — not null, not hidden: absent.
     */
    reviewer?: { role: string | null }
    [key: string]: unknown
}

/** What was just put in the basket (#16): the panel after an add prints it; every figure is the server's. */
export interface AddedToBasket {
    /** `Komplettrad zum Warenkorb hinzugefügt.` */
    heading: string
    /** The line added — for a mixed set its two axles — at the amount added and that amount's price. */
    lines: { title: string; detail: string; quantity: number; price: string }[]
    /** The basket as it now stands. */
    count: number
    subtotal: string
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

/**
 * The Auflagen as the document hangs them (App\Domain\Fitment\Verdict\ConditionGroups): the combination's once, each tyre
 * size's with that size — never one list in which one size's „no snow chains“ stands beside another's chains. With a
 * size chosen (a Komplettrad), just what applies to it. Rendered by Components/Fitment/ConditionGroups.vue.
 */
export interface ConditionGroupsView {
    combination: string[]
    /** Every permitted size with its own Auflagen — only where the sizes differ. */
    sizes: { size: string; axle: string; conditions: string[]; entry: boolean }[]
    chosen: string | null
    /** With a size chosen: whether it needs the Abnahme or Eintragung. Null: the verdict's own flag stands. */
    entry: boolean | null
}

export interface CardFitment {
    status?: VerdictStatus
    requiresEntry: boolean
    conditions?: string[]
    /** Further Auflagen depend on the rim or tyre size: said on the product page, per size. */
    conditionsVary?: boolean
    /** Every Auflage of every size a Hinweis (#23, D-104): „Freigegeben“, quietly „mit Hinweisen“. */
    notesOnly?: boolean
}

export interface FacetOption {
    value: string
    count: number
    /** The value as a customer reads it — `8,5` rather than `8.50` (R-10). */
    label?: string
}

export type Facets = Record<string, FacetOption[]>

/** The tyre a Komplettrad line carries, re-read from the catalogue on every render (§4.7). */
export interface BasketTyre {
    id: number
    brandName: string
    name: string
    season: 'sommer' | 'winter' | 'ganzjahres'
    /** `Sommerreifen` */
    seasonLabel: string
    /** `245/45 R18 100Y` */
    sizeLabel: string
    unitPriceCents: number
    unitPrice: string
    /** Enough of this tyre for the line's quantity. */
    inStock: boolean
    /** Shipped only when the tyre carries a verified EPREL id (ACCURACY D7). */
    label: { fuel: string | null; wetGrip: string | null; noiseDb: number | null; noiseClass: string | null; eprelId: string } | null
}

/** The Wuchtgewichte colour on a Komplettrad line: per wheel, surcharge 0 unless the admin set one. */
export interface BasketWeights {
    colourId: number
    name: string
    swatchHex: string | null
    surchargeCents: number
    surcharge: string
}

/** One tile of the colour choice — every active colour, in the admin's order. */
export interface BasketWeightOption {
    id: number
    name: string
    swatchHex: string | null
    surchargeCents: number
    surcharge: string
    isDefault: boolean
}

/**
 * One row of a Komplettrad's price: `Felge`, `Reifen`, `Montage und Auswuchten`, `Wuchtgewichte`.
 * An unpriced component reads `wird noch festgelegt`, has no line total and is `open`.
 */
export interface BasketComponent {
    key: string
    label: string
    quantity: number
    unitPrice: string
    lineTotal: string | null
    open: boolean
}

export interface BasketLine {
    key: string
    /** Only wheels: Felgen alone, or a Komplettrad that carries its tyre (ACCURACY D6). */
    kind: 'WHEEL'
    wheelConfigId?: number
    title: string
    subtitle: string
    brandName: string
    sizeLabel?: string
    art: { kind: 'wheel' | 'tyre'; finish?: string; spokes?: number; label?: string }
    quantity: number
    /** Per wheel: the rim, or for a Komplettrad the KNOWN components summed (§4.7). */
    unitPriceCents?: number
    unitPrice: string
    lineTotal: string
    lineTotalCents: number
    inStock: boolean
    /** A seeded demonstration row on the line — the wheel model or, for a Komplettrad, its tyre. */
    demo?: boolean
    slug?: string
    /**
     * Re-computed on every render, never trusted from the session: a document may have been
     * superseded since the line was added, and the basket is the last place that can say so
     * before money changes hands. Null when no vehicle is chosen.
     */
    verdict?: {
        status: VerdictStatus
        label: string
        /** Every Auflage a Hinweis (#23, D-104): shown as „Freigegeben“. Additive. */
        notesOnly?: boolean
        sellable: boolean
        requiresEntry: boolean
        /** The document frees the papers from correction (§ 15 FZV). Additive. */
        papersExempt?: boolean
        conditions: string[]
        /** What the customer reads (ConditionGroups). Additive. */
        conditionGroups?: ConditionGroupsView
        /** The verdict in one sentence, as the checkout repeats it up to the order button (Block G). */
        sentence?: string
        /** The Gutachten and revisions the answer rests on (`id@revision`), for CheckoutShown. */
        basis?: string[]
    } | null
    /* docs/specs/komplettrad.md §4.7 — a Komplettrad is a wheel line that carries its tyre. */
    isSet?: boolean
    setLabel?: 'Felge' | 'Komplettrad' | 'Komplettrad Vorderachse' | 'Komplettrad Hinterachse'
    /**
     * Mischbereifung (#20, D-105): one axle of a mixed set — the two lines are one entry, so a change on either changes
     * both. Null on every other line. Additive.
     */
    mixed?: BasketMixed | null
    /** Null on a Felgen-only line, and on a Komplettrad whose tyre has gone (then `blockReasons` says so). */
    tyre?: BasketTyre | null
    /** Null until a colour is chosen or while the chosen one has gone; the line is then marked. */
    weights?: BasketWeights | null
    weightOptions?: BasketWeightOption[]
    /** Null on a Felgen-only line; `configured: false` reads `wird noch festgelegt` (D-032). */
    mounting?: { configured: boolean; unitPriceCents: number | null; unitPrice: string } | null
    components?: BasketComponent[]
    /** A component of this line has no price yet: the totals leave it out and the order is refused. */
    priceOpen?: boolean
    /** Full German sentences, never codes; empty when nothing is wrong (R-15). */
    blockReasons?: string[]
}

/** One axle of a mixed set, as the basket and the order record it (D-105). */
export interface BasketMixed {
    setKey: string
    axle: 'FRONT' | 'REAR'
    /** `Vorderachse` */
    axleLabel: string
    /** `235/45 R19` — this axle's size, and the other axle's. */
    size: string | null
    partnerSize: string | null
    /** The entry of the document's table (`Nr. 8`); null where the pair is no longer listed (then the line is marked). */
    pairing: number | null
    sourcePage: number | null
    /** What the document says beyond the table, in its own words. */
    rulesDe: string | null
    minLoadIndex: number | null
    minSpeedSymbol: string | null
    axleLoadKg: number | null
    bindingAxle: 'FRONT' | 'REAR' | null
    minimumSentence: string | null
}

/**
 * The RDKS block of the totals (docs/specs/komplettrad.md §4.8). Recomputed from the CURRENT
 * vehicle's make on every render; `choice` is null whenever the stored answer was given for another
 * make. Every figure arrives formatted: the page prints `line` and `total` and never multiplies.
 */
export interface BasketTpms {
    /** At least one Komplettrad line — the question is asked only then (D-034). */
    applicable: boolean
    /** Komplettrad wheels in the basket, which is how many sensors `ja` means. */
    quantity: number
    /** An active price exists for the current vehicle's make. */
    available: boolean
    makeLabel: string | null
    unitPriceCents: number | null
    unitPrice: string | null
    /** `4 × 49,00 €` */
    line: string | null
    choice: 'ja' | 'nein' | null
    /** 0 unless `choice === 'ja'`. */
    totalCents: number
    total: string
    /** The fail-closed sentence while `available` is false. */
    notice: string | null
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
    /** The VAT rate in basis points: 1900, or 0 for a Kleinunternehmer (§ 19 UStG). */
    vatRateBp?: number
    tax: string
    total: string
    totalCents: number
    count: number
    /** False while `rimify.komplettrad.mounting_per_wheel_cents` is unset: no Komplettrad can be ordered (D-032). */
    mountingConfigured?: boolean
    /** The RDKS question and its answer; absent only from fixtures written before §4.8. */
    tpms?: BasketTpms
}
