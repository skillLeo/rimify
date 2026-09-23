<script setup lang="ts">
/**
 * The hero frame on a phone: the same photograph and the same anchors as the desktop stage
 * (`calloutSlots.ts`, docs/phase0/ACCURACY.md §4) — the product's shadowless `bare` cut-out on one
 * CSS contact shadow in a pool of studio light, and two leaders: the Lochkreis, a dashed circle
 * through the bolt-hole centres, and the KBA number at the stamp (only when the photographed stamp
 * is this configuration's number). Under the frame: the spec line, the caption that is the link to
 * the product, the line saying what the picture shows, and the Demodaten line.
 *
 * With no photograph of the product the frame draws the outline and names no product: no brand,
 * no model, no price, no link, no leader — the spec line and one sentence saying what the drawing
 * is. The bundled stand-in photograph is retired.
 *
 * On a tall phone the frame is in the first viewport and its picture is the LCP, so it loads
 * eagerly (app.blade.php preloads it with the same `sizes`). Once, on load, the wheel rolls in and
 * the leaders draw after it; the resting frame is the default, so without JavaScript and under
 * reduced motion everything simply stands there.
 */

import { Link, usePage } from '@inertiajs/vue3'
import { computed, onMounted, ref } from 'vue'
import Picture from '../../Ui/Picture.vue'
import SpecCallout from '../../Ui/SpecCallout.vue'
import WheelOutline from '../../Ui/WheelOutline.vue'
import { euro } from '../../../format'
import type { HeroProduct } from '../../../types/pages'
import { frameStyle, HERO_SIZES_PHONE, heroScene, PHONE_LAYOUT, rollStyle } from './calloutSlots'

const props = defineProps<{ product: HeroProduct }>()

const page = usePage<{ demo?: boolean }>()

const CAPTION = 'Abbildung zeigt das Design; Werte der gezeigten Ausführung.'
const SYMBOLIC = 'Symbolbild – Werte einer Beispielkonfiguration'
const DEMO = 'Demodaten – Beispielsortiment; Preise und Bestände sind Beispielwerte.'

const scene = computed(() => heroScene(props.product, PHONE_LAYOUT))

/* The photograph failed to load: the outline, and no leaders — they would point at nothing. */
const failed = ref(false)
const photo = computed(() => (failed.value ? null : scene.value.picture))
const callouts = computed(() => (photo.value === null ? [] : scene.value.callouts))
/* The callouts are drawing, hidden from assistive technology; the stamp's number is read with the spec line. */
const kba = computed(() => callouts.value.find((c) => c.key === 'kba') ?? null)
/* The product is named, and linked, only over its own photograph: never under the outline. */
const named = computed(() => !props.product.symbolic && photo.value !== null)

const href = computed(() => `/felgen/${props.product.slug}`)
const alt = computed(() => `${props.product.brand} ${props.product.name} in ${props.product.finish}, Ansicht von vorn`)
const perWheel = computed(() => euro(Math.round(props.product.fromPriceCents / 4)))

const frameVars = computed(() => ({ ...frameStyle(PHONE_LAYOUT), '--callout-delay': scene.value.roll === null ? '0ms' : 'var(--d-roll)' }))
const pictureStyle = computed(() => rollStyle(scene.value))

const root = ref<HTMLElement | null>(null)

onMounted(() => {
    // A cached photograph that is broken fired `error` before hydration; it will not fire again.
    const img = root.value?.querySelector('img') ?? null

    if (img !== null && img.complete && img.getAttribute('src') !== null && img.naturalWidth === 0) {
        failed.value = true
    }
})
</script>

