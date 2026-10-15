<script setup lang="ts">
/**
 * Übersicht: the admin's first screen (docs/admin/rest-build-plan.md, „Übersicht und Shell“; the
 * density brief).
 *
 * One Zeitraum for everything on it (PeriodSwitcher, remembered on the account). The figures come
 * first; under them one twelve-column grid whose cards take the brief's spans — Umsatz 8 / Heute 4 ·
 * Verdikte 5 / Top-Felgen 4 / Systemzustand 3 · Abdeckung 7 / Nachfrage-Lücken 5 · Neueste
 * Bestellungen 12 · Zu erledigen 8 / Letzte Aktivität 4 — rows as tall as their content, cards as
 * tall as theirs; a card with nothing to show shrinks to its sentence (layout.ts places them, and a
 * role without a card never leaves a hole). Where seeded demonstration orders are among the ones
 * counted, the page says so once, above the figures.
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import BarChart from '../../../Components/Admin/Charts/BarChart.vue'
import ChartMenu from '../../../Components/Admin/Charts/ChartMenu.vue'
import ChartTable from '../../../Components/Admin/Charts/ChartTable.vue'
import LineChart from '../../../Components/Admin/Charts/LineChart.vue'
import StackedBar from '../../../Components/Admin/Charts/StackedBar.vue'
import CoverageRow from '../../../Components/Admin/Dashboard/CoverageRow.vue'
import DashWidget from '../../../Components/Admin/Dashboard/DashWidget.vue'
import KpiTile from '../../../Components/Admin/Dashboard/KpiTile.vue'
import PeriodSwitcher from '../../../Components/Admin/Dashboard/PeriodSwitcher.vue'
import QualityList from '../../../Components/Admin/Dashboard/QualityList.vue'
import RecentOrders from '../../../Components/Admin/Dashboard/RecentOrders.vue'
import TodayCard from '../../../Components/Admin/Dashboard/TodayCard.vue'
import TodoList from '../../../Components/Admin/Dashboard/TodoList.vue'
import { useHealth } from '../../../composables/admin/useHealth'
import { formatMoney, formatNumber, formatPercent } from '../../../lib/num'
import type { AdminUebersichtProps, ChartKey, VerdictChart } from '../../../types/admin/uebersicht'
import { cellStyle, MID, place, WIDE, type Slot } from './layout'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminUebersichtProps>()

const health = useHealth()

const exportUrl = computed(() => {
    if (!props.can.export) {
        return null
    }

    const query: Record<string, string> = props.period.key === 'eigen' ? { zeitraum: 'eigen', von: props.period.von, bis: props.period.bis } : { zeitraum: props.period.key }

    return `/admin/uebersicht/export?${new URLSearchParams(query).toString()}`
})

/** Which chart shows its numbers as a table instead ("Tabelle anzeigen"). */
const tables = reactive({ revenue: false, verdicts: false, topWheels: false })

/* Each chart's numbers, as its table and its CSV: the same rows, written by num.ts — amounts with their cents. */
const revenueTable = computed(() => {
    const chart = props.charts?.revenue
    const previous = props.period.compare && chart ? chart.previous : null

    return {
        header: previous ? ['Tag', 'Umsatz', 'Bestellungen', 'Umsatz im Vorzeitraum'] : ['Tag', 'Umsatz', 'Bestellungen'],
        rows: chart
            ? chart.points.map((p, i) => {
                  const before = previous?.[i]

                  return previous ? [p.label, formatMoney(p.value), formatNumber(p.orders), before ? formatMoney(before.value) : ''] : [p.label, formatMoney(p.value), formatNumber(p.orders)]
              })
            : [],
    }
})

const verdictTable = computed(() => {
    const chart = props.charts?.verdicts

    return {
        header: ['Woche', ...(chart ? chart.series.map((s) => s.label) : []), 'Zusammen'],
        rows: chart ? chart.weeks.map((w) => [`${w.label} (${w.range})`, ...chart.series.map((s) => formatNumber(w.values[s.key] ?? 0)), formatNumber(w.total)]) : [],
    }
})

