/** Katalog › Reifen (his admin item 10, D-302): the props the list and the form receive (ReifenController). */

export interface TyreRow {
    id: number
    brand: string
    name: string
    /** `Sommerreifen` */
    season: string
    /** `225/45 R18 95Y` */
    size: string
    /** Only where the label is complete on record (D-303). */
    label: { fuel: string; wet: string; noiseDb: number; noiseClass: string; snow: boolean; ice: boolean } | null
    /** The label's entries still to enter, by the form's names. */
    missingLabel: string[]
    priceCents: number
    available: boolean
    demo: boolean
    /** Offered by the shop now: available and its label complete, or a demonstration tyre (D-301, D-303). */
    offered: boolean
    href: string
}

export interface Option {
    value: string
    label: string
}

export interface AdminReifenIndexProps {
    tyres: TyreRow[]
    filters: { q: string; marke: string; saison: string; zoll: string; stand: string }
    options: { brands: Option[]; diameters: Option[]; stands: Option[] }
    missingLabels: number
    filtered: boolean
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
    fullTitle: string
    offered: boolean
    missingLabel: string[]
    updated: string | null
}

export interface AdminReifenEditProps {
    tyre: TyreRecordProp | null
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
