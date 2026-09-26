<script setup lang="ts">
/**
 * A chart's numbers as a table — the „Tabelle anzeigen“ view, and what a screen reader is offered.
 * The first column names the row; the rest are right-aligned figures in tabular digits.
 */

defineProps<{ caption: string; header: string[]; rows: string[][] }>()
</script>

<template>
    <!-- A scroll box the keyboard can reach and scroll (Safari scrolls nothing it cannot focus). -->
    <div class="ct-wrap" tabindex="0" role="region" :aria-label="caption">
        <table class="ct">
            <caption class="visually-hidden">{{ caption }}</caption>
            <thead>
                <tr>
                    <th v-for="(label, i) in header" :key="label" scope="col" :class="{ 'ct__num': i > 0 }">{{ label }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(row, r) in rows" :key="r">
                    <th scope="row">{{ row[0] }}</th>
                    <td v-for="(value, i) in row.slice(1)" :key="i" class="ct__num">{{ value }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.ct-wrap {
    max-height: 320px;
    overflow: auto;
}

.ct-wrap:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.ct {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--adm-fs-table);
    line-height: var(--adm-lh-table);
    font-variant-numeric: tabular-nums;
}

.ct th,
.ct td {
    height: 32px;
    padding: 0 var(--sp-8);
    border-bottom: 1px solid var(--c-line);
    text-align: left;
    white-space: nowrap;
}

.ct thead th {
    position: sticky;
    top: 0;
    background: var(--c-surface);
    font-size: var(--fs-micro);
    font-weight: 500;
    color: var(--c-ink-3);
}

.ct tbody th {
    font-weight: 500;
}

.ct .ct__num {
    text-align: right;
}
</style>
