<script setup lang="ts">
/**
 * A figure's curve, 40 px high, the full width of its tile (BRIEF §5: our own SVG, `d3-scale` and
 * `d3-shape` for the maths only).
 *
 * The line is 2 px with round caps in the accent, its baseline zero — a revenue curve that starts
 * mid-air would exaggerate every wobble. A day without a value (an average on a day without orders)
 * is a gap in the line, not a dip to zero. The last point carries an 8 px marker ringed in the
 * surface colour; it is placed in HTML, so it stays round however the tile stretches the drawing.
 *
 * Decoration beside the figure it belongs to: the tile says the value and the change in words, so
 * the drawing is hidden from a screen reader rather than read as "image".
 */

import { scaleLinear } from 'd3-scale'
import { curveMonotoneX, line } from 'd3-shape'
import { computed } from 'vue'

const props = withDefaults(defineProps<{ values: (number | null)[]; height?: number }>(), { height: 40 })

/** The drawing's own width; the SVG stretches it to the tile, the stroke keeps its 2 px. */
const WIDTH = 200
const PAD = 3

const geometry = computed(() => {
    const values = props.values
    const known = values.filter((v): v is number => v !== null)

    if (values.length < 2 || known.length === 0) {
        return null
    }

    const x = scaleLinear().domain([0, values.length - 1]).range([PAD, WIDTH - PAD])
    const max = Math.max(...known)
    const y = scaleLinear().domain([0, max > 0 ? max : 1]).range([props.height - PAD, PAD])

    const path = line<number | null>()
        .defined((v) => v !== null)
        .x((_, i) => x(i))
        .y((v) => y(v ?? 0))
        .curve(curveMonotoneX)(values)

    let last = values.length - 1

    while (last >= 0 && values[last] === null) {
        last--
    }

    return {
        path: path ?? '',
        marker: last < 0 ? null : { left: (x(last) / WIDTH) * 100, top: (y(values[last] as number) / props.height) * 100 },
    }
})
</script>

<template>
    <div v-if="geometry" class="spark" :style="{ height: `${height}px` }" aria-hidden="true">
        <svg class="spark__svg" :viewBox="`0 0 ${WIDTH} ${height}`" preserveAspectRatio="none" focusable="false">
            <path class="spark__line" :d="geometry.path" />
        </svg>
        <span v-if="geometry.marker" class="spark__marker" :style="{ left: `${geometry.marker.left}%`, top: `${geometry.marker.top}%` }" />
    </div>
</template>

<style scoped>
.spark {
    position: relative;
    width: 100%;
}

.spark__svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
}

.spark__line {
    fill: none;
    stroke: var(--chart-accent);
    stroke-width: 2px;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
}

.spark__marker {
    position: absolute;
    width: var(--sp-8);
    height: var(--sp-8);
    margin: calc(-1 * var(--sp-4)) 0 0 calc(-1 * var(--sp-4));
    border-radius: var(--r-round);
    background: var(--chart-accent);
    box-shadow: var(--chart-marker-ring);
}
</style>