const topTable = computed(() => ({
    header: ['Felge', 'Größe', 'Bestellungen'],
    rows: (props.topWheels ?? []).map((b) => [b.label, b.size ?? '', formatNumber(b.value)]),
}))

/** „1.411 Prüfungen im Zeitraum, 63,2 % davon freigegeben.“ — the Freigabequote is PERMITTED ÷ all. */
const verdictSummary = computed(() => {
    const chart = props.charts?.verdicts

    if (!chart || chart.checks === 0) {
        return null
    }

    return `${formatNumber(chart.checks)} ${chart.checks === 1 ? 'Prüfung' : 'Prüfungen'} im Zeitraum, ${formatPercent((chart.permitted / chart.checks) * 100, 1, false)} davon freigegeben.`
})

/* ── The deferred charts: their boxes from the first frame, then the charts, or a retry ─── */

const page = usePage()

/** The charts' own request failed (no answer, a bare error): every chart widget offers a retry. */
const loadFailed = ref(false)

/** The server could not build the charts at all (Inertia's `rescue`): the same. */
const rescued = computed(() => ((page as unknown as { rescuedProps?: string[] }).rescuedProps ?? []).includes('charts'))

const chartsFailed = computed(() => props.charts === undefined && (loadFailed.value || rescued.value))
const chartsLoading = computed(() => props.charts === undefined && !chartsFailed.value)

const FAILED = 'Diese Auswertung konnte nicht geladen werden. Die übrigen Zahlen der Übersicht sind davon nicht betroffen.'

function has(key: ChartKey): boolean {
    return props.chartKeys.includes(key)
}

function failedOne(key: ChartKey): string | null {
    return chartsFailed.value || props.charts?.failed.includes(key) ? FAILED : null
}

function isChartsVisit(visit: unknown): boolean {
    const only = (visit as { only?: unknown }).only

    return Array.isArray(only) && only.includes('charts')
}

let unbind: Array<() => void> = []

onMounted(() => {
    unbind = [
        router.on('start', (event) => {
            if (isChartsVisit(event.detail.visit)) {
                loadFailed.value = false
            }
        }),
        // Inertia marks every visit „completed“ when it ends, answered or not: what tells a failed
        // load from a good one is whether the charts are on the page now (the page object, which is
        // set before this event; the component's props follow a render later).
        router.on('finish', (event) => {
            if (isChartsVisit(event.detail.visit) && (page.props as { charts?: unknown }).charts === undefined) {
                loadFailed.value = true
            }
        }),
    ]
})

onBeforeUnmount(() => unbind.forEach((off) => off()))

function retryCharts(): void {
    loadFailed.value = false
    router.reload({ only: ['charts'] })
}

/* The skeletons stand in at the size of what replaces them (UEB-02). */
/** The four verdicts, in the server's words (ChartData::VERDICTS), for the legend of the skeleton. */
const VERDICT_SKELETON: VerdictChart = {
    series: [
        { key: 'PERMITTED', label: 'Freigegeben' },
        { key: 'CONDITIONAL', label: 'Mit Auflagen' },
        { key: 'NOT_PERMITTED', label: 'Nicht freigegeben' },
        { key: 'UNKNOWN', label: 'Noch nicht bestätigt' },
    ],
    weeks: [],
    since: null,
    checks: 0,
    permitted: 0,
}

/** The Übersicht's Zeitraum as a query: a list opened from a widget counts the same days. */
const periodQuery = computed(() => {
    const query: Record<string, string> = props.period.key === 'eigen' ? { zeitraum: 'eigen', von: props.period.von, bis: props.period.bis } : { zeitraum: props.period.key }

    return `?${new URLSearchParams(query).toString()}`
})

