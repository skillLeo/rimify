<script setup lang="ts">
/**
 * A photograph from the image pipeline (scripts/images.mjs): AVIF, then WebP, then JPEG, at the
 * widths the manifest lists, with the frame's own dimensions so nothing shifts, and the 24 px
 * placeholder behind it until the real file has painted. The hero passes `eager`; everything
 * below the fold is lazy.
 */

import { computed, ref } from 'vue'

/**
 * Anchor points measured on the photograph, normalised to this frame: x and y are fractions of the
 * frame's width and height, r is a fraction of its width (for `kba`, w is a fraction of the width
 * and h of the height). Written by scripts/wheel-image.mjs; absent unless measured
 * (docs/phase0/ACCURACY.md §4).
 */
export interface WheelAnchors {
    centre: { x: number; y: number }
    /** The rim's outer lip, derived from the cut-out, never typed in. */
    wheel?: { x: number; y: number; r: number }
    /** The circle through the bolt-hole centres (Lochkreis). */
    pcd?: { x: number; y: number; r: number }
    /** The cap over the centre bore (Mittenlochbohrung). */
    bore?: { x: number; y: number; r: number }
    valve?: { x: number; y: number }
    /** The stamped approval mark: its centre, width and height. */
    kba?: { x: number; y: number; w: number; h: number }
}

export interface ImageManifest {
    name: string
    base: string
    width: number
    height: number
    widths: number[]
    placeholder: string
    /** The format of the `<img>` fallback: `jpg` (the default) or `png` for a transparent cut-out. */
    fallback?: string
    /**
     * Further photographs of the same finish from other angles, in the order they were shot
     * (front view first is the manifest itself). Only real studio shots: never a drawing.
     */
    views?: ImageView[]
    /** The 4:3 frame, with its own anchors. */
    wide?: ImageManifest
    /** This frame's anchors; `bare` shares the square frame's geometry, so the same ones apply. */
    anchors?: WheelAnchors
    /** The square frame without the baked contact shadow. */
    bare?: ImageManifest
    /** The approval number the photograph shows (`53810`), when one was read off it. */
    stamp?: string
}

/** One more angle of the same finish, and how to name it (`Schräg von vorn`). */
export interface ImageView extends ImageManifest {
    label: string
}

const props = withDefaults(
    defineProps<{
        image: ImageManifest
        alt: string
        /** The `sizes` attribute: how wide the frame is at each width. */
        sizes?: string
        eager?: boolean
    }>(),
    { sizes: '100vw', eager: false }
)

const emit = defineEmits<{ (e: 'loaded'): void }>()

const loaded = ref(false)

const srcset = (ext: string): string => props.image.widths.map((w) => `${props.image.base}-${w}.${ext} ${w}w`).join(', ')
// The manifest names its own fallback format: a cut-out with transparency ships PNG, a photo JPEG.
const fallbackExt = computed(() => props.image.fallback ?? 'jpg')
const fallback = computed(() => `${props.image.base}-${props.image.widths[props.image.widths.length - 1]}.${fallbackExt.value}`)

function onLoad(): void {
    loaded.value = true
    emit('loaded')
}
</script>

<template>
    <!-- A transparent cut-out gets no blurred placeholder: an opaque square behind it would
         show as a box until the file paints. -->
    <picture class="picture" :class="{ 'picture--loaded': loaded }" :style="fallbackExt === 'png' ? undefined : { backgroundImage: `url(${image.placeholder})` }">
        <source type="image/avif" :srcset="srcset('avif')" :sizes="sizes" />
        <source type="image/webp" :srcset="srcset('webp')" :sizes="sizes" />
        <img
            :src="fallback"
            :srcset="srcset(fallbackExt)"
            :sizes="sizes"
            :alt="alt"
            :width="image.width"
            :height="image.height"
            :loading="eager ? 'eager' : 'lazy'"
            :fetchpriority="eager ? 'high' : undefined"
            decoding="async"
            @load="onLoad"
        />
    </picture>
</template>

<style scoped>
.picture {
    display: block;
    overflow: hidden;
    background-size: cover;
    background-position: center;
}

.picture img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}
</style>
