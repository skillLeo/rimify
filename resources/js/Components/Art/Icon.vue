<script setup lang="ts">
/**
 * One icon from the set. 1.5px stroke, currentColor, 20px or 24px only.
 *
 * Decorative by default. Pass `label` only where the icon is the whole control — a bare icon
 * button in the header — because an aria-label beside a visible text label reads the name twice.
 */

import { computed } from 'vue'
import { icon, type IconName } from '../../art'
import Svg from './Svg.vue'

const props = withDefaults(
    defineProps<{
        name: IconName
        size?: 20 | 24
        label?: string
    }>(),
    { size: 20, label: undefined }
)

const markup = computed(() => icon(props.name, { size: props.size, label: props.label }))
</script>

<template>
    <Svg :markup="markup" />
</template>