/** Four tiles share a row as four, three as three: the row always fills its twelve columns. */
const kpiSpan = computed(() => (props.kpis.length > 0 ? Math.max(3, Math.floor(12 / props.kpis.length)) : 12))

/* ── The grid: which cards this role has, in the order the brief reads them ─────────── */

const slots = computed<Slot[]>(() => {
    const coverage: Slot[] = [...(has('coverage') ? (['coverage'] as const) : []), ...(has('demand') ? (['demand'] as const) : [])]
    const sales: Slot[] = [
        ...(has('revenue') ? (['revenue'] as const) : []),
        'today',
        ...(has('verdicts') ? (['verdicts'] as const) : []),
        ...(props.topWheels ? (['topWheels'] as const) : []),
        ...(health.value ? (['health'] as const) : []),
    ]
    const lists: Slot[] = [
        ...(props.recentOrders ? (['orders'] as const) : []),
        ...(props.quality ? (['quality'] as const) : []),
        'todo',
        ...(props.activity ? (['activity'] as const) : []),
    ]

    // Documents, conflicts and demand are the Gutachten role's day: its coverage comes first.
    return props.variant === 'gutachten' ? [...coverage, ...sales, ...lists] : [...sales, ...coverage, ...lists]
})

const wide = computed(() => place(slots.value, WIDE))
const mid = computed(() => place(slots.value, MID))

function cell(slot: Slot): Record<string, number> {
    return cellStyle(wide.value[slot], mid.value[slot])
}
</script>

