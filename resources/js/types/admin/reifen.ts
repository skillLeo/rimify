/** Katalog › Reifen (his admin item 10, D-302): the props the list and the form receive (ReifenController). */
import type { ImageManifest } from '../../Components/Ui/Picture.vue'

/** One tyre model in the list, with what its sizes add up to (the Gutachten rework §9). */
export interface TyreModelRow {
    id: number
    brand: string
    name: string
    /** `sommer`, `winter`, `ganzjahres` */
    season: string
    /** The cover, as `Picture` reads it; null where the model has no photograph. */
    thumb: ImageManifest | null
    photos: number
    sizes: number
    /** `18 Zoll`, `17–19 Zoll` */
    diameters: string
    priceFromCents: number
    /** Real sizes whose EU label is not complete on record (D-303). */
    missingLabels: number
    /** Real sizes the shop offers now: available and their label complete (D-301, D-303). */
    offered: number
    demo: boolean
    changed: string | null
    href: string
}

export interface Option {
    value: string
    label: string
}

export interface AdminReifenIndexProps {
    models: TyreModelRow[]
    filters: { q: string; marke: string; saison: string; zoll: string; stand: string; sort: 'reifen' | 'preis' | 'geaendert'; richtung: 'auf' | 'ab' }
    options: { brands: Option[]; diameters: Option[]; stands: Option[] }
    missingLabels: number
    filtered: boolean
    /** The address's query as the server reads it, the order included where it is not the plain list's (F-32). */
    query: Record<string, string>
    totalAll: number
    pagination: { current: number; last: number; total: number; prev: string | null; next: string | null }
    can: { create: boolean; edit: boolean; delete: boolean }
}

export interface TyreRecordProp {
    id: number
    brandId: number
    name: string
    season: string
    width: string
    aspect: string
    diameter: string
    loadIndex: string
    speedSymbol: string
    fuel: string
    wet: string
    noiseDb: string
    noiseClass: string
    /** null: not on record — never read as „Nein“ (D-302). */
    snow: boolean | null
    ice: boolean | null
    eprelId: string
    /** German digits, `129,00`. */
    price: string
    available: boolean
    demo: boolean
    /** On an order: its size, load index and speed symbol stay as sold. */
    sold: boolean
    fullTitle: string
    offered: boolean
    missingLabel: string[]
    updated: string | null
}

export interface AdminReifenEditProps {
    /** What the form was opened on (EditStamp); null for a new tyre. A save against an older state is refused. */
    stamp: string | null
    tyre: TyreRecordProp | null
    /** The model it belongs to: brand, name and season are changed there, for all its sizes. Null for a new tyre. */
    modelHref?: string | null
    /** „Weitere Größe“: what a new tyre starts from. */
    template: { brandId: number; name: string; season: string } | null
    brands: { value: number; label: string }[]
    options: {
        seasons: Option[]
        speedSymbols: string[]
        classes: string[]
        noiseClasses: string[]
    }
    can: { create: boolean; edit: boolean; delete: boolean }
}

/** One tyre model's page: its photographs, its facts and its sizes (the Gutachten rework §9). */
export interface AdminReifenModellProps {
    model: { id: number; brandId: number; brand: string; name: string; season: string; title: string; demo: boolean; updated: string | null }
    photos: { id: number; manifest: ImageManifest; alt: string }[]
    photoOrderStamp: string
    maxPhotos: number
    sizes: {
        id: number
        size: string
        priceCents: number
        available: boolean
        label: { fuel: string; wet: string; noiseDb: number; noiseClass: string; snow: boolean; ice: boolean } | null
        missingLabel: string[]
        eprel: string | null
        demo: boolean
        offered: boolean
        href: string
    }[]
    stamp: string
    brands: { value: number; label: string }[]
    seasons: Option[]
    can: { edit: boolean; create: boolean }
}

/** The form as it is sent: strings as typed, the two pictograms answered or not. */
export interface TyreForm {
    brand_id: number | null
    brand_new: string
    name: string
    season: string
    width_mm: string
    aspect: string
    diameter_in: string
    load_index: string
    speed_symbol: string
    eu_fuel_class: string
    eu_wet_grip_class: string
    eu_noise_db: string
    eu_noise_class: string
    eu_snow_grip: boolean | null
    eu_ice_grip: boolean | null
    eprel_id: string
    price: string
    available: boolean
}
