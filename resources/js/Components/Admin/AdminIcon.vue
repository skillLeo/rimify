<script setup lang="ts">
/**
 * One glyph of the admin's own set (resources/js/icons/admin), inline, with no wrapper, sitting on
 * the text baseline. Drawn on a 20-unit grid; at 16 px the stroke keeps its 1.5 px (it does not
 * scale), so a small icon beside a table figure has the same weight as a rail icon — one weight only.
 *
 * Decorative by default; pass `label` only where the icon is the whole control.
 */

import { computed } from 'vue'
import { adminIconMarkup, type AdminIconName } from '../../icons/admin'

const props = withDefaults(defineProps<{ name: AdminIconName; size?: 16 | 20 | 24; label?: string }>(), { size: 20, label: undefined })

const markup = computed(() => adminIconMarkup(props.name))
</script>

<template>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        :width="size"
        :height="size"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="square"
        stroke-linejoin="miter"
        :role="label ? 'img' : undefined"
        :aria-label="label"
        :aria-hidden="label ? undefined : 'true'"
        focusable="false"
        class="adm-icon"
        v-html="markup"
    />
</template>

<style scoped>
.adm-icon {
    flex: none;
    display: inline-block;
    vertical-align: middle;
}

/* One weight at every size: the stroke is 1.5 px on screen, not 1.5 units of a scaled drawing. */
.adm-icon :deep(*) {
    vector-effect: non-scaling-stroke;
}
</style>
