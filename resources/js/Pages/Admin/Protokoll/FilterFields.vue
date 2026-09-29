<script setup lang="ts">
/**
 * The Protokoll's filter fields, drawn once and used twice: in a row above the list from 768 px, and
 * in the phone's filter sheet. The page owns the values; this only lays them out.
 */

import type { FilterForm } from './filters'

defineProps<{
    people: { value: string; label: string }[]
    areas: { value: string; label: string }[]
    /** Prefix for the field ids, so the row and the sheet never share one. */
    idPrefix: string
    /** A German sentence about the own range, from the page's own check. */
    dateError?: string
}>()

const form = defineModel<FilterForm>('form', { required: true })
</script>

<template>
    <div class="form-field">
        <label class="form-field__label" :for="`${idPrefix}-person`">Person</label>
        <select :id="`${idPrefix}-person`" v-model="form.person" class="input">
            <option value="">Alle Personen</option>
            <option v-for="person in people" :key="person.value" :value="person.value">{{ person.label }}</option>
        </select>
    </div>

    <div class="form-field">
        <label class="form-field__label" :for="`${idPrefix}-bereich`">Bereich</label>
        <select :id="`${idPrefix}-bereich`" v-model="form.bereich" class="input">
            <option value="">Alle Bereiche</option>
            <option v-for="area in areas" :key="area.value" :value="area.value">{{ area.label }}</option>
        </select>
    </div>

    <div class="form-field">
        <label class="form-field__label" :for="`${idPrefix}-zeitraum`">Zeitraum</label>
        <select :id="`${idPrefix}-zeitraum`" v-model="form.zeitraum" class="input">
            <option value="">Jederzeit</option>
            <option value="heute">Heute</option>
            <option value="7">Letzte 7 Tage</option>
            <option value="30">Letzte 30 Tage</option>
            <option value="eigen">Eigener Zeitraum …</option>
        </select>
    </div>

    <template v-if="form.zeitraum === 'eigen'">
        <div class="form-field">
            <label class="form-field__label" :for="`${idPrefix}-von`">Von</label>
            <input
                :id="`${idPrefix}-von`"
                v-model="form.von"
                class="input"
                type="text"
                inputmode="numeric"
                placeholder="TT.MM.JJJJ"
                autocomplete="off"
                :aria-invalid="dateError ? 'true' : undefined"
                :aria-describedby="`${idPrefix}-date-err`"
            >
        </div>
        <div class="form-field">
            <label class="form-field__label" :for="`${idPrefix}-bis`">Bis</label>
            <input
                :id="`${idPrefix}-bis`"
                v-model="form.bis"
                class="input"
                type="text"
                inputmode="numeric"
                placeholder="TT.MM.JJJJ"
                autocomplete="off"
                :aria-invalid="dateError ? 'true' : undefined"
                :aria-describedby="`${idPrefix}-date-err`"
            >
        </div>
        <p :id="`${idPrefix}-date-err`" class="form-field__error pk-date-error">{{ dateError }}</p>
    </template>
</template>
