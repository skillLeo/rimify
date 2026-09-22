<script setup lang="ts">
/**
 * The photograph of the explainer (ACCURACY.md §5): the hero wheel's shadow-free front view, and
 * over it an SVG in the picture's own coordinate box (its viewBox is the frame's pixel size), so a
 * shape drawn from a measured anchor lands exactly where the anchor was measured, at any width.
 *
 * Only what a front view shows is marked: the Lochkreis as a dashed circle through the bolt-hole
 * centres, the cap that covers the Mittenlochbohrung (labelled *hinter der Nabenkappe*), and the
 * KBA stamp in a box. For the other values the line under the photograph says that the
 * cross-section shows them. Nothing is marked without a measured anchor.
 */

import { computed } from 'vue'
import Picture from '../Ui/Picture.vue'
import { photoHint, photoLabel, photoShape, type PhotoFrame, type RimKey } from './rimCode'

const props = withDefaults(
    defineProps<{
        frame: PhotoFrame
        /** The feature on show (hovered or chosen). */
        active: RimKey
        /** The KBA number the token explains; the stamp is boxed only when it is the same number. */
        kba?: string | null
        alt: string
        /** One line naming what the photograph is, and what the values belong to. */
        credit?: string | null
        sizes?: string
    }>(),
    { kba: null, credit: null, sizes: '100vw' }
)

const shape = computed(() => photoShape(props.active, props.frame, props.kba))
const label = computed(() => (shape.value === null ? null : photoLabel(shape.value, props.frame)))
const hint = computed(() => photoHint(props.active, shape.value !== null))

const box = computed(() => `0 0 ${props.frame.image.width} ${props.frame.image.height}`)
const ratio = computed(() => `${props.frame.image.width} / ${props.frame.image.height}`)
const labelStyle = computed(() =>
    label.value === null ? undefined : { left: `${(label.value.x * 100).toFixed(2)}%`, top: `${(label.value.y * 100).toFixed(2)}%` }
)
</script>

<template>
    <figure class="rc-photo">
        <div class="rc-photo__frame" :style="{ aspectRatio: ratio }">
            <Picture class="rc-photo__picture" :image="frame.image" :alt="alt" :sizes="sizes" />

            <svg class="rc-photo__overlay" :viewBox="box" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <circle
                    v-if="shape?.kind === 'circle'"
                    class="rc-photo__shape"
                    :class="{ 'rc-photo__shape--dashed': shape.dashed }"
                    :data-shape="shape.key"
                    :cx="shape.cx"
                    :cy="shape.cy"
                    :r="shape.r"
                />
                <rect
                    v-else-if="shape?.kind === 'rect'"
                    class="rc-photo__shape"
                    :data-shape="shape.key"
                    :x="shape.x"
                    :y="shape.y"
                    :width="shape.width"
                    :height="shape.height"
                />
            </svg>

            <span v-if="label" class="rc-photo__label small num" :style="labelStyle" aria-hidden="true">{{ label.text }}</span>
        </div>

        <figcaption class="rc-photo__caption">
            <span class="small muted rc-photo__hint">{{ hint }}</span>
            <span v-if="credit" class="micro quiet">{{ credit }}</span>
        </figcaption>
    </figure>
</template>

<style scoped>
.rc-photo {
    display: grid;
    gap: var(--sp-12);
    min-width: 0;
    margin: 0;
}

.rc-photo__frame {
    position: relative;
    width: 100%;
    max-width: 440px;
}

.rc-photo__picture {
    width: 100%;
    height: 100%;
}

.rc-photo__overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
}

.rc-photo__shape {
    fill: none;
    stroke: var(--c-blue);
    stroke-width: 2.5;
    vector-effect: non-scaling-stroke;
}

.rc-photo__shape--dashed {
    stroke-dasharray: 6 4;
}

/* Centred under the marked feature, on a plate so it reads over the spokes. */
.rc-photo__label {
    position: absolute;
    z-index: var(--z-base);
    margin-top: var(--sp-8);
    padding: 0 var(--sp-8);
    border-radius: var(--r-control);
    background: var(--c-surface);
    color: var(--c-ink);
    font-weight: 500;
    white-space: nowrap;
    transform: translateX(-50%);
    pointer-events: none;
}

.rc-photo__caption {
    display: grid;
    gap: var(--sp-4);
    /* Two lines held, so the hint changing under a hovered value never moves what follows. */
    min-height: calc(2 * var(--lh-small));
    align-content: start;
}

.rc-photo__hint {
    max-width: 54ch;
}
</style>
