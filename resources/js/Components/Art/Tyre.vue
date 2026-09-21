<script setup lang="ts">
/** A tyre, carrying its own size on the sidewall. The caller formats the label. */

import { computed } from 'vue'
import { tyreSVG } from '../../art'
import Svg from './Svg.vue'

const props = withDefaults(
    defineProps<{
        label?: string
        size?: number
        title?: string
    }>(),
    { label: '', size: 400, title: undefined }
)

const markup = computed(() =>
    tyreSVG({ label: props.label, size: props.size, title: props.title })
)
</script>

<template>
    <Svg :markup="markup" />
</template>
