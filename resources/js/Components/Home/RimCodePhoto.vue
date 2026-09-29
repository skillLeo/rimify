<script setup lang="ts">
/**
 * The photograph of the explainer (ACCURACY.md §5): the hero wheel's shadow-free front view, and
 * over it an SVG in the picture's own coordinate box (its viewBox is the frame's pixel size), so a
 * shape drawn from a measured anchor lands exactly where the anchor was measured, at any width.
 *
 * Only what the photograph shows is marked: the Felgendurchmesser at the bead seat and the Maulweite
 * across the barrel, as dimension lines; the Lochkreis as a dashed circle through the bolt-hole
 * centres; the cap that covers the Mittenlochbohrung (labelled *hinter der Nabenkappe*); and the KBA
 * stamp in a box. For the ET the line under the photograph says that the cross-section shows it.
 * Nothing is marked without a measured anchor.
 */

import { computed } from 'vue'
import Picture from '../Ui/Picture.vue'
import ValueText from '../Ui/ValueText.vue'
import { dimensionTick, photoHint, photoLabel, photoShape, type PhotoFrame, type RimKey } from './rimCode'

const props = withDefaults(
    defineProps<{
        frame: PhotoFrame
        /** The feature on show (hovered or chosen). */
        active: RimKey
        /** The KBA number the token explains; the stamp is boxed only when it is the same number. */
        kba?: string | null
        /** Whether the cross-section draws the ET at all; false keeps the line from pointing at it. */
        showEt?: boolean
        alt: string
        /** One line naming what the photograph is, and what the values belong to. */
        credit?: string | null
        sizes?: string
    }>(),
    { kba: null, showEt: true, credit: null, sizes: '100vw' }
)

const shape = computed(() => photoShape(props.active, props.frame, props.kba))
const label = computed(() => (shape.value === null ? null : photoLabel(shape.value, props.frame)))
const hint = computed(() => photoHint(props.active, shape.value !== null, props.showEt))

/*
 * A dimension line with a tick across each end: 2 % of the frame at most, and never more than 30 % of
 * the line itself, so a short span reads as a dimension and not as a letter.
 */
const dimension = computed(() => {
    const s = shape.value

    if (s === null || s.kind !== 'line') {
        return ''
    }

    const t = dimensionTick(s, props.frame.image.width)
    const vertical = s.x1 === s.x2
    const tick = (x: number, y: number): string => (vertical ? `M${x - t} ${y}H${x + t}` : `M${x} ${y - t}V${y + t}`)

    return `M${s.x1} ${s.y1}L${s.x2} ${s.y2}${tick(s.x1, s.y1)}${tick(s.x2, s.y2)}`
})

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
                <!-- A casing in the surface colour under the mark, so it reads on a matt black wheel. -->
                <g v-if="shape" class="rc-photo__casing" :class="{ 'rc-photo__shape--dashed': shape.kind === 'circle' && shape.dashed }">
                    <circle v-if="shape.kind === 'circle'" :cx="shape.cx" :cy="shape.cy" :r="shape.r" />
                    <rect v-else-if="shape.kind === 'rect'" :x="shape.x" :y="shape.y" :width="shape.width" :height="shape.height" />
                    <path v-else :d="dimension" />
                </g>
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
                <path v-else-if="shape?.kind === 'line'" class="rc-photo__shape" :data-shape="shape.key" :d="dimension" />
            </svg>

            <!-- The overlay label is a term (`Lochkreis`, `hinter der Nabenkappe`) or a number
                 (`KBA 53810`): ValueText keeps the translator off the figure and leaves the
                 German words to it. -->
            <span v-if="label" class="rc-photo__label small num" :style="labelStyle" aria-hidden="true"><ValueText :text="label.text" /></span>
        </div>

        <figcaption class="rc-photo__caption">
            <!-- Keyed by the value it describes: a page translator replaces the text node it
                 translated, and an unkeyed update would leave the previous value's line here. -->
            <span :key="`hint-${active}`" class="small muted rc-photo__hint">{{ hint }}</span>
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

.rc-photo__casing > * {
    fill: none;
    stroke: var(--c-surface);
    stroke-width: 6;
    vector-effect: non-scaling-stroke;
}

.rc-photo__shape--dashed,
.rc-photo__shape--dashed > * {
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
