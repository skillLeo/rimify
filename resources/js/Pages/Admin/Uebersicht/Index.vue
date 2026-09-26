<script setup lang="ts">
/**
 * Übersicht: the admin's first screen (docs/admin/rest-build-plan.md, „Übersicht und Shell“).
 *
 * A 12-column grid, 1440 px at most, one Zeitraum for everything on it (PeriodSwitcher, remembered on
 * the account). The KPI row comes first: four tiles for a role that sells, the Gutachten figures for
 * a role that approves; every tile links to the list it counts. Where seeded demonstration orders
 * are among the ones counted, the page says so once, above the figures.
 */

import { Deferred, Link } from '@inertiajs/vue3'
import { computed, reactive } from 'vue'
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
import TodoList from '../../../Components/Admin/Dashboard/TodoList.vue'
import { useHealth } from '../../../composables/admin/useHealth'
import type { AdminUebersichtProps } from '../../../types/admin/uebersicht'

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

/* Each chart's numbers, as its table and its CSV: the same rows, already German. */
const revenueTable = computed(() => {
    const chart = props.charts?.revenue
    const previous = props.period.compare && chart ? chart.previous : null

    return {
        header: previous ? ['Tag', 'Umsatz', 'Vorperiode'] : ['Tag', 'Umsatz'],
        rows: chart ? chart.points.map((p, i) => (previous ? [p.label, p.text, previous[i]?.text ?? ''] : [p.label, p.text])) : [],
    }
})

const verdictTable = computed(() => {
    const chart = props.charts?.verdicts

    return {
        header: ['Woche', ...(chart ? chart.series.map((s) => s.label) : []), 'Zusammen'],
        rows: chart ? chart.weeks.map((w) => [`${w.label} (${w.range})`, ...chart.series.map((s) => String(w.values[s.key] ?? 0)), String(w.total)]) : [],
    }
})

const topTable = computed(() => ({
    header: ['Felge', 'Bestellungen'],
    rows: props.charts?.topWheels ? props.charts.topWheels.map((b) => [b.label, String(b.value)]) : [],
}))

/** Four tiles share a row as four, three as three: the row always fills its twelve columns. */
const kpiSpan = computed(() => (props.kpis.length > 0 ? Math.max(3, Math.floor(12 / props.kpis.length)) : 12))
</script>

