<script setup lang="ts">
/**
 * One document chosen from all of them (the admin audit's F-36): „Nachtrag zu“ and „Ersetzt eine frühere Fassung“
 * offered only the newest 300 and 200 — an older Gutachten could not be chosen, and „Einem Gutachten, das uns nicht
 * vorliegt“ was the only way on. Every document is offered, newest first; a long list gets a field above it that
 * shortens it to the documents whose name holds what is typed. The one chosen always stays in the list.
 */

import { computed, ref } from 'vue'
import { decimal } from '../../format'

type DocumentOption = { value: number; label: string }

const props = withDefaults(
    defineProps<{
        id: string
        options: DocumentOption[]
        /** The first option: no document of ours. */
        noneLabel: string
        describedby?: string
        invalid?: boolean
    }>(),
    { describedby: undefined, invalid: false }
)

const model = defineModel<number | null>({ required: true })

/** From this many documents on, the list can be shortened by typing. */
const SHORTEN_FROM = 20

const query = ref('')

/** `ABE 53841`, `abe53841` and `ABE-53841` are one search. */
function plain(text: string): string {
    return text.toLocaleLowerCase('de-DE').replace(/[\s\-–./]/g, '')
}

const typed = computed(() => plain(query.value))

const shown = computed(() =>
    typed.value === '' ? props.options : props.options.filter((doc) => doc.value === model.value || plain(doc.label).includes(typed.value))
)

const found = computed(() => shown.value.filter((doc) => typed.value === '' || plain(doc.label).includes(typed.value)).length)
</script>

<template>
    <div class="dsel">
        <template v-if="options.length > SHORTEN_FROM">
            <input
                :id="`${id}-shorten`"
                v-model="query"
                class="input dsel__shorten"
                type="search"
                maxlength="64"
                autocomplete="off"
                spellcheck="false"
                placeholder="Nummer eingeben, etwa 53841"
                aria-label="Dokumente filtern: Nummer oder Name"
                :aria-controls="id"
                :aria-describedby="`${id}-shorten-count`"
            >
            <p :id="`${id}-shorten-count`" class="form-field__help dsel__count" aria-live="polite">
                <template v-if="typed === ''">{{ decimal(options.length, 0) }} Dokumente in der Liste</template>
                <template v-else-if="found === 0">Kein Dokument passt zu „{{ query.trim() }}“.</template>
                <template v-else>{{ decimal(found, 0) }} von {{ decimal(options.length, 0) }} Dokumenten gefunden</template>
            </p>
        </template>
        <select :id="id" v-model="model" class="input" :aria-invalid="invalid ? 'true' : undefined" :aria-describedby="describedby">
            <option :value="null">{{ noneLabel }}</option>
            <option v-for="doc in shown" :key="doc.value" :value="doc.value">{{ doc.label }}</option>
        </select>
    </div>
</template>

<style scoped>
.dsel {
    display: grid;
    gap: var(--sp-8);
}

.dsel__shorten {
    max-width: calc(34 * var(--ch-text));
}

.dsel__count {
    margin: 0;
}
</style>
