<script setup lang="ts">
/**
 * H7 · Kompletträder — the one dark band on the page, signature moment 3.
 *
 * What a Komplettrad is, in one sentence; the one regulated fact about a tyre, its EU label, from
 * the featured tyre's own record (only with a verified EPREL entry); and a complete wheel that
 * turns with the scroll.
 *
 * The wheel is a real product (the client's #9): the hero's wheel photographed in its other finish, from the cut-out the
 * client gave us the rights to, captioned with its name — „Felge im Bild“, because the band speaks of Kompletträder and
 * the photograph shows the rim. Where no wheel is photographed it is the illustration, and the page says so: the
 * parametric rim with a parametric tyre, rendered offline by scripts/3d/render-komplettrad.mjs — generated, no brand
 * (docs/phase0/ACCURACY.md §3.1). Never a photograph of somebody else's wheel. Neither claims a size: the label beside
 * it is the featured tyre's, not the picture's. No 3D mounts here (nothing ever did: the viewer's `replacePoster` was
 * never switched on); the picture
 * turns 0 → −720° (two full turns) by a CSS `view()` timeline where the browser has one and stands still where it
 * has none — no scroll listener. Under reduced motion nothing turns. No lifestyle photograph beside
 * it (spec H7 "Never"), and no scrim: a scrim would be a second gradient.
 */

import { Link } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import Picture from '../Ui/Picture.vue'
import TyreLabel, { type TyreClass } from '../Ui/TyreLabel.vue'
import WheelOutline from '../Ui/WheelOutline.vue'
import illustration from '../../images/komplettrad-illustration.json'
import { bandWheelAlt, bandWheelCaption, bandWheelStyle } from '../../lib/bandWheel'
import type { BandWheel, EuTyreLabel } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'

const props = withDefaults(
    defineProps<{
        tyre: EuTyreLabel | null
        vehicle: VehicleProp | null
        /** The photographed wheel (#9); null keeps the illustration. */
        wheel?: BandWheel | null
    }>(),
    { wheel: null }
)

const photo = computed(() =>
    props.wheel === null ? null : { image: props.wheel.image, alt: bandWheelAlt(props.wheel), caption: bandWheelCaption(props.wheel), style: bandWheelStyle(props.wheel) }
)

const TYRE_CLASSES: readonly string[] = ['A', 'B', 'C', 'D', 'E']

function isTyreClass(value: string): value is TyreClass {
    return TYRE_CLASSES.includes(value)
}

/* A label with a class the regulation does not know is not shown; it is never "corrected". */
const label = computed(() => {
    const tyre = props.tyre

    if (tyre === null || !isTyreClass(tyre.fuel) || !isTyreClass(tyre.wet)) {
        return null
    }

    return {
        title: tyre.title,
        fuel: tyre.fuel,
        wet: tyre.wet,
        noiseDb: tyre.noiseDb,
        noiseClass: tyre.noiseClass,
        eprelId: tyre.eprelId,
    }
})

/* With a vehicle the listing already knows the car; without one the selector comes first. */
const href = computed(() => (props.vehicle === null ? '/felgen-suchen?ziel=komplettraeder' : '/felgen'))

/* The illustration: AVIF, WebP, then the PNG the manifest names as its fallback (it has an alpha channel). */
const WHEEL_SIZES = '(min-width: 1280px) 416px, (min-width: 1024px) 30vw, (min-width: 768px) 45vw, 240px'
const WHEEL_ALT = 'Illustration eines Komplettrads aus Felge und Reifen, Ansicht von vorn'

const wheelFailed = ref(false)
</script>

