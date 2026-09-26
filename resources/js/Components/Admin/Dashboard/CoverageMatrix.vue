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
 * cell. From the keyboard it is one stop, not makes × sizes of them: Tab enters at the chosen cell
 * (or the first), the arrow keys, Home and End move inside, Tab leaves. A focused cell says its own
 * sentence, so the caption under the grid is for the eye and announces nothing.
 *
 * `placeholder` draws the same table with skeletons where the names and counts will be — the matrix's
 * own height before it arrives, so nothing under it moves when it does.
 */

import { Link } from '@inertiajs/vue3'
import { computed, nextTick, ref } from 'vue'
import { decimal } from '../../../format'
import type { CoverageCell, CoverageMatrix } from '../../../types/admin/uebersicht'

const props = withDefaults(
    defineProps<{
        matrix: CoverageMatrix
        /** The cell whose variants the page lists (Gutachten › Abdeckung). */
        selected?: { make: string; size: string } | null
        placeholder?: boolean
    }>(),
    { selected: null, placeholder: false }
)

function isSelected(make: string, cell: CoverageCell): boolean {
    return props.selected?.make === make && props.selected.size === cell.size
}

const pointed = ref<CoverageCell | null>(null)

const caption = computed(() => pointed.value?.sentence ?? props.matrix.summary.sentence)

/** From the fifth step on the ramp is dark enough that the count is written in the surface colour. */
function onDark(level: number): boolean {
    return level >= 5
}

/* ── One tab stop, the arrows inside ─────────────────────────────────────────────── */

/** The cell Tab lands on: the one last reached, else the chosen one, else the first. */
const reached = ref<[number, number] | null>(null)

const stop = computed<[number, number]>(() => {
    if (reached.value) {
        return reached.value
    }

    for (const [r, row] of props.matrix.rows.entries()) {
        const c = row.cells.findIndex((cell) => isSelected(row.make, cell))

        if (c >= 0) {
            return [r, c]
        }
    }

    return [0, 0]
})

const grid = ref<HTMLElement | null>(null)

function cellAt(r: number, c: number): HTMLElement | null {
    return grid.value?.querySelector<HTMLElement>(`[data-cell="${r}:${c}"]`) ?? null
}

function onFocus(cell: CoverageCell, r: number, c: number): void {
    pointed.value = cell
    reached.value = [r, c]
}

function onKey(event: KeyboardEvent, r: number, c: number): void {
    const rows = props.matrix.rows.length
    const cols = props.matrix.sizes.length
    const moves: Record<string, [number, number]> = {
        ArrowRight: [r, Math.min(cols - 1, c + 1)],
        ArrowLeft: [r, Math.max(0, c - 1)],
        ArrowDown: [Math.min(rows - 1, r + 1), c],
        ArrowUp: [Math.max(0, r - 1), c],
        Home: event.ctrlKey ? [0, 0] : [r, 0],
        End: event.ctrlKey ? [rows - 1, cols - 1] : [r, cols - 1],
    }
    const next = moves[event.key]

    if (!next) {
        return
    }

    event.preventDefault()
    reached.value = next
    void nextTick(() => cellAt(next[0], next[1])?.focus())
}
</script>

<template>
    <div class="cm" :class="{ 'cm--placeholder': placeholder }">
        <div ref="grid" class="cm__scroll">
            <table class="cm__table">
                <caption class="visually-hidden">Abdeckung nach Marke und Felgengröße: Varianten mit mindestens einer freigegebenen Felge</caption>
                <thead>
                    <tr>
                        <th scope="col" class="cm__corner">Marke</th>
                        <th v-for="size in matrix.sizes" :key="size.key" scope="col" class="cm__size">
                            <span v-if="placeholder" class="skeleton cm__ph cm__ph--size" />
                            <template v-else>{{ size.label }}</template>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(row, r) in matrix.rows" :key="row.make">
                        <th scope="row" class="cm__make">
                            <template v-if="placeholder">
                                <span class="cm__make-name"><span class="skeleton cm__ph cm__ph--name" /></span>
                                <span class="cm__make-count"><span class="skeleton cm__ph cm__ph--count" /></span>
                            </template>
                            <template v-else>
                                <span class="cm__make-name">{{ row.make }}</span>
                                <span class="cm__make-count">{{ decimal(row.covered, 0) }} von {{ decimal(row.variants, 0) }}</span>
                            </template>
                        </th>
                        <td v-for="(cell, c) in row.cells" :key="cell.size" class="cm__cell-wrap">
                            <span v-if="placeholder" class="skeleton cm__cell cm__cell--ph" />
                            <component
                                :is="cell.href ? Link : 'span'"
                                v-else
                                :href="cell.href ?? undefined"
                                class="cm__cell"
                                :class="{ 'cm__cell--dark': onDark(cell.level), 'cm__cell--none': cell.level === 0, 'cm__cell--selected': isSelected(row.make, cell) }"
                                :data-cell="`${r}:${c}`"
                                :aria-current="isSelected(row.make, cell) ? 'true' : undefined"
                                :style="cell.level > 0 ? { background: `var(--chart-seq-${cell.level})` } : undefined"
                                :aria-label="cell.sentence"
                                :tabindex="stop[0] === r && stop[1] === c ? 0 : -1"
                                @mouseenter="pointed = cell"
                                @mouseleave="pointed = null"
                                @focus="onFocus(cell, r, c)"
                                @blur="pointed = null"
                                @keydown="onKey($event, r, c)"
                            >
                                {{ decimal(cell.count, 0) }}
                            </component>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="cm__foot">
            <p class="cm__caption">
                <span v-if="placeholder" class="skeleton cm__ph cm__ph--caption" />
                <template v-else>{{ caption }}</template>
            </p>
            <div class="cm__legend" aria-hidden="true">
                <span>0</span>
                <span v-for="step in 7" :key="step" class="cm__swatch" :style="{ background: `var(--chart-seq-${step})` }" />
                <span>{{ placeholder ? '' : decimal(matrix.max, 0) }}</span>
            </div>
        </div>
    </div>
</template>
<style scoped>
.cm {
    display: grid;
    gap: var(--sp-12);
}

/* The positioned box its hidden labels hang from: without it they escape the scroll box's clip and
   widen the whole page on a phone. */
.cm__scroll {
    position: relative;
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

/* The panel's one focus ring, and the chosen cell ringed the same blue: this is the one the list below
   counts. */
.cm__cell:focus-visible,
.cm__cell--selected {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
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

/* A phone: the sentence above the scale, and room for two lines of it whatever it says — the total,
   a pointed cell, or its skeleton — so the matrix never changes height under the reader. */
@media (max-width: 767px) {
    .cm__foot {
        flex-direction: column;
        align-items: flex-start;
    }

    .cm__caption {
        min-height: calc(2 * var(--lh-small));
    }
}

/* ── The placeholder: the matrix's own boxes, skeletons where its words will be ─────── */

.cm__ph {
    display: inline-block;
    height: var(--sp-12);
    vertical-align: middle;
}

.cm__ph--size {
    width: var(--sp-24);
}

.cm__ph--name {
    width: 72px;
}

.cm__ph--count {
    width: 48px;
}

.cm__ph--caption {
    width: 60%;
}

.cm__cell--ph {
    box-shadow: none;
}

@media (prefers-reduced-motion: reduce) {
    .cm__cell {
        transition: none;
    }
}
</style>
