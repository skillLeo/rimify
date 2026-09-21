<script setup lang="ts">
/**
 * A photograph from the image pipeline (scripts/images.mjs): AVIF, then WebP, then JPEG, at the
 * widths the manifest lists, with the frame's own dimensions so nothing shifts, and the 24 px
 * placeholder behind it until the real file has painted. The hero passes `eager`; everything
 * below the fold is lazy.
 */

import { computed, ref } from 'vue'

export interface ImageManifest {
    name: string
    base: string
    width: number
    height: number
    widths: number[]
    placeholder: string
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
const fallback = computed(() => `${props.image.base}-${props.image.widths[props.image.widths.length - 1]}.jpg`)

function onLoad(): void {
    loaded.value = true
    emit('loaded')
}
</script>

<template>
    <picture class="picture" :class="{ 'picture--loaded': loaded }" :style="{ backgroundImage: `url(${image.placeholder})` }">
        <source type="image/avif" :srcset="srcset('avif')" :sizes="sizes" />
        <source type="image/webp" :srcset="srcset('webp')" :sizes="sizes" />
        <img
            :src="fallback"
            :srcset="srcset('jpg')"
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
