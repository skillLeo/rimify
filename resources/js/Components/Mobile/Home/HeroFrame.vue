<script setup lang="ts">
/**
 * The hero frame on a phone: the admin-chosen wheel as a cut-out standing on a contact shadow
 * in a pool of studio light, two spec callouts pointing at it, the remaining two values in one
 * line beneath, and the caption that is the link to the product.
 *
 * While the picture is symbolic — a free-licence photograph standing in for the supplier's
 * packshot — the frame names no product: no brand, no model, no price, no link. The values are
 * still real (they are the configuration's), and one line says what the picture is.
 *
 * On a tall phone the frame is in the first viewport and its picture is the LCP, so it loads
 * eagerly (app.blade.php preloads it). The leader lines draw once the image has painted
 * (SpecCallout keys on `.frame.is-ready`). No sweep and no roll on a phone.
 */

import { Link, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import Picture, { type ImageManifest } from '../../Ui/Picture.vue'
import SpecCallout from '../../Ui/SpecCallout.vue'
import WheelOutline from '../../Ui/WheelOutline.vue'
import { euro } from '../../../format'
import heroWheel from '../../../images/hero-wheel.json'
import type { HeroProduct } from '../../../types/pages'
import { assignSlots, FRAME_SLOTS, phoneTargets, SHORT_LABEL, type SlotKey, type Targets } from './calloutSlots'

interface CutoutManifest extends ImageManifest {
    targets?: Targets
}

const props = defineProps<{ product: HeroProduct }>()

const page = usePage<{ demo?: boolean }>()

/* The finish's own cut-out when the catalogue has one; otherwise the bundled stand-in. */
const manifest = computed<CutoutManifest>(
    () => (props.product.imageManifest as CutoutManifest | null | undefined) ?? (heroWheel as CutoutManifest),
)

/* The wheel is 70 % of the frame, the frame the container: 70vw less 70 % of the two gutters. */
const HERO_SIZES = '(min-width: 1280px) 540px, (min-width: 1024px) 40vw, (min-width: 768px) 336px, calc(70vw - 22px)'

const ready = ref(false)
const failed = ref(false)

const href = computed(() => `/felgen/${props.product.slug}`)
const alt = computed(() =>
    props.product.symbolic ? 'Symbolbild einer Felge, Ansicht von vorn' : `${props.product.brand} ${props.product.name} in ${props.product.finish}, Ansicht von vorn`
)
const perWheel = computed(() => euro(Math.round(props.product.fromPriceCents / 4)))

/* Where the two boxes sit in the frame (§H2, 390); the line's target comes from the manifest. */
const BOXES: Readonly<Record<SlotKey, { x: number; y: number } | null>> = {
    widthDiameter: { x: 2, y: 6 },
    offset: { x: 62, y: 8 },
    boltCircle: null,
    centreBore: null,
}

const targets = computed(() => phoneTargets(manifest.value.targets))

/* The two callouts the phone shows; the other two values read as one line under the frame. */
const slots = computed(() => assignSlots(props.product.spec))
const callouts = computed(() =>
    slots.value.flatMap((s) => {
        const box = BOXES[s.key]

        return box && FRAME_SLOTS.includes(s.key) ? [{ ...s, ...box, ...targets.value[s.key] }] : []
    })
)
const rest = computed(() => slots.value.filter((s) => !FRAME_SLOTS.includes(s.key)))

/* `LK 5 × 112 · MLB 66,6 mm`: a value that already starts with its short label is not doubled. */
const restLine = computed(() =>
    rest.value.map((s) => (s.value.startsWith(`${SHORT_LABEL[s.key]} `) ? s.value : `${SHORT_LABEL[s.key]} ${s.value}`)).join(' · ')
)
</script>

<template>
    <div class="hero-mobile">
        <component
            :is="product.symbolic ? 'div' : Link"
            :href="product.symbolic ? undefined : href"
            class="frame hero-frame"
            :class="{ 'is-ready': ready }"
            :prefetch="product.symbolic ? undefined : true"
        >
            <span class="hero-studio" aria-hidden="true" />
            <span class="hero-contact" aria-hidden="true" />

            <!-- The link's name is the picture's alt plus the callouts: no aria-label, so the visible
                 text is part of the name. `error` does not bubble, but it does pass this wrapper in
                 the capture phase. The sizes match the hero preload in app.blade.php. -->
            <span v-if="!failed" class="hero-frame__wheel" @error.capture="failed = true">
                <Picture :image="manifest" :alt="alt" :sizes="HERO_SIZES" eager @loaded="ready = true" />
            </span>
            <span v-else class="hero-frame__outline" aria-hidden="true">
                <WheelOutline :bolts="product.config.boltHoles" />
            </span>

            <SpecCallout v-for="c in callouts" :key="c.key" :label="c.label" :value="c.value" :x="c.x" :y="c.y" :tx="c.tx" :ty="c.ty" />
        </component>

        <p v-if="rest.length" class="small num muted hero-mobile__rest">{{ restLine }}</p>

        <Link v-if="!product.symbolic" :href="href" class="hero-mobile__caption" prefetch>
            <span class="small hero-mobile__name">{{ product.brand }} {{ product.name }} · {{ product.finish }}</span>
            <span class="small num muted">ab {{ perWheel }} · pro Felge</span>
        </Link>
        <p v-else class="micro quiet hero-mobile__symbolic">Symbolbild – Werte einer Beispielkonfiguration</p>
        <!-- Seeded demonstration rows: the page says so, once (OVERHAUL.md §2). -->
        <p v-if="page.props.demo" class="micro quiet demo-note">Demodaten – Beispielsortiment mit Fotos unter freier Lizenz.</p>
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

.hero-frame__wheel :deep(img) {
    height: auto;
    object-fit: contain;
}

.hero-frame__outline {
    width: 60%;
    color: var(--c-ink-3);
}

/* The callouts are later in the DOM than the wheel and share its layer: they paint over it. */
.hero-frame :deep(.callout-anchor) {
    z-index: var(--z-raised);
}

.hero-mobile__rest,
.hero-mobile__symbolic {
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
