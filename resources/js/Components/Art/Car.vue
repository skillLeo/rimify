<script setup lang="ts">
/** The coupé silhouette, with a real RIMIFY wheel on it. */

import { computed } from 'vue'
import { carSVG, type CarVariant, type Finish } from '../../art'
import Svg from './Svg.vue'

const props = withDefaults(
    defineProps<{
        variant?: CarVariant
        finish?: Finish | string
        spokes?: number
        width?: number
        title?: string
    }>(),
    { variant: 'white', finish: 'graphite', spokes: 5, width: 1200, title: undefined }
)

const markup = computed(() =>
    carSVG({
        variant: props.variant,
        finish: props.finish,
        spokes: props.spokes,
        width: props.width,
        title: props.title,
    })
)
</script>

<template>
    <Svg :markup="markup" />
</template>