<template>
    <AdminPage title="Übersicht" dashboard :context="`Stand: ${asOf}`">
        <template #primary>
            <PeriodSwitcher :period="period" :export-url="exportUrl" />
        </template>

        <div class="dash">
            <p class="dash__period">
                <span class="dash__period-name">{{ period.label }}</span>
                <span class="dash__period-range">{{ period.range }}</span>
                <span v-if="period.compare" class="dash__period-compare">gegenüber dem Vorzeitraum {{ period.previousRange }}</span>
            </p>

            <p v-if="demo" class="dash__demo" role="note">
                Unter den gezählten Bestellungen sind Demodaten. Die Zahlen zeigen, wie die Übersicht arbeitet, nicht, wie der Shop läuft.
            </p>

            <section v-if="kpis.length" class="dash__kpis" aria-label="Kennzahlen" :style="{ '--kpi-span': kpiSpan }">
                <KpiTile v-for="kpi in kpis" :key="kpi.key" :kpi="kpi" />
            </section>

            <AdminState v-else kind="empty" text="Für deine Rolle gibt es hier noch keine Kennzahlen. Deine Bereiche findest du in der Navigation." />

            <div class="dash__grid">
                <!-- Documents, conflicts and demand are the Gutachten role's day: its coverage leads. -->
                <CoverageRow
                    v-if="variant === 'gutachten' && (has('coverage') || has('demand'))"
                    :charts="charts"
                    :keys="chartKeys"
                    :rows="coverageRows"
                    :failed="chartsFailed"
                    :period-query="periodQuery"
                    :coverage-style="cell('coverage')"
                    :demand-style="cell('demand')"
                    @retry="retryCharts"
                />

                <template v-if="has('revenue')">
                    <DashWidget
                        v-if="!charts || !charts.revenue && failedOne('revenue')"
                        class="dash__cell"
                        :style="cell('revenue')"
                        title="Umsatz über die Zeit"
                        :loading="chartsLoading"
                        :error="failedOne('revenue')"
                        @retry="retryCharts"
                    >
                        <!-- The plot's height, and the legend itself (its words are known already): the box is
                             exactly what replaces it, at every width. -->
                        <template #skeleton>
                            <div class="chart-skeleton">
                                <span class="skeleton chart-skeleton__plot" />
                                <p v-if="period.compare" class="chart-legend">
                                    <span class="chart-legend__line" /> {{ period.range }}
                                    <span class="chart-legend__line chart-legend__line--previous" /> Vorzeitraum {{ period.previousRange }}
                                </p>
                            </div>
                        </template>
                    </DashWidget>
                    <DashWidget
                        v-else
                        class="dash__cell"
                        :style="cell('revenue')"
                        title="Umsatz über die Zeit"
                        :empty="charts.revenue ? null : 'Noch kein Umsatz in diesem Zeitraum. Die Linie beginnt mit der ersten bezahlten Bestellung.'"
                    >
                        <template v-if="charts.revenue" #tools>
                            <span class="chart-total">{{ formatMoney(charts.revenue.total) }}</span>
                            <ChartMenu
                                v-model:table="tables.revenue"
                                title="Umsatz über die Zeit"
                                :header="revenueTable.header"
                                :rows="revenueTable.rows"
                                :filename="`umsatz-${period.von}-bis-${period.bis}`"
                            />
                        </template>
                        <template v-if="charts.revenue">
                            <ChartTable v-if="tables.revenue" caption="Umsatz je Tag" :header="revenueTable.header" :rows="revenueTable.rows" />
                            <LineChart
                                v-else
                                :points="charts.revenue.points"
                                :previous="period.compare ? charts.revenue.previous : null"
                                :label="`Umsatz je Tag, ${period.range}, zusammen ${formatMoney(charts.revenue.total)}`"
                            />
                            <p v-if="period.compare && charts.revenue.previous" class="chart-legend">
                                <span class="chart-legend__line" aria-hidden="true" /> {{ period.range }}
                                <span class="chart-legend__line chart-legend__line--previous" aria-hidden="true" /> Vorzeitraum {{ period.previousRange }}
                            </p>
                        </template>
                    </DashWidget>
                </template>

                <TodayCard :items="today" class="dash__cell dash__today" :style="cell('today')" />

                <template v-if="has('verdicts')">
                    <DashWidget
                        v-if="!charts || !charts.verdicts && failedOne('verdicts')"
                        class="dash__cell"
                        :style="cell('verdicts')"
                        title="Ergebnisse der Prüfungen"
                        :loading="chartsLoading"
                        :error="failedOne('verdicts')"
                        @retry="retryCharts"
                    >
                        <template #skeleton>
                            <div class="chart-skeleton">
                                <StackedBar :chart="VERDICT_SKELETON" label="" loading />
                                <!-- The caption's two lines, held while the numbers come. -->
                                <p class="chart-caption" aria-hidden="true">&nbsp;<br>&nbsp;</p>
                            </div>
                        </template>
                    </DashWidget>
                    <DashWidget
                        v-else
                        class="dash__cell"
                        :style="cell('verdicts')"
                        title="Ergebnisse der Prüfungen"
                        :empty="charts.verdicts ? null : 'Der Shop zählt jede Prüfung einer Felge an einem Auto. Sobald Kundinnen und Kunden prüfen, zeigt sich hier je Woche, wie oft die Antwort freigegeben, mit Auflagen, nicht freigegeben oder noch nicht bestätigt war.'"
                    >
                        <template v-if="charts.verdicts" #tools>
                            <ChartMenu
                                v-model:table="tables.verdicts"
                                title="Ergebnisse der Prüfungen"
                                :header="verdictTable.header"
                                :rows="verdictTable.rows"
                                :filename="`pruefergebnisse-${period.von}-bis-${period.bis}`"
                            />
                        </template>
                        <template v-if="charts.verdicts">
                            <ChartTable v-if="tables.verdicts" caption="Prüfergebnisse je Woche" :header="verdictTable.header" :rows="verdictTable.rows" />
                            <StackedBar v-else :chart="charts.verdicts" :label="`Prüfergebnisse je Woche, ${period.range}`" />
                            <!-- What the chart counts, under it: two lines at most. -->
                            <p class="chart-caption">
                                {{ verdictSummary }}
                                <template v-if="charts.verdicts.since">Gezählt seit {{ charts.verdicts.since }}.</template>
                            </p>
                        </template>
                    </DashWidget>
                </template>

                <template v-if="topWheels">
                    <DashWidget
                        class="dash__cell"
                        :style="cell('topWheels')"
                        title="Meistbestellte Felgen"
                        :empty="topWheels.length ? null : 'Noch keine bezahlte Bestellung mit Felgen in diesem Zeitraum.'"
                    >
                        <template v-if="topWheels.length" #tools>
                            <ChartMenu
                                v-model:table="tables.topWheels"
                                title="Meistbestellte Felgen"
                                :header="topTable.header"
                                :rows="topTable.rows"
                                :filename="`top-felgen-${period.von}-bis-${period.bis}`"
                            />
                        </template>
                        <ChartTable v-if="tables.topWheels" caption="Meistbestellte Felgen" :header="topTable.header" :rows="topTable.rows" />
                        <BarChart v-else :bars="topWheels" :label="`Meistbestellte Felgen, ${period.range}`" />
                    </DashWidget>
                </template>

                <!-- A degraded state colours the dot and the sentence, never the card. -->
                <DashWidget v-if="health" class="dash__cell" :style="cell('health')" title="Systemzustand" :href="health.href" href-label="Alle Systemprüfungen">
                    <p class="health" :class="`health--${health.state}`">
                        <span class="adm-health__dot" :class="`adm-health__dot--${health.state}`" aria-hidden="true" />
                        {{ health.sentence }}
                    </p>
                    <p class="health__note">Wird jede Minute neu geprüft.</p>
                </DashWidget>

                <!-- The client's core asset, made visible, and what customers asked for that it does not cover yet. -->
                <CoverageRow
                    v-if="variant !== 'gutachten' && (has('coverage') || has('demand'))"
                    :charts="charts"
                    :keys="chartKeys"
                    :rows="coverageRows"
                    :failed="chartsFailed"
                    :period-query="periodQuery"
                    :coverage-style="cell('coverage')"
                    :demand-style="cell('demand')"
                    @retry="retryCharts"
                />

                <DashWidget
                    v-if="recentOrders"
                    class="dash__cell"
                    :style="cell('orders')"
                    title="Neueste Bestellungen"
                    href="/admin/bestellungen"
                    href-label="Alle Bestellungen"
                    :empty="recentOrders.length ? null : 'Hier erscheinen die neuesten Bestellungen, sobald jemand im Shop bestellt.'"
                >
                    <RecentOrders :orders="recentOrders" />
                </DashWidget>

                <!-- Katalog: what is missing from the Felgen in the shop, where Verkauf has its orders. -->
                <DashWidget
                    v-if="quality"
                    class="dash__cell"
                    :style="cell('quality')"
                    title="Datenqualität"
                    :empty="quality.length ? null : 'Bei jeder Ausführung im Shop sind Preis, Foto, Gewicht und Traglast gepflegt.'"
                >
                    <QualityList :rows="quality" />
                </DashWidget>

                <DashWidget
                    class="dash__cell"
                    :style="cell('todo')"
                    title="Zu erledigen"
                    :empty="todo.length ? null : 'Alles erledigt. Was auf dich wartet, erscheint hier – das Älteste zuerst.'"
                >
                    <TodoList :items="todo" />
                </DashWidget>

                <DashWidget
                    v-if="activity"
                    class="dash__cell"
                    :style="cell('activity')"
                    title="Letzte Aktivität"
                    href="/admin/protokoll"
                    href-label="Ganzes Protokoll"
                    :empty="activity.length ? null : 'Jede Änderung im Admin erscheint hier, sobald jemand aus dem Team sie speichert.'"
                >
                    <ul class="activity">
                        <li v-for="entry in activity" :key="entry.id" class="activity__row">
                            <span class="activity__who">{{ entry.person }}</span>
                            <span class="activity__what">{{ entry.sentence }}</span>
                            <time class="activity__when" :datetime="entry.iso ?? undefined">{{ entry.ago }}</time>
                        </li>
                    </ul>
                </DashWidget>
            </div>
        </div>
    </AdminPage>
