import type { CoverageMatrix } from './uebersicht'

/** Gutachten › Abdeckung — AbdeckungController. */
export interface AbdeckungRow {
    id: number
    /** `3er 320d` */
    vehicle: string
    /** `03/2018–heute` */
    period: string
    /** `0005 / ABC` */
    keys: string
    /** Felgen of this size a customer may be shown for this variant. */
    wheels: number
    documents: number
}

export interface AdminAbdeckungProps {
    matrix: CoverageMatrix
    selection: {
        make: string
        size: string
        covered: number
        total: number
        rows: AbdeckungRow[]
    } | null
}
