<script setup lang="ts">
/**
 * The Felgenrechner's drawing (PROTECTED P7, rebuilt for the client's #11 — „The current illustration is very
 * confusing … add some color (for example old: gray; new: blue)“; the operator's brief of 29.10.2026, Batch 2): the
 * wheel cut through its middle and seen from the front of the car — the tyre top and bottom, the rim with its lips,
 * the disc on the hub — the outside on the left, the hub and the strut on the right, as his example sets them. The
 * current wheel solid gray, the new one a blue outline on top of it, so both read wherever they cover each other; at
 * the edges a chevron the way each rim edge moved, and between them by how much, as in his example („‹ 17,7 mm …
 * 7,7 mm ›“). Under it the key: what each colour is, with its sizes.
 *
 * Schematic: one millimetre is one unit across, the height and the tyre are not to scale, and the strut stands where no
 * rim the form offers reaches — it marks a side, never a clearance (the calculator judges nothing, ACCURACY.md §6). The
 * shapes are SVG; the words and figures are text laid over it at the type scale's sizes, so they read the same on a
 * phone as on a desktop. Everything moves by `transform` alone (DIRECTION §7) — the labels in container units — so a
 * change is seen as a movement; with reduced motion it is set at once.
 */

import { computed } from 'vue'
import ValueText from '../Ui/ValueText.vue'
import { edgeChange, innerEdge, mmText, outerEdge, roundToTenths, setupLine, type EtSetup, type EtState } from '../../lib/etRechner'

const props = defineProps<{ state: EtState }>()

/* Across, in millimetres from the hub's face (towards the car positive). Both edges follow the wheels — the left the
   outer edge with room for „außen“, the right the inner edge, never short of the strut — so an extreme setup is never
   cut off and an ordinary one fills the drawing. */
const STRUT_X = 262
const HEIGHT = 380

/* Down, not to scale: the figures and chevrons, the tyre on the rim, the rim's cut and lips, the disc, the hub. */
const FIGURE_Y = 16
const BAND_TOP = 104
const BAND_BOTTOM = 276
const TYRE_TOP = 34
const TYRE_H = BAND_TOP - TYRE_TOP
const BAND = 16
const LIP = 26
const MIDDLE = (BAND_TOP + BAND_BOTTOM) / 2
const TYRE_BULGE = 14
const OUTSIDE_ROOM = 80

interface Wheel {
    centre: number
    width: number
    inner: number
    outer: number
    face: number
    spacer: number
}

function wheel(s: EtSetup): Wheel {
    return {
        centre: s.etMm - s.spacerMm,
        width: s.widthIn * 25.4,
        inner: innerEdge(s) / 100,
        outer: -outerEdge(s) / 100,
        face: -s.spacerMm,
        spacer: s.spacerMm,
    }
}

const current = computed(() => wheel(props.state.current))
const next = computed(() => wheel(props.state.next))
const change = computed(() => {
    const c = edgeChange(props.state)

    return { inner: roundToTenths(c.inner), outer: roundToTenths(c.outer) }
})

const outermost = computed(() => Math.min(current.value.outer, next.value.outer))
const innermost = computed(() => Math.max(current.value.inner, next.value.inner))
const left = computed(() => Math.floor(Math.min(-140, outermost.value - TYRE_BULGE - OUTSIDE_ROOM)))
const right = computed(() => Math.ceil(Math.max(STRUT_X + 58, innermost.value + TYRE_BULGE + 30)))

const move = (x: number, scale = 1): Record<string, string> => ({ transform: `translate(${x}px, 0px) scaleX(${scale})` })

/* The chevrons stand just outside the tyres, at the height of the figures. */
const outerChevron = computed(() => outermost.value - TYRE_BULGE - 4)
const innerChevron = computed(() => innermost.value + TYRE_BULGE + 4)

/** A chevron the way an edge moved: the inner edge towards the car points right, the outer edge out of the car left. */
function chevron(x: number, pointsRight: boolean): string {
    const d = pointsRight ? 1 : -1

    return `M ${x - 5 * d} ${FIGURE_Y - 8} L ${x + 5 * d} ${FIGURE_Y} L ${x - 5 * d} ${FIGURE_Y + 8}`
}

/**
 * A label at a point of the drawing: across in container units (the stage is the container), so it moves by transform
 * with the wheel; down as a share of the height. `end` puts the text before the point, `middle` around it. Held inside
 * the stage: the drawing shrinks on a phone and its words do not, and „Fahrwerk“ over the strut ran past the right edge.
 */
