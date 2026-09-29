<script setup lang="ts">
/**
 * A date typed the German way, TT.MM.JJJJ, whatever language the browser speaks — the native date
 * field follows the browser and shows „mm/dd/yyyy“ or „dd-----yyyy“. The model stays the ISO date the
 * server reads (`2024-03-12`, or '' for none). Text that is not a whole date goes to the server as
 * typed, so its German sentence says what is wrong instead of the field quietly dropping it.
 */

import { ref, watch } from 'vue'
import { fromGermanDate, toGermanDate } from './dateField'

const model = defineModel<string>({ required: true })

defineProps<{
    id: string
    invalid?: boolean
    describedby?: string
    disabled?: boolean
}>()

const text = ref(toGermanDate(model.value))

/* A value set from outside (a reset, a record loaded) replaces the text; one this field wrote does not. */
watch(model, (value) => {
    if ((fromGermanDate(text.value) ?? text.value.trim()) !== value) {
        text.value = toGermanDate(value)
    }
})

function onInput(): void {
    model.value = fromGermanDate(text.value) ?? text.value.trim()
}
</script>

<template>
    <input
        :id="id"
        v-model="text"
        class="input adm-date"
        type="text"
        inputmode="numeric"
        placeholder="TT.MM.JJJJ"
        autocomplete="off"
        maxlength="10"
        :disabled="disabled"
        :aria-invalid="invalid ? 'true' : undefined"
        :aria-describedby="describedby"
        @input="onInput"
    >
</template>

<style scoped>
.adm-date {
    max-width: 16ch;
    font-variant-numeric: tabular-nums;
}

@media (max-width: 767px) {
    .adm-date {
        max-width: none;
    }
}
</style>
