<script setup lang="ts">
/** The admin dashboard revenue line. No charting library: twelve points and a shape. */

import { computed } from 'vue'
import { revenueChartSVG, type SparkPoint } from '../../art'
import Svg from './Svg.vue'

const props = withDefaults(
    defineProps<{
        points: SparkPoint[]
        width?: number
        height?: number
    }>(),
    { width: 720, height: 220 }
)

const markup = computed(() => revenueChartSVG(props.points, props.width, props.height))
</script>

<template>
    <Svg :markup="markup" />
</template>