</template>

<style scoped>
.dash {
    display: grid;
    gap: var(--adm-dash-gap);
    max-width: var(--adm-dash-max);
}

.dash__period {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--sp-4) var(--sp-12);
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    font-variant-numeric: tabular-nums;
}

.dash__period-name {
    font-weight: 600;
    color: var(--c-ink);
}

.dash__period-compare {
    color: var(--c-ink-3);
}

.dash__demo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-12);
    margin: 0;
    padding: var(--sp-12) var(--sp-16);
    border-radius: var(--r-tile);
    background: var(--c-band);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

/* Each tile takes four row tracks (KpiTile's subgrid): the tracks are shared along a row of tiles. */
.dash__kpis {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    grid-auto-rows: auto;
    gap: var(--adm-dash-gap);
}

.dash__kpis > :deep(*) {
    grid-column: span var(--kpi-span);
}

/* Two by two from the phone up to where four no longer fit beside each other. */
@media (max-width: 1279px) {
    .dash__kpis > :deep(*) {
        grid-column: span 6;
    }
}

/* The cards' grid (.dash__grid, .dash__cell) is admin.css's: some cards are a child component's
   roots (CoverageRow), which a scoped rule here would never reach. */

/* ── Charts: the total beside the title, a legend in words, a caption on what was counted ── */

