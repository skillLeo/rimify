<script setup lang="ts">
/** The dashboard on a phone: two tiles per row, the chart beneath, conflicts as cards. */

import { Head } from '@inertiajs/vue3'
import RevenueChart from '../../../Components/Art/RevenueChart.vue'
import type { AdminDashboardProps } from '../../../types/pages'

const props = defineProps<AdminDashboardProps>()

const points = props.revenue.map((r) => ({ label: r.label, value: r.value }))

const KIND_LABEL: Record<string, string> = {
    ENTRY_REQUIREMENT: 'Eintragungspflicht',
    TYRE_SIZES: 'Reifengrößen',
    WIDTH_ET_RANGE: 'Breite / ET',
    CONDITIONS: 'Auflagen',
}
</script>

<template>
    <Head title="Dashboard" />

    <div class="tiles">
        <article v-for="tile in tiles" :key="tile.key" class="tile">
            <span class="micro">{{ tile.label }}</span>
            <p class="tile__value">{{ tile.value }}</p>
        </article>
    </div>

    <section class="card mdash__chart">
        <span class="micro">Umsatz, 12 Monate</span>
        <RevenueChart :points="points" :width="360" :height="180" />
    </section>

    <section class="stack mdash__conflicts">
        <span class="micro">Offene Konflikte</span>
        <article v-for="conflict in conflicts" :key="conflict.id" class="card mdash__conflict">
            <p class="mdash__vehicle">{{ conflict.vehicle }}</p>
            <span class="data">{{ conflict.keyNumbers }}</span>
            <span class="tag mdash__tag" :class="conflict.blocking ? 'tag--danger' : 'tag--warn'">
                {{ KIND_LABEL[conflict.kind] ?? conflict.kind }}
            </span>
        </article>
        <p v-if="conflicts.length === 0" class="quiet">Keine offenen Konflikte.</p>
    </section>
</template>

<style scoped>
.mdash__chart {
    margin-top: var(--space-4);
}

.mdash__chart :deep(svg) {
    width: 100%;
    height: auto;
    color: var(--ink2);
}

.mdash__conflicts {
    margin-top: var(--space-5);
}

.mdash__conflict {
    padding: var(--space-3);
}

.mdash__vehicle {
    margin: 0;
    font-weight: 700;
}

.mdash__tag {
    margin-top: var(--space-2);
}
</style>