<template>
    <section id="h7" class="komplett dark" data-section="H7" aria-labelledby="h7-heading">
        <div class="container grid komplett__grid">
            <div class="komplett__text">
                <h2 id="h7-heading" class="h2">Kompletträder – montiert und gewuchtet.</h2>
                <!-- No promise that the Gutachten is delivered: nothing delivers it yet (ACCURACY D7). -->
                <p class="body-l komplett__lead">Felge und Reifen kommen fertig montiert und gewuchtet bei dir an.</p>
                <Link :href="href" class="btn btn--light komplett__button">Kompletträder für mein Fahrzeug</Link>
            </div>

            <figure class="komplett__stage">
                <!-- `error` does not bubble, but it does pass this wrapper in the capture phase. -->
                <div v-if="!wheelFailed" class="komplett__wheel" @error.capture="wheelFailed = true">
                    <span class="komplett__turn">
                        <!-- The photograph placed so the wheel fills the square and its axle is the square's centre. -->
                        <span v-if="photo" class="komplett__photo" :style="photo.style">
                            <Picture :image="photo.image" :alt="photo.alt" :sizes="WHEEL_SIZES" />
                        </span>
                        <Picture v-else :image="illustration" :alt="WHEEL_ALT" :sizes="WHEEL_SIZES" />
                    </span>
                </div>
                <div v-else class="komplett__fallback" aria-hidden="true">
                    <WheelOutline size="60%" />
                </div>
                <!-- The photographed wheel is in the shop (the client's #9): its caption leads to its page. -->
                <figcaption class="micro quiet komplett__caption">
                    <Link v-if="photo && !wheelFailed && wheel?.href" :href="wheel.href" class="komplett__caption-link">{{ photo.caption }}</Link>
                    <template v-else>{{ photo && !wheelFailed ? photo.caption : 'Illustration' }}</template>
                </figcaption>
            </figure>

            <div class="komplett__label">
                <TyreLabel v-if="label" v-bind="label" />
            </div>
        </div>
    </section>
</template>

<style scoped>
.komplett__grid {
    row-gap: var(--sp-32);
}

.komplett__text,
.komplett__stage,
.komplett__label {
    grid-column: 1 / -1;
    min-width: 0;
}

.komplett__lead {
    max-width: 40ch;
    margin-top: var(--sp-16);
    color: var(--c-on-dark-2);
}

.komplett__button {
    margin-top: var(--sp-32);
}

/* The wheel's box is square and centred, so the turn never changes the layout box. */
.komplett__stage {
    width: 100%;
    max-width: 240px;
    margin: 0 auto;
}

.komplett__wheel {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
}

.komplett__turn {
    display: block;
    width: 100%;
    height: 100%;
}

.komplett__turn {
    position: relative;
}

.komplett__turn > :deep(.picture) {
    width: 100%;
    height: 100%;
}

/* The photograph's box, set from the wheel's anchor (lib/bandWheel): larger than the square by the cut-out's margin. */
.komplett__photo {
    position: absolute;
    display: block;
}

.komplett__photo :deep(.picture),
.komplett__photo :deep(img) {
    display: block;
    width: 100%;
    height: auto;
}

.komplett__caption {
    display: block;
    margin-top: var(--sp-8);
    text-align: center;
}

/* On the dark band: the caption's own colour, underlined so it reads as the link it is; 44 px to tap. */
.komplett__caption-link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
}

.komplett__fallback {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    color: var(--c-on-dark-2);
}

.komplett__fallback :deep(.outline) {
    color: var(--c-on-dark-2);
}

/* The label fills its column (218 px at 1024, 306 at 1440) and its title wraps; `max-content`
   would push it past the page edge on the narrower desktop widths. */
.komplett__label :deep(.tyre-label) {
    width: 100%;
    max-width: 100%;
}

/* The label is a white card on the dark band: its own link needs a ring that shows on white. */

.komplett__label :deep(.tyre-label a:focus-visible) {
    outline-color: var(--c-blue);
}

@media (hover: hover) and (pointer: fine) {
    .komplett__label :deep(.tyre-label a:hover) {
        color: var(--c-blue-hover);
    }
}

@media (min-width: 768px) {
    .komplett__grid {
        row-gap: var(--sp-40);
    }

    .komplett__stage {
        grid-column: 1 / span 4;
        max-width: none;
        margin-inline: 0;
        align-self: center;
    }

    .komplett__label {
        grid-column: 5 / span 4;
        align-self: center;
    }
}

@media (min-width: 1024px) {
    .komplett__text {
        grid-column: 1 / span 5;
    }

    .komplett__stage {
        grid-column: 6 / span 4;
    }

    .komplett__label {
        grid-column: 10 / span 3;
        justify-self: start;
    }
}

/* ── Motion: the illustration turns with the scroll, and only there ─────────── */

@supports (animation-timeline: view()) {
    .komplett__turn {
        animation: komplett-turn linear both;
        animation-timeline: view();
        animation-range: entry 0% exit 100%;
    }
}

@keyframes komplett-turn {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(-720deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .komplett__turn {
        animation: none;
        transform: none;
    }
}
</style>
