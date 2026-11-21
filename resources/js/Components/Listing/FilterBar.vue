<script setup lang="ts">
/**
 * The filter panel: one vertical list of facets, used as the desktop sidebar and, unchanged,
 * inside the phone's filter sheet — one component, so the two can never offer different filters.
 *
 * „Ohne Abnahme und Eintragung“ is gone (D-486, the client's round of 18.11.2026, item 4): the absence of a code is no
 * statement the shop can stand behind. Whether a wheel needs an Eintragung stands on its product page, from its codes.
 *
 * An option that would return nothing is DISABLED, never hidden. Disabling teaches the shape of
 * the catalogue; hiding makes the panel change length every time it is opened.
 *
 * Counts carry the other filters but not the facet's own, so "18 Zoll (12)" means "12 results if
 * you add this", which is the number a customer is actually deciding on.
 */

import { computed } from 'vue'
import { formatNumber } from '../../lib/num'
import type { Facets } from '../../types/rimify'

const props = defineProps<{
    facets: Facets
    filters: Record<string, unknown>
    total: number | null
}>()

const emit = defineEmits<{
    (e: 'toggle', facet: string, value: string): void
    (e: 'reset'): void
}>()

const FACETS = [
    { key: 'marke', label: 'Marke' },
    { key: 'zoll', label: 'Durchmesser (Zoll)' },
    { key: 'breite', label: 'Felgenbreite' },
    { key: 'et', label: 'Einpresstiefe (ET)' },
    { key: 'farbe', label: 'Farbe' },
] as const

const anyApplied = computed(
    () => Object.keys(props.filters).filter((key) => key !== 'seite').length > 0
)

function selected(facet: string): string[] {
    const value = props.filters[facet]

    return Array.isArray(value) ? value.map(String) : []
}

function optionsFor(facet: string): { value: string; count: number }[] {
    return props.facets[facet] ?? []
}

/*
 * The measurements arrive as the database holds them (`18.0`, `8.50`); they are shown the German
 * way, with only the decimals they need — `18`, `8,5J`, `35` (R-10): the Felgenbreite as every
 * other page writes it, with its `J`. The value sent back stays raw.
 */
function optionLabel(facet: string, value: string): string {
    if (facet !== 'zoll' && facet !== 'breite' && facet !== 'et') {
        return value
    }

    const n = Number(value)

    if (!Number.isFinite(n)) {
        return value
    }

    const figure = formatNumber(n, Number.isInteger(n) ? 0 : Number.isInteger(n * 10) ? 1 : 2)

    return facet === 'breite' ? `${figure}J` : figure
}
</script>

<template>
    <div class="fpanel">
        <div class="between fpanel__head">
            <h2 class="t-h3">Filter</h2>
            <button v-if="anyApplied" class="btn btn--quiet btn--sm" type="button" @click="emit('reset')">
                Zurücksetzen
            </button>
        </div>

        <fieldset v-for="facet in FACETS" :key="facet.key" class="fpanel__group">
            <legend class="label fpanel__legend">{{ facet.label }}</legend>

            <label
                v-for="option in optionsFor(facet.key)"
                :key="option.value"
                class="fpanel__opt"
                :class="{ 'fpanel__opt--off': option.count === 0 && !selected(facet.key).includes(option.value) }"
            >
                <input
                    type="checkbox"
                    :checked="selected(facet.key).includes(option.value)"
                    :disabled="option.count === 0 && !selected(facet.key).includes(option.value)"
                    @change="emit('toggle', facet.key, option.value)"
                />
                <span class="fpanel__label">{{ optionLabel(facet.key, option.value) }}</span>
                <span class="data fpanel__count">{{ formatNumber(option.count) }}</span>
            </label>

            <p v-if="optionsFor(facet.key).length === 0" class="quiet t-small">Keine Auswahl verfügbar.</p>
        </fieldset>
    </div>
</template>

<style scoped>
.fpanel__head {
    min-height: 44px;
    margin-bottom: var(--space-2);
}

.fpanel__group {
    margin: var(--sp-24) 0 0;
    padding: 0;
    border: 0;
    border-top: 1px solid var(--line);
}

.fpanel__legend {
    padding: 0;
    margin-bottom: var(--space-2);
}

.fpanel__opt {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-height: 44px;
    font-size: var(--text-body);
    color: var(--ink);
    cursor: pointer;
}

.fpanel__opt input {
    width: 18px;
    height: 18px;
    flex: none;
    margin: 0;
    accent-color: var(--blue);
}

.fpanel__label {
    flex: 1;
    min-width: 0;
}

.fpanel__count {
    color: var(--ink3);
}

/* Shown and unusable, so the catalogue's shape stays legible. */
.fpanel__opt--off {
    color: var(--ink3);
    cursor: not-allowed;
}
</style>
