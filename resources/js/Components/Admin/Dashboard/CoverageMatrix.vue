<script setup lang="ts">
/**
 * The Abdeckungs-Matrix: makes down the side, rim sizes across, in each cell the number of that
 * make's variants with at least one wheel of that size a customer may be shown.
 *
 * One hue, light to dark, for magnitude (BRIEF §5: a sequential ramp, never a rainbow); the count is
 * printed in every cell, so the shade only repeats what the number says. Pointing at a cell, or
 * reaching it with the keyboard, names it in a sentence under the grid („BMW, 19 Zoll: 142 von 168
 * Varianten“); each cell opens the list of the variants it counts.
 *
 * It is a table, because it is one: a screen reader reads make, size and count as row, column and
 * cell.
 */

import { Link } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import { decimal } from '../../../format'
import type { CoverageCell, CoverageMatrix } from '../../../types/admin/uebersicht'

const props = defineProps<{ matrix: CoverageMatrix }>()

const pointed = ref<CoverageCell | null>(null)

const caption = computed(() => pointed.value?.sentence ?? props.matrix.summary.sentence)

/** From the fifth step on the ramp is dark enough that the count is written in the surface colour. */
function onDark(level: number): boolean {
    return level >= 5
}
</script>

<template>
    <div class="cm">
        <div class="cm__scroll">
            <table class="cm__table">
                <caption class="visually-hidden">Abdeckung nach Marke und Felgengröße: Varianten mit mindestens einer freigegebenen Felge</caption>
                <thead>
                    <tr>
                        <th scope="col" class="cm__corner">Marke</th>
                        <th v-for="size in matrix.sizes" :key="size.key" scope="col" class="cm__size">
                            <span aria-hidden="true">{{ size.label }}</span>
                            <span class="visually-hidden">{{ size.key }} Zoll</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in matrix.rows" :key="row.make">
                        <th scope="row" class="cm__make">
                            <span class="cm__make-name">{{ row.make }}</span>
                            <span class="cm__make-count">{{ decimal(row.covered, 0) }} von {{ decimal(row.variants, 0) }}</span>
                        </th>
                        <td v-for="cell in row.cells" :key="cell.size" class="cm__cell-wrap">
                            <component
                                :is="cell.href ? Link : 'span'"
                                :href="cell.href ?? undefined"
                                class="cm__cell"
                                :class="{ 'cm__cell--dark': onDark(cell.level), 'cm__cell--none': cell.level === 0 }"
                                :style="cell.level > 0 ? { background: `var(--chart-seq-${cell.level})` } : undefined"
                                :aria-label="cell.sentence"
                                :tabindex="cell.href ? undefined : 0"
                                @mouseenter="pointed = cell"
                                @mouseleave="pointed = null"
                                @focus="pointed = cell"
                                @blur="pointed = null"
                            >
                                {{ decimal(cell.count, 0) }}
                            </component>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="cm__foot">
            <p class="cm__caption" aria-live="polite">{{ caption }}</p>
            <div class="cm__legend" aria-hidden="true">
                <span>0</span>
                <span v-for="step in 7" :key="step" class="cm__swatch" :style="{ background: `var(--chart-seq-${step})` }" />
                <span>{{ decimal(matrix.max, 0) }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.cm {
    display: grid;
    gap: var(--sp-12);
}

.cm__scroll {
    overflow-x: auto;
}

.cm__table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 2px;
    font-size: var(--adm-fs-table);
    line-height: var(--adm-lh-table);
    font-variant-numeric: tabular-nums;
}

.cm__corner,
.cm__size {
    padding: 0 var(--sp-8) var(--sp-4);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 500;
    color: var(--c-ink-3);
    white-space: nowrap;
}

.cm__corner {
    text-align: left;
}

.cm__size {
    text-align: center;
}

.cm__make {
    padding-right: var(--sp-12);
    text-align: left;
    white-space: nowrap;
}

.cm__make-name {
    display: block;
    font-weight: 600;
    color: var(--c-ink);
}

.cm__make-count {
    display: block;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 400;
    color: var(--c-ink-3);
}

.cm__cell-wrap {
    padding: 0;
}

.cm__cell {
    display: grid;
    place-items: center;
    min-width: 56px;
    height: var(--adm-control-h-lg);
    border-radius: var(--r-control);
    color: var(--c-ink);
    font-weight: 600;
    text-decoration: none;
    outline: none;
    transition: box-shadow var(--d-1) var(--ease-out);
}

.cm__cell--dark {
    color: var(--c-surface);
}

/* No approved variant: an empty cell, drawn as the hairline it is, its zero quiet. */
.cm__cell--none {
    box-shadow: var(--chart-cell-empty);
    color: var(--c-ink-3);
    font-weight: 400;
}

@media (hover: hover) and (pointer: fine) {
    a.cm__cell:hover {
        box-shadow: var(--chart-cell-hover);
    }
}

.cm__cell:focus-visible {
    box-shadow: var(--chart-cell-hover);
}

.cm__foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-8) var(--sp-24);
}

.cm__caption {
    min-height: var(--lh-small);
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    color: var(--c-ink);
    font-variant-numeric: tabular-nums;
}

.cm__legend {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
    font-variant-numeric: tabular-nums;
}

.cm__legend > span:first-child {
    margin-right: var(--sp-4);
}

.cm__legend > span:last-child {
    margin-left: var(--sp-4);
}

.cm__swatch {
    display: inline-block;
    width: 20px;
    height: 12px;
    border-radius: var(--r-control);
}

@media (prefers-reduced-motion: reduce) {
    .cm__cell {
        transition: none;
    }
}
</style>
