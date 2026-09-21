<script setup lang="ts">
/**
 * The product tile: one link, one image, the same lines on every tile in a grid — brand, model,
 * finish, the sizes in stock, the price per wheel with its legal note. With a vehicle chosen, the
 * engine's verdict sits in the image corner, and a `CONDITIONAL` verdict brings its Auflagen with
 * it as sentences (R-15). Without a vehicle, no compatibility claim is made at all.
 *
 * The photograph comes from the catalogue. When there is none, or it fails to load, a flat
 * technical drawing stands in and says so — never a stock photo, never a drawing dressed as one.
 */

import { Link } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import VerdictBadge from './VerdictBadge.vue'
import WheelOutline from './WheelOutline.vue'
import { euro, zoll } from '../../format'
import type { ProductCardProp, VehicleProp, VerdictStatus } from '../../types/rimify'

const props = withDefaults(
    defineProps<{
        card: ProductCardProp
        vehicle?: VehicleProp | null
        /** Tiles below the fold load lazily; the first row does not. */
        eager?: boolean
        compare?: boolean
    }>(),
    { vehicle: null, eager: false, compare: false }
)

const href = computed(() => `/felgen/${props.card.slug}`)

const failed = ref(false)
watch(
    () => props.card.image,
    () => {
        failed.value = false
    }
)
const photo = computed(() => (props.card.image && !failed.value ? props.card.image : null))

const verdict = computed<{ status: VerdictStatus; conditions: string[] } | null>(() => {
    if (props.vehicle === null || props.card.fitment === null) {
        return null
    }

    const { status = 'PERMITTED', requiresEntry, conditions = [] } = props.card.fitment
    const effective: VerdictStatus = status === 'PERMITTED' && requiresEntry ? 'CONDITIONAL' : status

    return { status: effective, conditions: effective === 'CONDITIONAL' ? conditions : [] }
})

const sizes = computed(() => (props.card.diameters.length ? zoll(props.card.diameters) : ''))

/* A per-wheel price: the catalogue prices a set of four, the tile says what one costs. */
const perWheel = computed(() => euro(Math.round(props.card.fromPriceCents / 4)))
</script>

<template>
    <article class="tile">
        <div class="tile__media">
            <img
                v-if="photo"
                :src="photo"
                :alt="`${card.brandName} ${card.modelName} in ${card.finishName}`"
                width="800"
                height="800"
                :loading="eager ? 'eager' : 'lazy'"
                decoding="async"
                @error="failed = true"
            />
            <!-- Until the packshot exists the drawing stands alone; a caption would make the
                 missing photograph the tile's message. -->
            <WheelOutline v-else :spokes="card.art.spokes" />
            <span v-if="!photo" class="visually-hidden">Noch kein Foto</span>

            <VerdictBadge v-if="verdict" :status="verdict.status" class="tile__badge" />

            <label v-if="compare" class="tile__compare">
                <input type="checkbox" name="vergleich" :value="card.modelId" />
                Vergleichen
            </label>
        </div>

        <span class="tile__brand">{{ card.brandName }}</span>
        <h3 class="tile__title">
            <Link :href="href" class="tile__name" prefetch>{{ card.modelName }}</Link>
        </h3>
        <span class="tile__finish">{{ card.finishName }}</span>
        <span v-if="sizes" class="tile__sizes">{{ sizes }}</span>

        <p class="tile__price">ab {{ perWheel }} <small>pro Felge</small></p>
        <span class="tile__legal">inkl. MwSt., zzgl. Versand</span>

        <ul v-if="verdict && verdict.conditions.length" class="tile__conditions">
            <li v-for="condition in verdict.conditions" :key="condition">{{ condition }}</li>
        </ul>

        <span v-if="!card.inStock" class="stock stock--out">Ausverkauft</span>
    </article>
</template>

<style scoped>
.tile__title {
    font-size: inherit;
    line-height: inherit;
    font-weight: inherit;
}

.tile__media {
    display: grid;
}

.tile__pending {
    position: absolute;
    left: var(--sp-12);
    bottom: var(--sp-8);
    color: var(--c-ink-3);
}

.tile__conditions {
    margin-top: var(--sp-4);
    padding-left: var(--sp-16);
    list-style: disc;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}
</style>
