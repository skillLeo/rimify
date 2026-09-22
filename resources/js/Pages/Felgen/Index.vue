<script setup lang="ts">
/**
 * The listing.
 *
 * With a vehicle it is a compliance answer — only wheels with a valid Gutachten for that car, and
 * the count says so. Without one it is the open catalogue, and a notice above the grid says so
 * rather than quietly implying everything fits.
 *
 * One page for every width. The filters are a sticky sidebar from 1200px; below that they open in
 * a sheet from a sticky bar, with the live result count on the button that closes it.
 *
 * The page count is derived from the result count. It is never a literal.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import FilterBar from '../../Components/Listing/FilterBar.vue'
import Icon from '../../Components/Art/Icon.vue'
import ProductTile from '../../Components/Ui/ProductTile.vue'
import { useListingFilters } from '../../composables/useListingFilters'
import { useShared } from '../../composables/useShared'
import type { FelgenProps } from '../../types/pages'

defineOptions({ layout: AppLayout })

const props = defineProps<FelgenProps>()

const PAGE_SIZE = 24

const shared = useShared()
const vehicle = computed(() => shared.value.vehicle)
const filters = useListingFilters(() => props.filters)
const sheetOpen = ref(false)

const heading = computed(() =>
    vehicle.value === null ? 'Alle Felgen' : `Felgen für deinen ${vehicle.value.short}`
)

const appliedCount = computed(
    () =>
        Object.entries(props.filters).filter(
            ([key, value]) => key !== 'seite' && (Array.isArray(value) ? value.length > 0 : value)
        ).length
)

const currentPage = computed(() => props.page ?? 1)

const lastPage = computed(() =>
    props.total === null ? 1 : Math.max(1, Math.ceil(props.total / PAGE_SIZE))
)

/** A window of page numbers around the current one, never a hard-coded run. */
const pages = computed(() => {
    const last = lastPage.value
    const from = Math.max(1, Math.min(currentPage.value - 2, last - 4))
    const to = Math.min(last, from + 4)

    return Array.from({ length: to - from + 1 }, (_, i) => from + i)
})

watch(sheetOpen, (open) => {
    if (typeof document !== 'undefined') {
        document.body.style.overflow = open ? 'hidden' : ''
    }
})

onBeforeUnmount(() => {
    if (typeof document !== 'undefined') {
        document.body.style.removeProperty('overflow')
    }
})
</script>

<template>
    <Head title="Felgen" />

    <section class="section-dense">
        <div class="wrap">
            <nav class="plp__crumbs t-small" aria-label="Brotkrumen">
                <Link href="/">Startseite</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">Felgen</span>
            </nav>

            <div class="plp__head">
                <h1 class="t-h1">
                    {{ heading }}
                    <!-- Seeded demonstration rows are on this page: it says so, once (OVERHAUL.md §2). -->
                    <span v-if="demo" class="badge demo-note plp__demo">Demodaten</span>
                </h1>
                <p class="plp__count">
                    <template v-if="total !== null">
                        <strong class="tabular">{{ total }}</strong>
                        {{ total === 1 ? 'Felge' : 'Felgen' }} mit gültigem Gutachten für dieses Fahrzeug
                    </template>
                    <template v-else>{{ cards.length }} Felgen im Sortiment</template>
                </p>
                <p v-if="demo" class="micro quiet">Beispielsortiment – Preise und Bestände sind Beispielwerte, bestellen kannst du noch nicht.</p>
            </div>

            <!-- No vehicle: honest about what the page is, and one step away from the real answer. -->
            <div v-if="!hasVehicle" class="plp__notice">
                <Icon name="info" :size="20" />
                <p class="plp__notice-text">
                    Wähle dein Fahrzeug, um nur Felgen zu sehen, die dafür freigegeben sind.
                </p>
                <Link href="/felgen-suchen" class="btn btn--primary">Fahrzeug wählen</Link>
            </div>

            <!-- Below 1200px: one sticky bar that opens the filters. -->
            <div v-if="hasVehicle" class="plp__bar">
                <button class="btn btn--secondary plp__bar-btn" type="button" @click="sheetOpen = true">
                    <Icon name="filter" :size="20" />
                    Filter
                    <span v-if="appliedCount > 0" class="plp__bar-n tabular">{{ appliedCount }}</span>
                </button>
            </div>

            <div class="plp__layout" :class="{ 'plp__layout--filters': hasVehicle }">
                <aside v-if="hasVehicle" class="plp__side" aria-label="Filter">
                    <FilterBar
                        :facets="facets"
                        :filters="filters.current.value"
                        :total="total"
                        @toggle="filters.toggle"
                        @toggle-entry="filters.toggleEntry"
                        @reset="filters.reset"
                    />
                </aside>

                <div class="plp__results">
                    <!-- The same card as the homepage (home-overhaul.md §1): one CTA, one checkbox. -->
                    <div v-if="cards.length > 0" class="tile-grid plp__grid">
                        <ProductTile
                            v-for="(card, i) in cards"
                            :key="`${card.modelId}-${card.finishId}`"
                            :card="card"
                            :vehicle="vehicle"
                            :eager="i < 4"
                            sizes="(min-width: 1280px) 240px, (min-width: 1024px) 22vw, (min-width: 768px) 30vw, 45vw"
                            compare
                        />
                    </div>

                    <!-- Never an empty grid: the gap is named and two ways forward are offered. -->
                    <div v-else class="state">
                        <Icon name="info" :size="24" />
                        <p class="state__title">
                            {{
                                appliedCount > 0
                                    ? 'Keine Felgen für diese Filter.'
                                    : 'Für dieses Fahrzeug haben wir noch keine freigegebenen Felgen.'
                            }}
                        </p>
                        <p class="t-body">
                            RIMIFY zeigt ausschließlich Felgen, für die ein gültiges Gutachten vorliegt.
                        </p>
                        <div class="cluster">
                            <button
                                v-if="appliedCount > 0"
                                class="btn btn--primary"
                                type="button"
                                @click="filters.reset()"
                            >
                                Filter zurücksetzen
                            </button>
                            <Link v-else href="/kontakt" class="btn btn--primary">
                                Benachrichtigen, sobald verfügbar
                            </Link>
                            <Link href="/felgen-suchen" class="btn btn--secondary">Anderes Fahrzeug wählen</Link>
                        </div>
                    </div>

                    <nav v-if="lastPage > 1" class="pager plp__pager" aria-label="Seiten">
                        <button
                            v-for="n in pages"
                            :key="n"
                            class="pager__page"
                            :class="{ 'pager__page--on': currentPage === n }"
                            type="button"
                            :aria-current="currentPage === n ? 'page' : undefined"
                            @click="filters.goToPage(n)"
                        >
                            {{ n }}
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    </section>

    <!-- The filter sheet: the same panel as the sidebar, with the live count on its button. -->
    <template v-if="sheetOpen">
        <div class="scrim" @click="sheetOpen = false" />
        <div class="sheet plp__sheet" role="dialog" aria-modal="true" aria-label="Filter">
            <div class="sheet__grab" />
            <FilterBar
                :facets="facets"
                :filters="filters.current.value"
                :total="total"
                @toggle="filters.toggle"
                @toggle-entry="filters.toggleEntry"
                @reset="filters.reset"
            />
            <div class="plp__apply">
                <button class="btn btn--primary btn--block" type="button" @click="sheetOpen = false">
                    {{ total ?? 0 }} {{ total === 1 ? 'Felge' : 'Felgen' }} anzeigen
                </button>
            </div>
        </div>
    </template>
