<script setup lang="ts">
/**
 * Renders a generated SVG string.
 *
 * `v-html` is safe here and only here: the markup comes from `resources/js/art/*`, which are pure
 * functions over typed options that escape every value they interpolate. No prop on this component
 * is ever fed a string that arrived from a request, a database row or a CMS block — those go
 * through DOMPurify in the block renderer instead.
 *
 * The wrapper is `display: contents` so it never becomes a layout box of its own; the `<svg>` the
 * generator produced is what the grid sees.
 */

defineProps<{
    /** A string from one of the art generators. Never user input. */
    markup: string
}>()
</script>

<template>
    <span class="art" v-html="markup" />
</template>

<style scoped>
.art {
    display: contents;
}
</style>
