/** Gutachten-Erfassung — GutachtenController, GutachtenZeilenController, AuflagenController, FahrzeugeController. */

import type { ConditionGroupsView } from '../rimify'

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
    /** Page 1's header and a Nachtrag's base, as the forms type them. */
    shape: RecordShape
    /** Page 1's header, as the record shows it: label → value, only what is filled. */
    header: { label: string; value: string }[]
    /** `Nachtrag zu ABE 53841` — linked when we hold it. */
    supplementTo: { label: string; href: string | null } | null
    /** The sentence the record, the Abdeckung and the shop say for a Nachtrag without its base. */
    baseMissing: string | null
    /** `Verwendungsbereich unvollständig – Anlagen 1–15 liegen nicht vor.` — null while every Anlage is held. */
    scopeIncomplete?: string | null
}

/** A code on a row or a tyre size, as printed, with what its own document says it means. */
export interface RowCode {
    code: string
    note: string
    /** The document's sentence; null while the document does not define the code. */
    text: string | null
    kind: string | null
    page: number | null
    defined: boolean
}

/** A bolt or nut the document names: `S01 · M14x1,25 · Kegelbund 60° · 140 Nm`. */
export interface FastenerView {
    id: number
    number: string
    thread: string
    seat: string
    torqueNm: number | null
    shaftLengthMm: number | null
    articleNumber: string | null
    vehicleTypes: string | null
    page: number | null
}

/** A duty the document always states, shown with every verdict. */
export interface NoticeView {
    id: number
    text: string
    page: number | null
}

/** The millimetres of a „Nacharbeit mit Maßen“ code, per vehicle type and axle. */
export interface ReworkView {
    id: number
    code: string
    vehicleType: string
    axle: 'FRONT' | 'REAR' | 'ALL'
    /** `von 15 bis 30 mm · aufgeweitet um 5 mm`, formatted by the server. */
    measure: string
    note: string | null
}

/** The record's shape beyond its number, as the forms type it (the corrections memo §4). */
export interface RecordShape {
    supplement_to_id: number | null
    supplement_to_number: string
    annex: string
    test_report_number: string
    copy_number: string
    designation_number: string
    test_site: string
    /** `YYYY-MM-DD` for the date fields. */
    test_date: string
    revision_date: string
    /** `MM.JJJJ` as typed. */
    valid_from_production: string
    /** § 15 FZV as the document says it: `not_required`, `required`, or '' when it says nothing. */
    papers_correction: '' | 'not_required' | 'required'
    /** The Anlagen of its Verwendungsbereich we do not hold, as printed: „1–15“. */
    missing_annexes: string
}

export interface TyreSizeRow {
    width_mm: number
    aspect: number
    diameter: number
    min_load_index: number | null
    min_speed_symbol: string
    axle: AxleValue
    /** The kW band the document prints beside the size (Block D); null on both when it prints none. */
    kw_min: number | null
    kw_max: number | null
    label: string
    codes: RowCode[]
    /** Derived from an Abnahme among its codes and the row's — or the override. */
    requiresEntry: boolean
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
    /** Whether an Abnahme among the codes derives the Eintragung. */
    entryDerived: boolean
    /** The Abnahme codes it comes from, with their page: `A01, Seite 6`. */
    entrySource: string[]
    entryOverride: 'required' | 'not_required' | null
    entryOverrideReason: string
    entryOverrideBy: string | null
    entryOverrideAt: string | null
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
    conditions: RowCode[]
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
    /** How loud it is in the shop (#23, D-104): hinweis, auflage, nicht_zulaessig — and the lowest it may be. */
    level?: string
    levelFloor?: string
    /** Rows and tyre sizes of this document that carry the code. */
    uses: number
    /** A load-index limit that is not twice its index's capacity: the warning, in words; null otherwise. */
    limitWarning?: string | null
    /** Confirmed as the document prints it, with the reason — shown on the record, lifts the release blocker. */
    limitConfirmed?: { reason: string; by: string | null; at: string } | null
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

export interface PreviewVerdict {
    config: number
    wheel: string
    status: 'PERMITTED' | 'CONDITIONAL' | 'NOT_PERMITTED' | 'UNKNOWN'
    statusLabel: string
    /** Every Auflage a Hinweis (#23, D-104): the shop says „Freigegeben“. Additive. */
    notesOnly?: boolean
    reason: string | null
    requiresEntry: boolean
    /** The shop's words for the Auflagen's line and the document's § 15 FZV line (PapersWording). Additive. */
    entryLine?: string | null
    papersLine?: string | null
    entryNote: string | null
    conditions: string[]
    /** As the shop will show them (ConditionGroups). Additive. */
    conditionGroups?: ConditionGroupsView
    front: string[]
    rear: string[]
    sourcePage: number | null
}

/** A document's table of tyre load at speed (ABE 55255, p. 6): each cell „97“, „–“ or absent. */
export interface DeratingView {
    sourcePage: number | null
    /** Written by the demo seed, not typed from this document's pages — said on the record. */
    seededFrom: string | null
    symbols: string[]
    rows: { speed: number; cells: Record<string, string> }[]
}

export interface AdminGutachtenShowProps {
    document: DocumentFacts
    rows: FitmentRowView[]
    vehicles: { id: number; label: string }[]
    blockers: string[]
    preview?: PreviewVerdict[]
    previewVehicle: number | null
    /** The document's own Auflagenverzeichnis. */
    conditions: DocumentConditionView[]
    choices: ConditionChoices
    unresolved: UnresolvedCode[]
    kinds: { value: string; label: string }[]
    replaceable: { value: number; label: string }[]
    /** The documents a Nachtrag may supplement. */
    supplementable: { value: number; label: string }[]
    /** Befestigungsmittel, Pflichthinweise and the millimetres of the rework codes (the corrections memo §4). */
    fasteners: FastenerView[]
    notices: NoticeView[]
    reworks: ReworkView[]
    /** The document's own table of tyre load at speed; `rows` empty when it has none. */
    derating: DeratingView
    openConflicts: number
    /** `levels`: may set how loud each Auflage is in the shop (#23, D-104) — on a released document too. */
    can: { edit: boolean; release: boolean; levels?: boolean }
    levels?: { value: string; label: string }[]
    levelFloorSentence?: string
}

/** One tyre size as typed: `225/40 R18`, the axle, an optional minimum and its own codes (`A01 T88`). */
export interface TyreSizeForm {
    text: string
    axle: AxleValue
    min_load_index: number | null
    min_speed_symbol: string
    /** The kW band as typed: `85-195`, `85–195 kW`; empty when the document prints none. */
    kw: string
    codes: string
}

export interface RowForm {
    axle: AxleValue
    /** The row's codes as typed, as the document prints them: `A01 A12 K1c`. */
    codes: string
    /** '' = the Eintragung follows the codes. */
    entry_override: '' | 'required' | 'not_required'
    entry_override_reason: string
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
    /** A note per code of the row, kept by code while the codes are retyped. */
    notes: Record<string, string>
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
