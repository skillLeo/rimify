<script setup lang="ts">
/**
 * Magnitudes, ranked (BRIEF §5: magnitudes → bars; one series is the story → that series in the
 * accent and the rest grey). Horizontal, so a long model name reads on one line beside its bar; the
 * first bar in the accent, every other in grey — emphasis, not eight colours. Bars are 24 px at most,
 * square at the baseline and rounded at the data end, and the value stands at the tip.
 *
 * The widths come from one `d3-scale` linear scale, zero to the largest value; bars grow from the
 * baseline once, on the first paint.
 */

import { scaleLinear } from 'd3-scale'
import { computed, onMounted, ref } from 'vue'
import type { ChartPoint } from '../../../types/admin/uebersicht'
import { mayAnimate } from './useWidth'

const props = defineProps<{ bars: ChartPoint[]; label: string }>()

const growIn = ref(false)

onMounted(() => {
    growIn.value = mayAnimate()
})

const rows = computed(() => {
    const max = Math.max(1, ...props.bars.map((b) => b.value))
    const x = scaleLinear().domain([0, max]).range([0, 100])

    return props.bars.map((bar, i) => ({ ...bar, share: x(bar.value) / 100, lead: i === 0 }))
})
</script>

<template>
    <ol class="bc" :aria-label="label">
        <li v-for="row in rows" :key="row.key" class="bc__row">
            <span class="bc__label" :title="row.label">{{ row.label }}</span>
            <span class="bc__track">
                <span
                    class="bc__bar"
                    :class="{ 'bc__bar--lead': row.lead, 'bc__bar--grow': growIn }"
                    :style="{ '--share': row.share }"
                    aria-hidden="true"
                />
                <span class="bc__value">{{ row.text }}</span>
            </span>
        </li>
    </ol>
</template>

<style scoped>
.bc {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    list-style: none;
}

.bc__row {
    display: grid;
    grid-template-columns: minmax(0, 38%) minmax(0, 1fr);
    align-items: center;
    gap: var(--sp-12);
    min-height: 28px;
    font-size: var(--adm-fs-table);
    line-height: var(--adm-lh-table);
}

.bc__label {
    overflow: hidden;
    color: var(--c-ink);
    text-overflow: ellipsis;
    white-space: nowrap;
}

.bc__track {
    display: flex;
    align-items: center;
    gap: var(--sp-8);
    min-width: 0;
}

/* Every bar is its share of the same length — the track less the room its figure needs at the tip —
   so 5 is drawn half as long as 10, whatever the widget's width. */
.bc__bar {
    flex: none;
    width: calc((100% - 96px) * var(--share));
    min-width: 2px;
    height: 20px;
    border-radius: 0 var(--r-control) var(--r-control) 0;
    background: var(--chart-muted);
}

.bc__bar--lead {
    background: var(--chart-accent);
}

/* Bars grow from the baseline once, 240 ms, all together: no staggered cascade (DIRECTION §5). */
.bc__bar--grow {
    transform-origin: left;
    animation: bc-grow 240ms var(--ease-out) backwards;
}

@keyframes bc-grow {
    from {
        transform: scaleX(0);
    }
}

.bc__value {
    flex: none;
    font-size: var(--fs-micro);
    font-variant-numeric: tabular-nums;
    color: var(--c-ink-2);
    white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
    .bc__bar--grow {
        animation: none;
    }
}
</style>