function at(x: number, y: number, anchor: 'start' | 'middle' | 'end' = 'start'): Record<string, string> {
    const across = ((x - left.value) / (right.value - left.value)) * 100
    const shift = anchor === 'end' ? ' - 100%' : anchor === 'middle' ? ' - 50%' : ''

    return { top: `${(y / HEIGHT) * 100}%`, transform: `translate(clamp(0px, calc(${across.toFixed(3)}cqw${shift}), calc(100cqw - 100%)), -50%)` }
}

const lines = computed(() => ({ current: setupLine(props.state.current), next: setupLine(props.state.next) }))
</script>

<template>
    <figure class="odraw calc-drawing">
        <div class="odraw__stage">
            <svg class="odraw__svg" :viewBox="`${left} 0 ${right - left} ${HEIGHT}`" role="img" aria-labelledby="odraw-caption odraw-key">
                <!-- The car's side: the strut and the hub, schematic; a leader from „Fahrwerk“ to the strut. -->
                <g class="odraw__car" aria-hidden="true">
                    <rect class="odraw__strut" :x="STRUT_X" y="62" width="44" height="88" rx="4" />
                    <rect class="odraw__knuckle" :x="STRUT_X - 22" :y="MIDDLE - 50" width="70" height="100" rx="4" />
                    <rect class="odraw__hub" x="0" :y="MIDDLE - 38" :width="STRUT_X - 22" height="76" rx="4" />
                    <line class="odraw__face" x1="0" :y1="MIDDLE - 60" x2="0" :y2="MIDDLE + 60" />
                    <line class="odraw__leader" :x1="STRUT_X + 22" y1="48" :x2="STRUT_X + 22" y2="62" />
                </g>

                <!-- Each wheel: its tyre top and bottom, its spacer, its disc on the mounting face, its rim's cut and lips. -->
                <g v-for="(w, i) in [current, next]" :key="i" class="odraw__wheel" :class="i === 0 ? 'odraw__wheel--current' : 'odraw__wheel--next'" aria-hidden="true">
                    <rect class="odraw__tyre odraw__part" :style="move(w.centre, w.width + TYRE_BULGE * 2)" x="-0.5" :y="TYRE_TOP" width="1" :height="TYRE_H" />
                    <rect class="odraw__tyre odraw__part" :style="move(w.centre, w.width + TYRE_BULGE * 2)" x="-0.5" :y="BAND_BOTTOM" width="1" :height="TYRE_H" />
                    <rect class="odraw__spacer odraw__part" :style="move(w.face, Math.max(w.spacer, 0.001))" x="0" :y="MIDDLE - 50" width="1" height="100" :opacity="w.spacer > 0 ? 1 : 0" />
                    <rect class="odraw__disc odraw__part" :style="move(w.face)" x="-7" :y="BAND_TOP + BAND" width="7" :height="BAND_BOTTOM - BAND_TOP - BAND * 2" />
                    <rect class="odraw__band odraw__part" :style="move(w.centre, w.width)" x="-0.5" :y="BAND_TOP" width="1" :height="BAND" />
                    <rect class="odraw__band odraw__part" :style="move(w.centre, w.width)" x="-0.5" :y="BAND_BOTTOM - BAND" width="1" :height="BAND" />
                    <rect class="odraw__lip odraw__part" :style="move(w.outer)" x="-7" :y="BAND_TOP - LIP" width="7" :height="LIP + BAND" />
                    <rect class="odraw__lip odraw__part" :style="move(w.outer)" x="-7" :y="BAND_BOTTOM - BAND" width="7" :height="LIP + BAND" />
                    <rect class="odraw__lip odraw__part" :style="move(w.inner)" x="0" :y="BAND_TOP - LIP" width="7" :height="LIP + BAND" />
                    <rect class="odraw__lip odraw__part" :style="move(w.inner)" x="0" :y="BAND_BOTTOM - BAND" width="7" :height="LIP + BAND" />
                </g>

                <g class="odraw__chevrons" aria-hidden="true">
                    <path v-if="change.outer !== 0" class="odraw__chevron" :d="chevron(outerChevron, change.outer < 0)" />
                    <path v-if="change.inner !== 0" class="odraw__chevron" :d="chevron(innerChevron, change.inner > 0)" />
                </g>
            </svg>

            <!-- Between the chevrons, how far each rim edge moved; the sides named. Text, at the type scale. -->
            <div class="odraw__labels" aria-hidden="true">
                <span v-if="change.outer !== 0" class="odraw__figure odraw__label" translate="no" :style="at(outerChevron + 10, FIGURE_Y, 'start')">{{ mmText(Math.abs(change.outer)) }}</span>
                <span v-if="change.inner !== 0" class="odraw__figure odraw__label" translate="no" :style="at(innerChevron - 10, FIGURE_Y, 'end')">{{ mmText(Math.abs(change.inner)) }}</span>
                <span class="odraw__name odraw__label" :style="at(outermost - TYRE_BULGE - 10, MIDDLE, 'end')">außen</span>
                <span class="odraw__name odraw__label" :style="at(STRUT_X + 22, 38, 'middle')">Fahrwerk</span>
                <span class="odraw__name odraw__label" :style="at((STRUT_X - 22) / 2 + 30, MIDDLE, 'middle')">Radnabe</span>
            </div>
        </div>

        <figcaption class="odraw__foot">
            <span id="odraw-caption" class="small muted">Schnitt durch das Rad, schematisch, von vorn gesehen.</span>
            <!-- No label of its own: the drawing is named by this list's words, both rims with their sizes. -->
            <ul id="odraw-key" class="odraw__key">
                <li class="odraw__key-line small"><span class="odraw__sample odraw__sample--current" aria-hidden="true" /><span class="odraw__side">Aktuell:</span> <ValueText :text="lines.current" /></li>
                <li class="odraw__key-line small"><span class="odraw__sample odraw__sample--next" aria-hidden="true" /><span class="odraw__side">Neu:</span> <ValueText :text="lines.next" /></li>
            </ul>
        </figcaption>
    </figure>
