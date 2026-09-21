<script setup lang="ts">
/**
 * The filter panel: one vertical list of facets, used as the desktop sidebar and, unchanged,
 * inside the phone's filter sheet — one component, so the two can never offer different filters.
 *
 * `Ohne Eintragung` comes first and stands on its own: for many German buyers whether the wheel
 * needs an entry in the vehicle papers is the deciding attribute of the purchase.
 *
 * An option that would return nothing is DISABLED, never hidden. Disabling teaches the shape of
 * the catalogue; hiding makes the panel change length every time it is opened.
 *
 * Counts carry the other filters but not the facet's own, so "18 Zoll (12)" means "12 results if
 * you add this", which is the number a customer is actually deciding on.
 */

import { computed } from 'vue'
import type { Facets } from '../../types/rimify'

const props = defineProps<{
    facets: Facets
    filters: Record<string, unknown>
    total: number | null
}>()

const emit = defineEmits<{
    (e: 'toggle', facet: string, value: string): void
    (e: 'toggle-entry'): void
    (e: 'reset'): void
}>()

const FACETS = [
    { key: 'marke', label: 'Marke' },
    { key: 'zoll', label: 'Durchmesser (Zoll)' },
    { key: 'breite', label: 'Breite (Zoll)' },
    { key: 'et', label: 'Einpresstiefe (ET)' },
    { key: 'farbe', label: 'Farbe' },
] as const

const entryOn = computed(() => props.filters.ohne_eintragung === true)
const entryCount = computed(() => props.facets.ohne_eintragung?.[0]?.count ?? null)

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
</script>

<template>
    <div class="fpanel">
        <div class="between fpanel__head">
            <h2 class="t-h3">Filter</h2>
            <button v-if="anyApplied" class="btn btn--quiet btn--sm" type="button" @click="emit('reset')">
                Zurücksetzen
            </button>
        </div>

        <label class="fpanel__opt fpanel__opt--entry">
            <input type="checkbox" :checked="entryOn" @change="emit('toggle-entry')" />
            <span class="fpanel__label">Ohne Eintragung</span>
            <span v-if="entryCount !== null" class="data fpanel__count">{{ entryCount }}</span>
        </label>

        <fieldset v-for="facet in FACETS" :key="facet.key" class="fpanel__group">
            <legend class="micro fpanel__legend">{{ facet.label }}</legend>

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
                <span class="fpanel__label">{{ option.value }}</span>
                <span class="data fpanel__count">{{ option.count }}</span>
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
    margin: var(--space-4) 0 0;
    padding: var(--space-4) 0 0;
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

.fpanel__opt--entry {
    padding: var(--space-2) var(--space-3);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    font-weight: 700;
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
