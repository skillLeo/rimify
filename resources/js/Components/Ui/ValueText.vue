<script setup lang="ts">
/**
 * The one place the storefront tells the browser's translator to keep its hands off a value.
 * Chrome's page translation once read "5,5 J" as "5.5 years" and "Zoll" as "Customs".
 *
 * Two shapes, one component:
 *
 * - `<ValueText :text="sentence" />` — a line of German prose whose figures must survive: every
 *   value with a unit or a technical code (`8,5J`, `ET 45`, `225/45 R17`, `23 mm`, `+0,91 %`,
 *   `100,9 km/h`) is wrapped in a `translate="no"` span and the words around it stay translatable.
 * - `<ValueText :text="value" whole />` — the string is nothing but a value or a name
 *   (`66,6 mm`, `189,00 €`, `MOTEC MCR4 Ultimate`): it is wrapped whole, in one span.
 *
 * A figure never breaks across a line. Where the element that holds the value exists already and
 * holds nothing else — a spec cell, a size chip, the hero's spec line — that element carries
 * `translate="no"` itself and no span is added.
 */

import { computed } from 'vue'
import { valueParts, type TextPart } from '../../lib/felgenSentences'

const props = withDefaults(defineProps<{ text: string; whole?: boolean }>(), { whole: false })

const parts = computed<TextPart[]>(() => (props.whole ? [{ text: props.text, value: true }] : valueParts(props.text)))
</script>

<template>
    <template v-for="(part, i) in parts" :key="i"><span v-if="part.value" class="value" translate="no">{{ part.text }}</span><template v-else>{{ part.text }}</template></template>
</template>

<style scoped>
.value {
    white-space: nowrap;
}
</style>