<template>
    <AdminPage title="Übersicht" :context="`Stand: ${asOf}`">
        <template #primary>
            <PeriodSwitcher :period="period" :export-url="exportUrl" />
        </template>

        <div class="dash">
            <p class="dash__period">
                <span class="dash__period-name">{{ period.label }}</span>
                <span class="dash__period-range">{{ period.range }}</span>
                <span v-if="period.compare" class="dash__period-compare">verglichen mit {{ period.previousRange }}</span>
            </p>

            <p v-if="demo" class="dash__demo" role="note">
                <span class="adm-tag adm-tag--neutral">Demodaten</span>
                Unter den gezählten Bestellungen sind Demodaten. Die Zahlen zeigen, wie die Übersicht arbeitet, nicht, wie der Shop läuft.
            </p>

            <section v-if="kpis.length" class="dash__kpis" aria-label="Kennzahlen" :style="{ '--kpi-span': kpiSpan }">
                <KpiTile v-for="kpi in kpis" :key="kpi.key" :kpi="kpi" :compare="period.compare" />
            </section>

            <AdminState v-else kind="empty" text="Für deine Rolle gibt es hier noch keine Kennzahlen. Deine Bereiche findest du in der Navigation." />

            <!-- Documents, conflicts and demand are the Gutachten role's day: its coverage row comes first. -->
            <CoverageRow v-if="charts?.coverage !== false && variant === 'gutachten'" :charts="charts" />

            <!-- Row 2: the trend, and beside it what to do now and whether the shop is all right. -->
            <div class="dash__row">
                <Deferred v-if="charts?.revenue !== false" data="charts">
                    <template #fallback>
                        <DashWidget class="dash__col-8" title="Umsatz über die Zeit" loading :skeleton-rows="6" />
                    </template>
                    <DashWidget
                        v-if="charts"
                        class="dash__col-8"
                        title="Umsatz über die Zeit"
                        :empty="charts.revenue ? null : 'Noch kein Umsatz in diesem Zeitraum. Die Linie beginnt mit der ersten bezahlten Bestellung.'"
                    >
                        <template v-if="charts.revenue" #tools>
                            <span class="chart-total">{{ charts.revenue.total }}</span>
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
                                :label="`Umsatz je Tag, ${period.range}, zusammen ${charts.revenue.total}`"
                            />
                            <p v-if="period.compare && charts.revenue.previous" class="chart-legend">
                                <span class="chart-legend__line" aria-hidden="true" /> {{ period.range }}
                                <span class="chart-legend__line chart-legend__line--previous" aria-hidden="true" /> Vorperiode {{ period.previousRange }}
                            </p>
                        </template>
                    </DashWidget>
                </Deferred>

                <div class="dash__stack" :class="charts?.revenue === false ? 'dash__col-12' : 'dash__col-4'">
                    <!-- Heute: what this role should do now, each with the button that starts it. -->
                    <DashWidget title="Heute" :empty="today.length ? null : 'Heute ist nichts offen. Neues erscheint hier, sobald es dich betrifft.'">
                        <ul class="today">
                            <li v-for="item in today" :key="item.key" class="today__row">
                                <p class="today__sentence">{{ item.sentence }}</p>
                                <Link :href="item.href" class="btn btn--secondary btn--sm">{{ item.action }}</Link>
                            </li>
                        </ul>
                    </DashWidget>

                    <DashWidget v-if="health" title="Systemzustand" :href="health.href" href-label="Details">
                        <p class="health" :class="`health--${health.state}`">
                            <span class="adm-health__dot" :class="`adm-health__dot--${health.state}`" aria-hidden="true" />
                            {{ health.sentence }}
                        </p>
                        <p class="health__note">Wird jede Minute neu geprüft.</p>
                    </DashWidget>
                </div>
            </div>

            <!-- Row 3: the two tables this screen was missing most. -->
            <div class="dash__row">
                <DashWidget
                    v-if="recentOrders"
                    class="dash__col-7"
                    title="Neueste Bestellungen"
                    href="/admin/bestellungen"
                    :empty="recentOrders.length ? null : 'Hier erscheinen die neuesten Bestellungen, sobald jemand im Shop bestellt.'"
                >
                    <RecentOrders :orders="recentOrders" />
                </DashWidget>

                <!-- Katalog: what is missing from the Felgen in the shop, where Verkauf has its orders. -->
                <DashWidget
                    v-if="quality"
                    class="dash__col-7"
                    title="Datenqualität"
                    :empty="quality.length ? null : 'Bei jeder Ausführung im Shop sind Preis, Foto, Gewicht und Traglast gepflegt.'"
                >
                    <QualityList :rows="quality" />
                </DashWidget>

                <DashWidget
                    :class="recentOrders || quality ? 'dash__col-5' : 'dash__col-12'"
                    title="Zu erledigen"
                    :empty="todo.length ? null : 'Alles erledigt. Was auf dich wartet, erscheint hier – das Älteste zuerst.'"
                >
                    <TodoList :items="todo" />
                </DashWidget>
            </div>

            <!-- Row 4: what customers were told, what sells, and what the team changed. -->
            <div class="dash__row">
                <Deferred v-if="charts?.verdicts !== false" data="charts">
                    <template #fallback>
                        <DashWidget class="dash__col-4" title="Verdikte der Prüfungen" loading :skeleton-rows="6" />
                    </template>
                    <DashWidget
                        v-if="charts"
                        class="dash__col-4"
                        title="Verdikte der Prüfungen"
                        :empty="charts.verdicts ? null : 'Der Shop zählt jede Prüfung einer Felge an einem Auto. Sobald Kundinnen und Kunden prüfen, zeigt sich hier je Woche, wie oft die Antwort freigegeben, mit Auflagen, nicht freigegeben oder unbekannt war.'"
                    >
                        <template v-if="charts.verdicts" #tools>
                            <ChartMenu
                                v-model:table="tables.verdicts"
                                title="Verdikte der Prüfungen"
                                :header="verdictTable.header"
                                :rows="verdictTable.rows"
                                :filename="`verdikte-${period.von}-bis-${period.bis}`"
                            />
                        </template>
                        <template v-if="charts.verdicts">
                            <ChartTable v-if="tables.verdicts" caption="Verdikte je Woche" :header="verdictTable.header" :rows="verdictTable.rows" />
                            <StackedBar v-else :chart="charts.verdicts" :label="`Verdikte je Woche, ${period.range}`" />
                            <p v-if="charts.verdicts.since" class="chart-note">Gezählt seit {{ charts.verdicts.since }}.</p>
                        </template>
                    </DashWidget>
                </Deferred>

                <Deferred v-if="charts?.topWheels !== false" data="charts">
                    <template #fallback>
                        <DashWidget class="dash__col-4" title="Top-Felgen nach Bestellungen" loading :skeleton-rows="6" />
                    </template>
                    <DashWidget
                        v-if="charts"
                        class="dash__col-4"
                        title="Top-Felgen nach Bestellungen"
                        :empty="charts.topWheels.length ? null : 'Noch keine bezahlte Bestellung mit Felgen in diesem Zeitraum.'"
                    >
                        <template v-if="charts.topWheels.length" #tools>
                            <ChartMenu
                                v-model:table="tables.topWheels"
                                title="Top-Felgen nach Bestellungen"
                                :header="topTable.header"
                                :rows="topTable.rows"
                                :filename="`top-felgen-${period.von}-bis-${period.bis}`"
                            />
                        </template>
                        <ChartTable v-if="tables.topWheels" caption="Top-Felgen nach Bestellungen" :header="topTable.header" :rows="topTable.rows" />
                        <BarChart v-else :bars="charts.topWheels" :label="`Top-Felgen nach Bestellungen, ${period.range}`" />
                    </DashWidget>
                </Deferred>

                <DashWidget
                    v-if="activity"
                    class="dash__col-4"
                    title="Letzte Aktivität"
                    href="/admin/protokoll"
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

            <!-- Row 5: the client's core asset, made visible, and what customers asked for that it does
                 not cover yet. The Gutachten role has it straight under its figures instead. -->
            <CoverageRow v-if="charts?.coverage !== false && variant !== 'gutachten'" :charts="charts" />
        </div>
    </AdminPage>
