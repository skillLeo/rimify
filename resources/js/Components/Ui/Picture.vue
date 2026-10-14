<script setup lang="ts">
/**
 * A photograph from the image pipeline (scripts/images.mjs): AVIF, then WebP, then JPEG, at the
 * widths the manifest lists, with the frame's own dimensions so nothing shifts, and the 24 px
 * placeholder behind it until the real file has painted. The desktop hero passes `eager`; everything
 * below the fold is lazy, and the phone's hero, just below the first screen, `late`.
 */

import { computed, onMounted, ref } from 'vue'

/**
 * Anchor points measured on the photograph, normalised to this frame: x and y are fractions of the
 * frame's width and height, r is a fraction of its width (for `kba`, w is a fraction of the width
 * and h of the height). Written by scripts/wheel-image.mjs; absent unless measured
 * (docs/phase0/ACCURACY.md §4).
 */
export interface WheelAnchors {
    centre: { x: number; y: number }
    /** The rim's outer lip: derived from the cut-out, or measured where the cut-out shows the barrel too. */
    wheel?: { x: number; y: number; r: number }
    /** The circle through the bolt-hole centres (Lochkreis). */
    pcd?: { x: number; y: number; r: number }
    /** The cap over the centre bore (Mittenlochbohrung). */
    bore?: { x: number; y: number; r: number }
    valve?: { x: number; y: number }
    /** The stamped approval mark: its centre, width and height. */
    kba?: { x: number; y: number; w: number; h: number }
    /** The diameter at the bead seat: a vertical line through its centre, `h` long. */
    bead?: { x: number; y: number; h: number }
    /** The barrel between the two Felgenhörner where the photograph shows it: a span through its centre, `w` wide. */
    flanges?: { x: number; y: number; w: number }
}

export interface ImageManifest {
    name: string
    base: string
    width: number
    height: number
    widths: number[]
    placeholder: string
    /** The format of the `<img>` fallback: `jpg` (the default), `png` for a transparent cut-out, `svg` for a drawing. */
    fallback?: string
    /**
     * The formats offered before the fallback, best first (default AVIF, then WebP). A drawn
     * placeholder (DemoPlaceholders) is one SVG and offers none.
     */
    formats?: string[]
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
    /**
     * An uploaded photograph's own sentence, as a person wrote it in the admin (FinishImages) — the
     * alt text wherever it is shown, and its thumbnail's name as `label`.
     */
    alt?: string
    label?: string
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
        /**
         * Loaded at once but after the page's main picture: the hero's second wheel, in view from the first frame
         * but never competing with the LCP picture for the first bytes.
         */
        soon?: boolean
        /**
         * Lazy and last: a picture just below the first screen — the phone's hero frame — that must not take a
         * byte from what is painted first (the operator's brief of 05.10.2026, §5).
         */
        late?: boolean
        /**
         * On the first screen without being the page's main picture — a listing's first rows: loaded at once, never
         * lazily, with the priority left to the browser. `eager` is for the one picture that is the page's largest
         * paint; it asks for the first bytes.
         */
        prompt?: boolean
    }>(),
    { sizes: '100vw', eager: false, soon: false, late: false, prompt: false }
)

const emit = defineEmits<{ (e: 'loaded'): void; (e: 'failed'): void }>()

const loaded = ref(false)
const img = ref<HTMLImageElement | null>(null)

/* A file that failed before the page was hydrated fired its error with nobody listening: asked once here. */
onMounted(() => {
    if (img.value?.complete && img.value.naturalWidth === 0 && img.value.currentSrc !== '') {
        emit('failed')
    }
})

const srcset = (ext: string): string => props.image.widths.map((w) => `${props.image.base}-${w}.${ext} ${w}w`).join(', ')
const formats = computed(() => props.image.formats ?? ['avif', 'webp'])
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
        <source v-for="format in formats" :key="format" :type="`image/${format}`" :srcset="srcset(format)" :sizes="sizes">
        <img
            ref="img"
            :src="fallback"
            :srcset="srcset(fallbackExt)"
            :sizes="sizes"
            :alt="alt"
            :width="image.width"
            :height="image.height"
            :loading="(eager || soon || prompt) && !late ? 'eager' : 'lazy'"
            :fetchpriority="late ? 'low' : eager ? 'high' : soon ? 'low' : undefined"
            decoding="async"
            @load="onLoad"
            @error="emit('failed')"
        >
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
