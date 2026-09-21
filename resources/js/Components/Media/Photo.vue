<script setup lang="ts">
/**
 * A photograph, with the drawn SVG behind it as the fallback.
 *
 * The build pack's rule 1 is that every visual ships as inline SVG, because "external images
 * cannot load in this environment. A grey box with a picture icon is a failure." This component
 * keeps that guarantee while letting photography sit on top for client review: the fallback slot
 * is what renders when the flag is off, when the URL is blocked by CSP, when the host throttles,
 * and when the image 404s. There is no state in which this shows an empty box.
 *
 * The failure is tracked per component instance rather than globally, so one dead URL does not
 * take down every photograph on the page.
 *
 * `eager` exists for the hero. It is the LCP element and must be painted, not faded in — so it
 * carries fetchpriority and skips lazy loading, and the CSS never animates its opacity.
 */

import { computed, ref } from 'vue'
import { useShared } from '../../composables/useShared'
import type { Photo } from '../../media/photos'

const props = withDefaults(
    defineProps<{
        photo: Photo | null
        /** The hero only. Everything else loads lazily. */
        eager?: boolean
        /** `cover` fills the box; `contain` fits a product shot inside its well. */
        fit?: 'cover' | 'contain'
    }>(),
    { eager: false, fit: 'cover' }
)

const shared = useShared()
const failed = ref(false)

/*
 * The flag comes from the server, not from a build-time constant, so turning photography off is
 * one env change and a deploy — and so the CSP and the markup can never disagree about whether
 * remote images are allowed on this response.
 */
const showPhoto = computed(
    () => shared.value.photography === true && props.photo !== null && !failed.value
)

/**
 * Decorative photographs are hidden from assistive tech; a photograph carrying meaning keeps its
 * alt. The drawn art follows the same rule, so the two are interchangeable to a screen reader.
 */
const alt = computed(() => props.photo?.alt ?? '')
</script>

<template>
    <img
        v-if="showPhoto && photo"
        class="photo"
        :class="[`photo--${fit}`, { 'photo--eager': eager }]"
        :src="photo.url"
        :alt="alt"
        :aria-hidden="alt === '' ? 'true' : undefined"
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="eager ? 'high' : 'auto'"
        :style="photo.position ? { objectPosition: photo.position } : undefined"
        decoding="async"
        @error="failed = true"
    />

    <slot v-else />
</template>

<style scoped>
.photo {
    display: block;
    width: 100%;
    height: 100%;
}

.photo--cover {
    object-fit: cover;
}

.photo--contain {
    object-fit: contain;
}

/* The LCP element is painted, never transitioned. A hero that fades in costs the page its
   largest-contentful-paint budget for an effect nobody asked for. */
.photo--eager {
    animation: none !important;
    transition: none !important;
}
</style>
