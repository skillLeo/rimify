/** Übersicht — UebersichtController and SalesFigures. */

/** A tile's one line under its figure. */
export interface KpiSub {
    /** `+12,4 % zum Vorzeitraum`, `älteste seit 3 Tagen`, `noch keine bezahlte Bestellung` */
    text: string
    /** The change against the previous period, a fact about the figure, or why there is no figure (or change). */
    kind: 'delta' | 'note' | 'reason'
    /** For a change: which way (the arrow). */
    direction: 'up' | 'down' | 'flat' | null
}

export interface Kpi {
    key: string
    label: string
    /** What the figure counts — shown on hover and read with the link. */
    hint: string
    /** The figure: cents where `unit` is EUR, else a count. Zero is a figure; null only where none can be computed. */
    value: number | null
    unit: 'EUR' | null
    sub: KpiSub
    /** One value per day of the period; null where a day has no value (an average without orders). */
    series: (number | null)[]
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
    /** Minor units (cents); written by num.ts formatMoney. */
    total: number
    payment: { label: string; tone: 'plain' | 'warn' | 'bad' | 'neutral' }
    /** `none`: nothing to ship, said quietly („noch nicht versandt“, „entfällt“) — not a chip. */
    fulfilment: { label: string; tone: 'plain' | 'warn' | 'bad' | 'neutral' | 'none' }
    /** `vor 2 Std.` */
    ago: string | null
    iso: string | null
    demo: boolean
    href: string
    /** Every order of the same person — a row action. */
    customerHref: string | null
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
    /** Cents. */
    value: number
    /** Paid orders that day. */
    orders: number
}

export interface RevenueChart {
    points: ChartPoint[]
    /** The previous period, day for day; null with comparing off. */
    previous: ChartPoint[] | null
    /** Cents: the sum of the days, the Umsatz tile's figure. */
    total: number
}

/** One Felge in the ranking: the model, and the size most of its orders took. */
export interface TopWheel {
    key: string
    /** `Bergsteig Gipfel` */
    label: string
    brand: string
    name: string
    /** `8,5J × 19` */
    size: string | null
    /** Paid orders holding it. */
    value: number
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
    /** The period's Prüfungen, and how many were freigegeben (the Freigabequote is one ÷ the other). */
    checks: number
    permitted: number
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
    /**
     * Released Nachträge whose base document we do not hold, each with its sentence: the approvals the
     * matrix counts for them are not the whole approval (the corrections memo §4). Additive.
     */
    incomplete?: { document: string; href: string; sentence: string; base: string | null }[]
    /** Released documents without a table of tyre load at speed: no tyre answer above 210 km/h from them. Additive. */
    noSpeedTable?: { document: string; href: string }[]
    /** Released documents whose Verwendungsbereich we hold only in part („1–15“ missing). Additive. */
    missingAnnexes?: { document: string; href: string; annexes: string }[]
}

/** One Nachfrage-Lücke: a car asked for that the shop has no approved wheel for yet (Demand). */
export interface DemandGap {
    /** `v:123` a variant in the catalogue, `k:0005-ABC` key numbers it does not know. */
    key: string
    kind: 'vehicle' | 'keys'
    /** `BMW X3 M40i`, or `HSN 0005 · TSN ABC` for a car the catalogue does not know. */
    title: string
    /** `HSN 0005 · TSN ABC · 11/2017–heute`, `Nicht im Fahrzeugkatalog` */
    detail: string
    /** Asks in the Zeitraum. */
    asked: number
    /** People waiting now for a message. */
    waiting: number
    lastAgo: string | null
    lastIso: string | null
    score: number
    /** 1–100: this gap's demand against the largest in the list. */
    weight: number
    mark: { state: 'watched' | 'requested'; label: string; by: string | null } | null
    /** The request to a wheel brand, ready to send. */
    mail: { subject: string; body: string }
    /** Its place in the whole ranking, on any page and in any search (Nachfrage; the admin audit's F-41). */
    rank?: number
}

export interface DemandCounts {
    offen: number
    beobachtet: number
    angefordert: number
    alle: number
}

export interface DemandList {
    rows: DemandGap[]
    counts: DemandCounts
    asks: number
    waiting: number
}

/** The charts a role may get; which of them it does get is known before they arrive (`chartKeys`). */
export type ChartKey = 'revenue' | 'verdicts' | 'coverage' | 'demand'

export interface DashboardCharts {
    /** false: not for this role; null: nothing to draw yet — or its query failed (then in `failed`). */
    revenue: RevenueChart | null | false
    verdicts: VerdictChart | null | false
    coverage: CoverageMatrix | null | false
    demand: DemandList | null | false
    /** The charts whose query failed: each widget says so and offers „Erneut versuchen“. */
    failed: ChartKey[]
}

/** A Felge in the shop with something missing (RoleFigures::incomplete). */
export interface QualityRow {
    key: string
    /** `BBS CH-R` */
    title: string
    /** `8,5J × 19 · ET 35 · Satin Black` */
    detail: string
    /** `Preis`, `Foto`, `Gewicht`, `Traglast` */
    missing: string[]
}

/** Which Übersicht this role gets (Variant): one layout, different figures. */
export type DashboardVariant = 'verkauf' | 'katalog' | 'gutachten' | 'support' | 'keine'

export interface AdminUebersichtProps {
    /** `26.09.2026, 20:10 Uhr` */
    asOf: string
    period: DashboardPeriod
    variant: DashboardVariant
    kpis: Kpi[]
    /** Katalog only: the Felgen with something missing. */
    quality: QualityRow[] | null
    /** Seeded demonstration orders are among the ones counted. */
    demo: boolean
    /** Null for a role that may not open Bestellungen. */
    recentOrders: DashboardOrderRow[] | null
    todo: TodoItem[]
    today: TodaySentence[]
    /** Null for a role that may not read the Protokoll. */
    activity: ActivityEntry[] | null
    /**
     * Top-Felgen, with the page itself (null: not for this role). One short query — and a ranking whose
     * names may wrap has no skeleton that could match it, so it has none (M1-06).
     */
    topWheels: TopWheel[] | null
    /** Deferred: undefined until the charts arrive, a moment after the page. */
    charts?: DashboardCharts
    /** The charts this role gets, known at once: their boxes are in place from the first frame. */
    chartKeys: ChartKey[]
    /** The Abdeckungs-Matrix's makes, counted at once: its skeleton has the matrix's height. */
    coverageRows: number
    can: { export: boolean }
}
