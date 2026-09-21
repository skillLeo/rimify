<script setup lang="ts">
/**
 * H7 · Kompletträder — the one dark band on the page, signature moment 3.
 *
 * What a Komplettrad is, in one sentence; the one regulated fact about a tyre, its EU label, from
 * the featured tyre's own record; and a complete wheel that turns with the scroll. Where 3D runs
 * (desktop document, fine pointer, motion allowed) the wheel is the hero's rim model with a
 * parametric tyre in the featured tyre's section, rolled 0 → −120° by the box's progress through
 * the viewport — no scroll listener, an IntersectionObserver reads the range. Everywhere else the
 * poster turns by a CSS `view()` timeline where the browser has one, and stands still where it
 * has none. Under reduced motion nothing turns.
 *
 * One picture, and it is the subject: the cut-out that turns. The poster is the hero's rim until
 * the client's own complete-wheel cut-out — rim with tyre, front-facing — arrives
 * (docs/phase0/ASSET-REQUEST.md §5) and replaces it in `resources/js/images/`. No lifestyle
 * photograph beside it (spec H7 "Never"), and no scrim: a scrim would be a second gradient.
 */

import { Link } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import TyreLabel, { type TyreClass } from '../Ui/TyreLabel.vue'
import WheelOutline from '../Ui/WheelOutline.vue'
import WheelViewer3D from './Wheel3D/WheelViewer3D.vue'
import { HERO_MODEL_3D } from './Wheel3D/model'
import { HERO_SEQUENCE } from './Wheel3D/sequence'
import { tyreSectionFromTitle } from './Wheel3D/targets'
import type { TyreSection } from './Wheel3D/types'
import heroWheel from '../../images/hero-wheel.json'
import type { EuTyreLabel } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'

const props = defineProps<{
    tyre: EuTyreLabel | null
    vehicle: VehicleProp | null
}>()

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

/* The cut-out: AVIF, WebP, then the PNG the manifest names as its fallback (it has an alpha channel). */
const WHEEL_SIZES = '(min-width: 1280px) 416px, (min-width: 1024px) 30vw, (min-width: 768px) 45vw, 240px'

/* The rim model the hero already fetched — the band downloads no second GLB — plus a tyre in the featured section. */
const MODEL_3D = HERO_MODEL_3D
const DEFAULT_SECTION: TyreSection = { widthMm: 225, aspect: 45 }
const tyreSection = computed<TyreSection>(() => tyreSectionFromTitle(props.tyre?.title) ?? DEFAULT_SECTION)

const wheelFailed = ref(false)
</script>

<template>
    <section id="h7" class="komplett dark" data-section="H7" aria-labelledby="h7-heading">
        <div class="container grid komplett__grid">
            <div class="komplett__text">
                <h2 id="h7-heading" class="h2">Kompletträder – montiert und gewuchtet.</h2>
                <p class="body-l komplett__lead">
                    Felge und Reifen kommen fertig montiert und gewuchtet bei dir an – mit dem Gutachten für dein Fahrzeug.
                </p>
                <Link :href="href" class="btn btn--light komplett__button">Kompletträder für mein Fahrzeug</Link>
            </div>

            <div class="komplett__stage">
                <div v-if="!wheelFailed" class="komplett__wheel">
                    <WheelViewer3D
                        :poster="heroWheel"
                        alt="Komplettrad, Ansicht von vorn"
                        :sizes="WHEEL_SIZES"
                        :model="MODEL_3D"
                        :sequence="HERO_SEQUENCE"
                        :tyre="tyreSection"
                        mode="band"
                        @error="wheelFailed = true"
                    />
                </div>
                <div v-else class="komplett__fallback">
                    <WheelOutline />
                </div>
            </div>

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

/* The stage is square and centred, so the turn never changes the layout box. */
.komplett__stage {
    width: 100%;
    max-width: 240px;
    margin-inline: auto;
}

.komplett__wheel {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
}

.komplett__fallback {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    color: var(--c-on-dark-2);
}

.komplett__fallback :deep(.outline) {
    width: 60%;
    height: 60%;
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
</style>
