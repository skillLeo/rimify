<script setup lang="ts">
/**
 * A tyre without a photograph, in the shop and the admin (the Gutachten rework §9): a flat outline of a tyre, drawn in the ink of the
 * page — never a photograph of a different tyre, which would show the customer something they are not buying.
 */

import { computed } from 'vue'

const props = withDefaults(defineProps<{ px?: number }>(), { px: 160 })

/* The tread: short marks round the outer edge, every 10°. */
const tread = computed(() =>
    Array.from({ length: 36 }, (_, i) => {
        const a = (i * Math.PI) / 18

        return { x1: 60 + 50 * Math.cos(a), y1: 60 + 50 * Math.sin(a), x2: 60 + 56 * Math.cos(a), y2: 60 + 56 * Math.sin(a) }
    }),
)
</script>

<template>
    <svg class="tyre-silhouette" viewBox="0 0 120 120" :style="{ maxWidth: `${props.px}px` }" aria-hidden="true" focusable="false" data-qa-ignore>
        <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="1.5" />
        <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" stroke-width="1.5" />
        <circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" stroke-width="1" />
        <circle cx="60" cy="60" r="6" fill="none" stroke="currentColor" stroke-width="1" />
        <line v-for="(mark, i) in tread" :key="i" :x1="mark.x1" :y1="mark.y1" :x2="mark.x2" :y2="mark.y2" stroke="currentColor" stroke-width="1.5" />
    </svg>
</template>

<style scoped>
.tyre-silhouette {
    display: block;
    width: 100%;
    height: auto;
    color: var(--c-ink-3);
}
</style>
