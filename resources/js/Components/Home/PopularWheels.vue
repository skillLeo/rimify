<script setup lang="ts">
/**
 * H5 · the shelf — „Meistgekaufte Felgen“, or before the first sale „Neu im Shop“ (the client's #5, the operator's
 * brief „THE 34“) — and H5b · Zuletzt angesehen.
 *
 * Up to eight real wheels under one heading the server chose from its data: what sold in the last 90 days, by paid
 * order lines, or the newest in the shop — never a bestseller claim without a sale behind it, never „beliebt“
 * (ACCURACY.md D7). With a vehicle chosen the cards are that car's answer, every tile carries its verdict and the
 * button the count. While fewer than four wheels are on sale the server sends no shelf (`popular` null): the section is
 * absent, not empty — only the recently viewed may still stand.
 *
 * Never a rating, never a "Details" button, never a price without its legal line — the tile itself guarantees that
 * (docs/phase0/ADDENDUM.md §D2).
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import ProductTile from '../Ui/ProductTile.vue'
import { decimal } from '../../format'
import type { StartseiteProps } from '../../types/pages'
import type { ProductCardProp, VehicleProp } from '../../types/rimify'

const props = defineProps<{
    popular: StartseiteProps['popular']
    recentlyViewed: ProductCardProp[]
    vehicle: VehicleProp | null
}>()

/* The button says what happens: the count when the listing has one, never a vague "mehr". */
const buttonLabel = computed(() => {
    if (props.vehicle === null) {
        return 'Alle Felgen ansehen'
    }

    const total = props.popular?.total ?? null

    if (total === null) {
        return 'Passende Felgen anzeigen'
    }

    return total === 1 ? '1 passende Felge anzeigen' : `${decimal(total, 0)} passende Felgen anzeigen`
})

function keyOf(card: ProductCardProp): string {
    return `${card.modelId}-${card.finishId}`
}
</script>

<template>
    <section id="h5" class="popular" data-section="H5" :data-ranking="popular?.ranking" :aria-labelledby="popular ? 'h5-heading' : 'h5b-heading'">
        <div class="container">
            <template v-if="popular">
                <h2 id="h5-heading" class="h2 popular__title">{{ popular.title }}</h2>
                <p v-if="vehicle" class="body popular__for">Passend für {{ vehicle.short }}</p>

                <div v-if="popular.cards.length > 0" class="tile-grid popular__grid">
                    <ProductTile v-for="card in popular.cards" :key="keyOf(card)" :card="card" :vehicle="vehicle" compare />
                </div>
                <div v-else class="empty popular__none">
                    <p class="empty__title">Für dein Fahrzeug ist hier gerade keine dabei.</p>
                    <p class="empty__text">In der Felgenliste siehst du alles, was das Gutachten für dein Fahrzeug erlaubt.</p>
                </div>

                <div class="popular__more">
                    <Link href="/felgen" class="btn btn--secondary" prefetch>{{ buttonLabel }}</Link>
                </div>
            </template>

            <section v-if="recentlyViewed.length > 0" id="h5b" class="recent" :class="{ 'recent--alone': !popular }" data-section="H5b" aria-labelledby="h5b-heading">
                <h2 id="h5b-heading" class="h2">Zuletzt angesehen</h2>
                <div class="tile-grid recent__grid">
                    <ProductTile v-for="card in recentlyViewed" :key="keyOf(card)" :card="card" :vehicle="vehicle" />
                </div>
            </section>
        </div>
    </section>
</template>

<style scoped>
.popular__for {
    margin-top: var(--sp-8);
    color: var(--c-ink-2);
}

.popular__grid,
.popular__none {
    margin-top: var(--sp-24);
}

.popular__more {
    margin-top: var(--sp-32);
}

.recent {
    margin-top: var(--sp-64);
}

.recent--alone {
    margin-top: 0;
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