</template>

<style scoped>
.odraw {
    display: grid;
    gap: var(--sp-12);
    margin: 0;
}

/* The labels' container: `cqw` across it is the drawing's own width. */
.odraw__stage {
    position: relative;
    container-type: inline-size;
}

.odraw__svg {
    display: block;
    width: 100%;
    max-width: 100%;
    height: auto;
}

.odraw__labels {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.odraw__label {
    position: absolute;
    left: 0;
    white-space: nowrap;
    transition: transform var(--d-2) var(--ease-out);
}

.odraw__figure {
    color: var(--c-ink);
    font-size: var(--fs-h4);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.odraw__name {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    font-weight: 500;
}

/* A narrow drawing (a small phone): the figures a step smaller, so two fit between the chevrons. */
@container (max-width: 340px) {
    .odraw__figure {
        font-size: var(--fs-small);
    }
}

.odraw__strut,
.odraw__knuckle,
.odraw__hub {
    fill: var(--c-band);
    stroke: var(--c-line-2);
    stroke-width: 1.5;
}

.odraw__face {
    stroke: var(--c-ink-3);
    stroke-width: 1.5;
    stroke-dasharray: 4 4;
}

.odraw__leader {
    stroke: var(--c-ink-3);
    stroke-width: 1;
}

.odraw__part {
    vector-effect: non-scaling-stroke;
    transition: transform var(--d-2) var(--ease-out), opacity var(--d-2) var(--ease-out);
}

/* The current wheel solid gray; the new one a blue outline on top — both read where they cover each other. */
.odraw__wheel--current .odraw__part {
    fill: var(--c-line-2);
    stroke: none;
}

.odraw__wheel--current .odraw__tyre {
    fill: var(--c-line);
}

/* The new wheel is blue — the one place blue is not an action (the client's „new: blue“, D-357). */
.odraw__wheel--next .odraw__part {
    fill: none;
    stroke: var(--c-blue);
    stroke-width: 2;
}

.odraw__wheel--next .odraw__tyre {
    stroke-width: 1.5;
}

.odraw__chevron {
    fill: none;
    stroke: var(--c-blue);
    stroke-width: 3;
    stroke-linecap: square;
}

.odraw__foot {
    display: grid;
    gap: var(--sp-8);
}

.odraw__key {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
}

.odraw__key-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4) var(--sp-8);
    color: var(--c-ink-2);
}

.odraw__side {
    color: var(--c-ink);
    font-weight: 500;
}

/* Each sample drawn as its wheel is: gray solid, blue outlined. */
.odraw__sample {
    width: 24px;
    height: 12px;
    border-radius: var(--r-control);
}

.odraw__sample--current {
    background: var(--c-line-2);
}

.odraw__sample--next {
    border: 2px solid var(--c-blue);
}

@media (prefers-reduced-motion: reduce) {
    .odraw__part,
    .odraw__label {
        transition: none;
    }
}
</style>
