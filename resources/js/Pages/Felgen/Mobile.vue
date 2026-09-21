<script setup lang="ts">
/**
 * The listing on a phone.
 *
 * The eight dropdowns collapse to one full-width control that opens a full-height sheet, with the
 * `Ohne Eintragung` toggle at the top and a sticky `… Felgen anzeigen` action at the bottom — the
 * count is on the button because a filter sheet whose effect you can only see after closing it is
 * a filter sheet people close without using.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import Icon from '../../Components/Art/Icon.vue'
import ProductCard from '../../Components/Product/ProductCard.vue'
import { useListingFilters } from '../../composables/useListingFilters'
import { useShared } from '../../composables/useShared'
import type { FelgenProps } from '../../types/pages'

const props = defineProps<FelgenProps>()

const shared = useShared()
const filters = useListingFilters(() => props.filters)
const sheetOpen = ref(false)

const FACETS = [
    { key: 'marke', label: 'Marke' },
    { key: 'zoll', label: 'Zoll' },
    { key: 'breite', label: 'Breite' },
    { key: 'et', label: 'ET' },
    { key: 'farbe', label: 'Farbe' },
] as const

const heading = computed(() =>
    shared.value.vehicle === null
        ? 'Unser gesamtes Felgensortiment'
        : `Unser gesamtes Felgensortiment für deinen ${shared.value.vehicle.short}`
)

const entryOn = computed(() => props.filters.ohne_eintragung === true)

function selected(facet: string): string[] {
    const value = props.filters[facet]

    return Array.isArray(value) ? value.map(String) : []
}
</script>

<template>
    <Head title="Felgen" />

    <section class="section">
        <div class="wrap">
            <h1 class="t-h2 mplp__title">{{ heading }}</h1>
            <p class="mplp__sub">
                {{
                    total === null
                        ? 'Wähle dein Fahrzeug, um nur freigegebene Felgen zu sehen.'
                        : `${total} Felgen mit gültiger Freigabe für dieses Fahrzeug.`
                }}
            </p>

            <Link v-if="!hasVehicle" href="/felgen-suchen" class="btn btn--primary btn--block mplp__cta">
                Fahrzeug wählen
            </Link>

            <button
                v-else
                class="btn btn--secondary btn--block mplp__filter"
                type="button"
                @click="sheetOpen = true"
            >
                Filtern nach Größe, Farbe, etc.
                <Icon name="chevron-down" :size="20" />
            </button>

            <div v-if="cards.length > 0" class="mplp__grid">
                <ProductCard
                    v-for="card in cards"
                    :key="`${card.modelId}-${card.finishId}`"
                    :card="card"
                    :vehicle="shared.vehicle"
                />
            </div>

            <div v-else class="state">
                <Icon name="info" :size="24" />
                <p class="state__title">Für dieses Fahrzeug haben wir noch keine freigegebenen Felgen.</p>
                <p class="t-body">
                    RIMIFY zeigt ausschließlich Felgen, für die ein gültiges Gutachten vorliegt.
                </p>
                <Link href="/kontakt" class="btn btn--primary btn--block">
                    Benachrichtigen, sobald verfügbar
                </Link>
                <Link href="/felgen-suchen" class="btn btn--secondary btn--block">
                    Anderes Fahrzeug wählen
                </Link>
            </div>
        </div>
    </section>

    <template v-if="sheetOpen">
        <div class="scrim" @click="sheetOpen = false" />
        <div class="sheet mplp__sheet" role="dialog" aria-modal="true" aria-label="Filter">
            <div class="sheet__grab" />
            <div class="between">
                <span class="t-h3">Filter</span>
                <button class="btn btn--quiet" type="button" @click="filters.reset()">
                    Zurücksetzen
                </button>
            </div>

            <button
                class="pill mplp__entry"
                :class="{ 'pill--on': entryOn }"
                type="button"
                :aria-pressed="entryOn"
                @click="filters.toggleEntry()"
            >
                <Icon name="check" :size="20" />
                Ohne Eintragung
            </button>

            <div v-for="facet in FACETS" :key="facet.key" class="mplp__group">
                <span class="micro">{{ facet.label }}</span>
                <div class="chip-row mplp__chips">
                    <button
                        v-for="option in facets[facet.key] ?? []"
                        :key="option.value"
                        class="chip"
                        :class="{
                            'chip--on': selected(facet.key).includes(option.value),
                            'chip--blocked': option.count === 0,
                        }"
                        type="button"
                        :disabled="option.count === 0"
                        @click="filters.toggle(facet.key, option.value)"
                    >
                        {{ option.value }}
                    </button>
                </div>
            </div>

            <div class="mplp__apply">
                <button class="btn btn--primary btn--block" type="button" @click="sheetOpen = false">
                    {{ total ?? 0 }} Felgen anzeigen
                </button>
            </div>
        </div>
    </template>
</template>

<style scoped>
.mplp__title {
    text-align: center;
    margin: 0 0 var(--s2);
}

.mplp__sub {
    margin: 0;
    text-align: center;
    font-size: 14px;
    color: var(--ink2);
}

.mplp__cta,
.mplp__filter {
    margin-top: var(--s4);
}

.mplp__grid {
    display: grid;
    gap: var(--s3);
    margin-top: var(--s4);
}

.mplp__sheet {
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
    padding-bottom: calc(96px + env(safe-area-inset-bottom));
}

.mplp__entry {
    margin: var(--s4) 0;
}

.mplp__group + .mplp__group {
    margin-top: var(--s4);
}

.mplp__chips {
    margin-top: var(--s2);
}

/* Sticky, because the count is the reason to press it. */
.mplp__apply {
    position: sticky;
    bottom: 0;
    margin: var(--s5) calc(var(--gutter-m) * -1) 0;
    padding: var(--s3) var(--gutter-m) calc(var(--s3) + env(safe-area-inset-bottom));
    background: var(--surface);
    border-top: 1px solid var(--line);
}
</style>
