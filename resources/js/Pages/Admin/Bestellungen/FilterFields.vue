<script setup lang="ts">
/**
 * The Bestellungen filter fields, drawn once and used twice: in a row above the list from 768 px,
 * and in the phone's filter sheet. The page owns the values; this only lays them out.
 *
 * Zahlart and Versandart appear only when some order carries one — a filter whose every option finds
 * nothing is a dead end. Amounts are typed the German way and read by the server.
 */

import type { OrderOption } from '../../../types/admin/bestellungen'
import type { FilterForm } from './filters'

defineProps<{
    statuses: (OrderOption & { count: number })[]
    payment: OrderOption[]
    shipping: OrderOption[]
    /** Prefix for the field ids, so the row and the sheet never share one. */
    idPrefix: string
    /** A German sentence about the own date range, from the page's own check. */
    dateError?: string
}>()

const form = defineModel<FilterForm>('form', { required: true })
</script>

<template>
    <div class="form-field">
        <label class="form-field__label" :for="`${idPrefix}-status`">Status</label>
        <select :id="`${idPrefix}-status`" v-model="form.status" class="input">
            <option value="">Alle</option>
            <option v-for="status in statuses" :key="status.value" :value="status.value">{{ status.label }} ({{ status.count }})</option>
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
        <p :id="`${idPrefix}-date-err`" class="form-field__error ob-date-error">{{ dateError }}</p>
    </template>

    <div v-if="payment.length" class="form-field">
        <label class="form-field__label" :for="`${idPrefix}-zahlart`">Zahlart</label>
        <select :id="`${idPrefix}-zahlart`" v-model="form.zahlart" class="input">
            <option value="">Alle</option>
            <option v-for="method in payment" :key="method.value" :value="method.value">{{ method.label }}</option>
        </select>
    </div>

    <div v-if="shipping.length" class="form-field">
        <label class="form-field__label" :for="`${idPrefix}-versandart`">Versandart</label>
        <select :id="`${idPrefix}-versandart`" v-model="form.versandart" class="input">
            <option value="">Alle</option>
            <option v-for="method in shipping" :key="method.value" :value="method.value">{{ method.label }}</option>
        </select>
    </div>

    <div class="form-field">
        <label class="form-field__label" :for="`${idPrefix}-min`">Summe ab</label>
        <input :id="`${idPrefix}-min`" v-model="form.min" class="input" type="text" inputmode="decimal" placeholder="z. B. 500" autocomplete="off">
    </div>

    <div class="form-field">
        <label class="form-field__label" :for="`${idPrefix}-max`">Summe bis</label>
        <input :id="`${idPrefix}-max`" v-model="form.max" class="input" type="text" inputmode="decimal" placeholder="z. B. 2.000" autocomplete="off">
    </div>

    <label class="check ob-check">
        <input v-model="form.auflagen" type="checkbox">
        Nur mit Auflagen
    </label>
</template>
