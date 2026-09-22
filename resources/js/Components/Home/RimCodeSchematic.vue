<script setup lang="ts">
/**
 * The cross-section of a rim, schematic and not to scale (ACCURACY.md §5): both flanges, the bead
 * seats with their humps, the well, the disc, the hub pad and its Anlagefläche, the rim centre plane
 * as a dashed line exactly halfway between the flange inner faces, and the wheel axis. Five
 * dimensions sit on it — Maulweite, ½ Felgendurchmesser, Einpresstiefe (ET), ½ Lochkreis and
 * ½ Mittenlochbohrung — in the tertiary ink; the one the visitor chose is traced in the selection
 * colour, with the faces it is taken from, and its label and reference parts in the full ink.
 *
 * The geometry lives in `rimCodeSchematic.ts` and is fixed: the drawing explains the terms, it does
 * not measure this wheel. The ET dimension is drawn for a positive ET only (the Anlagefläche
 * outboard of the centre plane); for any other value the drawing shows no ET at all rather than a
 * direction it cannot vouch for (CLAUDE.md §2).
 *
 * The labels are SVG text in `--fs-small`: set at its own width of 360 px the drawing prints them at
 * 14 px, and because they scale with the lines, no label can ever run into another one.
 */

import { computed, useId } from 'vue'
import type { SchematicKey } from './rimCode'
import {
    BOLT_AXIS,
    CENTRE_PLANE,
    DIMENSION_ORDER,
    DIMENSIONS,
    labelTransform,
    PAD_BELOW,
    PARTS,
    PROFILE,
    SCHEMATIC,
    WHEEL_AXIS,
} from './rimCodeSchematic'

const props = withDefaults(
    defineProps<{
        /** The feature to trace; null traces nothing. */
        active?: SchematicKey | null
        /** False when the ET is not positive (or not readable): no ET dimension is drawn. */
        showEt?: boolean
    }>(),
    { active: null, showEt: true }
)

const hatch = `rc-hatch-${useId()}`

const dimensions = computed(() => DIMENSION_ORDER.filter((key) => key !== 'et' || props.showEt).map((key) => DIMENSIONS[key]))
const traced = computed(() => (props.active !== null && dimensions.value.some((d) => d.key === props.active) ? props.active : null))

const TERMS: Record<SchematicKey, string> = {
    width: 'die Maulweite',
    diameter: 'der Felgendurchmesser',
    et: 'die Einpresstiefe',
    lk: 'der Lochkreis',
    mlb: 'die Mittenlochbohrung',
}

const description = computed(() => {
    const et = props.showEt ? ', die Einpresstiefe reicht von der Felgenmitte nach außen bis zur Anlagefläche an der Nabe' : ''
    const marked = traced.value === null ? '' : ` Markiert: ${TERMS[traced.value]}.`

    return (
        'Schnittzeichnung einer Felge, schematisch und nicht maßstäblich; links liegt die Fahrzeugmitte, rechts die Außenseite. ' +
        `Die Maulweite reicht von Innenseite zu Innenseite der Felgenhörner, der Felgendurchmesser wird am Wulstsitz gemessen${et}.${marked}`
    )
})
</script>

