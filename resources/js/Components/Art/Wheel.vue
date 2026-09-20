<script setup lang="ts">
/**
 * The alloy wheel. Nine layers, drawn in SVG — see resources/js/art/wheel.ts.
 *
 * Memoised on its own props so a listing page with twenty-four cards builds the markup once per
 * distinct spokes-and-finish pair rather than twenty-four times.
 */

import { computed } from 'vue'
import { wheelSVG, type Finish } from '../../art'
import Svg from './Svg.vue'

const props = withDefaults(
    defineProps<{
        spokes?: number
        finish?: Finish | string
        size?: number
        /** Draw the tyre too — a Komplettrad rather than a bare rim. */
        tyre?: boolean
        /** One character in the centre cap; the brand's initial. */
        initial?: string
        /** Supply only where the wheel is the sole content of a link or button. */
        title?: string
    }>(),
    { spokes: 5, finish: 'graphite', size: 400, tyre: false, initial: 'R', title: undefined }
)

const markup = computed(() =>
    wheelSVG({
        spokes: props.spokes,
        finish: props.finish,
        size: props.size,
        tyre: props.tyre,
        initial: props.initial,
        title: props.title,
    })
)
</script>

<template>
    <Svg :markup="markup" />
</template>
