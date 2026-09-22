<script setup lang="ts">
/**
 * The product card, v2 (docs/design/sections/home-overhaul.md §1): one card everywhere a wheel is
 * listed. It shows the wheel as an object, names it, prices it per wheel with its legal line,
 * states the verdict when a vehicle is known, and offers one action — *Details ansehen*, the
 * card's only link, stretched over the whole card. The compare checkbox sits after it in the DOM,
 * above the stretched link, so a keyboard reaches the CTA and then the checkbox.
 *
 * With a vehicle chosen, the engine's verdict sits in the image corner, and a `CONDITIONAL`
 * verdict brings its Auflagen with it as sentences (R-15). Without a vehicle, no compatibility
 * claim is made at all. A size no document permits on the car is greyed and named as such for
 * assistive technology — never struck.
 *
 * The cut-out comes from the catalogue. When there is none, or it fails to load, the flat
 * technical drawing stands in without a caption — never a stock photo, never a drawing dressed
 * as one — and the card says so in `data-fallback` for the page gate that counts them.
 */

import { Link } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import Picture from './Picture.vue'
import VerdictBadge from './VerdictBadge.vue'
import WheelOutline from './WheelOutline.vue'
import { toast } from '../Chrome/toast'
import { euro, NNBSP, zoll } from '../../format'
import { COMPARE_CAP_TEXT, useCompare, type CompareEntry } from '../../stores/compare'
import { compareKeyOf, type ProductCardProp, type VehicleProp, type VerdictStatus } from '../../types/rimify'

const props = withDefaults(
    defineProps<{
        card: ProductCardProp
        vehicle?: VehicleProp | null
        /** Tiles below the fold load lazily; the first row does not. */
        eager?: boolean
        /** Render the compare control. The card then reads and writes the compare store. */
        compare?: boolean
        /** How wide the tile is at each width, for `srcset`; the listing passes its own grid. */
        sizes?: string
    }>(),
    {
        vehicle: null,
        eager: false,
        compare: false,
        sizes: '(min-width: 1280px) 306px, (min-width: 1024px) 22vw, (min-width: 768px) 30vw, 62vw',
    }
)

/* The product page opens on this card's finish: one wheel, one answer, one click apart. */
const href = computed(() => `/felgen/${props.card.slug}?ausfuehrung=${props.card.finishId}`)
const fullName = computed(() => `${props.card.brandName} ${props.card.modelName} ${props.card.finishName}`)

/* ── Image ──────────────────────────────────────────────────────────────────── */

const failed = ref(false)
watch(
    () => props.card.image,
    () => {
        failed.value = false
    }
)
const photo = computed(() => (props.card.image && !failed.value ? props.card.image : null))
const alt = computed(() => `${props.card.brandName} ${props.card.modelName} in ${props.card.finishName}, Ansicht von vorn`)

/* ── Verdict ────────────────────────────────────────────────────────────────── */

const verdict = computed<{ status: VerdictStatus; conditions: string[] } | null>(() => {
    if (props.vehicle === null || props.card.fitment === null) {
        return null
    }

    const { status = 'PERMITTED', requiresEntry, conditions = [] } = props.card.fitment
    const effective: VerdictStatus = status === 'PERMITTED' && requiresEntry ? 'CONDITIONAL' : status

    return { status: effective, conditions: effective === 'CONDITIONAL' ? conditions : [] }
})

/* ── Sizes ──────────────────────────────────────────────────────────────────── */

/** With a vehicle and the server's subset, each size knows whether a document permits it. */
const sizedByVehicle = computed(() => props.vehicle !== null && Array.isArray(props.card.diametersFitting))
const sizeList = computed(() => {
    const fitting = new Set(props.card.diametersFitting ?? [])

    return props.card.diameters.map((label) => ({ label, none: sizedByVehicle.value && !fitting.has(label) }))
})
const sizesPlain = computed(() => (props.card.diameters.length ? zoll(props.card.diameters) : ''))

/* A per-wheel price: the catalogue prices a set of four, the tile says what one costs. */
const perWheel = computed(() => euro(Math.round(props.card.fromPriceCents / 4)))

/* ── Compare ────────────────────────────────────────────────────────────────── */

