<script setup lang="ts">
/**
 * Magnitudes, ranked (BRIEF §5: magnitudes → bars; one series is the story → that series in the
 * accent and the rest grey). Horizontal, the top seven, a 36 px row with 8 px between — so the card
 * is as tall as its data, never taller. The label has two weights on two lines: the Felge, then the
 * size most of its orders took, quieter — a row of fixed height, so its skeleton matches it. The first bar in the
 * accent, every other grey; square at the baseline, rounded at the data end; the figure stands at
 * the tip (the title says what it counts).
 *
 * The widths come from one `d3-scale` linear scale, zero to the largest value; bars grow from the
 * baseline once, on the first paint.
 */

import { scaleLinear } from 'd3-scale'
import { computed, onMounted, ref } from 'vue'
import { formatNumber } from '../../../lib/num'
import type { TopWheel } from '../../../types/admin/uebersicht'
import { mayAnimate } from './useWidth'

const props = defineProps<{ bars: TopWheel[]; label: string }>()

/** The ranking's length: seven reads at a glance, eight is a list. */
const TOP = 7

const growIn = ref(false)

onMounted(() => {
    growIn.value = mayAnimate()
})

const rows = computed(() => {
    const bars = props.bars.slice(0, TOP)
    const max = Math.max(1, ...bars.map((b) => b.value))
    const x = scaleLinear().domain([0, max]).range([0, 100])

    // A model code keeps its hyphen whole („S‑04“, a no-break hyphen): a name may wrap between its
    // words, never inside its code (M1-17).
    return bars.map((bar, i) => ({ ...bar, name: bar.label.replace(/-/g, '\u2011'), share: x(bar.value) / 100, lead: i === 0, figure: formatNumber(bar.value) }))
})
</script>

<template>
    <ol class="bc" :aria-label="label">
        <li v-for="row in rows" :key="row.key" class="bc__row">
            <span class="bc__label">
                <span class="bc__name">{{ row.name }}</span>
                <span v-if="row.size" class="bc__size">{{ row.size }}</span>
            </span>
            <span class="bc__track">
                <span
                    class="bc__bar"
                    :class="{ 'bc__bar--lead': row.lead, 'bc__bar--grow': growIn }"
                    :style="{ '--share': row.share }"
                    aria-hidden="true"
                />
                <span class="bc__value">{{ row.figure }}<span class="visually-hidden">{{ row.value === 1 ? ' Bestellung' : ' Bestellungen' }}</span></span>
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
    grid-template-columns: minmax(0, 11fr) minmax(0, 9fr);
    align-items: center;
    gap: var(--sp-12);
    min-height: 36px;
    font-size: var(--adm-fs-table);
    line-height: var(--adm-lh-table);
}

/* Two weights on two lines: the Felge in ink, its size under it in the small step — never cut off. */
.bc__label {
    display: grid;
    min-width: 0;
}

.bc__name {
    font-weight: 600;
    color: var(--c-ink);
    overflow-wrap: break-word;
}

.bc__size {
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
    font-variant-numeric: tabular-nums;
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
    width: calc((100% - var(--sp-40)) * var(--share));
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
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--c-ink);
    white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
    .bc__bar--grow {
        animation: none;
    }
}
</style>
