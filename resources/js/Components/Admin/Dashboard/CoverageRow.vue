<script setup lang="ts">
/**
 * The Übersicht's coverage pair: the Abdeckungs-Matrix and the Nachfrage-Lücken — what the shop may
 * show, and what customers asked for that it may not show yet. Two cells of the page's grid, each
 * placed by the page (`coverageStyle`, `demandStyle`: its spans); its own component because the
 * Gutachten role sees it straight under the figures, the others further down.
 *
 * Both arrive with the page's deferred charts. Until then each stands in its own final size — the
 * matrix as a skeleton of as many makes as it will show (`rows`, counted with the page), the list as
 * five rows under its lead line — so nothing on the page moves when they land. If they cannot load,
 * each says so and offers „Erneut versuchen“.
 */

import { computed } from 'vue'
import CoverageMatrix from './CoverageMatrix.vue'
import DashWidget from './DashWidget.vue'
import DemandGaps from './DemandGaps.vue'
import { formatNumber } from '../../../lib/num'
import type { ChartKey, CoverageMatrix as Matrix, DashboardCharts } from '../../../types/admin/uebersicht'

const props = defineProps<{
    charts?: DashboardCharts
    /** Which of the two this role gets (the page's `chartKeys`). */
    keys: ChartKey[]
    /** The matrix's makes, counted with the page: the skeleton's rows. */
    rows: number
    /** The whole deferred load failed (network, server): both widgets offer a retry. */
    failed: boolean
    /** The Übersicht's Zeitraum as a query, so the full list counts the same days as the widget. */
    periodQuery: string
    /** Where each sits in the page's grid. */
    coverageStyle?: Record<string, string | number>
    demandStyle?: Record<string, string | number>
}>()

const emit = defineEmits<{ retry: [] }>()

/** A lead line and five two-line rows of 56 px: the list's box, loaded or not. */
const DEMAND_HEIGHT = 28 + 5 * 56

const FAILED = 'Diese Auswertung konnte nicht geladen werden. Die übrigen Zahlen der Übersicht sind davon nicht betroffen.'

function failedOne(key: ChartKey): string | null {
    return props.failed || props.charts?.failed.includes(key) ? FAILED : null
}

/** The matrix as it will be drawn, without its words: as many makes, five sizes. */
const skeleton = computed<Matrix>(() => {
    const sizes = Array.from({ length: 5 }, (_, i) => ({ key: `s${i}`, label: '' }))

    return {
        sizes,
        rows: Array.from({ length: Math.max(1, props.rows) }, (_, i) => ({
            make: `m${i}`,
            variants: 0,
            covered: 0,
            cells: sizes.map((size) => ({ size: size.key, count: 0, level: 0, sentence: '', href: null })),
        })),
        max: 0,
        summary: { fitments: '', variants: '', sentence: '' },
        computedAt: '',
    }
})
</script>

<template>
    <template v-if="keys.includes('coverage')">
        <DashWidget
            v-if="!charts || !charts.coverage"
            class="dash__cell"
            :style="coverageStyle"
            title="Abdeckung"
            :loading="!charts && !failed"
            :error="failedOne('coverage')"
            @retry="emit('retry')"
        >
            <template #skeleton>
                <CoverageMatrix :matrix="skeleton" placeholder />
            </template>
        </DashWidget>
        <DashWidget
            v-else
            class="dash__cell"
            :style="coverageStyle"
            title="Abdeckung"
            href="/admin/abdeckung"
            href-label="Abdeckung öffnen"
            :empty="charts.coverage.rows.length ? null : 'Noch kein Fahrzeug im Katalog. Die Matrix füllt sich mit dem ersten Import der Fahrzeugliste.'"
        >
            <CoverageMatrix :matrix="charts.coverage" />
        </DashWidget>
    </template>

    <template v-if="keys.includes('demand')">
        <DashWidget
            v-if="!charts || !charts.demand"
            class="dash__cell"
            :style="demandStyle"
            title="Nachfrage-Lücken"
            :body-height="DEMAND_HEIGHT"
            :loading="!charts && !failed"
            :error="failedOne('demand')"
            @retry="emit('retry')"
        />
        <DashWidget
            v-else
            class="dash__cell"
            :style="demandStyle"
            title="Nachfrage-Lücken"
            :href="`/admin/nachfrage${periodQuery}`"
            href-label="Alle offenen Lücken"
            :body-height="DEMAND_HEIGHT"
            :empty="charts.demand.rows.length ? null : 'Im Zeitraum hat niemand nach einem Auto gefragt, für das der Shop keine Felge zeigen kann.'"
        >
            <p class="demand-lead">
                {{ formatNumber(charts.demand.counts.offen) }} {{ charts.demand.counts.offen === 1 ? 'offene Lücke' : 'offene Lücken' }},
                {{ formatNumber(charts.demand.asks) }}-mal gefragt<template v-if="charts.demand.waiting">, {{ formatNumber(charts.demand.waiting) }} {{ charts.demand.waiting === 1 ? 'Person wartet' : 'Personen warten' }}</template>.
            </p>
            <DemandGaps :rows="charts.demand.rows" />
        </DashWidget>
    </template>
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
