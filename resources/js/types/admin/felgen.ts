/** Katalog › Felgen and Katalog › Import — FelgenController, KatalogImportController. */

import type { ImageManifest } from '../../Components/Ui/Picture.vue'
import type { ListColumnsProps, ListViewsProps } from './lists'

export interface WheelState {
    label: string
    /** Only the exception is tagged; `plain` is written as text. */
    tone: 'plain' | 'warn' | 'bad' | 'neutral'
}

export interface WheelRow {
    id: number
    brand: string
    name: string
    status: 'draft' | 'published' | 'archived'
    statusLabel: string
    /** Seeded demonstration data: never in the shop. */
    demo: boolean
    /** Admin only, never in the shop. */
    internalNote: string | null
    finishes: number
    sizes: number
    /** `18–19 Zoll`, or null without sizes. */
    diameters: string | null
    /** Minor units; the smallest price of its sizes. */
    fromCents: number | null
    /** How many of its sizes can be bought (D-299). */
    available: number
    /** Saved before the Radtypenbezeichnung was required, still without it (D-298). */
    designationMissing: boolean
    /** A typed title its brand, model and Radtypenbezeichnung no longer make (D-298). */
    titleDiverges: boolean
    /** Sizes a published fitment row names. */
    covered: number
    coverage: WheelState
    image: { manifest: ImageManifest; alt: string } | null
    updated: string | null
    href: string
}

export type WheelSort = 'name' | 'aktualisiert' | 'preis' | 'groessen'

export interface WheelFilters {
    q: string
    status: string
    marke: string
    freigaben: string
    demo: string
    /** `fehlt`: the Felgen still without their Radtypenbezeichnung (D-298). */
    radtyp?: string
    sort: WheelSort
    richtung: 'auf' | 'ab'
}

export interface WheelOption {
    value: string
    label: string
}

export interface WheelCan {
    create: boolean
    edit: boolean
    publish: boolean
    archive: boolean
    import: boolean
}

export interface AdminFelgenProps {
    wheels: WheelRow[]
    filters: WheelFilters
    options: { brands: WheelOption[]; statuses: (WheelOption & { count: number })[] }
    filtered: boolean
    totalAll: number
    pagination: { current: number; last: number; total: number; prev: string | null; next: string | null }
    query: Record<string, string>
    views: ListViewsProps
    columns: ListColumnsProps
    can: WheelCan
    /** Felgen outside the archive without their Radtypenbezeichnung: the backfill (D-298). */
    missingDesignation: number
}

/* ── One Felge ─────────────────────────────────────────────────────────────── */

export interface FinishForm {
    /** The page's own key (`f12`, or `n1` for a new one); sizes point at it. */
    key: string
    id: number | null
    name: string
    hex: string
    art_finish: string
}

export interface FinishImage {
    manifest: ImageManifest
    alt: string
    /** A generated drawing (the demo set), not a photograph. */
    placeholder: boolean
}

/** One photograph of a colour, in the order the shop shows them (the first is the cover). */
export interface FinishPhoto {
    id: number
    manifest: ImageManifest
    alt: string
}

export interface SizeForm {
    key: string
    id: number | null
    /** A FinishForm key. */
    finish: string
    /** Typed the German way: `18`, `8,5`, `35`, `112`, `66,6`, `189,00`. */
    diameter: string
    width: string
    et: string
    bolt_holes: number
    bolt_circle: string
    bore: string
    sku: string
    ean: string
    kba: string
    price: string
    /** Available or not, never a count (his admin item 7, D-299). */
    available: boolean
    weight_g: number | null
}

export interface WheelForm {
    brand_id: number | null
    brand_new: string
    name: string
    /** The Radtypenbezeichnung (D-298): required for a new Felge. */
    type_designation: string
    /** The title in the shop as typed; empty: brand, model and Radtypenbezeichnung (lib/wheelTitle). */
    title: string
    spoke_count: number
    description: string
    seo_title: string
    seo_description: string
    internal_note: string
    finishes: FinishForm[]
    configs: SizeForm[]
}

export interface SizeDocument {
    id: number
    label: string
    fitments: number
}

export interface AdminFelgeProps {
    /** What the form was opened on (EditStamp); null for a new Felge. A save against an older state is refused. */
    stamp: string | null
    model: {
        id: number
        brandId: number
        brand: string
        name: string
        typeDesignation: string
        /** The title as typed; empty when the shop composes it (D-298). */
        title: string
        /** The title the shop shows now. */
        fullTitle: string
        spokeCount: number
        description: string
        seoTitle: string
        seoDescription: string
        /** Admin only, never in the shop: shown above the Felge and in the list. */
        internalNote: string
        status: 'draft' | 'published' | 'archived'
        statusLabel: string
        demo: boolean
        slug: string
        shopUrl: string | null
        updated: string | null
    } | null
    finishes: {
        key: string
        id: number
        name: string
        hex: string
        artFinish: string
        image: FinishImage | null
        photos: FinishPhoto[]
        /** The photos' order as loaded (EditStamp): a move sends it, a move from an older order is refused. */
        photoOrderStamp?: string
        sizes: number
    }[]
    configs: (Omit<SizeForm, 'weight_g'> & { weight_g: number | null; locked: boolean })[]
    /** Per size id: the approval documents that name it in a published fitment row. */
    documents: Record<string, SizeDocument[]>
    check: { blockers: string[]; hints: string[] } | null
    brands: { value: number; label: string }[]
    options: { spokes: number[]; boltHoles: number[]; artFinishes: WheelOption[]; maxPhotos: number }
    can: WheelCan
}

/* ── Import ────────────────────────────────────────────────────────────────── */

export interface ImportField {
    key: string
    label: string
    required: boolean
}

export interface ImportSummary {
    create?: number
    update?: number
    unchanged?: number
    refused?: number
    brands?: number
    models?: number
    finishes?: number
}

export interface ImportRunRow {
    id: number
    file: string
    /** Who sent the file, as the admin named it. */
    supplier: string | null
    format: string
    status: 'previewed' | 'applied' | 'rolled_back'
    statusLabel: string
    summary: ImportSummary
    by: string | null
    at: string | null
    href: string
}

export interface ImportPlanRow {
    line: number
    sku: string
    action: 'create' | 'update' | 'unchanged' | 'refused'
    label: string
    changes: { field: string; from: string; to: string }[]
    reasons: string[]
    new: { brand: boolean; model: boolean; finish: boolean }
}

export interface AdminImportProps {
    fields: ImportField[]
    /** Every supplier named before, most recent first. */
    suppliers: string[]
    imports: ImportRunRow[]
    /** Every run, while the page lists the latest 20. */
    total: number
    can: { preview: boolean }
}

export interface AdminImportRunProps {
    run: ImportRunRow & {
        decimal: 'komma' | 'punkt'
        /** The mapping started from this supplier's last import. */
        mappingRemembered: boolean
        /** The refused lines as a CSV, when there are any. */
        refusedHref: string | null
        rowCount: number
        appliedAt: string | null
        rolledBackAt: string | null
    }
    fields: ImportField[]
    headers: string[]
    examples: Record<string, string>
    mapping: Record<string, string>
    missing: string[]
    rows: ImportPlanRow[]
    hiddenRows: number
    can: { remap: boolean; apply: boolean; rollback: boolean }
}
