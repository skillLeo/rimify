<script setup lang="ts">
/**
 * The facet bar.
 *
 * `Ohne Eintragung` sits at the FRONT of the row and not inside a dropdown: for a large share of
 * German buyers, whether the wheel needs an entry in the vehicle papers is the single most
 * important attribute of the purchase, and burying it under `Design` would be answering a
 * different question than the one they came with.
 *
 * Options that would return nothing are DISABLED, never hidden. Disabling teaches the shape of the
 * catalogue; hiding makes the interface feel unstable, because the same control shows a different
 * number of choices each time it is opened.
 */

import { computed, ref } from 'vue'
import Icon from '../Art/Icon.vue'
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

/** The eight facets in the order the Figma fixes. Price and availability arrive in V2. */
const FACETS = [
    { key: 'marke', label: 'Marke' },
    { key: 'zoll', label: 'Zoll' },
    { key: 'breite', label: 'Breite' },
    { key: 'et', label: 'ET' },
    { key: 'farbe', label: 'Farbe' },
] as const

const open = ref<string | null>(null)

const entryOn = computed(() => props.filters.ohne_eintragung === true)

const anyApplied = computed(
    () => Object.keys(props.filters).filter((key) => key !== 'seite').length > 0
)

function selected(facet: string): string[] {
    const value = props.filters[facet]

    return Array.isArray(value) ? value.map(String) : []
}

function count(facet: string): number {
    return selected(facet).length
}

function optionsFor(facet: string): { value: string; count: number }[] {
    return props.facets[facet] ?? []
}

function toggleOpen(facet: string): void {
    open.value = open.value === facet ? null : facet
}
</script>

<template>
    <div class="fbar">
        <!-- First, and deliberately so. -->
        <button
            class="pill fbar__entry"
            :class="{ 'pill--on': entryOn }"
            type="button"
            :aria-pressed="entryOn"
            @click="emit('toggle-entry')"
        >
            <Icon name="check" :size="20" />
            Ohne Eintragung
            <span v-if="facets.ohne_eintragung?.[0]" class="fbar__n">
                ({{ facets.ohne_eintragung[0].count }})
            </span>
        </button>

        <span class="fbar__rule" aria-hidden="true" />

        <div v-for="facet in FACETS" :key="facet.key" class="fbar__facet">
            <button
                class="pill"
                :class="{ 'pill--on': open === facet.key }"
                type="button"
                :aria-expanded="open === facet.key"
                @click="toggleOpen(facet.key)"
            >
                {{ facet.label }}
                <span v-if="count(facet.key) > 0" class="fbar__badge">{{ count(facet.key) }}</span>
                <Icon name="chevron-down" :size="20" />
            </button>

            <div v-if="open === facet.key" class="fbar__panel">
                <label
                    v-for="option in optionsFor(facet.key)"
                    :key="option.value"
                    class="fbar__opt"
                    :class="{ 'fbar__opt--off': option.count === 0 }"
                >
                    <input
                        type="checkbox"
                        :checked="selected(facet.key).includes(option.value)"
                        :disabled="option.count === 0"
                        @change="emit('toggle', facet.key, option.value)"
                    />
                    <span class="fbar__optlabel">{{ option.value }}</span>
                    <span class="data fbar__optcount">{{ option.count }}</span>
                </label>

                <p v-if="optionsFor(facet.key).length === 0" class="quiet fbar__empty">
                    Keine Auswahl verfügbar.
                </p>
            </div>
        </div>

        <button v-if="anyApplied" class="btn btn--quiet fbar__reset" type="button" @click="emit('reset')">
            Alle Filter zurücksetzen
        </button>
    </div>
</template>

<style scoped>
.fbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 12px;
}

/* Rules between controls stop 10px short at top and bottom. */
.fbar__rule {
    align-self: stretch;
    width: 1px;
    margin: 10px 4px;
    background: var(--line);
}

.fbar__facet {
    position: relative;
}

.fbar__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding-inline: 5px;
    border-radius: var(--radius-round);
    background: var(--blue);
    color: #fff;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
}

.pill--on .fbar__badge {
    background: #fff;
    color: var(--blue);
}

.fbar__n {
    font-weight: 500;
    opacity: 0.8;
}

.fbar__panel {
    position: absolute;
    top: calc(100% + var(--space-2));
    left: 0;
    z-index: 30;
    min-width: 240px;
    max-height: 320px;
    overflow-y: auto;
    padding: var(--space-2);
    background: var(--surface);
    border-radius: 12px;
    box-shadow: var(--shadow-overlay);
}

.fbar__opt {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding-inline: var(--space-2);
    border-radius: var(--radius-sm);
    font-size: 14px;
    cursor: pointer;
}

.fbar__opt:hover {
    background: var(--ground);
}

/* Shown and unusable, so the catalogue's shape stays legible. */
.fbar__opt--off {
    color: var(--ink3);
    cursor: not-allowed;
}

.fbar__optlabel {
    flex: 1;
}

.fbar__optcount {
    color: var(--ink3);
}

.fbar__empty {
    margin: 0;
    padding: var(--space-3) var(--space-2);
    font-size: 13px;
}

.fbar__reset {
    margin-left: auto;
}
</style>
