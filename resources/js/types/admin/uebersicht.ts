/** Übersicht — UebersichtController and SalesFigures. */

export interface KpiDelta {
    value: number
    direction: 'up' | 'down' | 'flat'
    /** `+12,4 % vs. Vorperiode` */
    label: string
}

export interface Kpi {
    key: string
    label: string
    /** What the figure counts — shown on hover and read with the link. */
    hint: string
    /** Formatted German; null when there is nothing to count. */
    value: string | null
    /** The sentence shown instead of a zero. */
    empty: string | null
    delta: KpiDelta | null
    /** Why a change is missing although comparing is on („Vorperiode ohne Bestellungen“). */
    deltaNote: string | null
    /** One value per day of the period; null where a day has no value (an average without orders). */
    series: (number | null)[]
    /** A state's own line: `Stand jetzt`, `älteste seit 3 Tagen`. */
    note: string | null
    /** The list that shows exactly what the figure counts; null where this role cannot open it. */
    href: string | null
}

export interface DashboardPeriod {
    key: '7' | '30' | '90' | 'eigen'
    /** `YYYY-MM-DD`, Berlin days, both included. */
    von: string
    bis: string
    /** `Letzte 30 Tage` */
    label: string
    /** `28.08.–26.09.2026` */
    range: string
    previousRange: string
    days: number
    compare: boolean
}

export interface DashboardOrderRow {
    id: number
    number: string
    customer: string
    total: string
    payment: { label: string; tone: 'plain' | 'warn' | 'bad' | 'neutral' }
    fulfilment: { label: string; tone: 'plain' | 'warn' | 'bad' | 'neutral' }
    /** `vor 2 Std.` */
    ago: string | null
    iso: string | null
    demo: boolean
    href: string
}

export interface TodoItem {
    key: string
    /** The chip: Versand, Gutachten, Anfrage, System. */
    type: string
    title: string
    detail: string | null
    ago: string | null
    iso: string | null
    href: string
}

export interface TodaySentence {
    key: string
    sentence: string
    action: string
    href: string
}

export interface ActivityEntry {
    id: number
    person: string
    sentence: string
    ago: string | null
    iso: string | null
}

export interface AdminUebersichtProps {
    /** `26.09.2026, 20:10 Uhr` */
    asOf: string
    period: DashboardPeriod
    kpis: Kpi[]
    /** Seeded demonstration orders are among the ones counted. */
    demo: boolean
    /** Null for a role that may not open Bestellungen. */
    recentOrders: DashboardOrderRow[] | null
    todo: TodoItem[]
    today: TodaySentence[]
    /** Null for a role that may not read the Protokoll. */
    activity: ActivityEntry[] | null
    can: { export: boolean }
}
