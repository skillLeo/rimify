<script setup lang="ts">
/**
 * „Neueste Bestellungen“: eight rows, each one link (the number is the link; the row's hover and
 * focus light up as one). 13 px, 44 px rows, hairlines, no zebra; the amount right-aligned in
 * tabular figures; payment and shipping as chips; the age as a colleague would say it.
 */

import { Link } from '@inertiajs/vue3'
import StateChip from './StateChip.vue'
import type { DashboardOrderRow } from '../../../types/admin/uebersicht'

defineProps<{ orders: DashboardOrderRow[] }>()
</script>

<template>
    <div class="dt-wrap">
        <table class="dt">
            <thead>
                <tr>
                    <th scope="col">Nummer</th>
                    <th scope="col">Kunde</th>
                    <th scope="col" class="dt__num">Betrag</th>
                    <th scope="col">Zahlung</th>
                    <th scope="col">Versand</th>
                    <th scope="col" class="dt__num">Alter</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="order in orders" :key="order.id" class="dt__row">
                    <td>
                        <Link :href="order.href" class="dt__link">{{ order.number }}</Link>
                        <span v-if="order.demo" class="dt__demo">Demo</span>
                    </td>
                    <td class="dt__text">{{ order.customer }}</td>
                    <td class="dt__num">{{ order.total }}</td>
                    <td><StateChip :label="order.payment.label" :tone="order.payment.tone" /></td>
                    <td><StateChip :label="order.fulfilment.label" :tone="order.fulfilment.tone" /></td>
                    <td class="dt__num dt__age">
                        <time :datetime="order.iso ?? undefined">{{ order.ago ?? '–' }}</time>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.dt-wrap {
    margin-inline: calc(-1 * var(--sp-20));
    overflow-x: auto;
}

.dt {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--adm-fs-table);
    line-height: var(--adm-lh-table);
    font-variant-numeric: tabular-nums;
}

.dt th {
    position: sticky;
    top: 0;
    z-index: var(--z-raised);
    height: 36px;
    padding: 0 var(--sp-8);
    border-bottom: 1px solid var(--c-line);
    background: var(--c-surface);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 500;
    color: var(--c-ink-3);
    text-align: left;
    white-space: nowrap;
}

.dt td {
    height: var(--adm-control-h-lg);
    padding: 0 var(--sp-8);
    border-bottom: 1px solid var(--c-line);
    color: var(--c-ink);
    white-space: nowrap;
}

.dt th:first-child,
.dt td:first-child {
    padding-left: var(--sp-20);
}

.dt th:last-child,
.dt td:last-child {
    padding-right: var(--sp-20);
}

.dt tbody tr:last-child td {
    border-bottom: 0;
}

.dt__num {
    text-align: right;
}

.dt th.dt__num {
    text-align: right;
}

.dt__text {
    max-width: 16ch;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dt__age {
    color: var(--c-ink-3);
}

/* The number is the link; the whole row answers to it. */
.dt__row {
    position: relative;
}

.dt__link {
    font-weight: 600;
    color: var(--c-ink);
    text-decoration: none;
    outline: none;
}

.dt__link::after {
    content: '';
    position: absolute;
    inset: 0;
}

@media (hover: hover) and (pointer: fine) {
    .dt__row:hover td {
        background: var(--c-band);
    }
}

.dt__row:focus-within td {
    background: var(--c-band);
}

.dt__row:has(.dt__link:focus-visible) td:first-child {
    box-shadow: var(--adm-row-focus);
}

.dt__demo {
    margin-left: var(--sp-8);
    font-size: var(--fs-micro);
    color: var(--c-ink-3);
}
</style>
