<script setup lang="ts">
/**
 * The dashboard: the operational figures, twelve months of revenue, and the open-conflict queue.
 *
 * Every figure is a real query (AdminDashboardController). A figure with a list behind it links
 * to that list; the others are plain, because a link to nowhere is worse than no link.
 *
 * The conflicts are here and not behind a menu because they are the one thing on this screen that
 * costs money while ignored: an unresolved disagreement is a fitment nobody can publish.
 *
 * One page for every width: the figures run 2-up on a phone, 3-up from 900px and 6-up from
 * 1440px; the chart and the queue stack until 1200px.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import RevenueChart from '../../../Components/Art/RevenueChart.vue'
import type { AdminDashboardProps } from '../../../types/pages'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminDashboardProps>()

const points = computed(() => props.revenue.map((r) => ({ label: r.label, value: r.value })))

/** Where a figure's underlying list lives. Only lists that exist are named. */
const TILE_HREF: Record<string, string> = {
    documents: '/admin/gutachten',
}

const KIND_LABEL: Record<string, string> = {
    ENTRY_REQUIREMENT: 'Eintragungspflicht',
    TYRE_SIZES: 'Reifengrößen',
    WIDTH_ET_RANGE: 'Breite / ET',
    CONDITIONS: 'Auflagen',
}
</script>

<template>
    <Head title="Dashboard" />

    <h1 class="t-h1 dash__title">Dashboard</h1>

    <div class="metrics dash__metrics">
        <template v-for="tile in tiles" :key="tile.key">
            <Link v-if="TILE_HREF[tile.key]" :href="TILE_HREF[tile.key] ?? ''" class="metric dash__metric--link">
                <span class="micro">{{ tile.label }}</span>
                <p class="metric__value">{{ tile.value }}</p>
            </Link>
            <div v-else class="metric">
                <span class="micro">{{ tile.label }}</span>
                <p class="metric__value">{{ tile.value }}</p>
            </div>
        </template>
    </div>

    <div class="dash__row">
        <section class="card dash__chart" aria-labelledby="dash-revenue">
            <h2 id="dash-revenue" class="t-h3">Umsatz der letzten 12 Monate</h2>
            <div class="dash__svg">
                <RevenueChart :points="points" :width="720" :height="220" />
            </div>
        </section>

        <section class="card" aria-labelledby="dash-conflicts">
            <h2 id="dash-conflicts" class="t-h3">Offene Konflikte</h2>

            <ul v-if="conflicts.length > 0" class="dash__conflicts">
                <li v-for="conflict in conflicts" :key="conflict.id" class="dash__conflict">
                    <div class="dash__conflict-text">
                        <p class="dash__vehicle">{{ conflict.vehicle }}</p>
                        <p class="data">{{ conflict.keyNumbers }}</p>
                    </div>
                    <span class="tag" :class="conflict.blocking ? 'tag--danger' : 'tag--warn'">
                        {{ KIND_LABEL[conflict.kind] ?? conflict.kind }}
                    </span>
                </li>
            </ul>

            <p v-else class="t-body quiet dash__empty">Keine offenen Konflikte.</p>
        </section>
    </div>
</template>

<style scoped>
.dash__title {
    margin-bottom: var(--space-5);
}

.dash__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
}

.dash__metric--link {
    transition: border-color var(--duration-instant) var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
    .dash__metric--link:hover {
        border-color: var(--ink2);
    }
}

.dash__row {
    display: grid;
    gap: var(--space-4);
    margin-top: var(--space-5);
    align-items: start;
}

.dash__chart {
    min-width: 0;
}

.dash__svg {
    margin-top: var(--space-4);
    color: var(--ink2);
}

.dash__svg :deep(svg) {
    width: 100%;
    height: auto;
}

.dash__conflicts {
    margin: var(--space-3) 0 0;
    padding: 0;
    list-style: none;
}

.dash__conflict {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    min-height: 56px;
    padding-block: var(--space-2);
    border-bottom: 1px solid var(--line-s);
}

.dash__conflict-text {
    min-width: 0;
}

.dash__vehicle {
    font-weight: 700;
}

.dash__empty {
    margin-top: var(--space-3);
}

@media (min-width: 900px) {
    .dash__metrics {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--space-4);
    }
}

@media (min-width: 1200px) {
    .dash__row {
        grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    }
}

@media (min-width: 1440px) {
    .dash__metrics {
        grid-template-columns: repeat(6, minmax(0, 1fr));
    }
}
</style>
