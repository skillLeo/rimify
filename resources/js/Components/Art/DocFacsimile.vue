<script setup lang="ts">
/**
 * The Fahrzeugschein facsimile with the two key-number fields ringed.
 *
 * Both layouts exist because both are in circulation. A customer shown only the certificate issued
 * since 2005, while holding the older document, is worse off than with no help at all.
 */

import { computed } from 'vue'
import { docSVG, type DocVariant } from '../../art'
import Svg from './Svg.vue'

const props = withDefaults(
    defineProps<{
        variant?: DocVariant
        width?: number
        title?: string
    }>(),
    { variant: 'neu', width: 560, title: undefined }
)

const markup = computed(() =>
    docSVG(props.variant, { width: props.width, title: props.title })
)
</script>

<template>
    <Svg :markup="markup" />
</template>
