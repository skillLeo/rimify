<script setup lang="ts">
/**
 * One icon from the set, rendered as an inline `<svg>` with no wrapper element, so it sits on the
 * text baseline like a glyph. Decorative by default; pass `label` only where the icon is the whole
 * control, because an aria-label beside a visible text label reads the name twice.
 */

import { computed } from 'vue'
import { iconPaths, isFilled, type IconName } from '../../icons'

const props = withDefaults(
    defineProps<{
        name: IconName
        size?: 16 | 20 | 24
        label?: string
    }>(),
    { size: 20, label: undefined }
)

const paths = computed(() => iconPaths(props.name))
const filled = computed(() => isFilled(props.name))
</script>

<template>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        :width="size"
        :height="size"
        :fill="filled ? 'currentColor' : 'none'"
        :stroke="filled ? 'none' : 'currentColor'"
        stroke-width="1.5"
        stroke-linecap="square"
        stroke-linejoin="miter"
        :role="label ? 'img' : undefined"
        :aria-label="label"
        :aria-hidden="label ? undefined : 'true'"
        focusable="false"
        class="icon"
        v-html="paths"
    />
</template>

<style scoped>
.icon {
    flex: none;
    display: inline-block;
    vertical-align: middle;
}
</style>
