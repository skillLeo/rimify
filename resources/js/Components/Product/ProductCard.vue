<script setup lang="ts">
/**
 * The product card, in exactly the order the design system fixes: well, brand, model, finish,
 * rating, sizes, divider, price, action — and the fitment marker directly above the action.
 *
 * The fitment line is the single most valuable line on the card, and it is rendered ONLY when a
 * vehicle is chosen. `Passend` on its own means nothing; a card that claims compatibility without
 * naming a car is the exact failure this product exists to prevent.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from '../Art/Icon.vue'
import Wheel from '../Art/Wheel.vue'
import type { ProductCardProp, VehicleProp } from '../../types/rimify'

const props = withDefaults(
    defineProps<{
        card: ProductCardProp
        /** Passed rather than read from shared props so the card stays usable in isolation. */
        vehicle?: VehicleProp | null
    }>(),
    { vehicle: null }
)

const href = computed(() => `/felgen/${props.card.slug}`)

const stock = computed(() =>
    props.card.inStock
        ? { label: 'Auf Lager', cls: 'tag--ok' }
        : { label: 'Ausverkauft', cls: 'tag--danger' }
)

/** With a vehicle: named, and honest about whether the papers need an entry. */
const fitment = computed(() => {
    if (props.vehicle === null || props.card.fitment === null) {
        return null
    }

    return props.card.fitment.requiresEntry
        ? { label: `Mit Auflagen für ${props.vehicle.short}`, cls: 'is-warn', icon: 'warning' as const }
        : { label: `Passend für ${props.vehicle.short}`, cls: 'is-ok', icon: 'check' as const }
})
</script>

<template>
    <article class="pcard">
        <div class="well">
            <span class="well__tag tag" :class="stock.cls">{{ stock.label }}</span>
            <span class="well__shadow" />
            <span class="well__art">
                <Wheel :spokes="card.art.spokes" :finish="card.art.finish" :size="320" />
            </span>
        </div>

        <span class="micro pcard__brand">{{ card.brandName }}</span>
        <h3 class="pcard__model">
            <Link :href="href" class="pcard__link">{{ card.modelName }}</Link>
        </h3>
        <p class="pcard__finish">{{ card.finishName }}</p>

        <p v-if="card.ratingLabel" class="stars pcard__rating">
            <span class="stars__glyph" aria-hidden="true">★</span>
            <span class="tabular">{{ card.ratingLabel }}</span>
        </p>

        <div v-if="card.diameters.length" class="pcard__sizes">
            <span class="micro">Verfügbare Größen</span>
            <div class="chip-row pcard__chips">
                <span v-for="size in card.diameters" :key="size" class="chip chip--static">{{ size }}</span>
            </div>
        </div>

        <hr class="pcard__divider" />

        <div class="pcard__price">
            <span class="micro">ab UVP</span>
            <p class="price">{{ card.fromPrice }}</p>
            <p class="price-note">für 4 Felgen</p>
        </div>

        <p v-if="fitment" class="pcard__fitment" :class="fitment.cls">
            <Icon :name="fitment.icon" :size="20" />
            {{ fitment.label }}
        </p>

        <Link
            :href="href"
            class="btn btn--primary btn--block pcard__action"
            :class="{ 'btn--is-disabled': !card.inStock }"
        >
            Kompatibilität prüfen
        </Link>
    </article>
</template>

<style scoped>
.pcard__link {
    color: inherit;
    text-decoration: none;
}

/* The whole card lifts and the wheel scales; the link itself must not also move. */
.pcard__link::after {
    content: '';
    position: absolute;
    inset: 0;
}

.pcard {
    position: relative;
}

.pcard__chips {
    margin-top: 6px;
}

/* A size shown on a card is information, not a control — the choosing happens on the product
   page, where the price and the verdict can change with it. */
.chip--static {
    cursor: default;
    min-height: 32px;
    min-width: 40px;
}

.pcard__fitment.is-ok {
    color: var(--blue);
}

.pcard__fitment.is-warn {
    color: var(--warn);
}

.pcard__action {
    position: relative;
    z-index: 1;
}
</style>