</template>

<style scoped>
.dash {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: var(--sp-24);
    max-width: var(--adm-dash-max);
}

.dash > * {
    grid-column: 1 / -1;
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

.dash__kpis {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: var(--sp-24);
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

/* Heute and Systemzustand, one above the other beside the trend; side by side where there is none. */
.dash__stack {
    display: grid;
    align-content: start;
    gap: var(--sp-24);
}

.dash__stack.dash__col-12 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 767px) {
    .dash__stack,
    .dash__stack.dash__col-12 {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--sp-16);
    }
}

/* ── Charts: the total beside the title, a legend in words, a note on what was counted ── */

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

.chart-legend__line--previous {
    margin-left: var(--sp-8);
    border-top: 2px dashed var(--chart-muted);
}


.chart-note {
    margin: var(--sp-8) 0 0;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

/* ── Heute, Systemzustand, Letzte Aktivität ─────────────────────────────────────── */

.today {
    display: grid;
    gap: var(--sp-12);
    margin: 0;
    padding: 0;
    list-style: none;
}

.today__row {
    display: grid;
    justify-items: start;
    gap: var(--sp-8);
    padding-bottom: var(--sp-12);
    border-bottom: 1px solid var(--c-line);
}

.today__row:last-child {
    padding-bottom: 0;
    border-bottom: 0;
}

.today__sentence {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink);
}

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

@media (max-width: 767px) {
    .dash,
    .dash__kpis {
        gap: var(--sp-16);
    }
}

@media print {
    .dash__kpis > :deep(*) {
        break-inside: avoid;
    }
}
</style>
