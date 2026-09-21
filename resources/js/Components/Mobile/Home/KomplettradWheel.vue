<script setup lang="ts">
/**
 * The wheel in the dark band (H7, signature moment 3) on a phone: a 240 px cut-out, centred,
 * that turns with the scroll — a scroll-driven animation where the browser has one, and simply a
 * still wheel everywhere else. There is no scroll listener, ever. Under reduced motion it stands
 * at 0°. The cut-out is square and centred, so the turn never changes the layout box.
 *
 * The cut-out is the hero's until the client's own complete wheel — rim with tyre — comes out of
 * `scripts/cutout.mjs` as `images/komplettrad.json` (docs/phase0/ASSET-REQUEST.md §5); the alt
 * text says what the picture is, not what it stands for.
 */

import { ref } from 'vue'
import Picture from '../../Ui/Picture.vue'
import WheelOutline from '../../Ui/WheelOutline.vue'
import heroWheel from '../../../images/hero-wheel.json'

const failed = ref(false)
</script>

<template>
    <div class="komplett-wheel">
        <!-- `error` does not bubble, but it does pass this wrapper in the capture phase. -->
        <span v-if="!failed" class="komplett-wheel__turn" @error.capture="failed = true">
            <Picture :image="heroWheel" alt="Komplettrad, Ansicht von vorn" sizes="240px" />
        </span>
        <span v-else class="komplett-wheel__fallback" aria-hidden="true">
            <WheelOutline />
        </span>
    </div>
</template>

<style scoped>
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
    width: 60%;
    height: 60%;
    color: var(--c-on-dark-2);
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
        transform: rotate(-120deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .komplett-wheel__turn {
        animation: none;
        transform: none;
    }
}
</style>
