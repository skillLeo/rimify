<script setup lang="ts">
/** The 16:9 brand card art on the homepage. */

import { computed } from 'vue'
import { brandBannerSVG, type Finish } from '../../art'
import Svg from './Svg.vue'

const props = withDefaults(
    defineProps<{
        brand: string
        finish?: Finish | string
        spokes?: number
        width?: number
    }>(),
    { finish: 'graphite', spokes: 10, width: 640 }
)

const markup = computed(() =>
    brandBannerSVG({
        brand: props.brand,
        finish: props.finish,
        spokes: props.spokes,
        width: props.width,
    })
)
</script>

<template>
    <Svg :markup="markup" />
</template>
