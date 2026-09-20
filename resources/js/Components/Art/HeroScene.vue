<script setup lang="ts">
/**
 * The hero background. It is the LCP element: painted immediately, never faded in.
 */

import { computed } from 'vue'
import { heroSceneSVG, type Finish } from '../../art'
import Svg from './Svg.vue'

const props = withDefaults(
    defineProps<{
        layout?: 'desktop' | 'mobile'
        finish?: Finish | string
        spokes?: number
    }>(),
    { layout: 'desktop', finish: 'graphite', spokes: 5 }
)

const markup = computed(() =>
    heroSceneSVG({ layout: props.layout, finish: props.finish, spokes: props.spokes })
)
</script>

<template>
    <Svg :markup="markup" />
</template>
