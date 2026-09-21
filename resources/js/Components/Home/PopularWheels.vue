<script setup lang="ts">
/**
 * H5 · Beliebte Felgen, and H5b · Zuletzt angesehen.
 *
 * Eight real wheels from the catalogue in one of three real orders; with a vehicle chosen the row
 * is that car's answer, every tile carries its verdict, and the tabs give way to the count.
 * Changing a tab is a partial reload of `popular` only: the page keeps its scroll position and its
 * state, the grid shows skeletons while the request runs, and a failed request says so above the
 * last tiles that loaded rather than in place of them.
 *
 * Never a rating, never a "Details" button, never a price without its legal line — the tile
 * itself guarantees that (docs/phase0/ADDENDUM.md §D2).
 */

import { Link, router } from '@inertiajs/vue3'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { computed, ref, watch } from 'vue'
import ProductTile from '../Ui/ProductTile.vue'
import ProductTileSkeleton from '../Ui/ProductTileSkeleton.vue'
import { decimal } from '../../format'
import type { StartseiteProps } from '../../types/pages'
import type { ProductCardProp, VehicleProp } from '../../types/rimify'

const props = defineProps<{
    popular: StartseiteProps['popular']
    recentlyViewed: ProductCardProp[]
    vehicle: VehicleProp | null
}>()

const SKELETONS = 8

const active = ref(props.popular.active)
const loading = ref(false)
const failed = ref(false)

watch(
    () => props.popular.active,
    (value) => {
        active.value = value
    }
)

const title = computed(() => {
    if (props.popular.title !== null) {
        return props.popular.title
    }

    return props.vehicle === null ? 'Beliebte Felgen' : `Beliebt für deinen ${props.vehicle.short}`
})

/* The button says what happens: the count when the listing has one, never a vague "mehr". */
const buttonLabel = computed(() => {
    if (props.vehicle === null) {
        return 'Alle Felgen ansehen'
    }

    const total = props.popular.total

    if (total === null) {
        return 'Passende Felgen anzeigen'
    }

    return total === 1 ? '1 passende Felge anzeigen' : `${decimal(total, 0)} passende Felgen anzeigen`
})

function load(key: string): void {
    let succeeded = false
    let cancelled = false

    router.get(
        '/',
        { beliebt: key },
        {
            only: ['popular'],
            preserveScroll: true,
            preserveState: true,
            onStart: () => {
                loading.value = true
                failed.value = false
            },
            onSuccess: () => {
                succeeded = true
            },
            onCancel: () => {
                cancelled = true
            },
            onFinish: () => {
                loading.value = false

                if (!cancelled) {
                    failed.value = !succeeded
                }
            },
        }
    )
}

function select(value: string | number): void {
    const key = String(value)
    active.value = key
    load(key)
}

function keyOf(card: ProductCardProp): string {
    return `${card.modelId}-${card.finishId}`
}
</script>

<template>
    <section id="h5" class="popular" data-section="H5" aria-labelledby="h5-heading">
        <div class="container">
            <h2 id="h5-heading" class="h2 popular__title">{{ title }}</h2>

            <TabsRoot v-if="popular.tabs.length > 0" :model-value="active" class="popular__tabs" @update:model-value="select">
                <TabsList class="tabs__list" aria-label="Auswahl der Felgen">
                    <TabsTrigger v-for="tab in popular.tabs" :key="tab.key" :value="tab.key" class="tabs__trigger">
                        {{ tab.label }}
                    </TabsTrigger>
                </TabsList>

                <TabsContent :value="active" class="tabs__content">
                    <div v-if="failed" class="notice notice--bad popular__notice" role="alert">
                        <p class="popular__notice-text">Die Felgen lassen sich gerade nicht laden.</p>
                        <button class="btn btn--secondary btn--sm" type="button" @click="load(active)">Erneut versuchen</button>
                    </div>

                    <div v-if="loading" class="tile-grid popular__grid" aria-busy="true">
                        <ProductTileSkeleton v-for="n in SKELETONS" :key="n" />
                    </div>
                    <div v-else-if="popular.cards.length > 0" class="tile-grid popular__grid">
                        <ProductTile
                            v-for="(card, i) in popular.cards"
                            :key="keyOf(card)"
                            :card="card"
                            :vehicle="vehicle"
                            :eager="i < 4"
                            compare
                        />
                    </div>
                    <div v-else class="empty">
                        <p class="empty__title">In dieser Auswahl ist gerade nichts.</p>
                        <p class="empty__text">Schau bei Beliebt oder Neu, oder sieh dir alle Felgen an.</p>
                    </div>
                </TabsContent>
            </TabsRoot>

            <!-- With a vehicle there are no tabs: the row is the answer for that car. -->
            <template v-else>
                <div v-if="popular.cards.length > 0" class="tile-grid popular__grid popular__grid--vehicle">
                    <ProductTile v-for="(card, i) in popular.cards" :key="keyOf(card)" :card="card" :vehicle="vehicle" :eager="i < 4" compare />
                </div>
                <div v-else class="empty">
                    <p class="empty__title">In dieser Auswahl ist gerade nichts.</p>
                    <p class="empty__text">Schau bei Beliebt oder Neu, oder sieh dir alle Felgen an.</p>
                </div>
            </template>

            <div class="popular__more">
                <Link href="/felgen" class="btn btn--secondary" prefetch>{{ buttonLabel }}</Link>
            </div>

            <section v-if="recentlyViewed.length > 0" id="h5b" class="recent" data-section="H5b" aria-labelledby="h5b-heading">
                <h2 id="h5b-heading" class="h2">Zuletzt angesehen</h2>
                <div class="tile-grid recent__grid">
                    <ProductTile v-for="card in recentlyViewed" :key="keyOf(card)" :card="card" :vehicle="vehicle" />
                </div>
            </section>
        </div>
    </section>
</template>

<style scoped>
.popular__tabs {
    margin-top: var(--sp-24);
}

.popular__grid--vehicle {
    margin-top: var(--sp-24);
}

.popular__notice {
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: var(--sp-24);
}

.popular__notice-text {
    flex: 1;
    min-width: 0;
}

.popular__more {
    margin-top: var(--sp-32);
}

.recent {
    margin-top: var(--sp-64);
}

.recent__grid {
    margin-top: var(--sp-24);
}

/* One row of the recent wheels: four on a desktop, three on a tablet, never a ragged second row. */
.recent__grid > :nth-child(n + 5) {
    display: none;
}

@media (min-width: 768px) and (max-width: 1023px) {
    .popular__grid > :nth-child(n + 7),
    .recent__grid > :nth-child(n + 4) {
        display: none;
    }
}
</style>
