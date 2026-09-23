<script setup lang="ts">
/**
 * A placeholder the exact size of the content it stands in for. Never a spinner where the layout
 * is already known.
 */

withDefaults(
    defineProps<{
        width?: string
        height?: string
        tile?: boolean
    }>(),
    { width: '100%', height: '1em', tile: false }
)
</script>

<template>
    <span class="skeleton" :class="{ 'skeleton--tile': tile }" :style="{ width, height }" aria-hidden="true" />
</template>

<style scoped>
.skeleton {
    display: block;
}
</style>
