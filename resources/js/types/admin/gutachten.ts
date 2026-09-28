/** Gutachten-Erfassung — GutachtenController, GutachtenZeilenController, AuflagenController, FahrzeugeController. */

export type AxleValue = 'ALL' | 'FRONT' | 'REAR'

export interface DocumentFacts {
    id: number
    label: string
    kind: string
    kindLabel: string
    kbaNumber: string
    reportNumber: string
    approvalMark: string
    issuer: string
    /** `YYYY-MM-DD` for the date field. */
    issuedOn: string
    issuedOnLabel: string | null
    pageCount: number | null
    revision: number
    supersedesId: number | null
    supersedesLabel: string | null
    status: 'draft' | 'published' | 'superseded' | 'withdrawn'
    statusLabel: string
    validFrom: string | null
    validTo: string | null
    pdfUrl: string | null
    hasPdf: boolean
    /** A key is stored, the file is not in the storage. */
    pdfMissing?: boolean
}

export interface TyreSizeRow {
    width_mm: number
    aspect: number
    diameter: number
    min_load_index: number | null
    min_speed_symbol: string
    axle: AxleValue
    label: string
}

export interface FitmentRowView {
    id: number
    vehicleId: number
    vehicle: string
    configId: number
    wheel: string
    size: string
    finish: string | null
    axle: AxleValue
    axleLabel: string
    requiresEntry: boolean
    entryNote: string
    sourcePage: number | null
    buildFrom: string
    buildTo: string
    widthMin: string
    widthMax: string
    etMin: string
    etMax: string
    centreBore: string
    status: 'draft' | 'published' | 'retired'
    tyreSizes: TyreSizeRow[]
    conditions: { id: number; text: string; note: string }[]
    draft: boolean
}

/** One entry of this document's own Auflagenverzeichnis (document_conditions). */
export interface DocumentConditionView {
    id: number
    code: string
    kind: string
    kindLabel: string
    /** Where the customer reads it: Abnahme, Arbeiten am Fahrzeug, Befestigung, Reifen, Hinweise, Fahrzeug. */
    section: string
    text: string
    page: number | null
    bodyForms: string[]
    drive: { mode: 'only' | 'not'; drive: string } | null
    maxAxleLoadKg: number | null
    axle: 'FRONT' | 'REAR' | null
    /** Rows and tyre sizes of this document that carry the code. */
    uses: number
}

/** The choices of the Auflagenverzeichnis form. */
export interface ConditionChoices {
    kinds: { value: string; label: string; section: string }[]
    bodyForms: string[]
    drives: string[]
}

/** A code a row carries that its document does not define: the row is UNKNOWN until it is defined. */
export interface UnresolvedCode {
    code: string
    rows: number
}

/** @deprecated kept for the row form until it reads DocumentConditionView */
export interface ConditionOption {
    id: number
    code: string
    text: string
    severity: string
}

export interface PreviewVerdict {
    config: number
    wheel: string
    status: 'PERMITTED' | 'CONDITIONAL' | 'NOT_PERMITTED' | 'UNKNOWN'
    statusLabel: string
    reason: string | null
    requiresEntry: boolean
    entryNote: string | null
    conditions: string[]
    front: string[]
    rear: string[]
    sourcePage: number | null
}

export interface AdminGutachtenShowProps {
    document: DocumentFacts
    rows: FitmentRowView[]
    vehicles: { id: number; label: string }[]
    blockers: string[]
    preview?: PreviewVerdict[]
    previewVehicle: number | null
    conditions: ConditionOption[]
    kinds: { value: string; label: string }[]
    replaceable: { value: number; label: string }[]
    openConflicts: number
    can: { edit: boolean; release: boolean }
}

/** One tyre size as typed: `225/40 R18`, the axle, and an optional minimum from the document. */
export interface TyreSizeForm {
    text: string
    axle: AxleValue
    min_load_index: number | null
    min_speed_symbol: string
}

export interface RowForm {
    axle: AxleValue
    requires_entry: boolean
    entry_note: string
    source_page: number | null
    build_from: string
    build_to: string
    width_min: string
    width_max: string
    et_min: string
    et_max: string
    centre_bore: string
    tyre_sizes: TyreSizeForm[]
    conditions: { id: number; note: string }[]
}

export interface VehicleHit {
    id: number
    label: string
    window: string
    needsReview: boolean
}

export interface WheelGroup {
    model: string
    demo: boolean
    sizes: { id: number; label: string; finish: string | null; sku: string }[]
    /** The model goes on past the list's cut: not every size of it is shown. */
    partial?: boolean
}
