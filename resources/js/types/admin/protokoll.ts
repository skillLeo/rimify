/**
 * Protokoll (docs/admin/team-build-plan.md, BRIEF.md §2) — the page's props, exactly as
 * ProtokollController@index sends them. Every entry arrives already in words: the page never sees an
 * event name, an id or cents, and never formats a date itself — the server wrote them in Berlin time,
 * so the first frame and the hydrated one agree.
 */

export interface ProtokollChange {
    /** `Aufpreis je Rad`, `Katalog · Bearbeiten` */
    label: string
    /** `2,50 €`, `verboten`, `nicht festgelegt`, `nicht erfasst`, or `–` for nothing */
    before: string
    after: string
}

export interface ProtokollEntry {
    id: number
    /** `26.09.2026, 14:22 Uhr` */
    at: string | null
    /** The instant as ISO 8601, for `<time datetime>`. */
    iso: string | null
    /** `26.09.2026`, the Berlin calendar day the entries are grouped by. */
    day: string | null
    /** `Heute`, `Gestern` or the date. */
    dayLabel: string
    /** `14:22 Uhr` */
    time: string | null
    /** The account's name, else the address kept on the entry, else `Unbekannt`. */
    person: string
    /** `Team`, `Katalog`, `Konto`, `Zugriff`, `Protokoll`, `Sonstiges` */
    area: string
    /** One or two full German sentences. */
    sentence: string
    changes: ProtokollChange[]
    ip: string | null
}

export interface ProtokollOption {
    value: string
    label: string
}

export interface ProtokollFilters {
    /** An account id, or an address kept on entries that name no account. */
    person: string | null
    bereich: string | null
    /** `YYYY-MM-DD`, a Berlin calendar day. */
    von: string | null
    bis: string | null
}

export interface AdminProtokollProps {
    entries: ProtokollEntry[]
    filters: ProtokollFilters
    options: { people: ProtokollOption[]; areas: ProtokollOption[] }
    /** Whether any filter is in force. */
    filtered: boolean
    /** The oldest entry first (F-32); the plain log is newest first. An order, not a filter. */
    oldestFirst: boolean
    /** Every entry in the log, before the filters — the figure the filtered empty state names. */
    totalAll: number
    pagination: {
        current: number
        last: number
        /** Entries matching the filters. */
        total: number
        /** Newer entries; null on the first page. */
        prev: string | null
        /** Older entries; null on the last page. */
        next: string | null
    }
    /** The export with the same filters; null when this admin may not export. */
    exportUrl: string | null
    /** Presentation only — the server refuses the export regardless (R-11). */
    can: { export: boolean }
}
