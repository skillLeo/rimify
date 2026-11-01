<script setup lang="ts">
/**
 * „68B definieren": a code of this paper, described once (the brief §4.5, §7). The text as printed, and — beyond the
 * brief, for the reason Phase 0 gives — the kind: it is what makes a code act (an Abnahme derives the Eintragung, a body
 * form filters the cars, a tyre limit narrows the tyres), so it is chosen by a person, never guessed. The level stays
 * optional, with its floor: an Abnahme or work on the body is always at least an Auflage.
 */

import { computed, reactive, ref } from 'vue'
import { KINDS, LEVELS, PRINTED_ONLY, levelFloor, type KindValue, type LevelValue } from '../gutachtenDemo'
import { useSketch } from '../gutachtenStore'

const props = defineProps<{
    /** The code to describe; empty for a new one typed into the panel. */
    code: string
    idPrefix: string
}>()

const emit = defineEmits<{ done: [code: string]; cancel: [] }>()

const store = useSketch()
const existing = store.codeOf(props.code)

const form = reactive({
    code: props.code,
    text: existing?.text ?? '',
    kind: (existing?.kind ?? '') as KindValue | '',
    level: (existing?.level ?? null) as LevelValue | null,
    value: '',
})

const tried = ref(false)
const floor = computed(() => (form.kind === '' ? 'hinweis' : levelFloor(form.kind)))
const needs = computed(() => KINDS.find((kind) => kind.value === form.kind)?.needs ?? null)
const printed = computed(() => PRINTED_ONLY[form.code.trim()] ?? null)

/* A new code that the list already holds — whatever its spelling of case — is changed in the list, never replaced from here. */
const taken = computed(() => (props.code === '' ? store.state.codes.find((c) => c.code.toLowerCase() === form.code.trim().toLowerCase()) ?? null : null))

const errors = computed(() => ({
    code: tried.value && form.code.trim() === '' ? 'Der Code fehlt. Gib ihn so ein, wie er im Gutachten steht.' : taken.value ? `Den Code ${taken.value.code} gibt es schon. Ändere ihn in der Liste.` : '',
    text: tried.value && form.text.trim() === '' ? 'Der Text fehlt. Schreib ihn ab oder füg ihn ein, wie das Gutachten ihn druckt.' : '',
    kind: tried.value && form.kind === '' ? 'Wähl, was der Code bewirkt.' : '',
}))

function save(): void {
    tried.value = true

    if (errors.value.code || errors.value.text || errors.value.kind || form.kind === '') {
        return
    }

    const level = form.level !== null && LEVELS.findIndex((l) => l.value === form.level) >= LEVELS.findIndex((l) => l.value === floor.value) ? form.level : floor.value

    store.define(form.code.trim(), form.text.trim(), form.kind, level)
    emit('done', form.code.trim())
}
</script>

<template>
    <form class="sk-define" novalidate @submit.prevent="save">
        <div v-if="!code" class="form-field">
            <label class="form-field__label" :for="`${idPrefix}-code`">Code</label>
            <input :id="`${idPrefix}-code`" v-model="form.code" class="input sk-define__code" type="text" maxlength="32" spellcheck="false" :aria-invalid="errors.code ? 'true' : undefined">
            <p class="form-field__error">{{ errors.code }}</p>
        </div>

        <div class="form-field">
            <label class="form-field__label" :for="`${idPrefix}-text`">Text, wie im Gutachten gedruckt</label>
            <textarea :id="`${idPrefix}-text`" v-model="form.text" class="input sk-define__text" rows="4" :aria-invalid="errors.text ? 'true' : undefined" />
            <p v-if="printed && form.text.trim() === ''" class="form-field__help">
                Im PDF auf Seite {{ printed.page }}.
                <button class="sk-link" type="button" @click="form.text = printed.text">Text aus der Skizze einsetzen</button>
            </p>
            <p class="form-field__error">{{ errors.text }}</p>
        </div>

        <div class="form-field">
            <label class="form-field__label" :for="`${idPrefix}-kind`">Was bewirkt der Code?</label>
            <select :id="`${idPrefix}-kind`" v-model="form.kind" class="input" :aria-invalid="errors.kind ? 'true' : undefined">
                <option value="" disabled>Bitte wählen</option>
                <option v-for="kind in KINDS" :key="kind.value" :value="kind.value">{{ kind.label }}</option>
            </select>
            <p class="form-field__error">{{ errors.kind }}</p>
        </div>

        <div v-if="needs" class="form-field">
            <label class="form-field__label" :for="`${idPrefix}-value`">{{ needs }}</label>
            <input :id="`${idPrefix}-value`" v-model="form.value" class="input" type="text">
        </div>

        <fieldset class="sk-fieldset form-field">
            <legend class="form-field__label">Einstufung im Shop <span class="sk-optional">(optional)</span></legend>
            <div class="sk-define__levels">
                <label v-for="level in LEVELS" :key="level.value" class="adm-chip">
                    <input
                        v-model="form.level"
                        class="visually-hidden"
                        type="radio"
                        :name="`${idPrefix}-level`"
                        :value="level.value"
                        :disabled="floor === 'auflage' && level.value === 'hinweis'"
                    >
                    {{ level.label }}
                </label>
            </div>
            <p v-if="floor === 'auflage'" class="form-field__help">Eine Abnahme oder Arbeit an der Karosserie ist immer mindestens eine Auflage.</p>
        </fieldset>

        <div class="sk-define__actions">
            <button class="btn btn--ghost" type="button" @click="emit('cancel')">Abbrechen</button>
            <button class="btn btn--primary" type="submit">Speichern</button>
        </div>
    </form>
</template>

<style scoped>
.sk-define {
    display: grid;
    gap: var(--sp-12);
}

.sk-define__code {
    max-width: calc(16 * var(--ch-text));
}

.sk-define__text {
    min-height: 96px;
    resize: vertical;
}

.sk-define__levels {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.sk-define__levels .adm-chip:has(input:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
}

.sk-define__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--sp-8);
}

.sk-define .form-field__error:empty {
    display: none;
}

</style>
