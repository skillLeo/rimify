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
    finishes: number
    sizes: number
    /** `18–19 Zoll`, or null without sizes. */
    diameters: string | null
    /** Minor units; the smallest price of its sizes. */
    fromCents: number | null
    stock: number
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
    stock: number
    weight_g: number | null
}

export interface WheelForm {
    brand_id: number | null
    brand_new: string
    name: string
    type_designation: string
    spoke_count: number
    description: string
    seo_title: string
    seo_description: string
    finishes: FinishForm[]
    configs: SizeForm[]
}

export interface SizeDocument {
    id: number
    label: string
    fitments: number
}

export interface AdminFelgeProps {
    model: {
        id: number
        brandId: number
        brand: string
        name: string
        typeDesignation: string
        spokeCount: number
        description: string
        seoTitle: string
        seoDescription: string
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
        sizes: number
    }[]
    configs: (Omit<SizeForm, 'weight_g'> & { weight_g: number | null; locked: boolean })[]
    /** Per size id: the approval documents that name it in a published fitment row. */
    documents: Record<string, SizeDocument[]>
    check: { blockers: string[]; hints: string[] } | null
    brands: { value: number; label: string }[]
    options: { spokes: number[]; boltHoles: number[]; artFinishes: WheelOption[] }
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
    imports: ImportRunRow[]
    /** Every run, while the page lists the latest 20. */
    total: number
    can: { preview: boolean }
}

export interface AdminImportRunProps {
    run: ImportRunRow & { decimal: 'komma' | 'punkt'; rowCount: number; appliedAt: string | null; rolledBackAt: string | null }
    fields: ImportField[]
    headers: string[]
    examples: Record<string, string>
    mapping: Record<string, string>
    missing: string[]
    rows: ImportPlanRow[]
    hiddenRows: number
    can: { remap: boolean; apply: boolean; rollback: boolean }
}
