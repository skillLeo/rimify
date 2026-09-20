<script setup lang="ts">
/**
 * The two named scenes. These fill the slots where the client's own Figma used stock photography
 * and a flat-people illustration, both of which are on the banned list.
 */

import { computed } from 'vue'
import { sceneSVG, type SceneName } from '../../art'
import Svg from './Svg.vue'

const props = withDefaults(
    defineProps<{
        name: SceneName
        width?: number
        title?: string
    }>(),
    { width: 640, title: undefined }
)

const markup = computed(() => sceneSVG(props.name, { width: props.width, title: props.title }))
</script>

<template>
    <Svg :markup="markup" />
</template>
