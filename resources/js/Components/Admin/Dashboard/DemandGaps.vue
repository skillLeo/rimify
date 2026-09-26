<script setup lang="ts">
/**
 * Nachfrage-Lücken on the Übersicht: the open gaps most in demand, ranked. Each row names the car,
 * how often it was asked for in the Zeitraum — with a bar against the largest, so the order reads at
 * a glance — and how many people are waiting; each opens its row on the full list.
 */

import { Link } from '@inertiajs/vue3'
import { decimal } from '../../../format'
import type { DemandGap } from '../../../types/admin/uebersicht'

defineProps<{ rows: DemandGap[] }>()

/** `v:12` → `gap-v-12`: the full list's row for this gap. */
function anchor(key: string): string {
    return `gap-${key.replace(':', '-')}`
}
</script>

<template>
    <ol class="dg">
        <li v-for="(gap, i) in rows" :key="gap.key" class="dg__row">
            <span class="dg__rank" aria-hidden="true">{{ i + 1 }}</span>
            <span class="dg__text">
                <Link :href="`/admin/nachfrage#${anchor(gap.key)}`" class="dg__link">{{ gap.title }}</Link>
                <span class="dg__detail">{{ gap.detail }}</span>
            </span>
            <span class="dg__figures">
                <span class="dg__asked">
                    {{ decimal(gap.asked, 0) }}×<span class="visually-hidden"> gefragt</span>
                </span>
                <span class="dg__bar" aria-hidden="true"><span :style="{ width: `${gap.weight}%` }" /></span>
                <span v-if="gap.waiting" class="dg__waiting">{{ decimal(gap.waiting, 0) }} {{ gap.waiting === 1 ? 'wartet' : 'warten' }}</span>
            </span>
        </li>
    </ol>
</template>

<style scoped>
.dg {
    margin: 0 calc(-1 * var(--sp-20));
    padding: 0;
    list-style: none;
}

.dg__row {
    position: relative;
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr) 96px;
    align-items: center;
    gap: var(--sp-12);
    /* Two lines — the car, then its key numbers — so the shell's two-line row, exactly: the figures
       column (count, bar, who waits) fits inside it. */
    min-height: var(--adm-row-h-lg);
    padding: var(--sp-4) var(--sp-20);
    border-bottom: 1px solid var(--c-line);
    font-size: var(--adm-fs-table);
    line-height: var(--adm-lh-table);
}

.dg__row:last-child {
    border-bottom: 0;
}

@media (hover: hover) and (pointer: fine) {
    .dg__row:hover {
        background: var(--c-band);
    }
}

.dg__row:has(.dg__link:focus-visible) {
    background: var(--c-band);
    box-shadow: var(--adm-row-focus);
}

.dg__rank {
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 600;
    color: var(--c-ink-3);
    font-variant-numeric: tabular-nums;
    text-align: right;
}

.dg__text {
    display: grid;
    min-width: 0;
}

/* The car is never cut: its name wraps if it must; only the key numbers under it give way. */
.dg__link {
    font-weight: 600;
    color: var(--c-ink);
    text-decoration: none;
    overflow-wrap: anywhere;
    outline: none;
}

.dg__link::after {
    content: '';
    position: absolute;
    inset: 0;
}

.dg__detail {
    overflow: hidden;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
    text-overflow: ellipsis;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}

/* The count, its bar beneath it, and who is waiting: the figures read down one column. */
.dg__figures {
    display: grid;
    justify-items: end;
    gap: 2px;
    font-variant-numeric: tabular-nums;
}

.dg__asked {
    font-weight: 600;
    color: var(--c-ink);
}

.dg__bar {
    display: block;
    width: 100%;
    height: 4px;
    border-radius: var(--r-round);
    background: var(--c-line);
    overflow: hidden;
}

.dg__bar > span {
    display: block;
    height: 100%;
    border-radius: var(--r-round);
    background: var(--chart-accent);
}

.dg__waiting {
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-2);
    white-space: nowrap;
}
</style>
