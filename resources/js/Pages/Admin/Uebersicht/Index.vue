<script setup lang="ts">
/**
 * Übersicht: the admin's first screen (docs/admin/rest-build-plan.md, „Übersicht und Shell“).
 *
 * A 12-column grid, 1440 px at most, one Zeitraum for everything on it (PeriodSwitcher, remembered on
 * the account). The KPI row comes first: four tiles for a role that sells, the Gutachten figures for
 * a role that approves; every tile links to the list it counts. Where seeded demonstration orders
 * are among the ones counted, the page says so once, above the figures.
 */

import { computed } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import KpiTile from '../../../Components/Admin/Dashboard/KpiTile.vue'
import PeriodSwitcher from '../../../Components/Admin/Dashboard/PeriodSwitcher.vue'
import type { AdminUebersichtProps } from '../../../types/admin/uebersicht'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminUebersichtProps>()

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
