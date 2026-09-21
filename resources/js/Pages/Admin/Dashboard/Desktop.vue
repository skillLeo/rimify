<script setup lang="ts">
/**
 * The dashboard. Six tiles, a revenue line, and the open-conflict queue.
 *
 * The conflicts are on the dashboard and not behind a menu because they are the one thing here
 * that costs money while it is ignored: an unresolved entry-requirement disagreement means a
 * fitment nobody can publish, which is a wheel nobody can buy.
 */

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

    <div class="dash__row">
        <section class="card dash__chart">
            <span class="micro">Umsatz, 12 Monate</span>
            <RevenueChart :points="points" :width="720" :height="220" />
        </section>

        <section class="card dash__conflicts">
            <span class="micro">Offene Konflikte</span>

            <table v-if="conflicts.length > 0" class="table dash__table">
                <tbody>
                    <tr v-for="conflict in conflicts" :key="conflict.id">
                        <td>
                            <p class="dash__vehicle">{{ conflict.vehicle }}</p>
                            <span class="data">{{ conflict.keyNumbers }}</span>
                        </td>
                        <td>
                            <span
                                class="tag"
                                :class="conflict.blocking ? 'tag--danger' : 'tag--warn'"
                            >
                                {{ KIND_LABEL[conflict.kind] ?? conflict.kind }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>

            <p v-else class="quiet dash__empty">Keine offenen Konflikte.</p>
        </section>
    </div>
</template>

<style scoped>
.dash__row {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    gap: var(--s4);
    margin-top: var(--s4);
    align-items: start;
}

.dash__chart :deep(svg) {
    width: 100%;
    height: auto;
    color: var(--ink2);
}

.dash__table td {
    height: 56px;
}

.dash__vehicle {
    margin: 0;
    font-weight: 700;
}

.dash__empty {
    margin: var(--s4) 0 0;
}

@media (max-width: 1200px) {
    .dash__row {
        grid-template-columns: 1fr;
    }
}
</style>
