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

export interface ChartPoint {
    key: string
    /** `24.09.2026` */
    label: string
    /** For the scale: cents, or a count. */
    value: number
    /** For the tooltip and the table: `1.425,00 €`. */
    text: string
}

export interface RevenueChart {
    points: ChartPoint[]
    /** The previous period, day for day; null with comparing off. */
    previous: ChartPoint[] | null
    total: string
}

export interface VerdictWeek {
    key: string
    /** `KW 38` */
    label: string
    /** `15.09.–21.09.2026` */
    range: string
    values: Record<string, number>
    total: number
}

export interface VerdictChart {
    series: { key: string; label: string }[]
    weeks: VerdictWeek[]
    /** The first day counted: `27.09.2026`. */
    since: string | null
}

export interface CoverageCell {
    /** `19`, `18,5` */
    size: string
    count: number
    /** 0 for none, 1–7: the step of the sequential ramp. */
    level: number
    /** `BMW, 19 Zoll: 142 von 168 Varianten` */
    sentence: string
    href: string | null
}

export interface CoverageRow {
    make: string
    variants: number
    covered: number
    cells: CoverageCell[]
}

export interface CoverageMatrix {
    sizes: { key: string; label: string }[]
    rows: CoverageRow[]
    max: number
    summary: { fitments: string; variants: string; sentence: string }
    computedAt: string
}

export interface DashboardCharts {
    /** false: not for this role; null: nothing to draw yet. */
    revenue: RevenueChart | null | false
    verdicts: VerdictChart | null | false
    topWheels: ChartPoint[] | false
    coverage: CoverageMatrix | false
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
    /** Deferred: undefined until the charts arrive, a moment after the page. */
    charts?: DashboardCharts
    can: { export: boolean }
}
