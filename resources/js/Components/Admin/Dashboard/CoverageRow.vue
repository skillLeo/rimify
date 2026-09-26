<script setup lang="ts">
/**
 * The Übersicht's coverage row: the Abdeckungs-Matrix on eight columns and the Nachfrage-Lücken on
 * four — what the shop may show, and what customers asked for that it may not show yet. Its own
 * component because the Gutachten role sees it straight under the figures, the others further down.
 */

import { Deferred } from '@inertiajs/vue3'
import CoverageMatrix from './CoverageMatrix.vue'
import DashWidget from './DashWidget.vue'
import DemandGaps from './DemandGaps.vue'
import { decimal } from '../../../format'
import type { DashboardCharts } from '../../../types/admin/uebersicht'

defineProps<{ charts?: DashboardCharts }>()
</script>

<template>
    <div class="dash__row">
        <Deferred data="charts">
            <template #fallback>
                <DashWidget class="dash__col-8" title="Abdeckung" loading :skeleton-rows="8" />
                <DashWidget class="dash__col-4" title="Nachfrage-Lücken" loading :skeleton-rows="5" />
            </template>
            <template v-if="charts && charts.coverage">
                <DashWidget
                    class="dash__col-8"
                    title="Abdeckung"
                    href="/admin/abdeckung"
                    href-label="Abdeckung öffnen"
                    :empty="charts.coverage.rows.length ? null : 'Noch kein Fahrzeug im Katalog. Die Matrix füllt sich mit dem ersten Import der Fahrzeugliste.'"
                >
                    <CoverageMatrix :matrix="charts.coverage" />
                </DashWidget>
                <DashWidget
                    v-if="charts.demand"
                    class="dash__col-4"
                    title="Nachfrage-Lücken"
                    href="/admin/nachfrage"
                    :empty="charts.demand.rows.length ? null : 'Im Zeitraum hat niemand nach einem Auto gefragt, für das der Shop keine Felge zeigen kann.'"
                >
                    <p class="demand-lead">
                        {{ decimal(charts.demand.counts.offen, 0) }} {{ charts.demand.counts.offen === 1 ? 'offene Lücke' : 'offene Lücken' }},
                        {{ decimal(charts.demand.asks, 0) }}-mal gefragt<template v-if="charts.demand.waiting">, {{ decimal(charts.demand.waiting, 0) }} {{ charts.demand.waiting === 1 ? 'Person wartet' : 'Personen warten' }}</template>.
                    </p>
                    <DemandGaps :rows="charts.demand.rows" />
                </DashWidget>
            </template>
        </Deferred>
    </div>
</template>

<style scoped>
.demand-lead {
    margin: 0 0 var(--sp-8);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    font-variant-numeric: tabular-nums;
}
</style>
