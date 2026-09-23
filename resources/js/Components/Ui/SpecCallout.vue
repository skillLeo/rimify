<script setup lang="ts">
/**
 * A measured value pointed at the real thing in a photograph: the label and the value (and, where
 * it needs saying, a note) in a small white box, and a thin leader from the box to the feature.
 *
 * Everything is in the server-rendered HTML and nothing is measured: positions are percentages of
 * the frame, and the leader is drawn in the frame's own units (`ratio` × 100 wide, 100 tall), so a
 * frame of that ratio scales the drawing evenly and a ring stays round. With `side`, the box hugs
 * that edge of the frame, `x` % in and vertically centred on `y`, and the leader starts at that
 * edge, under the box: the opaque box covers the start, so the visible line leaves it wherever its
 * inner edge falls, however wide the text makes it. `elbow` bends the line to run level into the
 * box. Without `side`, the box's top-left corner is at (`x`, `y`) and the line starts there.
 *
 * The final drawing is the default: without JavaScript and under reduced motion the leader, its
 * dot and the ring are simply there. Otherwise the box fades in and the leader draws in once, after
 * `--callout-delay` (the host sets it — the hero waits for its wheel to stop), and the dot and ring
 * appear after it.
 */

import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        label: string
        value: string
        /** A third line under the value (`hinter der Nabenkappe`). */
        note?: string
        /** Where the box sits, as a percentage of the frame (see above). */
        x: number
        y: number
        /** The point the leader ends at, as a percentage of the frame. */
        tx: number
        ty: number
        side?: 'left' | 'right'
        /** Where the leader bends to run level into the box, as a percentage of the frame's width. */
        elbow?: number
        /** The frame's width / height: the drawing is `ratio` × 100 units wide and 100 tall. */
        ratio?: number
        /** The stroke, in the drawing's units. */
        weight?: number
        /** A dashed circle the leader ends on: centre in percent of the frame's width and height, radius in percent of its height. */
        ring?: { cx: number; cy: number; r: number }
    }>(),
    { note: undefined, side: undefined, elbow: undefined, ratio: 1, weight: 0.35, ring: undefined }
)

const width = computed(() => props.ratio * 100)

/** A percentage of the frame's width in the drawing's units. */
function ux(percent: number): number {
    return Math.round(((percent / 100) * width.value) * 100) / 100
}

const start = computed(() => ({ x: props.side === 'right' ? ux(100 - props.x) : ux(props.x), y: props.y }))
const end = computed(() => ({ x: ux(props.tx), y: props.ty }))

const d = computed(() => {
    const bend = props.elbow === undefined ? '' : ` L ${ux(props.elbow)} ${start.value.y}`

    return `M ${start.value.x} ${start.value.y}${bend} L ${end.value.x} ${end.value.y}`
})

const dot = computed(() => Math.round(props.weight * 2.2 * 100) / 100)

const boxStyle = computed(() => {
    if (props.side === 'right') {
        return { right: `${props.x}%`, top: `${props.y}%` }
    }

    return { left: `${props.x}%`, top: `${props.y}%` }
})
</script>

<template>
    <div class="callout-anchor" aria-hidden="true">
        <svg
            class="callout__line"
            :viewBox="`0 0 ${width} 100`"
            preserveAspectRatio="none"
            focusable="false"
            :style="{ '--callout-weight': weight }"
        >
            <circle v-if="ring" class="callout__ring" :cx="ux(ring.cx)" :cy="ring.cy" :r="ring.r" pathLength="60" />
            <path class="callout__leader" :d="d" pathLength="1" />
            <circle class="callout__dot" :cx="end.x" :cy="end.y" :r="dot" />
        </svg>
        <div class="callout" :class="side ? `callout--${side}` : undefined" :style="boxStyle">
            <span class="callout__label">{{ label }}</span>
            <!-- The value is measured data (`5 × 112`, `66,6 mm`, `53810 (ABE)`): the translator
                 leaves it alone. The label and the note are German and stay translatable. -->
            <span class="callout__value" translate="no">{{ value }}</span>
            <span v-if="note" class="callout__note">{{ note }}</span>
        </div>
    </div>
</template>

<style scoped>
.callout-anchor {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

/* The leaders under every box: a later callout's line never crosses an earlier callout's box. */
.callout__line {
    z-index: var(--z-base);
}

/* The box waits for the same `--callout-delay` as its leader: nothing is labelled while it turns. */
.callout {
    z-index: var(--z-raised);
    pointer-events: auto;
    animation: callout-appear var(--d-2) var(--ease-out) var(--callout-delay, 0ms) both;
}

.callout--left,
.callout--right {
    transform: translateY(-50%);
}

.callout__note {
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

/* The host picks the ink (`--callout-ink`); white on a dark photograph is the default. */
.callout__leader {
    fill: none;
    stroke: var(--callout-ink, var(--c-surface));
    stroke-width: var(--callout-weight);
    vector-effect: none;
    stroke-dasharray: 1;
    stroke-dashoffset: 0;
    animation: callout-draw var(--d-4) var(--ease-out) var(--callout-delay, 0ms) both;
}

.callout__ring {
    fill: none;
    stroke: var(--callout-ink, var(--c-surface));
    stroke-width: var(--callout-weight);
    /* Thirty dashes round the circle, whatever its size (`pathLength` 60). */
    stroke-dasharray: 1;
    animation: callout-appear var(--d-2) var(--ease-out) calc(var(--callout-delay, 0ms) + var(--d-4)) both;
}

.callout__dot {
    fill: var(--callout-ink, var(--c-surface));
    stroke: none;
    animation: callout-appear var(--d-2) var(--ease-out) calc(var(--callout-delay, 0ms) + var(--d-4)) both;
}

@keyframes callout-draw {
    from {
        stroke-dashoffset: 1;
    }
}

@keyframes callout-appear {
    from {
        opacity: 0;
    }
}

/* Motion off: the box, the leader, its dot and the ring rest in their end state from the first paint. */
@media (prefers-reduced-motion: reduce) {
    .callout,
    .callout__leader,
    .callout__ring,
    .callout__dot {
        animation: none;
    }
}
</style>