const store = props.compare ? useCompare() : null
const key = computed(() => compareKeyOf(props.card))
const inCompare = computed(() => store?.has(key.value) ?? false)
/** At the cap and not ticked: the input is disabled and the label explains through the toast. */
const capped = computed(() => (store?.isFull ?? false) && !inCompare.value)

function entry(): CompareEntry {
    return {
        modelId: props.card.modelId,
        finishId: props.card.finishId,
        slug: props.card.slug,
        brandName: props.card.brandName,
        modelName: props.card.modelName,
        finishName: props.card.finishName,
        image: props.card.image,
        fromPriceCents: props.card.fromPriceCents,
    }
}

function onCompareChange(event: Event): void {
    const input = event.target as HTMLInputElement

    if (store === null) {
        return
    }

    if (!input.checked) {
        // Unticking is silent: the tray is the feedback.
        store.remove(key.value)

        return
    }

    const result = store.add(entry())

    if (result === 'added') {
        const k = key.value
        toast.show({
            text: `${props.card.brandName} ${props.card.modelName} zum Vergleich hinzugefügt.`,
            action: { label: 'Rückgängig', run: () => store.remove(k) },
        })
    } else if (result === 'full') {
        input.checked = false
        toast.show({ text: COMPARE_CAP_TEXT, icon: 'info' })
    }
}

/** A disabled input fires nothing; the label still tells why. */
function onCompareLabelClick(event: MouseEvent): void {
    if (capped.value) {
        event.preventDefault()
        toast.show({ text: COMPARE_CAP_TEXT, icon: 'info' })
    }
}
</script>

<template>
    <article class="tile" :data-demo="card.isDemo ? 'true' : undefined" :data-fallback="photo ? undefined : 'true'">
        <div class="tile__media" @error.capture="failed = true">
            <Picture v-if="photo" :image="photo" :alt="alt" :sizes="sizes" :eager="eager" class="tile__picture" />
            <!-- Until the cut-out exists the drawing stands alone; a caption would make the
                 missing photograph the tile's message. -->
            <WheelOutline v-else :spokes="card.art.spokes" size="60%" />

            <VerdictBadge v-if="verdict" :status="verdict.status" class="tile__badge" />
        </div>

        <span class="tile__brand">{{ card.brandName }}</span>
        <h3 class="tile__title"><span class="tile__name">{{ card.modelName }}</span></h3>
        <span class="tile__meta">
            <span class="tile__finish">{{ card.finishName }}</span>
            <span v-if="card.diameters.length" class="tile__sep" aria-hidden="true"> · </span>
            <span v-if="sizedByVehicle && card.diameters.length" class="tile__sizes num"><template v-for="(size, i) in sizeList" :key="size.label">{{ i > 0 ? ' · ' : '' }}<span :class="{ 'tile__size--none': size.none }">{{ size.label }}<span v-if="size.none" class="visually-hidden"> (keine Freigabe für dein Fahrzeug)</span></span></template>{{ NNBSP }}Zoll</span>
            <span v-else-if="sizesPlain" class="tile__sizes num">{{ sizesPlain }}</span>
        </span>

        <p class="tile__price">ab {{ perWheel }} <small>pro Felge</small></p>
        <span class="tile__legal">inkl. MwSt., zzgl. Versand</span>

        <ul v-if="verdict && verdict.conditions.length" class="tile__conditions">
            <li v-for="condition in verdict.conditions" :key="condition">{{ condition }}</li>
        </ul>

        <span v-if="!card.inStock" class="stock stock--out">Ausverkauft</span>

        <div class="tile__actions">
            <Link :href="href" class="tile__cta btn btn--primary btn--sm" :aria-label="`${fullName}: Details ansehen`" prefetch>Details ansehen</Link>

            <label v-if="compare" class="tile__compare" :class="{ 'tile__compare--full': capped }" @click="onCompareLabelClick">
                <input
                    type="checkbox"
                    class="tile__compare-input"
                    name="vergleich"
                    :value="key"
                    :checked="inCompare"
                    :disabled="capped"
                    :aria-label="`${fullName} vergleichen`"
                    @change="onCompareChange"
                />
                Vergleichen
            </label>
        </div>
    </article>
</template>

<style scoped>
.tile__title {
    font-size: inherit;
    line-height: inherit;
    font-weight: inherit;
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
