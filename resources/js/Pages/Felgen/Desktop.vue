<script setup lang="ts">
/**
 * The listing. With a vehicle it is a compliance answer; without one it is the open catalogue and
 * says so in a strip above the grid rather than quietly implying everything fits.
 *
 * One result is still a grid, never a redirect to the product page — a redirect would steal the
 * back button and hide the fact that the filter narrowed to one.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import FilterBar from '../../Components/Listing/FilterBar.vue'
import Icon from '../../Components/Art/Icon.vue'
import ProductCard from '../../Components/Product/ProductCard.vue'
import { useListingFilters } from '../../composables/useListingFilters'
import { useShared } from '../../composables/useShared'
import type { FelgenProps } from '../../types/pages'

const props = defineProps<FelgenProps>()

const shared = useShared()
const filters = useListingFilters(() => props.filters)

const heading = computed(() =>
    shared.value.vehicle === null
        ? 'Unser gesamtes Felgensortiment'
        : `Unser gesamtes Felgensortiment für deinen ${shared.value.vehicle.short}`
)

const countLine = computed(() => {
    if (props.total === null) {
        return 'Wähle dein Fahrzeug, um nur freigegebene Felgen zu sehen.'
    }

    return `${props.total} Felgen mit gültiger Freigabe für dieses Fahrzeug.`
})

const pages = computed(() => {
    if (props.total === null) {
        return []
    }

    const last = Math.max(1, Math.ceil(props.total / 24))

    return Array.from({ length: Math.min(last, 12) }, (_, i) => i + 1)
})
</script>

<template>
    <Head title="Felgen" />

    <section class="section">
        <div class="wrap">
            <nav class="plp__crumbs" aria-label="Brotkrumen">
                <Link href="/">RIMIFY</Link>
                <span aria-hidden="true">›</span>
                <span class="plp__crumb-current">Felgen</span>
            </nav>

            <h1 class="t-h2 plp__title">{{ heading }}</h1>
            <p class="plp__sub">{{ countLine }}</p>

            <!-- No vehicle: the page is honest about what it is, and offers the fix. -->
            <div v-if="!hasVehicle" class="panel--wash plp__notice">
                <p class="plp__notice-text">
                    Wähle dein Fahrzeug, um nur freigegebene Felgen zu sehen.
                </p>
                <Link href="/felgen-suchen" class="btn btn--primary">Fahrzeug wählen</Link>
            </div>

            <FilterBar
                v-if="hasVehicle"
                :facets="facets"
                :filters="filters.current.value"
                :total="total"
                class="plp__filters"
                @toggle="filters.toggle"
                @toggle-entry="filters.toggleEntry"
                @reset="filters.reset"
            />

            <div v-if="cards.length > 0" class="grid-cards plp__grid">
                <ProductCard
                    v-for="card in cards"
                    :key="`${card.modelId}-${card.finishId}`"
                    :card="card"
                    :vehicle="shared.vehicle"
                />
            </div>

            <!-- Never an empty grid: the gap is named and two ways forward are offered. -->
            <div v-else class="state">
                <Icon name="info" :size="24" />
                <p class="state__title">Für dieses Fahrzeug haben wir noch keine freigegebenen Felgen.</p>
                <p class="t-body">
                    RIMIFY zeigt ausschließlich Felgen, für die ein gültiges Gutachten vorliegt. Sobald
                    eine Freigabe für dein Fahrzeug vorliegt, erscheint sie hier.
                </p>
                <div class="cluster">
                    <Link href="/kontakt" class="btn btn--primary">Benachrichtigen, sobald verfügbar</Link>
                    <Link href="/felgen-suchen" class="btn btn--secondary">Anderes Fahrzeug wählen</Link>
                </div>
            </div>

            <!-- Numbered pages with a real `?seite=`. Never infinite scroll. -->
            <nav v-if="pages.length > 1" class="plp__pages" aria-label="Seiten">
                <button
                    v-for="n in pages"
                    :key="n"
                    class="plp__page"
                    :class="{ 'plp__page--on': (page ?? 1) === n }"
                    type="button"
                    :aria-current="(page ?? 1) === n ? 'page' : undefined"
                    @click="filters.goToPage(n)"
                >
                    {{ n }}
                </button>
            </nav>
        </div>
    </section>
</template>

<style scoped>
.plp__crumbs {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 13px;
    color: var(--ink3);
}

.plp__crumbs a {
    color: var(--ink3);
    text-decoration: none;
}

.plp__crumb-current {
    color: var(--ink2);
}

.plp__title {
    margin: var(--space-4) auto var(--space-2);
    text-align: center;
    max-width: 22ch;
}

.plp__sub {
    margin: 0 auto;
    text-align: center;
    font-size: 15px;
    color: var(--ink2);
}

.plp__notice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    margin-top: var(--space-5);
}

.plp__notice-text {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
}

.plp__filters {
    margin-top: var(--space-5);
}

.plp__grid {
    margin-top: var(--space-5);
}

.plp__pages {
    display: flex;
    justify-content: center;
    gap: var(--space-2);
    margin-top: var(--space-7);
}

.plp__page {
    min-width: 44px;
    min-height: 44px;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--ink2);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
}

.plp__page--on {
    background: var(--blue);
    color: #fff;
}
</style>