<template>
    <figure class="rc-sch">
        <div class="rc-sch__sides micro muted">
            <span data-side="inside">← zur Fahrzeugmitte</span>
            <span data-side="outside">nach außen (Kotflügel) →</span>
        </div>

        <svg
            class="rc-sch__svg"
            :viewBox="`0 0 ${SCHEMATIC.width} ${SCHEMATIC.height}`"
            :width="SCHEMATIC.width"
            :height="SCHEMATIC.height"
            role="img"
            :aria-label="description"
            focusable="false"
        >
            <defs>
                <pattern :id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                    <path class="rc-sch__hatch" d="M 0 0 L 0 6" />
                </pattern>
            </defs>

            <!-- The wheel axis and the bolt hole's centre line, dash-dot. -->
            <path class="rc-sch__axis" data-part="axis" :d="WHEEL_AXIS" />
            <path class="rc-sch__axis" :class="{ 'is-active': traced === 'lk' }" data-part="bolt-axis" :d="BOLT_AXIS" />

            <!-- The section, hatched as a cut. -->
            <path class="rc-sch__cut" data-part="profile" :d="PROFILE" :fill="`url(#${hatch})`" />
            <path class="rc-sch__cut" data-part="pad-below" :d="PAD_BELOW" :fill="`url(#${hatch})`" />

            <!-- The reference faces the definitions name, drawn over the outline. -->
            <line
                v-for="x in [SCHEMATIC.xFlangeIn, SCHEMATIC.xFlangeOut]"
                :key="x"
                class="rc-sch__ref"
                data-part="flange-face"
                :x1="x"
                :y1="54"
                :x2="x"
                :y2="SCHEMATIC.yBeadSeat"
            />
            <line
                class="rc-sch__ref"
                data-part="anlage"
                :x1="SCHEMATIC.xAnlage"
                :y1="SCHEMATIC.yPadTop"
                :x2="SCHEMATIC.xAnlage"
                :y2="SCHEMATIC.yBore"
            />

            <!-- The rim centre plane, dashed, exactly halfway between the flange inner faces. -->
            <line
                class="rc-sch__centre"
                :class="{ 'is-active': traced === 'et' }"
                data-part="centre-plane"
                :x1="CENTRE_PLANE.x"
                :y1="CENTRE_PLANE.y1"
                :x2="CENTRE_PLANE.x"
                :y2="CENTRE_PLANE.y2"
            />

            <g
                v-for="dim in dimensions"
                :key="dim.key"
                class="rc-sch__dim"
                :class="{ 'is-active': traced === dim.key }"
                :data-dim="dim.key"
            >
                <path class="rc-sch__ext" :d="dim.ext" />
                <path class="rc-sch__line" data-role="line" :d="dim.line" />
                <path class="rc-sch__line" :d="dim.ticks" />
                <path v-if="traced === dim.key" class="rc-sch__face" data-role="faces" :d="dim.faces" />
                <text
                    class="rc-sch__label num"
                    :x="dim.label.x"
                    :y="dim.label.y"
                    :text-anchor="dim.label.anchor"
                    :transform="labelTransform(dim.label)"
                >{{ dim.label.text }}</text>
            </g>

            <g
                v-for="part in PARTS"
                :key="part.id"
                class="rc-sch__part"
                :class="{ 'is-active': traced !== null && part.for.includes(traced) }"
                :data-part-label="part.id"
            >
                <path v-if="part.leader" class="rc-sch__leader" :d="part.leader" />
                <text class="rc-sch__label" :x="part.label.x" :y="part.label.y" :text-anchor="part.label.anchor">{{ part.label.text }}</text>
            </g>
        </svg>

        <figcaption class="micro quiet rc-sch__caption">Schnittzeichnung, schematisch, nicht maßstäblich.</figcaption>
    </figure>
</template>

<style scoped>
.rc-sch {
    display: grid;
    gap: var(--sp-8);
    min-width: 0;
    margin: 0;
}

.rc-sch__sides {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--sp-4) var(--sp-16);
    max-width: 400px;
}

/* Fluid on a phone (the labels stay at 13–14 px from 335 px up); at its own width from 768 up. */
.rc-sch__svg {
    display: block;
    width: 100%;
    max-width: 400px;
    height: auto;
    overflow: visible;
}

.rc-sch__caption {
    margin: 0;
}

.rc-sch__label {
    font-family: var(--font-sans);
    font-size: var(--fs-small);
    font-weight: 500;
    fill: var(--c-ink-2);
}

.rc-sch__hatch {
    stroke: var(--c-line-2);
    stroke-width: 1;
}

.rc-sch__cut {
    stroke: var(--c-ink);
    stroke-width: 1.5;
    stroke-linejoin: miter;
    vector-effect: non-scaling-stroke;
}

.rc-sch__ref,
.rc-sch__axis,
.rc-sch__centre,
.rc-sch__ext,
.rc-sch__line,
.rc-sch__leader,
.rc-sch__face {
    fill: none;
    stroke-linecap: square;
    vector-effect: non-scaling-stroke;
}

.rc-sch__ref {
    stroke: var(--c-ink);
    stroke-width: 1.5;
}

/* An axis the way a drawing office draws one: dash-dot, in the tertiary ink. */
.rc-sch__axis {
    stroke: var(--c-ink-3);
    stroke-width: 1;
    stroke-dasharray: 12 3 2 3;
}

.rc-sch__centre {
    stroke: var(--c-ink-2);
    stroke-width: 1;
    stroke-dasharray: 6 4;
}

.rc-sch__ext,
.rc-sch__leader {
    stroke: var(--c-ink-3);
    stroke-width: 1;
}

.rc-sch__line {
    stroke: var(--c-ink-3);
    stroke-width: 1;
}

/* The chosen feature: the selection colour on its lines and faces, the full ink on its words. */
.rc-sch__dim.is-active .rc-sch__ext,
.rc-sch__dim.is-active .rc-sch__line,
.rc-sch__axis.is-active,
.rc-sch__centre.is-active {
    stroke: var(--c-blue);
    stroke-width: 2;
}

.rc-sch__face {
    stroke: var(--c-blue);
    stroke-width: 3;
}

.rc-sch__dim.is-active .rc-sch__label,
.rc-sch__part.is-active .rc-sch__label {
    font-weight: 600;
    fill: var(--c-ink);
}

@media (min-width: 768px) {
    .rc-sch__svg {
        width: 360px;
        max-width: 100%;
    }
}
</style>
