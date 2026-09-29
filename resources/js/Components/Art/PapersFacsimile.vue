<script setup lang="ts">
/**
 * Where the tyre check's figures stand in the papers: 8.1 and 8.2 (the permitted axle loads), T (the top
 * speed) and P.2 (the power) on the Zulassungsbescheinigung Teil I — Ziffer 16, 6 and 7 on the older
 * Fahrzeugschein. Both layouts, because both are in circulation.
 */

import { computed } from 'vue'
import { papersSVG, type DocVariant } from '../../art'
import Svg from './Svg.vue'

const props = withDefaults(
    defineProps<{
        variant?: DocVariant
        width?: number
        title?: string
    }>(),
    { variant: 'neu', width: 560, title: undefined }
)

const markup = computed(() => papersSVG(props.variant, { width: props.width, title: props.title }))
</script>

<template>
    <Svg :markup="markup" />
</template>
