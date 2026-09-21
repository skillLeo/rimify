<script setup lang="ts">
/**
 * The honest stand-in for a photograph that has not arrived: a flat technical drawing of the
 * wheel — rim, spokes, hub and bolt pattern in one stroke weight, nothing shaded, nothing that
 * could be mistaken for a photo. It renders only when a real image is missing or failed to load.
 */

import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        spokes?: number
        bolts?: number
        /** How much of its box the drawing fills: 70 % by default, 60 % in a product tile (home-overhaul.md §1). */
        size?: string
    }>(),
    { spokes: 5, bolts: 5, size: '70%' }
)

const spokeAngles = computed(() => Array.from({ length: props.spokes }, (_, i) => (360 / props.spokes) * i))
const boltAngles = computed(() => Array.from({ length: props.bolts }, (_, i) => (360 / props.bolts) * i - 90))

function boltAt(angle: number): { cx: number; cy: number } {
    const rad = (angle * Math.PI) / 180

    return { cx: 100 + 34 * Math.cos(rad), cy: 100 + 34 * Math.sin(rad) }
}
</script>

<template>
    <svg viewBox="0 0 200 200" class="outline" :style="{ width: size, height: size }" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">
            <circle cx="100" cy="100" r="94" />
            <circle cx="100" cy="100" r="82" />
            <circle cx="100" cy="100" r="20" />
            <circle cx="100" cy="100" r="8" />
            <path
                v-for="angle in spokeAngles"
                :key="angle"
                d="M 92 -16 L 86 -78 M 108 -16 L 114 -78 M 86 -78 L 114 -78"
                :transform="`translate(100 100) rotate(${angle}) translate(-100 -100) translate(0 100)`"
            />
            <circle v-for="angle in boltAngles" :key="`b${angle}`" v-bind="boltAt(angle)" r="4.5" />
        </g>
    </svg>
</template>

<style scoped>
.outline {
    width: 70%;
    height: 70%;
    margin: auto;
    color: var(--c-ink-3);
}
</style>
