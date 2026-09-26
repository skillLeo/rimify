<script setup lang="ts">
/**
 * Übersicht: the admin's first screen (docs/admin/rest-build-plan.md, „Übersicht und Shell“).
 *
 * A 12-column grid, 1440 px at most, one Zeitraum for everything on it (PeriodSwitcher, remembered on
 * the account). The KPI row comes first: four tiles for a role that sells, the Gutachten figures for
 * a role that approves; every tile links to the list it counts. Where seeded demonstration orders
 * are among the ones counted, the page says so once, above the figures.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import DashWidget from '../../../Components/Admin/Dashboard/DashWidget.vue'
import KpiTile from '../../../Components/Admin/Dashboard/KpiTile.vue'
import PeriodSwitcher from '../../../Components/Admin/Dashboard/PeriodSwitcher.vue'
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

            <div class="dash__row">
                <!-- Heute: what this role should do now, each with the button that starts it. -->
                <DashWidget class="dash__col-4" title="Heute" :empty="today.length ? null : 'Heute ist nichts offen. Neues erscheint hier, sobald es dich betrifft.'">
                    <ul class="today">
                        <li v-for="item in today" :key="item.key" class="today__row">
                            <p class="today__sentence">{{ item.sentence }}</p>
                            <Link :href="item.href" class="btn btn--secondary btn--sm">{{ item.action }}</Link>
                        </li>
                    </ul>
                </DashWidget>

                <DashWidget v-if="health" class="dash__col-4" title="Systemzustand" :href="health.href" href-label="Details">
                    <p class="health" :class="`health--${health.state}`">
                        <span class="adm-health__dot" :class="`adm-health__dot--${health.state}`" aria-hidden="true" />
                        {{ health.sentence }}
                    </p>
                    <p class="health__note">Wird jede Minute neu geprüft.</p>
                </DashWidget>

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

                <DashWidget
                    :class="recentOrders ? 'dash__col-5' : 'dash__col-12'"
                    title="Zu erledigen"
                    :empty="todo.length ? null : 'Alles erledigt. Was auf dich wartet, erscheint hier – das Älteste zuerst.'"
                >
                    <TodoList :items="todo" />
                </DashWidget>
            </div>
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

/* A row of widgets on the page's twelve columns; each says how many it takes. */
.dash__row {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    align-items: start;
    gap: var(--sp-24);
}

.dash__col-4 {
    grid-column: span 4;
}

.dash__col-5 {
    grid-column: span 5;
}

.dash__col-6 {
    grid-column: span 6;
}

.dash__col-7 {
    grid-column: span 7;
}

.dash__col-12 {
    grid-column: 1 / -1;
}

.dash__col-8 {
    grid-column: span 8;
}

/* Two by two from the phone up to where four no longer fit beside each other. */
@media (max-width: 1279px) {
    .dash__kpis > :deep(*) {
        grid-column: span 6;
    }

    .dash__col-4 {
        grid-column: span 6;
    }

    .dash__col-5,
    .dash__col-6,
    .dash__col-7,
    .dash__col-8 {
        grid-column: 1 / -1;
    }
}

@media (max-width: 767px) {
    .dash__row {
        gap: var(--sp-16);
    }

    .dash__col-4 {
        grid-column: 1 / -1;
    }
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