.chart-total {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--c-ink);
}

.chart-legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4) var(--sp-8);
    margin: var(--sp-8) 0 0;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-variant-numeric: tabular-nums;
    color: var(--c-ink-2);
}

.chart-legend__line {
    display: inline-block;
    width: var(--sp-16);
    height: 0;
    border-top: 2px solid var(--chart-accent);
}

/* The previous period as the chart draws it: 1 px, dotted, the strong line colour. */
.chart-legend__line--previous {
    margin-left: var(--sp-8);
    border-top: 1px dotted var(--c-line-2);
}

.chart-skeleton {
    display: grid;
}

.chart-skeleton__plot {
    display: block;
    height: var(--adm-plot-h);
}

/* Under the chart, what it counts: 13.5 px, the tertiary ink — two short sentences, two lines at most. */
.chart-caption {
    max-width: 60ch;
    /* Two lines, always — the skeleton holds two (UEB-02); a caption that fits one must not shrink the widget. */
    min-height: calc(2 * var(--adm-lh-caption));
    margin: var(--sp-12) 0 0;
    font-size: var(--adm-fs-caption);
    line-height: var(--adm-lh-caption);
    font-variant-numeric: tabular-nums;
    color: var(--c-ink-3);
}

/* ── Systemzustand, Letzte Aktivität ─────────────────────────────────────────────── */

.health {
    display: flex;
    align-items: center;
    gap: var(--sp-8);
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
}

.health--ok {
    color: var(--c-ok);
}

.health--warn {
    color: var(--c-warn);
}

.health--bad {
    color: var(--c-bad);
}

.health__note {
    margin: var(--sp-8) 0 0;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

.activity {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
}

.activity__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0 var(--sp-12);
    padding-block: var(--sp-8);
    border-bottom: 1px solid var(--c-line);
    font-size: var(--adm-fs-table);
    line-height: var(--adm-lh-table);
}

.activity__row:last-child {
    border-bottom: 0;
}

.activity__who {
    font-weight: 600;
    color: var(--c-ink);
}

.activity__what {
    grid-column: 1 / -1;
    color: var(--c-ink-2);
    overflow-wrap: anywhere;
}

.activity__when {
    grid-row: 1;
    grid-column: 2;
    font-size: var(--fs-micro);
    color: var(--c-ink-3);
    white-space: nowrap;
}

@media print {
    .dash__kpis > :deep(*) {
        break-inside: avoid;
    }
}
</style>
