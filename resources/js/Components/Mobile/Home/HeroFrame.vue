<script setup lang="ts">
/**
 * The hero frame on a phone: the admin-chosen wheel as a cut-out standing on a contact shadow
 * in a pool of studio light, two spec callouts pointing at it, the remaining two values in one
 * line beneath, and the caption that is the link to the product. The values are the product's
 * own; the picture may be symbolic while the supplier's packshot is missing, and says so.
 *
 * Below the fold on the phone, so lazy; the h1 is the LCP. The leader lines draw once the image
 * has painted (SpecCallout keys on `.frame.is-ready`). No sweep and no roll on a phone.
 */

import { Link } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import Picture from '../../Ui/Picture.vue'
import SpecCallout from '../../Ui/SpecCallout.vue'
import WheelOutline from '../../Ui/WheelOutline.vue'
import { euro } from '../../../format'
import manifest from '../../../images/hero-wheel.json'
import type { HeroProduct } from '../../../types/pages'

const props = defineProps<{ product: HeroProduct }>()

const ready = ref(false)
const failed = ref(false)

const href = computed(() => `/felgen/${props.product.slug}`)
const alt = computed(() => `${props.product.brand} ${props.product.name} in ${props.product.finish}, Ansicht von vorn`)
const perWheel = computed(() => euro(Math.round(props.product.fromPriceCents / 4)))

/* The two callouts the phone shows; the other two values read as one line under the frame. */
const callouts = computed(() => {
    const byLabel = new Map(props.product.spec.map((s) => [s.label, s.value]))

    return {
        size: byLabel.get('Felgengröße') ?? '',
        et: byLabel.get('Einpresstiefe') ?? '',
        rest: props.product.spec.filter((s) => s.label !== 'Felgengröße' && s.label !== 'Einpresstiefe'),
    }
})

const SHORT: Record<string, string> = { Lochkreis: 'LK', Mittenlochbohrung: 'MLB' }
</script>

<template>
    <div class="hero-mobile">
        <Link :href="href" class="frame hero-frame" :class="{ 'is-ready': ready }" :aria-label="`Zur Felge ${product.brand} ${product.name}`" prefetch>
            <span class="hero-studio" aria-hidden="true" />
            <span class="hero-contact" aria-hidden="true" />

            <!-- `error` does not bubble, but it does pass this wrapper in the capture phase. -->
            <span v-if="!failed" class="hero-frame__wheel" @error.capture="failed = true">
                <Picture :image="manifest" :alt="alt" sizes="70vw" @loaded="ready = true" />
            </span>
            <span v-else class="hero-frame__outline" aria-hidden="true">
                <WheelOutline :spokes="5" />
            </span>

            <SpecCallout v-if="callouts.size" label="Felgengröße" :value="callouts.size" :x="2" :y="6" :tx="33" :ty="44" />
            <SpecCallout v-if="callouts.et" label="Einpresstiefe" :value="callouts.et" :x="62" :y="8" :tx="55" :ty="46" />
        </Link>

        <p v-if="callouts.rest.length" class="small num muted hero-mobile__rest">
            <template v-for="(s, i) in callouts.rest" :key="s.label">{{ i > 0 ? ' · ' : '' }}{{ SHORT[s.label] ?? s.label }} {{ s.value }}</template>
        </p>

        <Link :href="href" class="hero-mobile__caption" prefetch>
            <span class="small hero-mobile__name">{{ product.brand }} {{ product.name }} · {{ product.finish }}</span>
            <span class="small num muted">ab {{ perWheel }} · pro Felge</span>
        </Link>
        <p v-if="product.symbolic" class="micro quiet">Symbolfoto – die Werte sind die dieser Felge.</p>
    </div>
</template>

<style scoped>
.hero-mobile {
    display: grid;
    gap: var(--sp-8);
}

.hero-frame {
    position: relative;
    display: block;
    aspect-ratio: 7 / 6;
    overflow: hidden;
    border-radius: var(--r-tile);
    text-decoration: none;
}

.hero-studio {
    position: absolute;
    inset: 0;
    z-index: var(--z-base);
    /* stylelint-disable-next-line declaration-property-value-disallowed-list */
    background-image: radial-gradient(60% 50% at 50% 62%, var(--c-surface) 0%, rgb(255 255 255 / 0) 100%);
}

/* The ellipse the wheel stands on: the same ink the scrims use, at 28 % and fading. */
.hero-contact {
    position: absolute;
    left: 50%;
    top: 83%;
    z-index: var(--z-base);
    width: 55%;
    height: 6%;
    transform: translate(-50%, -50%);
    /* stylelint-disable-next-line declaration-property-value-disallowed-list */
    background-image: radial-gradient(50% 50% at 50% 50%, rgb(11 15 20 / 0.28) 0%, rgb(11 15 20 / 0.12) 45%, rgb(11 15 20 / 0) 72%);
}

.hero-frame__wheel,
.hero-frame__outline {
    position: absolute;
    left: 50%;
    bottom: 16%;
    z-index: var(--z-raised);
    width: 70%;
    transform: translateX(-50%);
}

/* The cut-out has its own alpha; the placeholder behind it must not paint a square. */
.hero-frame__wheel :deep(.picture) {
    background-image: none;
}

.hero-frame__wheel :deep(img) {
    height: auto;
    object-fit: contain;
}

.hero-frame__outline {
    width: 60%;
    color: var(--c-ink-3);
}

.hero-mobile__rest {
    padding-inline: var(--sp-4);
}

.hero-mobile__caption {
    display: grid;
    gap: var(--sp-4);
    min-height: 44px;
    padding-inline: var(--sp-4);
    color: var(--c-ink);
    text-decoration: none;
}

.hero-mobile__name {
    font-weight: 500;
}

@media (hover: hover) and (pointer: fine) {
    .hero-mobile__caption:hover .hero-mobile__name {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}
</style>