<template>
    <div ref="root" class="hero-mobile">
        <component
            :is="named ? Link : 'div'"
            :href="named ? href : undefined"
            class="frame hero-frame"
            :style="frameVars"
            :prefetch="named ? true : undefined"
        >
            <span class="hero-studio" aria-hidden="true" />

            <!-- The link's name is the picture's alt: no aria-label, so the visible text is part of the
                 name. `error` does not bubble, but it does pass this wrapper in the capture phase. -->
            <span
                v-if="photo"
                class="hero-frame__roll"
                :class="{ 'hero-frame__roll--rolling': scene.roll !== null }"
                :style="pictureStyle"
                @error.capture="failed = true"
            >
                <span v-if="scene.shadow" class="hero-contact" aria-hidden="true" />
                <span class="hero-frame__spin">
                    <Picture :image="photo" :alt="alt" :sizes="HERO_SIZES_PHONE" eager />
                </span>
            </span>
            <span v-else class="hero-frame__outline" aria-hidden="true">
                <WheelOutline :bolts="product.config.boltHoles" size="82%" />
            </span>

            <SpecCallout
                v-for="c in callouts"
                :key="c.key"
                :data-callout="c.key"
                :label="c.label"
                :value="c.value"
                :note="c.note"
                :side="c.side"
                :x="c.x"
                :y="c.y"
                :tx="c.tx"
                :ty="c.ty"
                :elbow="c.elbow"
                :ring="c.ring"
                :ratio="PHONE_LAYOUT.ratio"
                :weight="PHONE_LAYOUT.weight"
            />
        </component>

        <p class="small num muted hero-mobile__spec">
            {{ product.facts.specLine }}<span v-if="kba" class="visually-hidden"> · {{ kba.label }} {{ kba.value }}</span>
        </p>

        <Link v-if="named" :href="href" class="hero-mobile__caption" prefetch>
            <span class="small hero-mobile__name">{{ product.brand }} {{ product.name }} · {{ product.finish }}</span>
            <span class="small num muted">ab {{ perWheel }} · pro Felge</span>
        </Link>
        <p v-if="photo" class="micro quiet hero-mobile__shown">{{ CAPTION }}</p>
        <p v-else class="micro quiet hero-mobile__symbolic">{{ SYMBOLIC }}</p>
        <!-- Seeded demonstration rows: the page says so, once (OVERHAUL.md §2). -->
        <p v-if="page.props.demo" class="micro quiet demo-note">{{ DEMO }}</p>
    </div>
</template>

<style scoped>
.hero-mobile {
    display: grid;
    gap: var(--sp-8);
}

/* The layout's ratio (7 : 6); the leaders (`--z-base`) over the picture, the boxes (`--z-raised`) over them. */
.hero-frame {
    --callout-ink: var(--c-ink);

    position: relative;
    display: block;
    aspect-ratio: var(--frame-ratio);
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

/* The square picture's box, where the layout puts it; the roll moves the box, the turn its content. */
.hero-frame__roll,
.hero-frame__outline {
    position: absolute;
    top: var(--pic-top);
    left: var(--pic-left);
    z-index: var(--z-base);
    width: var(--pic-size);
    aspect-ratio: 1;
}

/* About the wheel's own axle (the `centre` anchor), never the picture's middle. */
.hero-frame__spin {
    position: absolute;
    inset: 0;
    transform-origin: var(--roll-origin, 50% 50%);
}

.hero-frame__spin :deep(.picture) {
    width: 100%;
    height: 100%;
}

.hero-frame__outline {
    display: flex;
    color: var(--c-ink-3);
}

/* The one contact shadow, under `bare` only, centred on the bottom of the rim; it travels, never turns. */
.hero-contact {
    position: absolute;
    top: var(--contact-y);
    left: var(--contact-x);
    width: var(--contact-w);
    aspect-ratio: 78 / 8;
    transform: translate(-50%, -50%);
    /* stylelint-disable-next-line declaration-property-value-disallowed-list */
    background-image: radial-gradient(50% 50% at 50% 50%, rgb(11 15 20 / 0.28) 0%, rgb(11 15 20 / 0.12) 45%, rgb(11 15 20 / 0) 72%);
}

/* The roll-in, as on the desktop: travel and turn on one curve, the turn = distance / radius. */
.hero-frame__roll--rolling {
    animation: hero-travel var(--d-roll) var(--ease-roll) both;
}

.hero-frame__roll--rolling .hero-frame__spin {
    animation: hero-turn var(--d-roll) var(--ease-roll) both;
}

/* In from just past the frame's right edge (the frame clips), fading in as it enters. */
@keyframes hero-travel {
    from {
        transform: translateX(var(--roll-distance));
        opacity: 0;
    }

    15% {
        opacity: 1;
    }
}

@keyframes hero-turn {
    from {
        transform: rotate(var(--roll-angle));
    }
}

.hero-mobile__spec,
.hero-mobile__shown,
.hero-mobile__symbolic,
.demo-note {
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

@media (prefers-reduced-motion: reduce) {
    .hero-frame__roll--rolling,
    .hero-frame__roll--rolling .hero-frame__spin {
        animation: none;
    }
}
</style>
