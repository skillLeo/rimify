<script setup lang="ts">
/**
 * „Datenqualität“ for the Katalog role: the Felgen in the shop with something missing — price, photo,
 * weight or the load rating the fitment check needs — the most incomplete first, each gap named.
 */

import type { QualityRow } from '../../../types/admin/uebersicht'

defineProps<{ rows: QualityRow[] }>()
</script>

<template>
    <ul class="ql">
        <li v-for="row in rows" :key="row.key" class="ql__row">
            <span class="ql__text">
                <span class="ql__title">{{ row.title }}</span>
                <span class="ql__detail">{{ row.detail }}</span>
            </span>
            <span class="ql__missing">
                <span class="visually-hidden">Es fehlt: </span>
                <span v-for="item in row.missing" :key="item" class="adm-tag adm-tag--warn">{{ item }}</span>
            </span>
        </li>
    </ul>
</template>

<style scoped>
.ql {
    margin: 0 calc(-1 * var(--sp-20));
    padding: 0;
    list-style: none;
}

.ql__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--sp-12);
    min-height: var(--adm-control-h-lg);
    padding: var(--sp-8) var(--sp-20);
    border-bottom: 1px solid var(--c-line);
    font-size: var(--adm-fs-table);
    line-height: var(--adm-lh-table);
}

.ql__row:last-child {
    border-bottom: 0;
}

.ql__text {
    display: grid;
    min-width: 0;
}

.ql__title {
    overflow: hidden;
    font-weight: 600;
    color: var(--c-ink);
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ql__detail {
    overflow: hidden;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
    text-overflow: ellipsis;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}

.ql__missing {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--sp-4);
}

@media (max-width: 767px) {
    .ql__row {
        grid-template-columns: minmax(0, 1fr);
    }

    .ql__missing {
        justify-content: flex-start;
    }
}
</style>
