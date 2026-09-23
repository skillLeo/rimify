<script setup lang="ts">
/**
 * A keyboard hint. The modifier is written the way the visitor's keyboard writes it: ⌘ on a Mac,
 * Strg everywhere else — decided after mount, so the server and the client agree on the first
 * frame and only the label changes.
 */

import { onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ keys: string[]; modifier?: boolean }>(), { modifier: false })

const mod = ref('Strg')

onMounted(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) {
        mod.value = '⌘'
    }
})
</script>

<template>
    <span class="kbd-group">
        <kbd v-if="props.modifier" class="kbd">{{ mod }}</kbd>
        <kbd v-for="key in props.keys" :key="key" class="kbd">{{ key }}</kbd>
    </span>
</template>

<style scoped>
.kbd-group {
    display: inline-flex;
    gap: var(--sp-4);
    vertical-align: middle;
}
</style>
