<script setup lang="ts">
/**
 * A line of prose whose figures the browser's translator must leave alone: every value with a unit
 * or a technical code (`8,5J`, `ET 45`, `225/45 R17`, `23 mm`, `+0,91 %`, `100,9 km/h`) is wrapped
 * in a `translate="no"` span, the words around it stay translatable. Chrome's page translation
 * once read "5,5 J" as "5.5 years". A figure never breaks across a line.
 */

import { computed } from 'vue'
import { valueParts } from '../../lib/felgenSentences'

const props = defineProps<{ text: string }>()

const parts = computed(() => valueParts(props.text))
</script>

<template>
    <template v-for="(part, i) in parts" :key="i"><span v-if="part.value" class="value" translate="no">{{ part.text }}</span><template v-else>{{ part.text }}</template></template>
</template>

<style scoped>
.value {
    white-space: nowrap;
}
</style>