</template>

<style scoped>
.plp__crumbs {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--ink3);
}

.plp__crumbs a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink2);
    text-decoration: none;
}

.plp__head {
    margin-bottom: var(--space-5);
}

.plp__count {
    margin-top: var(--space-2);
    color: var(--ink2);
}

.plp__notice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-5);
    padding: var(--space-4);
    background: var(--band);
    border-radius: var(--radius-md);
    color: var(--ink2);
}

.plp__notice-text {
    flex: 1 1 260px;
    color: var(--ink);
    font-weight: 700;
}

/* Sticky under the header, so the filters are one tap away wherever the customer has scrolled. */
.plp__bar {
    position: sticky;
    top: var(--header-h-m);
    z-index: var(--z-sticky);
    margin: 0 calc(var(--gutter) * -1) var(--space-4);
    padding: var(--space-2) var(--gutter);
    background: var(--ground);
    border-bottom: 1px solid var(--line);
}

.plp__bar-btn {
    width: 100%;
}

.plp__bar-n {
    display: inline-grid;
    place-items: center;
    min-width: 20px;
    height: 20px;
    padding-inline: var(--space-1);
    border-radius: var(--radius-round);
    background: var(--blue);
    color: var(--c-surface);
    font-size: var(--text-micro);
}

.plp__side {
    display: none;
}

.plp__pager {
    margin-top: var(--space-7);
}

.plp__sheet {
    max-height: 92vh;
    padding-bottom: 0;
}

/* Sticky inside the sheet, because the count is the reason to press it. */
.plp__apply {
    position: sticky;
    bottom: 0;
    margin: var(--space-5) calc(var(--gutter) * -1) 0;
    padding: var(--space-3) var(--gutter) calc(var(--space-3) + env(safe-area-inset-bottom));
    background: var(--surface);
    border-top: 1px solid var(--line);
}

@media (min-width: 640px) {
    .plp__bar-btn {
        width: auto;
    }
}

@media (min-width: 900px) {
    .plp__bar {
        top: var(--header-h);
    }
}

@media (min-width: 1200px) {
    .plp__bar {
        display: none;
    }

    .plp__layout--filters {
        display: grid;
        grid-template-columns: 260px minmax(0, 1fr);
        gap: var(--space-6);
        align-items: start;
    }

    .plp__side {
        display: block;
        position: sticky;
        top: calc(var(--header-h) + var(--space-4));
        max-height: calc(100vh - var(--header-h) - var(--space-6));
        overflow-y: auto;
        padding: var(--space-4);
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
    }

    /* Beside the filters there is room for three columns, not four. */
    .plp__layout--filters .plp__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}
</style>
