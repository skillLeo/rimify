<script setup lang="ts">
/**
 * A measured value pointed at the real thing in a photograph: the label and the value in a small
 * white box, and a thin leader line from the box to the point on the wheel.
 *
 * Positions are percentages of the frame, so the callout keeps pointing at the same spoke at every
 * width. The line is drawn in the frame's own pixel space, measured after mount, so it is never
 * stretched and its dash can be animated by length; the box and its text are in the server-rendered
 * HTML from the first paint. The line draws in once the frame gains `is-ready` (after the image
 * has painted) — signature moment 1.
 */

import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
    label: string
    value: string
    /** Where the box sits, as a percentage of the frame. */
    x: number
    y: number
    /** The point the line ends at, as a percentage of the frame. */
    tx: number
    ty: number
}>()

const root = ref<HTMLElement | null>(null)
const box = ref<HTMLElement | null>(null)
const size = ref<{ w: number; h: number } | null>(null)
const boxSize = ref<{ w: number; h: number }>({ w: 0, h: 0 })
let observer: ResizeObserver | undefined

onMounted(() => {
    observer = new ResizeObserver(() => {
        if (root.value) {
            size.value = { w: root.value.clientWidth, h: root.value.clientHeight }
        }

        if (box.value) {
            boxSize.value = { w: box.value.offsetWidth, h: box.value.offsetHeight }
        }
    })
    observer.observe(root.value as HTMLElement)
    observer.observe(box.value as HTMLElement)
})

onBeforeUnmount(() => observer?.disconnect())

/* The line leaves the box from the edge that faces the target, at its vertical middle. */
const line = computed(() => {
    if (size.value === null) {
        return null
    }

    const { w, h } = size.value
    const boxLeft = (props.x / 100) * w
    const boxTop = (props.y / 100) * h
    const tx = (props.tx / 100) * w
    const ty = (props.ty / 100) * h
    const fromX = tx > boxLeft + boxSize.value.w / 2 ? boxLeft + boxSize.value.w : boxLeft
    const fromY = boxTop + boxSize.value.h / 2

    return { w, h, d: `M ${fromX} ${fromY} L ${tx} ${ty}`, tx, ty }
})
</script>

<template>
    <div ref="root" class="callout-anchor" aria-hidden="true">
        <svg v-if="line" class="callout__line" :viewBox="`0 0 ${line.w} ${line.h}`" :width="line.w" :height="line.h">
            <path :d="line.d" pathLength="1" />
            <circle :cx="line.tx" :cy="line.ty" r="3" />
        </svg>
        <div ref="box" class="callout" :style="{ left: `${x}%`, top: `${y}%` }">
            <span class="callout__label">{{ label }}</span>
            <span class="callout__value">{{ value }}</span>
        </div>
    </div>
</template>

<style scoped>
.callout-anchor {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.callout {
    pointer-events: auto;
}

.callout__line path {
    stroke-dasharray: 1;
    stroke-dashoffset: 0;
}

/* Signature moment 1: the leader lines draw in once the photograph has painted. */
:global(.frame:not(.is-ready)) .callout__line {
    opacity: 0;
}

:global(.frame.is-ready) .callout__line path {
    animation: draw var(--d-4) var(--ease-out) both;
}

:global(.frame.is-ready) .callout__line circle {
    animation: appear var(--d-2) var(--ease-out) both;
    animation-delay: var(--d-4);
}

@keyframes draw {
    from {
        stroke-dashoffset: 1;
    }

    to {
        stroke-dashoffset: 0;
    }
}

@keyframes appear {
    from {
        opacity: 0;
    }
}

/* Motion off: the line and its dot rest in their end state from the first paint — nothing draws, nothing appears. */
@media (prefers-reduced-motion: reduce) {
    :global(.frame:not(.is-ready)) .callout__line {
        opacity: 1;
    }

    :global(.frame) .callout__line path,
    :global(.frame) .callout__line circle,
    :global(.frame.is-ready) .callout__line path,
    :global(.frame.is-ready) .callout__line circle {
        animation: none;
        opacity: 1;
        stroke-dashoffset: 0;
    }
}
</style>
