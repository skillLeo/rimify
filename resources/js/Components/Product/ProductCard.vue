<script setup lang="ts">
/**
 * The product card. Every card in a listing renders exactly these fields, in this order: frame,
 * brand, model, finish, rating, sizes, price with its legal note, fitment line, action.
 *
 * Two of those are not negotiable.
 *
 * The price carries `inkl. MwSt., zzgl. Versand` wherever it appears — the Preisangabenverordnung
 * requires it next to the price, not once in a footer.
 *
 * The fitment line renders ONLY when a vehicle is chosen, and it names the car. "Passend" on its
 * own means nothing; a card that claims compatibility without naming a vehicle is the exact
 * failure this product exists to prevent.
 *
 * The card is a size container: two cards side by side on a phone are about 170px wide each, and
 * the card tightens itself for that width rather than waiting for a viewport breakpoint.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from '../Art/Icon.vue'
import ProductPhoto from './ProductPhoto.vue'
import type { ProductCardProp, VehicleProp } from '../../types/rimify'

const props = withDefaults(
    defineProps<{
        card: ProductCardProp
        /** Passed rather than read from shared props, so the card stays usable in isolation. */
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

/**
 * With a vehicle: named, and honest. The engine's status decides the line; an entry requirement or
 * an Auflage makes it "Mit Auflagen", and the Auflagen travel with it as full sentences (R-15).
 * A card whose status is not positive makes no positive claim — UNKNOWN is not "Passend" (R-07).
 */
const fitment = computed(() => {
    if (props.vehicle === null || props.card.fitment === null) {
        return null
    }

    const { status = 'PERMITTED', requiresEntry, conditions = [] } = props.card.fitment

    if (status === 'NOT_PERMITTED') {
        return { label: `Nicht freigegeben für ${props.vehicle.short}`, cls: 'is-bad', icon: 'close' as const, conditions: [] }
    }

    if (status === 'UNKNOWN') {
        return { label: `Für ${props.vehicle.short} nicht geprüft`, cls: 'is-unknown', icon: 'info' as const, conditions: [] }
    }

    if (status === 'CONDITIONAL' || requiresEntry) {
        return { label: `Mit Auflagen für ${props.vehicle.short}`, cls: 'is-warn', icon: 'warning' as const, conditions }
    }

    return { label: `Passend für ${props.vehicle.short}`, cls: 'is-ok', icon: 'check' as const, conditions: [] }
})

/*
 * A rating renders only when somebody has actually rated it: "(0 Bewertungen)" advertises that
 * nobody has bought this. It is set compactly — "4,8 (555)" — with the full wording for screen
 * readers, so it never wraps inside a narrow card.
 */
const rating = computed(() => {
    if (props.card.rating === null || props.card.ratingCount <= 0) {
        return null
    }

    const value = props.card.rating.toFixed(1).replace('.', ',')

    return {
        short: `${value} (${props.card.ratingCount})`,
        spoken: `${value} von 5 Sternen, ${props.card.ratingCount} Bewertungen`,
    }
})
</script>

<template>
    <article class="pcard">
        <div class="well">
            <span class="well__tag tag" :class="stock.cls">{{ stock.label }}</span>
            <ProductPhoto :spokes="card.art.spokes" :finish="card.art.finish" :size="320" />
        </div>

        <span class="micro pcard__brand">{{ card.brandName }}</span>
        <h3 class="pcard__model">
            <Link :href="href" class="pcard__link">{{ card.modelName }}</Link>
        </h3>
        <p class="pcard__finish">{{ card.finishName }}</p>

        <p v-if="rating" class="stars pcard__rating">
            <span class="visually-hidden">{{ rating.spoken }}</span>
            <span class="stars__glyph" aria-hidden="true">★</span>
            <span class="tabular" aria-hidden="true">{{ rating.short }}</span>
        </p>

        <div v-if="card.diameters.length" class="pcard__sizes">
            <span class="micro">Größen in Zoll</span>
            <div class="chip-row pcard__chips">
                <span v-for="size in card.diameters" :key="size" class="chip chip--static">
                    {{ size }}
                </span>
            </div>
        </div>

        <hr class="pcard__divider" />

        <div class="pcard__price">
            <p class="price"><span class="pcard__from">ab</span> {{ card.fromPrice }}</p>
            <p class="price-note">für 4 Felgen, inkl. MwSt., zzgl. Versand</p>
        </div>

        <p v-if="fitment" class="pcard__fitment" :class="fitment.cls">
            <Icon :name="fitment.icon" :size="20" />
            {{ fitment.label }}
        </p>
        <!-- An Auflage is never a badge on its own: the sentence renders wherever the badge does. -->
        <ul v-if="fitment && fitment.conditions.length" class="pcard__conditions">
            <li v-for="condition in fitment.conditions" :key="condition">{{ condition }}</li>
        </ul>

        <Link :href="href" class="btn btn--secondary btn--block btn--sm pcard__action">
            Details
        </Link>
    </article>
</template>

<style scoped>
.pcard {
    container-type: inline-size;
}

.pcard__link {
    color: inherit;
    text-decoration: none;
}

/* The whole card is the link target; the button is a second, explicit affordance above it. */
.pcard__link::after {
    content: '';
    position: absolute;
    inset: 0;
}

.pcard__chips {
    margin-top: var(--space-2);
}

.pcard__from {
    font-family: var(--sans);
    font-size: var(--text-small);
    font-weight: 400;
    color: var(--ink2);
}

.pcard__fitment.is-ok {
    color: var(--ok);
}

.pcard__fitment.is-warn {
    color: var(--warn);
}

.pcard__fitment.is-bad {
    color: var(--danger);
}

.pcard__fitment.is-unknown {
    color: var(--ink2);
}

.pcard__conditions {
    margin: var(--space-1) 0 0;
    padding-left: var(--space-4);
    font-size: var(--text-small);
    color: var(--ink2);
}

.pcard__action {
    white-space: nowrap;
}

/* Two-up on a phone: tighter padding and a smaller model name, same fields in the same order. */
@container (max-width: 220px) {
    .pcard__model {
        font-size: var(--text-body);
    }

    .pcard__divider {
        margin-block: var(--space-3);
    }
}
</style>
