<script setup lang="ts">
/**
 * The wheel in the dark band (H7, signature moment 3) on a phone: a 240 px illustration of a
 * complete wheel, centred and labelled "Illustration", that turns with the scroll — a scroll-driven
 * animation where the browser has one, and simply a still wheel everywhere else. There is no scroll
 * listener, ever. Under reduced motion it stands at 0°. The picture is square and centred, so the
 * turn never changes the layout box.
 *
 * The illustration is generated, never photographed (docs/phase0/ACCURACY.md §3.1): the parametric
 * rim with a parametric tyre, rendered by scripts/3d/render-komplettrad.mjs — no car, no brake, no
 * brand, no lettering, and no size claimed. The alt text says what the picture is.
 */

import { ref } from 'vue'
import Picture from '../../Ui/Picture.vue'
import WheelOutline from '../../Ui/WheelOutline.vue'
import illustration from '../../../images/komplettrad-illustration.json'

const failed = ref(false)
</script>

<template>
    <figure class="komplett-figure">
        <div class="komplett-wheel">
            <!-- `error` does not bubble, but it does pass this wrapper in the capture phase. -->
            <span v-if="!failed" class="komplett-wheel__turn" @error.capture="failed = true">
                <Picture :image="illustration" alt="Illustration eines Komplettrads aus Felge und Reifen, Ansicht von vorn" sizes="240px" />
            </span>
            <span v-else class="komplett-wheel__fallback" aria-hidden="true">
                <WheelOutline size="60%" />
            </span>
        </div>
        <figcaption class="micro quiet komplett-figure__label">Illustration</figcaption>
    </figure>
</template>

<style scoped>
.komplett-figure {
    margin: 0;
}

.komplett-wheel {
    width: 240px;
    max-width: 100%;
    aspect-ratio: 1;
    margin-inline: auto;
}

.komplett-wheel__turn {
    display: block;
    width: 100%;
    aspect-ratio: 1;
}

.komplett-wheel__turn :deep(img) {
    height: auto;
    object-fit: contain;
}

/* The one permitted fallback: the drawn wheel in the band's secondary ink, at 60 %. */
.komplett-wheel__fallback {
    display: grid;
    place-items: center;
    width: 100%;
    aspect-ratio: 1;
    color: var(--c-on-dark-2);
}

.komplett-wheel__fallback :deep(.outline) {
    color: var(--c-on-dark-2);
}

.komplett-figure__label {
    display: block;
    margin-top: var(--sp-8);
    text-align: center;
}

/* ── Motion: the wheel turns with the scroll, and only there ───────────────── */

@supports (animation-timeline: view()) {
    .komplett-wheel__turn {
        animation: turn linear both;
        animation-timeline: view();
        animation-range: entry 0% exit 100%;
    }
}

@keyframes turn {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(-720deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .komplett-wheel__turn {
        animation: none;
        transform: none;
    }
}
</style>
